(function () {
  const LOCATION = {
    latitude: 40.4898,
    longitude: -81.4457,
  };

  const DEG = Math.PI / 180;
  const RAD = 180 / Math.PI;

  function normalizeDegrees(value) {
    return ((value % 360) + 360) % 360;
  }

  function julianDate(date) {
    return date.getTime() / 86400000 + 2440587.5;
  }

  function gmst(date) {
    const jd = julianDate(date);
    const d = jd - 2451545.0;
    return normalizeDegrees(280.46061837 + 360.98564736629 * d);
  }

  function equatorialToHorizontal(raDeg, decDeg, date) {
    const lat = LOCATION.latitude * DEG;
    const dec = decDeg * DEG;
    const lst = normalizeDegrees(gmst(date) + LOCATION.longitude);
    const hourAngle = normalizeDegrees(lst - raDeg) * DEG;

    const altitude = Math.asin(
      Math.sin(lat) * Math.sin(dec) +
      Math.cos(lat) * Math.cos(dec) * Math.cos(hourAngle)
    );

    const azimuth = Math.atan2(
      -Math.sin(hourAngle),
      Math.tan(dec) * Math.cos(lat) - Math.sin(lat) * Math.cos(hourAngle)
    );

    return {
      altitude: altitude * RAD,
      azimuth: normalizeDegrees(azimuth * RAD),
    };
  }

  function solarEquatorial(date) {
    const jd = julianDate(date);
    const n = jd - 2451545.0;
    const meanLongitude = normalizeDegrees(280.460 + 0.9856474 * n);
    const meanAnomaly = normalizeDegrees(357.528 + 0.9856003 * n) * DEG;
    const eclipticLongitude = normalizeDegrees(
      meanLongitude + 1.915 * Math.sin(meanAnomaly) + 0.020 * Math.sin(2 * meanAnomaly)
    ) * DEG;
    const obliquity = (23.439 - 0.0000004 * n) * DEG;

    return {
      ra: normalizeDegrees(
        Math.atan2(
          Math.cos(obliquity) * Math.sin(eclipticLongitude),
          Math.cos(eclipticLongitude)
        ) * RAD
      ),
      dec: Math.asin(Math.sin(obliquity) * Math.sin(eclipticLongitude)) * RAD,
    };
  }

  function moonEquatorial(date) {
    const jd = julianDate(date);
    const d = jd - 2451543.5;

    const n = normalizeDegrees(125.1228 - 0.0529538083 * d) * DEG;
    const i = 5.1454 * DEG;
    const w = normalizeDegrees(318.0634 + 0.1643573223 * d) * DEG;
    const a = 60.2666;
    const e = 0.0549;
    const m = normalizeDegrees(115.3654 + 13.0649929509 * d) * DEG;

    const eccentricAnomaly = m + e * Math.sin(m) * (1 + e * Math.cos(m));
    const xv = a * (Math.cos(eccentricAnomaly) - e);
    const yv = a * Math.sqrt(1 - e * e) * Math.sin(eccentricAnomaly);
    const v = Math.atan2(yv, xv);
    const r = Math.sqrt(xv * xv + yv * yv);

    const xh = r * (Math.cos(n) * Math.cos(v + w) - Math.sin(n) * Math.sin(v + w) * Math.cos(i));
    const yh = r * (Math.sin(n) * Math.cos(v + w) + Math.cos(n) * Math.sin(v + w) * Math.cos(i));
    const zh = r * (Math.sin(v + w) * Math.sin(i));

    const obliquity = (23.4393 - 3.563e-7 * d) * DEG;
    const xe = xh;
    const ye = yh * Math.cos(obliquity) - zh * Math.sin(obliquity);
    const ze = yh * Math.sin(obliquity) + zh * Math.cos(obliquity);

    return {
      ra: normalizeDegrees(Math.atan2(ye, xe) * RAD),
      dec: Math.atan2(ze, Math.sqrt(xe * xe + ye * ye)) * RAD,
    };
  }

  function injectOrbitalStyles() {
    if (document.getElementById("trueSkyPositionStyles")) return;

    const style = document.createElement("style");
    style.id = "trueSkyPositionStyles";
    style.textContent = `
      .sun-position-card {
        display: grid;
        gap: 0.8rem;
      }

      .sky-orbit-graphic {
        position: relative;
        min-height: 220px;
        border-radius: 18px;
        overflow: hidden;
        border: 1px solid rgba(255, 255, 255, 0.08);
        background:
          radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.04), rgba(255, 255, 255, 0.015) 46%, transparent 47%),
          linear-gradient(180deg, rgba(110, 145, 220, 0.08), rgba(255, 255, 255, 0.02));
      }

      .sky-orbit-ring {
        position: absolute;
        inset: 50% auto auto 50%;
        width: min(160px, 74%);
        aspect-ratio: 1;
        border-radius: 999px;
        border: 1.5px solid rgba(255, 255, 255, 0.15);
        transform: translate(-50%, -50%);
      }

      .sky-orbit-axis {
        position: absolute;
        background: rgba(255, 255, 255, 0.08);
      }

      .sky-orbit-axis-h {
        left: 50%;
        top: 50%;
        width: min(190px, 86%);
        height: 1px;
        transform: translate(-50%, -50%);
      }

      .sky-orbit-axis-v {
        left: 50%;
        top: 50%;
        width: 1px;
        height: min(190px, 86%);
        transform: translate(-50%, -50%);
      }

      .sky-orbit-cardinal {
        position: absolute;
        color: var(--ink-soft);
        font-size: 0.68rem;
        font-weight: 600;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }

      .sky-orbit-cardinal.north { left: 50%; bottom: 10px; transform: translateX(-50%); }
      .sky-orbit-cardinal.south { left: 50%; top: 10px; transform: translateX(-50%); }
      .sky-orbit-cardinal.east { left: 12px; top: 50%; transform: translateY(-50%); }
      .sky-orbit-cardinal.west { right: 12px; top: 50%; transform: translateY(-50%); }

      .earth-core {
        position: absolute;
        left: 50%;
        top: 50%;
        width: 58px;
        height: 58px;
        display: grid;
        place-items: center;
        border-radius: 999px;
        border: 1px solid rgba(255, 255, 255, 0.12);
        color: var(--ink);
        font-size: 0.75rem;
        font-weight: 700;
        background:
          radial-gradient(circle at 35% 30%, rgba(87, 163, 255, 0.45), rgba(48, 97, 156, 0.85) 52%, rgba(20, 36, 56, 0.95));
        box-shadow: 0 12px 28px rgba(0, 0, 0, 0.22), inset 0 1px 8px rgba(255, 255, 255, 0.14);
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
        width: 18px;
        height: 18px;
        border-radius: 999px;
        background: #ffca5f;
        box-shadow: 0 0 24px rgba(255, 202, 95, 0.7);
      }

      .moon-body {
        width: 34px;
        height: 34px;
        display: grid;
        place-items: center;
      }

      .moon-body .moon-disc {
        width: 100%;
        height: auto;
      }

      .sky-body[data-below-horizon="true"] {
        opacity: 0.34;
        filter: grayscale(0.25);
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

      .combined-sky-meta .moon-inline-info small {
        display: block;
        color: var(--ink-soft);
      }

      @media (max-width: 720px) {
        .sky-orbit-graphic {
          min-height: 200px;
        }

        .combined-sky-meta {
          grid-template-columns: 1fr;
        }
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
      orbitGraphic.setAttribute("aria-label", "Live sun and moon position around Earth");
      orbitGraphic.className = "sky-orbit-graphic";
      orbitGraphic.innerHTML = `
        <span class="sky-orbit-ring"></span>
        <span class="sky-orbit-axis sky-orbit-axis-h"></span>
        <span class="sky-orbit-axis sky-orbit-axis-v"></span>
        <span class="sky-orbit-cardinal north">N</span>
        <span class="sky-orbit-cardinal east">E</span>
        <span class="sky-orbit-cardinal south">S</span>
        <span class="sky-orbit-cardinal west">W</span>
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
        moonNote.textContent = "Live orbit view around Earth; phase shown on the moon disc.";
        moonInfo.appendChild(moonNote);
      }

      sunCard.appendChild(meta);
      meta.appendChild(sunTimesGrid);
      meta.appendChild(moonInfo);
    }

    const moonBody = document.getElementById("homeSkyOrbitMoon");
    if (moonDisc && moonBody && moonDisc.parentElement !== moonBody) {
      moonBody.appendChild(moonDisc);
    }

    if (moonCard) {
      moonCard.style.display = "none";
    }

    return {
      sunElement: document.getElementById("homeSkyOrbitSun"),
      moonElement: document.getElementById("homeSkyOrbitMoon"),
    };
  }

  function applyOrbitPosition(element, position) {
    if (!element || !position) return;

    const angle = (position.azimuth - 180) * DEG;
    const radius = 39;
    const x = 50 + radius * Math.sin(angle);
    const y = 50 - radius * Math.cos(angle);

    element.style.left = `${x}%`;
    element.style.top = `${y}%`;
    element.dataset.belowHorizon = position.altitude >= 0 ? "false" : "true";
  }

  function updateTrueSkyPositions() {
    const bodies = buildCombinedSkyGraphic();
    if (!bodies) return;

    const now = new Date();
    const sunEq = solarEquatorial(now);
    const moonEq = moonEquatorial(now);

    const sun = equatorialToHorizontal(sunEq.ra, sunEq.dec, now);
    const moon = equatorialToHorizontal(moonEq.ra, moonEq.dec, now);

    applyOrbitPosition(bodies.sunElement, sun);
    applyOrbitPosition(bodies.moonElement, moon);
  }

  function startTrueSkyPositions() {
    injectOrbitalStyles();
    updateTrueSkyPositions();
    window.setInterval(updateTrueSkyPositions, 60000);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => window.setTimeout(startTrueSkyPositions, 0));
  } else {
    window.setTimeout(startTrueSkyPositions, 0);
  }
})();
