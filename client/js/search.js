const categorySel = document.getElementById('category');
const errorEl = document.getElementById('error');
const resultsEl = document.getElementById('results');

function renderResult(ev){
  const card = document.createElement('div');
  card.className='card';
  card.innerHTML = `
    <h3>${ev.name}</h3>
    <div class="muted">${ev.category} • ${ev.location}</div>
    <div class="muted">${new Date(ev.start_datetime).toLocaleString()}</div>
    <div style="margin-top:10px"><a href="#" class="btn" data-id="${ev.event_id}">Open</a></div>
  `;
  card.querySelector('a.btn').addEventListener('click', (e)=>{ e.preventDefault(); window.gotoEvent(ev.event_id); });
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
  const date = document.getElementById('date').value;
  const location = document.getElementById('location').value.trim();
  const category = categorySel.value;
  const params = new URLSearchParams();
  if(date) params.set('date', date);
  if(location) params.set('location', location);
  if(category) params.set('category', category);
  try{
    const data = await window.apiGet('/api/search?' + params.toString());
    if(data.length === 0){
      errorEl.style.display='block';
      errorEl.textContent = 'No events found. Try changing your filters.';
    }else{
      data.forEach(ev => resultsEl.appendChild(renderResult(ev)));
    }
  }catch(err){
    errorEl.style.display='block';
    errorEl.textContent = 'Search failed. Is the API running?';
  }
}

document.getElementById('searchForm').addEventListener('submit', (e) => {
  e.preventDefault();      
  doSearch();
});

document.getElementById('clearBtn').addEventListener('click', () => {
  document.getElementById('date').value='';
  document.getElementById('location').value='';
  document.getElementById('category').value='';
  resultsEl.innerHTML='';
  errorEl.style.display='none';
});

(async ()=>{
  try{ await loadCategories(); }catch(e){ /* ignore */ }
})();
