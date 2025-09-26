const categorySel = document.getElementById('category');
const errorEl = document.getElementById('error');
const resultsEl = document.getElementById('results');

function eventCard(ev){
  const card = document.createElement('div');
  card.className='card';
  const price = ev.ticket_price > 0 ? `$${ev.ticket_price.toFixed(2)}` : '$0.00 (free)';
  card.innerHTML = `
    <div class="muted">${ev.category || ''} • ${ev.location}</div>
    <h3>${ev.name}</h3>
    <div class="muted">${new Date(ev.start_datetime).toLocaleString()}</div>
    <div style="margin:10px 0">
      <span class="badge status-${ev.time_status}">${ev.time_status}</span>
      <span class="badge">${price}</span>
    </div>
    <div class="progress"><div style="width:${Math.min(100,(ev.progress_amount/Math.max(1,ev.goal_amount))*100)}%"></div></div>
    <div style="margin-top:10px"><a href="#" class="btn" data-id="${ev.event_id}">View details</a></div>
  `;
  card.querySelector('a.btn').addEventListener('click',(e)=>{
    e.preventDefault();
    window.location.href = `event.html?id=${ev.event_id}`;
  });
  return card;
}

async function loadCategories(){
  const cats = await window.apiGet('/api/categories');
  cats.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c.category_id;
    opt.textContent = c.name;
    categorySel.appendChild(opt);
  });
}

async function doSearch(){
  errorEl.style.display='none';
  resultsEl.innerHTML = '';

  const name = document.getElementById('name').value.trim();
  const date = document.getElementById('date').value;
  const location = document.getElementById('location').value.trim();
  const category = categorySel.value;

  const params = new URLSearchParams();
  if(name) params.set('name', name);
  if(date) params.set('date', date);
  if(location) params.set('location', location);
  if(category) params.set('category', category);

  try{
    const data = await window.apiGet('/api/search?' + params.toString());
    if(Array.isArray(data) && data.length){
      data.forEach(ev => resultsEl.appendChild(eventCard(ev)));
    }else{
      errorEl.style.display='block';
      errorEl.textContent = 'No events found. Try changing your filters.';
    }
  }catch(err){
    errorEl.style.display='block';
    errorEl.textContent = 'Search failed. Is the API running?';
  }
}

document.getElementById('searchForm').addEventListener('submit', (e)=>{
  e.preventDefault();
  doSearch();
});

document.getElementById('clearBtn').addEventListener('click', ()=>{
  document.getElementById('name').value='';
  document.getElementById('date').value='';
  document.getElementById('location').value='';
  document.getElementById('category').value='';
  resultsEl.innerHTML='';
  errorEl.style.display='none';
});

(async ()=>{
  try { await loadCategories(); } catch {}
})();
