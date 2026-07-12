(function () {
  const TIMEZONE = "America/New_York";
  const DEG = Math.PI / 180;
  const KNOWN_NEW_MOON = Date.UTC(2000, 0, 6, 18, 14);
  const LUNAR_CYCLE_DAYS = 29.530588853;

  function localMinutes(date) {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: TIMEZONE,
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
      hour12: false,
    }).formatToParts(date);

    const value = (type) => Number(parts.find((part) => part.type === type)?.value || 0);
    return value("hour") * 60 + value("minute") + value("second") / 60;
  }

  function lunarPhaseFraction(date) {
    const days = (date.getTime() - KNOWN_NEW_MOON) / 86400000;
    return ((days % LUNAR_CYCLE_DAYS) + LUNAR_CYCLE_DAYS) % LUNAR_CYCLE_DAYS / LUNAR_CYCLE_DAYS;
  }

  function injectOrbitalStyles() {
    if (document.getElementById("trueSkyPositionStyles")) return;

    const style = document.createElement("style");
    style.id = "trueSkyPositionStyles";
    style.textContent = `
      .sun-position-card { display: grid; gap: 0.8rem; }

      .sky-orbit-graphic {
        position: relative;
        min-height: 220px;
        border-radius: 18px;
        overflow: hidden;
        border: 1px solid rgba(255, 255, 255, 0.08);
        background:
          linear-gradient(180deg, rgba(110, 145, 220, 0.09) 0 50%, rgba(8, 12, 20, 0.22) 50% 100%),
          radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.04), transparent 52%);
      }

      .sky-orbit-ring {
        position: absolute;
        left: 50%;
        top: 50%;
        width: min(164px, 74%);
        aspect-ratio: 1;
        border-radius: 50%;
        border: 1.5px solid rgba(255, 255, 255, 0.16);
        transform: translate(-50%, -50%);
      }

      .sky-horizon {
        position: absolute;
        left: 8%;
        right: 8%;
        top: 50%;
        height: 1px;
        background: rgba(255, 255, 255, 0.18);
      }

      .sky-orbit-cardinal {
        position: absolute;
        color: var(--ink-soft);
        font-size: 0.66rem;
        font-weight: 600;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }

      .sky-orbit-cardinal.noon { left: 50%; top: 10px; transform: translateX(-50%); }
      .sky-orbit-cardinal.sunrise { left: 12px; top: 50%; transform: translateY(-50%); }
      .sky-orbit-cardinal.sunset { right: 12px; top: 50%; transform: translateY(-50%); }
      .sky-orbit-cardinal.midnight { left: 50%; bottom: 10px; transform: translateX(-50%); }

      .earth-core {
        position: absolute;
        left: 50%;
        top: 50%;
        width: 58px;
        height: 58px;
        display: grid;
        place-items: center;
        border-radius: 50%;
        border: 1px solid rgba(255, 255, 255, 0.13);
        color: var(--ink);
        font-size: 0.72rem;
        font-weight: 700;
        background: radial-gradient(circle at 35% 30%, rgba(87, 163, 255, 0.48), rgba(48, 97, 156, 0.9) 52%, rgba(20, 36, 56, 0.98));
        box-shadow: 0 12px 28px rgba(0, 0, 0, 0.24), inset 0 1px 8px rgba(255, 255, 255, 0.14);
        transform: translate(-50%, -50%);
      }

      .sky-body {
        position: absolute;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
        transition: left 0.45s ease, top 0.45s ease, opacity 0.25s ease, filter 0.25s ease;
      }

      .sun-body {
        width: 19px;
        height: 19px;
        border-radius: 50%;
        background: #ffca5f;
        box-shadow: 0 0 24px rgba(255, 202, 95, 0.72);
      }

      .moon-body {
        width: 34px;
        height: 34px;
        display: grid;
        place-items: center;
      }

      .moon-body .moon-disc { width: 100%; height: auto; }

      .sky-body[data-below-horizon="true"] {
        opacity: 0.3;
        filter: grayscale(0.35);
      }

      .combined-sky-meta {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 0.75rem;
      }

      .combined-sky-meta .moon-inline-info {
        display: grid;
        gap: 0.28rem;
        min-width: 0;
        padding: 0.72rem;
        border-radius: 14px;
        border: 1px solid rgba(255, 255, 255, 0.065);
        background: rgba(255, 255, 255, 0.035);
      }

      .combined-sky-meta .moon-inline-info small { display: block; color: var(--ink-soft); }

      @media (max-width: 720px) {
        .sky-orbit-graphic { min-height: 200px; }
        .combined-sky-meta { grid-template-columns: 1fr; }
      }
    `;

    document.head.appendChild(style);
  }

  function buildCombinedSkyGraphic() {
    const sunCard = document.querySelector(".sun-position-card");
    const orbitGraphic = document.getElementById("homeSunPath");
    const sunTimesGrid = sunCard?.querySelector(".sun-times-grid");
    const moonCard = document.querySelector(".moon-position-card");
    const moonDisc = document.getElementById("homeMoonDisc");
    const moonPhase = document.getElementById("homeMoonPhase");
    const moonPercent = document.getElementById("homeMoonPercent");
    const moonNote = document.getElementById("homeMoonNote");

    if (!sunCard || !orbitGraphic || !sunTimesGrid) return null;

    if (!orbitGraphic.dataset.combinedOrbitBuilt) {
      orbitGraphic.dataset.combinedOrbitBuilt = "true";
      orbitGraphic.className = "sky-orbit-graphic";
      orbitGraphic.setAttribute("aria-label", "Sun and moon sky clock");
      orbitGraphic.innerHTML = `
        <span class="sky-orbit-ring"></span>
        <span class="sky-horizon"></span>
        <span class="sky-orbit-cardinal noon">Noon</span>
        <span class="sky-orbit-cardinal sunrise">Rise</span>
        <span class="sky-orbit-cardinal sunset">Set</span>
        <span class="sky-orbit-cardinal midnight">Midnight</span>
        <span class="earth-core">Earth</span>
        <span class="sky-body sun-body" id="homeSkyOrbitSun" aria-hidden="true"></span>
        <span class="sky-body moon-body" id="homeSkyOrbitMoon" aria-hidden="true"></span>
      `;

      const meta = document.createElement("div");
      meta.className = "combined-sky-meta";

      const moonInfo = document.createElement("div");
      moonInfo.className = "moon-inline-info";
      moonInfo.innerHTML = `<span class="mini-label">Moon phase</span>`;

      if (moonPhase) moonInfo.appendChild(moonPhase);
      if (moonPercent) moonInfo.appendChild(moonPercent);
      if (moonNote) {
        moonNote.textContent = "Moon position is offset from the sun by the current lunar phase.";
        moonInfo.appendChild(moonNote);
      }

      sunCard.appendChild(meta);
      meta.appendChild(sunTimesGrid);
      meta.appendChild(moonInfo);
    }

    const moonBody = document.getElementById("homeSkyOrbitMoon");
    if (moonDisc && moonBody && moonDisc.parentElement !== moonBody) moonBody.appendChild(moonDisc);
    if (moonCard) moonCard.style.display = "none";

    return {
      sun: document.getElementById("homeSkyOrbitSun"),
      moon: document.getElementById("homeSkyOrbitMoon"),
    };
  }

  function placeBody(element, angleDegrees) {
    if (!element) return;

    const angle = angleDegrees * DEG;
    const radius = 39;
    const x = 50 + radius * Math.sin(angle);
    const y = 50 - radius * Math.cos(angle);

    element.style.left = `${x}%`;
    element.style.top = `${y}%`;
    element.dataset.belowHorizon = Math.cos(angle) > 0 ? "false" : "true";
  }

  function updateSkyClock() {
    const bodies = buildCombinedSkyGraphic();
    if (!bodies) return;

    const now = new Date();
    const minutes = localMinutes(now);

    // Midnight is at the bottom, sunrise at the left, noon at the top, sunset at the right.
    const sunAngle = ((minutes / 1440) * 360 + 180) % 360;
    const moonAngle = (sunAngle + lunarPhaseFraction(now) * 360) % 360;

    placeBody(bodies.sun, sunAngle);
    placeBody(bodies.moon, moonAngle);
  }

  function startSkyClock() {
    injectOrbitalStyles();
    updateSkyClock();
    window.setInterval(updateSkyClock, 60000);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => window.setTimeout(startSkyClock, 0));
  } else {
    window.setTimeout(startSkyClock, 0);
  }
})();