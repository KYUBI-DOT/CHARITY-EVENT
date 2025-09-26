async function loadEvent(){
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  if(!id){
    document.getElementById("eventError").style.display = "block";
    document.getElementById("eventError").textContent = "No event ID provided.";
    return;
  }

  try{
    const ev = await window.apiGet(`/api/events/${id}`);
    document.getElementById("eventName").textContent = ev.name;
    document.getElementById("eventDesc").textContent = ev.description;
    document.getElementById("eventLoc").textContent = ev.location;
    document.getElementById("eventDate").textContent =
      new Date(ev.start_datetime).toLocaleString() + " – " +
      new Date(ev.end_datetime).toLocaleString();
    document.getElementById("eventCat").textContent = ev.category;
    document.getElementById("eventPrice").textContent = ev.ticket_price.toFixed(2);
    document.getElementById("eventGoal").textContent = ev.goal_amount.toFixed(2);
    document.getElementById("eventProg").textContent = ev.progress_amount.toFixed(2);

    // progress bar
    const percent = Math.min(100, (ev.progress_amount / ev.goal_amount) * 100);
    document.getElementById("progressBar").style.width = percent + "%";

    document.getElementById("eventMeta").textContent =
      `${ev.category} • ${ev.location} • ${ev.time_status.toUpperCase()}`;

    document.getElementById("registerBtn").addEventListener("click", () => {
      alert("🚧 Register feature is under construction.");
    });
  }catch(err){
    document.getElementById("eventError").style.display = "block";
    document.getElementById("eventError").textContent = "Failed to load event details.";
  }
}

loadEvent();
