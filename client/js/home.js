const listEl = document.getElementById('events');
const errEl = document.getElementById('homeError');

function eventCard(ev){
  const pct = ev.goal_amount ? Math.min(100, Math.round((ev.progress_amount/ev.goal_amount)*100)) : 0;
  const div = document.createElement('div');
  div.className='card';
  div.innerHTML = `
    <div class="muted">${ev.category || ''} • ${new Date(ev.start_datetime).toLocaleString()}</div>
    <h3>${ev.name}</h3>
    <div class="muted">${ev.location}</div>
    <div style="margin:8px 0">
      <span class="badge">${ev.time_status}</span>
      <span class="badge">$${ev.ticket_price.toFixed(2)} ${ev.ticket_price===0?'(Free)':''}</span>
    </div>
    <div class="progress"><div style="width:${pct}%"></div></div>
    <div class="muted" style="margin-top:6px">Raised $${ev.progress_amount.toFixed(2)} of $${ev.goal_amount.toFixed(2)}</div>
    <div style="margin-top:12px"><a class="btn" href="#" data-id="${ev.event_id}">View details</a></div>
  `;
  div.querySelector('a.btn').addEventListener('click', (e)=>{ e.preventDefault(); window.gotoEvent(ev.event_id); });
  return div;
}

(async () => {
  try{
    const events = await window.apiGet('/api/events');
    listEl.innerHTML='';
    events.forEach(ev => listEl.appendChild(eventCard(ev)));
  }catch(err){
    errEl.style.display='block';
    errEl.textContent = 'Failed to load events. Ensure API is running on http://localhost:4000';
  }
})();
