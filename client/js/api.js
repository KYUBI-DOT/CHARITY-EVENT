const API_BASE = localStorage.getItem('API_BASE') || 'http://localhost:4000';

async function apiGet(path) {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json();
}

function gotoEvent(id){
  const url = new URL('event.html', window.location.href);
  url.searchParams.set('id', id);
  window.location.href = url.toString();
}

window.apiGet = apiGet;
window.gotoEvent = gotoEvent;
