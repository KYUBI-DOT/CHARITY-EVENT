const container = document.getElementById('eventContainer');
const err = document.getElementById('eventError');

function render(ev){
  const pct = ev.goal_amount ? Math.min(100, Math.round((ev.progress_amount/ev.goal_amount)*100)) : 0;
  container.innerHTML = `
    <div class="card">
      <div class="muted"><a href="index.html">← Back</a></div>
      <h1>${ev.name}</h1>
      <div class="muted">${ev.category} • ${new Date(ev.start_datetime).toLocaleString()} – ${new Date(ev.end_datetime).toLocaleString()}</div>
      <div class="muted">${ev.location}</div>
      <p style="margin-top:10px">${ev.description || ev.summary || ''}</p>
      <div class="progress"><div style="width:${pct}%"></div></div>
      <div class="muted" style="margin-top:6px">Raised $${ev.progress_amount.toFixed(2)} of $${ev.goal_amount.toFixed(2)}</div>
      <div style="display:flex;gap:8px;margin-top:12px">
        <button class="btn" id="registerBtn">Register</button>
        <span class="badge">$${ev.ticket_price.toFixed(2)} ${ev.ticket_price===0?'(Free)':''}</span>
        <span class="badge">${ev.time_status}</span>
      </div>
    </div>
  `;
  document.getElementById('registerBtn').addEventListener('click', ()=>{
    alert('This feature is currently under construction.');
  });
}

(async ()=>{
  const url = new URL(window.location.href);
  const id = url.searchParams.get('id');
  if(!id){ err.style.display='block'; err.textContent='Missing event id'; return; }
  try{
    const ev = await window.apiGet('/api/events/' + encodeURIComponent(id));
    render(ev);
  }catch(e){
    err.style.display='block';
    err.textContent = 'Failed to load event.';
  }
})();
