document.addEventListener("DOMContentLoaded", () => {
  const locationLabel = document.querySelector(".time-today-card .dashboard-card-head strong");
  if (locationLabel) {
    locationLabel.textContent = "New Philadelphia, OH";
  }

  const moonLabel = document.querySelector(".moon-position-card .mini-label");
  if (moonLabel) {
    moonLabel.textContent = "Moon phase track";
  }

  const moonNote = document.getElementById("homeMoonNote");
  if (moonNote && moonNote.textContent.includes("Lunar day")) {
    moonNote.textContent = `${moonNote.textContent} Visual shows phase cycle, not exact sky position.`;
  }

  const weekendEl = document.getElementById("homeWeekendCountdown");
  if (weekendEl) {
    const now = new Date();
    const localParts = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/New_York",
      weekday: "short",
    }).format(now);

    if (localParts === "Sat" || localParts === "Sun") {
      weekendEl.textContent = "Now";
    }
  }

  const goReason = document.getElementById("homeGoReason");
  if (goReason && goReason.textContent === "No obvious weather red flags right now.") {
    goReason.textContent = "No obvious weather red flags for casual outdoor activity right now.";
  }
});
