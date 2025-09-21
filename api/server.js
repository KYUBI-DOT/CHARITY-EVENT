const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

const pool = require('./event_db');
const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

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
  category: r.category_name || null
});

// categories
app.get('/api/categories', async (_, res) => {
  try {
    const [rows] = await pool.query('SELECT category_id, name FROM categories ORDER BY name');
    res.json(rows);
  } catch (err) {
    console.error('categories error:', err);                 // <— add this
    res.status(500).json({ error: 'Failed to fetch categories', detail: err.message });
  }
});

// events
app.get('/api/events', async (_, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT e.*, c.name AS category_name
      FROM events e JOIN categories c ON c.category_id = e.category_id
      WHERE e.status='active' ORDER BY e.start_datetime ASC`);
    const now = new Date();
    res.json(rows.map(r => {
      const d = mapEvent(r);
      d.time_status = new Date(r.end_datetime) < now ? 'past' : 'upcoming';
      return d;
    }));
  } catch (err) {
    console.error('events error:', err);                     // <— add this
    res.status(500).json({ error: 'Failed to fetch events', detail: err.message });
  }
});

// event details
app.get('/api/events/:id', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT e.*, c.name AS category_name
      FROM events e JOIN categories c ON c.category_id = e.category_id
      WHERE e.event_id = ?`, [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Event not found' });
    const now = new Date();
    const d = mapEvent(rows[0]);
    d.time_status = new Date(rows[0].end_datetime) < now ? 'past' : 'upcoming';
    res.json(d);
  } catch (err) {
    console.error('event details error:', err);              // <— add this
    res.status(500).json({ error: 'Failed to fetch event', detail: err.message });
  }
});

//health
app.get('/api/health', async (_, res) => {
  try {
    const [r] = await pool.query('SELECT 1 AS ok');
    res.json({ status: 'ok', db: r[0].ok });
  } catch (err) {
    console.error('health error:', err);
    res.status(500).json({ status: 'db-fail', detail: err.message });
  }
});



// search
app.get('/api/search', async (req, res) => {
  try {
    const { date, location, category } = req.query;
    const cond = [`e.status='active'`];
    const params = [];
    if (date) { cond.push('DATE(e.start_datetime)=?'); params.push(date); }
    if (location) { cond.push('e.location LIKE ?'); params.push(`%${location}%`); }
    if (category) { cond.push('e.category_id=?'); params.push(category); }
    const [rows] = await pool.query(`
      SELECT e.*, c.name AS category_name
      FROM events e JOIN categories c ON e.category_id=c.category_id
      WHERE ${cond.join(' AND ')}
      ORDER BY e.start_datetime ASC`, params);
    const now = new Date();
    res.json(rows.map(r => {
      const d = mapEvent(r);
      d.time_status = new Date(r.end_datetime) < now ? 'past' : 'upcoming';
      return d;
    }));
  } catch (err) {
    res.status(500).json({ error: 'Search failed' });
  }
});

const PORT = process.env.PORT || 4000;
(async () => {
  try {
    await pool.query('SELECT 1');
    console.log('✅ DB connection OK');
  } catch (e) {
    console.error('❌ DB connection FAILED:', e);
  }
})();

app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
