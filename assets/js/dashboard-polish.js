(() => {
  let latitude = null;
  let longitude = null;
  let timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  const DEG = Math.PI / 180;
  const RAD = 180 / Math.PI;

  const normalize = (value) => ((value % 360) + 360) % 360;
  const julian = (date) => date.getTime() / 86400000 + 2440587.5;
  const gmst = (date) => normalize(280.46061837 + 360.98564736629 * (julian(date) - 2451545));

  function solarEquatorial(date) {
    const n = julian(date) - 2451545;
    const meanLongitude = normalize(280.46 + 0.9856474 * n);
    const meanAnomaly = normalize(357.528 + 0.9856003 * n) * DEG;
    const lambda = normalize(meanLongitude + 1.915 * Math.sin(meanAnomaly) + 0.02 * Math.sin(2 * meanAnomaly)) * DEG;
    const obliquity = (23.439 - 0.0000004 * n) * DEG;
    return {
      ra: normalize(Math.atan2(Math.cos(obliquity) * Math.sin(lambda), Math.cos(lambda)) * RAD),
      dec: Math.asin(Math.sin(obliquity) * Math.sin(lambda)) * RAD,
    };
  }

  function moonEquatorial(date) {
    const d = julian(date) - 2451543.5;
    const node = normalize(125.1228 - 0.0529538083 * d) * DEG;
    const inclination = 5.1454 * DEG;
    const periapsis = normalize(318.0634 + 0.1643573223 * d) * DEG;
    const eccentricity = 0.0549;
    const meanAnomaly = normalize(115.3654 + 13.0649929509 * d) * DEG;
    const eccentricAnomaly = meanAnomaly + eccentricity * Math.sin(meanAnomaly) * (1 + eccentricity * Math.cos(meanAnomaly));
    const xv = 60.2666 * (Math.cos(eccentricAnomaly) - eccentricity);
    const yv = 60.2666 * Math.sqrt(1 - eccentricity * eccentricity) * Math.sin(eccentricAnomaly);
    const trueAnomaly = Math.atan2(yv, xv);
    const radius = Math.hypot(xv, yv);
    const xh = radius * (Math.cos(node) * Math.cos(trueAnomaly + periapsis) - Math.sin(node) * Math.sin(trueAnomaly + periapsis) * Math.cos(inclination));
    const yh = radius * (Math.sin(node) * Math.cos(trueAnomaly + periapsis) + Math.cos(node) * Math.sin(trueAnomaly + periapsis) * Math.cos(inclination));
    const zh = radius * Math.sin(trueAnomaly + periapsis) * Math.sin(inclination);
    const obliquity = (23.4393 - 3.563e-7 * d) * DEG;
    const xe = xh;
    const ye = yh * Math.cos(obliquity) - zh * Math.sin(obliquity);
    const ze = yh * Math.sin(obliquity) + zh * Math.cos(obliquity);
    return {
      ra: normalize(Math.atan2(ye, xe) * RAD),
      dec: Math.atan2(ze, Math.hypot(xe, ye)) * RAD,
    };
  }

  function altitude(equatorial, date) {
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return NaN;
    const latitudeRad = latitude * DEG;
    const declination = equatorial.dec * DEG;
    let hourAngle = normalize(gmst(date) + longitude - equatorial.ra);
    if (hourAngle > 180) hourAngle -= 360;
    const h = hourAngle * DEG;
    return Math.asin(
      Math.sin(latitudeRad) * Math.sin(declination) +
      Math.cos(latitudeRad) * Math.cos(declination) * Math.cos(h)
    ) * RAD;
  }

  function localParts(date = new Date()) {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
      hour12: false,
    }).formatToParts(date);
    const value = (type) => Number(parts.find((part) => part.type === type)?.value || 0);
    return { year: value("year"), month: value("month"), day: value("day"), hour: value("hour"), minute: value("minute"), second: value("second") };
  }

  function timezoneOffsetMs(date) {
    const p = localParts(date);
    return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - date.getTime();
  }

  function localMidnightUtc(date = new Date()) {
    const p = localParts(date);
    let guess = new Date(Date.UTC(p.year, p.month - 1, p.day, 0, 0, 0));
    guess = new Date(guess.getTime() - timezoneOffsetMs(guess));
    return guess;
  }

  function formatTime(date) {
    return new Intl.DateTimeFormat("en-US", {
      timeZone,
      hour: "numeric",
      minute: "2-digit",
    }).format(date);
  }

  function pathPoint(hour, alt, rowTop) {
    const x = 46 + (hour / 24) * 808;
    const clamped = Math.max(-28, Math.min(90, alt));
    const y = rowTop + 151 - ((clamped + 28) / 118) * 126;
    return { x, y };
  }

  function createBodyPath(kind, midnight, rowTop) {
    const samples = [];
    let maxAltitude = -90;
    let maxDate = midnight;
    const crossings = [];
    let previous = null;

    for (let index = 0; index <= 96; index += 1) {
      const hour = index / 4;
      const date = new Date(midnight.getTime() + hour * 3600000);
      const equatorial = kind === "sun" ? solarEquatorial(date) : moonEquatorial(date);
      const alt = altitude(equatorial, date);
      if (alt > maxAltitude) {
        maxAltitude = alt;
        maxDate = date;
      }
      if (previous && previous.alt * alt < 0) {
        const fraction = Math.abs(previous.alt) / (Math.abs(previous.alt) + Math.abs(alt));
        crossings.push(new Date(previous.date.getTime() + fraction * (date.getTime() - previous.date.getTime())));
      }
      samples.push({ hour, alt, date });
      previous = { alt, date };
    }

    const points = samples.map((sample) => pathPoint(sample.hour, sample.alt, rowTop));
    const path = points.map((point, index) => `${index ? "L" : "M"}${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(" ");
    return { path, maxAltitude, maxDate, crossings };
  }

  function markerPoint(kind, now, midnight, rowTop) {
    const hours = (now.getTime() - midnight.getTime()) / 3600000;
    const equatorial = kind === "sun" ? solarEquatorial(now) : moonEquatorial(now);
    const alt = altitude(equatorial, now);
    return { ...pathPoint(hours, alt, rowTop), altitude: alt };
  }

  function ensureSkyPathScene() {
    const svg = document.querySelector(".v2-orbit");
    if (!svg) return null;
    if (svg.dataset.skyPathsBuilt === "true") return svg;

    svg.dataset.skyPathsBuilt = "true";
    svg.setAttribute("viewBox", "0 0 900 430");
    svg.setAttribute("aria-label", "Live daily altitude paths for the Sun and Moon at your current location");
    svg.innerHTML = `
      <defs>
        <filter id="v2SunGlow" x="-150%" y="-150%" width="400%" height="400%">
          <feGaussianBlur stdDeviation="7" result="blur" />
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <radialGradient id="v2MoonFill" cx="35%" cy="30%" r="72%">
          <stop offset="0" stop-color="#f5f7fa" />
          <stop offset="0.58" stop-color="#c4cbd3" />
          <stop offset="1" stop-color="#69727c" />
        </radialGradient>
      </defs>
      <text id="v2SkyLocation" x="450" y="14" text-anchor="middle" class="v2-location-note">Requesting current location…</text>
      <g class="v2-sky-row v2-sun-row">
        <text x="46" y="38" class="v2-row-title">Sun</text>
        <text id="v2SunPeakLabel" x="854" y="38" text-anchor="end" class="v2-row-meta">Peak --</text>
        <rect x="36" y="50" width="828" height="144" rx="16" class="v2-row-bg" />
        <line x1="46" y1="169" x2="854" y2="169" class="v2-horizon" />
        <path id="v2SunPathLine" class="v2-sky-path sun" />
        <g id="v2SunLiveMarker" class="v2-live-marker"><circle r="18" class="v2-sun-glow" /><circle r="10" class="v2-sun-disc" /></g>
        <text id="v2SunStatus" x="46" y="188" class="v2-status-text">Waiting for location permission</text>
      </g>
      <g class="v2-sky-row v2-moon-row">
        <text x="46" y="232" class="v2-row-title">Moon</text>
        <text id="v2MoonPeakLabel" x="854" y="232" text-anchor="end" class="v2-row-meta">Peak --</text>
        <rect x="36" y="244" width="828" height="154" rx="16" class="v2-row-bg" />
        <line x1="46" y1="373" x2="854" y2="373" class="v2-horizon" />
        <path id="v2MoonPathLine" class="v2-sky-path moon" />
        <g id="v2MoonLiveMarker" class="v2-live-marker"><circle r="12" fill="url(#v2MoonFill)" class="v2-moon-disc-live" /></g>
        <text id="v2MoonStatus" x="46" y="392" class="v2-status-text">Waiting for location permission</text>
      </g>
      <g class="v2-time-labels">
        <text x="46" y="418">12 AM</text><text x="248" y="418" text-anchor="middle">6 AM</text><text x="450" y="418" text-anchor="middle">12 PM</text><text x="652" y="418" text-anchor="middle">6 PM</text><text x="854" y="418" text-anchor="end">12 AM</text>
      </g>
    `;
    return svg;
  }

  function setLocationMessage(message) {
    const label = document.getElementById("v2SkyLocation");
    if (label) label.textContent = message;
  }

  function updateSkyPaths() {
    const svg = ensureSkyPathScene();
    if (!svg || !Number.isFinite(latitude) || !Number.isFinite(longitude)) return;

    const now = new Date();
    const midnight = localMidnightUtc(now);
    const sun = createBodyPath("sun", midnight, 50);
    const moon = createBodyPath("moon", midnight, 244);
    const sunMarker = markerPoint("sun", now, midnight, 50);
    const moonMarker = markerPoint("moon", now, midnight, 244);

    document.getElementById("v2SunPathLine")?.setAttribute("d", sun.path);
    document.getElementById("v2MoonPathLine")?.setAttribute("d", moon.path);
    document.getElementById("v2SunLiveMarker")?.setAttribute("transform", `translate(${sunMarker.x.toFixed(1)} ${sunMarker.y.toFixed(1)})`);
    document.getElementById("v2MoonLiveMarker")?.setAttribute("transform", `translate(${moonMarker.x.toFixed(1)} ${moonMarker.y.toFixed(1)})`);

    const sunUp = sunMarker.altitude >= 0;
    const moonUp = moonMarker.altitude >= 0;
    document.getElementById("v2SunLiveMarker")?.classList.toggle("below", !sunUp);
    document.getElementById("v2MoonLiveMarker")?.classList.toggle("below", !moonUp);

    const sunRiseSet = sun.crossings.length >= 2 ? `${formatTime(sun.crossings[0])} rise · ${formatTime(sun.crossings[1])} set` : "No horizon crossings today";
    const moonRiseSet = moon.crossings.length >= 2 ? `${formatTime(moon.crossings[0])} rise · ${formatTime(moon.crossings[1])} set` : moon.crossings.length === 1 ? `Horizon crossing ${formatTime(moon.crossings[0])}` : "No horizon crossings today";
    document.getElementById("v2SunStatus").textContent = `${sunUp ? "Above" : "Below"} horizon · ${Math.abs(sunMarker.altitude).toFixed(0)}° · ${sunRiseSet}`;
    document.getElementById("v2MoonStatus").textContent = `${moonUp ? "Above" : "Below"} horizon · ${Math.abs(moonMarker.altitude).toFixed(0)}° · ${moonRiseSet}`;
    document.getElementById("v2SunPeakLabel").textContent = `Peak ${sun.maxAltitude.toFixed(0)}° at ${formatTime(sun.maxDate)}`;
    document.getElementById("v2MoonPeakLabel").textContent = `Peak ${moon.maxAltitude.toFixed(0)}° at ${formatTime(moon.maxDate)}`;
  }

  function requestLocation() {
    if (!navigator.geolocation) {
      setLocationMessage("Location is not supported by this browser");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        latitude = position.coords.latitude;
        longitude = position.coords.longitude;
        timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
        setLocationMessage(`Current location · ${latitude.toFixed(2)}°, ${longitude.toFixed(2)}°`);
        updateSkyPaths();
      },
      () => {
        setLocationMessage("Enable location access to calculate local Sun and Moon paths");
        document.getElementById("v2SunStatus").textContent = "Location permission is required";
        document.getElementById("v2MoonStatus").textContent = "Location permission is required";
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 900000 }
    );
  }

  function injectStyles() {
    document.getElementById("dashboardPolishStyles")?.remove();
    const style = document.createElement("style");
    style.id = "dashboardPolishStyles";
    style.textContent = `
      #home { max-width:1540px !important; margin:0 auto !important; padding:12px !important; }
      .v2-dashboard { grid-template-columns:minmax(250px,290px) minmax(0,1fr) !important; gap:12px !important; align-items:start !important; }
      .v2-card { border-radius:20px !important; border-color:rgba(115,170,225,.23) !important; background:linear-gradient(145deg,rgba(10,22,34,.97),rgba(5,13,22,.99)) !important; box-shadow:inset 0 1px 0 rgba(255,255,255,.035),0 18px 42px rgba(0,0,0,.26) !important; }
      .v2-time-panel,.v2-weather-panel,.v2-calculator-panel,.v2-shortcuts-panel { padding:22px !important; }
      .v2-weather-strip { grid-template-columns:minmax(145px,1.45fr) repeat(6,minmax(82px,1fr)) minmax(130px,1.15fr) !important; gap:0 !important; border-top:1px solid rgba(255,255,255,.12); border-bottom:1px solid rgba(255,255,255,.12); }
      .v2-current,.v2-stat,.v2-go { border:0 !important; border-right:1px solid rgba(255,255,255,.11) !important; border-radius:0 !important; padding:17px 13px !important; }
      .v2-go { border-right:0 !important; }
      .v2-orbit-wrap { margin-top:12px; }
      .v2-orbit { width:100%; max-height:430px; overflow:visible; }
      .v2-location-note { fill:rgba(220,228,238,.58); font-size:10px; }
      .v2-row-bg { fill:rgba(255,255,255,.025); stroke:rgba(255,255,255,.08); stroke-width:1; }
      .v2-horizon { stroke:rgba(255,255,255,.22); stroke-width:1.2; }
      .v2-sky-path { fill:none; stroke-width:5; stroke-linecap:round; stroke-linejoin:round; }
      .v2-sky-path.sun { stroke:#f5bd45; }
      .v2-sky-path.moon { stroke:#aeb8c7; }
      .v2-row-title { fill:#f4f7fb; font-size:20px; font-weight:700; }
      .v2-row-meta { fill:rgba(220,228,238,.72); font-size:12px; }
      .v2-status-text { fill:rgba(220,228,238,.68); font-size:10px; }
      .v2-time-labels text { fill:rgba(220,228,238,.58); font-size:11px; }
      .v2-sun-glow { fill:rgba(255,198,71,.18); filter:url(#v2SunGlow); }
      .v2-sun-disc { fill:#ffd05b; stroke:#fff1ae; stroke-width:1.2; }
      .v2-moon-disc-live { stroke:rgba(255,255,255,.55); stroke-width:1; }
      .v2-live-marker { transition:transform .7s ease,opacity .4s ease; }
      .v2-live-marker.below { opacity:.35; }
      .v2-sky-footer { margin-top:2px !important; }
      .v2-calculator-panel { grid-column:1 !important; }
      .v2-shortcuts-panel { grid-column:2 !important; }
      .v2-shortcut-grid { grid-template-columns:repeat(4,minmax(0,1fr)) !important; }
      @media(max-width:1180px){.v2-weather-strip{grid-template-columns:repeat(4,minmax(105px,1fr)) !important;gap:10px !important;border:0 !important;}.v2-current,.v2-stat,.v2-go{border:1px solid rgba(255,255,255,.09) !important;border-radius:12px !important;}.v2-current,.v2-go{grid-column:span 2;}}
      @media(max-width:900px){.v2-dashboard{grid-template-columns:1fr !important;}.v2-time-panel,.v2-weather-panel,.v2-calculator-panel,.v2-shortcuts-panel{grid-column:1 !important;}.v2-time-panel{display:grid;grid-template-columns:1fr 1fr;column-gap:24px;}.v2-location,.v2-clock-row,.v2-date{grid-column:1;}.v2-today-list,.v2-daylight{grid-column:2;}}
      @media(max-width:680px){#home{padding:8px !important;}.v2-card{border-radius:16px !important;}.v2-time-panel,.v2-weather-panel,.v2-calculator-panel,.v2-shortcuts-panel{padding:18px !important;}.v2-time-panel{display:block;}.v2-weather-strip{grid-template-columns:repeat(2,minmax(0,1fr)) !important;}.v2-current,.v2-go{grid-column:1/-1;}.v2-shortcut-grid{grid-template-columns:repeat(2,minmax(0,1fr)) !important;}.v2-row-title{font-size:17px;}.v2-row-meta{font-size:10px;}.v2-status-text{font-size:8px;}}
    `;
    document.head.appendChild(style);
  }

  function start() {
    if (!document.querySelector(".v2-dashboard")) {
      setTimeout(start, 50);
      return;
    }
    injectStyles();
    ensureSkyPathScene();
    requestLocation();
    setInterval(updateSkyPaths, 60000);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => setTimeout(start, 0));
  else setTimeout(start, 0);
})();