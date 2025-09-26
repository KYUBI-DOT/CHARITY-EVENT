// server.js — Charity Events API + static client

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

const pool = require('./event_db');

const app = express();

// --- middleware
app.use(cors());
app.use(express.json());
const helmet = require('helmet');
const compression = require('compression');
app.use(helmet());
app.use(compression());

app.use(morgan('dev'));

// --- serve the client (../client)
const clientDir = path.join(__dirname, '..', 'client');
app.use(express.static(clientDir))

// optional: make "/" load the client home page
app.get('/', (req, res) => {
  res.sendFile(path.join(clientDir, 'index.html'));
});
;



// --- helpers
const mapEvent = r => ({
  event_id: r.event_id,
  name: r.name,
  summary: r.summary,
  description: r.description,
  location: r.location,
  start_datetime: r.start_datetime,
  end_datetime: r.end_datetime,
  ticket_price: Number(r.ticket_price),
  goal_amount: Number(r.goal_amount),
  progress_amount: Number(r.progress_amount),
  status: r.status,
  category: r.category_name || null,
  image_url: r.image_url || null
});

// --- health check
app.get('/api/health', async (_, res) => {
  try {
    const [r] = await pool.query('SELECT 1 AS ok');
    res.json({ status: 'ok', db: r[0].ok });
  } catch (err) {
    console.error('health error:', err);
    res.status(500).json({ status: 'db-fail', detail: err.message });
  }
});

// --- categories
app.get('/api/categories', async (_, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT category_id, name FROM categories ORDER BY name'
    );
    res.json(rows);
  } catch (err) {
    console.error('categories error:', err);
    res.status(500).json({ error: 'Failed to fetch categories', detail: err.message });
  }
});

// --- events (active only; add time_status)
app.get('/api/events', async (_, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT e.*, c.name AS category_name
      FROM events e
      JOIN categories c ON c.category_id = e.category_id
      WHERE e.status = 'active'
      ORDER BY e.start_datetime ASC
    `);
    const now = new Date();
    const out = rows.map(r => {
      const d = mapEvent(r);
      d.time_status = new Date(r.end_datetime) < now ? 'past' : 'upcoming';
      return d;
    });
    res.json(out);
  } catch (err) {
    console.error('events error:', err);
    res.status(500).json({ error: 'Failed to fetch events', detail: err.message });
  }
});

// --- event details
app.get('/api/events/:id', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT e.*, c.name AS category_name
      FROM events e
      JOIN categories c ON c.category_id = e.category_id
      WHERE e.event_id = ?
    `, [req.params.id]);

    if (!rows.length) return res.status(404).json({ error: 'Event not found' });

    const now = new Date();
    const d = mapEvent(rows[0]);
    d.time_status = new Date(rows[0].end_datetime) < now ? 'past' : 'upcoming';
    res.json(d);
  } catch (err) {
    console.error('event details error:', err);
    res.status(500).json({ error: 'Failed to fetch event', detail: err.message });
  }
});

// --- search (date, location, category, name) — active only
// --- search (date, location, category, name/q) — active only
app.get('/api/search', async (req, res) => {
  try {
    // accept both ?name= and ?q=
    let { date, location, category, name, q } = req.query;
    if (!name && q) name = q;

    const cond = [`e.status = 'active'`];
    const params = [];

    // DATE: exact day (you can swap for month/range later)
    if (date && /^\d{4}-\d{2}-\d{2}$/.test(date.trim())) {
      cond.push('DATE(e.start_datetime) = ?');
      params.push(date.trim());
    }

    if (location && location.trim()) {
      cond.push('e.location LIKE ?');
      params.push(`%${location.trim()}%`);
    }

    // NAME: only if length >= 2 to avoid matching everything
    if (name && name.trim().length >= 2) {
      const needle = name.trim().toLowerCase();
      cond.push('LOWER(e.name) LIKE ?');
      params.push(`%${needle}%`);
    }

    if (category && String(category).trim()) {
      cond.push('e.category_id = ?');
      params.push(category);
    }

    // Dev aid: see what the server actually received/applied
    console.log('SEARCH req.query:', req.query);
    console.log('SEARCH where:', cond.join(' AND '), 'params:', params);

    const [rows] = await pool.query(`
      SELECT e.*, c.name AS category_name
      FROM events e
      JOIN categories c ON e.category_id = c.category_id
      WHERE ${cond.join(' AND ')}
      ORDER BY e.start_datetime ASC
    `, params);

    const now = new Date();
    const out = rows.map(r => {
      const d = {
        event_id: r.event_id,
        name: r.name,
        summary: r.summary,
        description: r.description,
        location: r.location,
        start_datetime: r.start_datetime,
        end_datetime: r.end_datetime,
        ticket_price: Number(r.ticket_price),
        goal_amount: Number(r.goal_amount),
        progress_amount: Number(r.progress_amount),
        status: r.status,
        category: r.category_name || null
      };
      d.time_status = new Date(r.end_datetime) < now ? 'past' : 'upcoming';
      return d;
    });

    res.json(out);
  } catch (err) {
    console.error('search error:', err);
    res.status(500).json({ error: 'Search failed', detail: err.message });
  }
});

  


// --- start
const PORT = process.env.PORT || 4000;

// probe DB once at startup so you see a clear message
(async () => {
  try {
    await pool.query('SELECT 1');
    console.log('✅ DB connection OK');
  } catch (e) {
    console.error('❌ DB connection FAILED:', e);
  }
})();

app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
});
