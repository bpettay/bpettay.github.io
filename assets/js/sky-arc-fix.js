(() => {
  const DEG = Math.PI / 180;
  const RAD = 180 / Math.PI;
  const DAY_MS = 86400000;
  const NEW_MOON = Date.UTC(2000, 0, 6, 18, 14);
  const LUNAR_CYCLE = 29.530588853;
  const LEFT = 78;
  const RIGHT = 822;
  const WIDTH = RIGHT - LEFT;

  let latitude = null;
  let longitude = null;
  let timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  let rendering = false;
  let observer = null;

  const normalize = (value) => ((value % 360) + 360) % 360;
  const signedAngle = (value) => {
    const angle = normalize(value);
    return angle > 180 ? angle - 360 : angle;
  };
  const julian = (date) => date.getTime() / DAY_MS + 2440587.5;
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

  function altitude(kind, date) {
    const equatorial = kind === "sun" ? solarEquatorial(date) : moonEquatorial(date);
    const latitudeRad = latitude * DEG;
    const declination = equatorial.dec * DEG;
    const hourAngle = signedAngle(gmst(date) + longitude - equatorial.ra) * DEG;
    return Math.asin(
      Math.sin(latitudeRad) * Math.sin(declination) +
      Math.cos(latitudeRad) * Math.cos(declination) * Math.cos(hourAngle)
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
    const guess = new Date(Date.UTC(p.year, p.month - 1, p.day));
    return new Date(guess.getTime() - timezoneOffsetMs(guess));
  }

  function formatTime(date) {
    if (!date) return "--:--";
    return new Intl.DateTimeFormat("en-US", { timeZone, hour: "numeric", minute: "2-digit" }).format(date);
  }

  function lunarPhase(date = new Date()) {
    const age = (((date.getTime() - NEW_MOON) / DAY_MS) % LUNAR_CYCLE + LUNAR_CYCLE) % LUNAR_CYCLE;
    const fraction = age / LUNAR_CYCLE;
    const illumination = Math.round(((1 - Math.cos(2 * Math.PI * fraction)) / 2) * 100);
    let name = "New Moon";
    if (fraction > 0.03 && fraction < 0.22) name = "Waxing Crescent";
    else if (fraction < 0.28) name = "First Quarter";
    else if (fraction < 0.47) name = "Waxing Gibbous";
    else if (fraction < 0.53) name = "Full Moon";
    else if (fraction < 0.72) name = "Waning Gibbous";
    else if (fraction < 0.78) name = "Last Quarter";
    else if (fraction < 0.97) name = "Waning Crescent";
    return { age, fraction, illumination, name };
  }

  function refineCrossing(kind, before, after) {
    let low = before.getTime();
    let high = after.getTime();
    let lowAlt = altitude(kind, new Date(low));
    for (let i = 0; i < 18; i += 1) {
      const mid = (low + high) / 2;
      const midAlt = altitude(kind, new Date(mid));
      if ((lowAlt < 0) === (midAlt < 0)) {
        low = mid;
        lowAlt = midAlt;
      } else {
        high = mid;
      }
    }
    return new Date((low + high) / 2);
  }

  function buildDailyTrack(kind, midnight, cardTop) {
    const end = new Date(midnight.getTime() + DAY_MS);
    const step = 5 * 60000;
    const samples = [];
    const crossings = [];
    let peak = null;

    for (let time = midnight.getTime(); time <= end.getTime(); time += step) {
      const date = new Date(time);
      const alt = altitude(kind, date);
      const sample = { date, altitude: alt };
      samples.push(sample);
      if (!peak || alt > peak.altitude) peak = sample;
      const prev = samples[samples.length - 2];
      if (prev && ((prev.altitude < 0 && alt >= 0) || (prev.altitude >= 0 && alt < 0))) {
        crossings.push({
          date: refineCrossing(kind, prev.date, date),
          type: prev.altitude < alt ? "rise" : "set",
        });
      }
    }

    const graphTop = cardTop + 108;
    const horizonY = cardTop + 285;
    const graphHeight = horizonY - graphTop;
    const commands = [];
    let open = false;
    samples.forEach((sample) => {
      if (sample.altitude >= 0) {
        const progress = (sample.date - midnight) / DAY_MS;
        const x = LEFT + progress * WIDTH;
        const y = horizonY - (Math.min(90, sample.altitude) / 90) * graphHeight;
        commands.push(`${open ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`);
        open = true;
      } else {
        open = false;
      }
    });

    const rise = crossings.find((event) => event.type === "rise")?.date || null;
    const set = crossings.find((event) => event.type === "set" && (!rise || event.date > rise))?.date || crossings.find((event) => event.type === "set")?.date || null;
    return { path: commands.join(" "), crossings, rise, set, peak, graphTop, horizonY, graphHeight };
  }

  function pointFor(kind, date, midnight, track) {
    const progress = Math.max(0, Math.min(1, (date - midnight) / DAY_MS));
    const alt = altitude(kind, date);
    return {
      x: LEFT + progress * WIDTH,
      y: track.horizonY - (Math.max(0, Math.min(90, alt)) / 90) * track.graphHeight,
      altitude: alt,
    };
  }

  function directionLabel(now, peakDate, altitudeValue) {
    if (altitudeValue < 0) return { text: "Below horizon", arrow: "", className: "muted" };
    const delta = (now - peakDate) / 60000;
    if (Math.abs(delta) <= 30) return { text: "Near peak", arrow: "•", className: "peak" };
    if (delta < 0) return { text: "Rising", arrow: "↗", className: "rising" };
    return { text: "Setting", arrow: "↘", className: "setting" };
  }

  function phaseContext(phase) {
    if (phase.illumination <= 8) return "The Moon is close to the Sun in the sky and follows a similar daily path.";
    if (phase.illumination >= 92) return "The Moon is opposite the Sun and typically rises near sunset.";
    if (phase.fraction < 0.5) return "A waxing Moon generally trails the Sun and remains visible later each day.";
    return "A waning Moon generally leads the Sun and is often visible before sunrise.";
  }

  function installScene() {
    const svg = document.querySelector(".v2-orbit");
    if (!svg) return null;
    svg.setAttribute("viewBox", "0 0 900 900");
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", "Large live Sun and Moon sky-position cards");
    svg.innerHTML = `
      <defs>
        <linearGradient id="skySunFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffc43d" stop-opacity=".22"/><stop offset="1" stop-color="#ffc43d" stop-opacity="0"/></linearGradient>
        <linearGradient id="skyMoonFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9fc7ff" stop-opacity=".18"/><stop offset="1" stop-color="#9fc7ff" stop-opacity="0"/></linearGradient>
        <filter id="skyGlow" x="-150%" y="-150%" width="400%" height="400%"><feGaussianBlur stdDeviation="8" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      </defs>
      <text id="skyLocation" x="450" y="25" text-anchor="middle" class="sky-location">Current location</text>

      <g id="sunCard" class="sky-card">
        <rect x="28" y="42" width="844" height="382" rx="24" class="sky-card-bg"/>
        <text x="58" y="88" class="sky-title sun-title">☀ Sun</text>
        <text id="sunDirection" x="842" y="85" text-anchor="end" class="sky-direction sun-direction">Loading</text>
        <text id="sunPeakTop" x="842" y="112" text-anchor="end" class="sky-peak-meta">Peak --</text>
        <line x1="78" y1="327" x2="822" y2="327" class="sky-horizon"/>
        <g id="sunTicks" class="sky-ticks"></g>
        <path id="sunArea" class="sky-area sun-area"/>
        <path id="sunPath" class="sky-path sun-path"/>
        <g id="sunPeakMarker"><circle r="6" class="sun-point"/><text y="30" text-anchor="middle" class="sky-marker-label">Peak</text><text id="sunPeakValue" y="53" text-anchor="middle" class="sky-marker-value">--</text></g>
        <g id="sunLiveMarker" class="sky-live-marker"><circle r="24" class="sun-glow"/><circle r="13" class="sun-disc"/></g>
        <text id="sunRiseLabel" x="78" y="305" class="sky-event-label">Rise --</text>
        <text id="sunSetLabel" x="822" y="305" text-anchor="end" class="sky-event-label">Set --</text>
        <g class="sky-axis-labels"><text x="78" y="352">12 AM</text><text x="264" y="352" text-anchor="middle">6 AM</text><text x="450" y="352" text-anchor="middle">12 PM</text><text x="636" y="352" text-anchor="middle">6 PM</text><text x="822" y="352" text-anchor="end">12 AM</text></g>
        <rect x="52" y="370" width="796" height="38" rx="12" class="sky-info-strip"/>
        <text id="sunFooter" x="450" y="395" text-anchor="middle" class="sky-footer-text">Loading Sun data…</text>
      </g>

      <g id="moonCard" class="sky-card">
        <rect x="28" y="446" width="844" height="426" rx="24" class="sky-card-bg"/>
        <text x="58" y="492" class="sky-title moon-title">☾ Moon</text>
        <text id="moonDirection" x="842" y="489" text-anchor="end" class="sky-direction moon-direction">Loading</text>
        <text id="moonPeakTop" x="842" y="516" text-anchor="end" class="sky-peak-meta">Peak --</text>
        <line x1="78" y1="731" x2="822" y2="731" class="sky-horizon"/>
        <g id="moonTicks" class="sky-ticks"></g>
        <path id="moonArea" class="sky-area moon-area"/>
        <path id="moonPath" class="sky-path moon-path"/>
        <g id="moonPeakMarker"><circle r="6" class="moon-point"/><text y="30" text-anchor="middle" class="sky-marker-label">Peak</text><text id="moonPeakValue" y="53" text-anchor="middle" class="sky-marker-value">--</text></g>
        <g id="moonLiveMarker" class="sky-live-marker"><circle r="23" class="moon-glow"/><circle r="13" class="moon-disc-large"/></g>
        <text id="moonRiseLabel" x="78" y="709" class="sky-event-label">Rise --</text>
        <text id="moonSetLabel" x="822" y="709" text-anchor="end" class="sky-event-label">Set --</text>
        <g class="sky-axis-labels"><text x="78" y="756">12 AM</text><text x="264" y="756" text-anchor="middle">6 AM</text><text x="450" y="756" text-anchor="middle">12 PM</text><text x="636" y="756" text-anchor="middle">6 PM</text><text x="822" y="756" text-anchor="end">12 AM</text></g>
        <rect x="52" y="774" width="796" height="78" rx="14" class="sky-info-strip"/>
        <text id="moonFooterTitle" x="72" y="803" class="sky-footer-title">Moon context</text>
        <text id="moonFooter" x="72" y="830" class="sky-footer-text left">Loading Moon data…</text>
      </g>`;
    return svg;
  }

  function installStyles() {
    document.getElementById("largeSkyCardStyles")?.remove();
    const style = document.createElement("style");
    style.id = "largeSkyCardStyles";
    style.textContent = `
      .v2-orbit-wrap{margin-top:18px!important;overflow:visible!important}.v2-orbit{width:100%!important;height:auto!important;min-height:0!important;display:block!important;overflow:visible!important}
      .sky-card-bg{fill:rgba(5,16,27,.9);stroke:rgba(102,158,215,.3);stroke-width:1.5}.sky-location{fill:rgba(219,229,241,.55);font-size:12px}.sky-title{font-size:28px;font-weight:750;fill:#f6f8fc}.sun-title{fill:#ffd35d}.moon-title{fill:#d9e8ff}.sky-direction{font-size:22px;font-weight:700}.sun-direction{fill:#ffbf34}.moon-direction{fill:#8fbcff}.sky-peak-meta{fill:rgba(232,239,247,.72);font-size:15px}.sky-horizon{stroke:rgba(225,235,247,.52);stroke-width:1.5}.sky-path{fill:none;stroke-width:5;stroke-linecap:round;stroke-linejoin:round}.sun-path{stroke:#ffc13d}.moon-path{stroke:#9fc7ff}.sky-area{opacity:.7}.sun-area{fill:url(#skySunFill)}.moon-area{fill:url(#skyMoonFill)}.sky-axis-labels text{fill:rgba(224,233,244,.76);font-size:15px}.sky-event-label{fill:#f1f5fa;font-size:16px;font-weight:650}.sky-marker-label{fill:rgba(245,248,252,.78);font-size:14px}.sky-marker-value{fill:#fff;font-size:19px;font-weight:700}.sun-point{fill:#ffc13d}.moon-point{fill:#9fc7ff}.sun-glow{fill:rgba(255,190,40,.3);filter:url(#skyGlow)}.sun-disc{fill:#ffd15a;stroke:#fff0a7;stroke-width:2}.moon-glow{fill:rgba(159,199,255,.28);filter:url(#skyGlow)}.moon-disc-large{fill:#dce9f7;stroke:#fff;stroke-width:1.5}.sky-info-strip{fill:rgba(255,255,255,.035);stroke:rgba(255,255,255,.08)}.sky-footer-text{fill:rgba(231,238,247,.76);font-size:15px}.sky-footer-text.left{text-anchor:start}.sky-footer-title{fill:#f5f8fc;font-size:16px;font-weight:700}.sky-live-marker{transition:transform .7s ease,opacity .35s ease}.sky-ticks line{stroke:rgba(226,235,246,.2);stroke-width:1}
      @media(max-width:680px){.v2-orbit-wrap{margin:14px -4px 0!important}.v2-orbit{width:calc(100% + 8px)!important;max-width:none!important}.v2-weather-panel{padding-left:12px!important;padding-right:12px!important}.sky-title{font-size:30px}.sky-direction{font-size:23px}.sky-axis-labels text{font-size:17px}.sky-event-label{font-size:17px}.sky-footer-text{font-size:16px}.sky-footer-title{font-size:17px}}
    `;
    document.head.appendChild(style);
  }

  function addTicks(groupId, horizonY) {
    const group = document.getElementById(groupId);
    if (!group) return;
    group.innerHTML = "";
    const ns = "http://www.w3.org/2000/svg";
    for (let hour = 0; hour <= 24; hour += 1) {
      const x = LEFT + (hour / 24) * WIDTH;
      const line = document.createElementNS(ns, "line");
      line.setAttribute("x1", x.toFixed(1));
      line.setAttribute("x2", x.toFixed(1));
      line.setAttribute("y1", String(horizonY - (hour % 6 === 0 ? 8 : 4)));
      line.setAttribute("y2", String(horizonY + (hour % 6 === 0 ? 8 : 4)));
      group.appendChild(line);
    }
  }

  function fillArea(path, track) {
    if (!path) return "";
    const firstMatch = path.match(/^M([\d.]+),([\d.]+)/);
    const lastMatch = path.match(/L([\d.]+),([\d.]+)$/) || firstMatch;
    if (!firstMatch || !lastMatch) return "";
    return `${path} L${lastMatch[1]},${track.horizonY} L${firstMatch[1]},${track.horizonY} Z`;
  }

  function renderBody(kind, now, midnight, cardTop) {
    const isSun = kind === "sun";
    const prefix = isSun ? "sun" : "moon";
    const track = buildDailyTrack(kind, midnight, cardTop);
    const current = pointFor(kind, now, midnight, track);
    const peakPoint = pointFor(kind, track.peak.date, midnight, track);
    const direction = directionLabel(now, track.peak.date, current.altitude);

    document.getElementById(`${prefix}Path`)?.setAttribute("d", track.path);
    document.getElementById(`${prefix}Area`)?.setAttribute("d", fillArea(track.path, track));

    const liveMarker = document.getElementById(`${prefix}LiveMarker`);
    if (liveMarker) {
      liveMarker.setAttribute("transform", `translate(${current.x.toFixed(1)} ${current.y.toFixed(1)})`);
      liveMarker.style.opacity = current.altitude >= 0 ? "1" : "0";
    }

    const peakMarker = document.getElementById(`${prefix}PeakMarker`);
    if (peakMarker) peakMarker.setAttribute("transform", `translate(${peakPoint.x.toFixed(1)} ${peakPoint.y.toFixed(1)})`);

    const directionEl = document.getElementById(`${prefix}Direction`);
    if (directionEl) directionEl.textContent = `${direction.text} ${direction.arrow}  ${Math.max(0, current.altitude).toFixed(0)}°`;
    const peakTop = document.getElementById(`${prefix}PeakTop`);
    if (peakTop) peakTop.textContent = `Peak ${track.peak.altitude.toFixed(0)}° at ${formatTime(track.peak.date)}`;
    const peakValue = document.getElementById(`${prefix}PeakValue`);
    if (peakValue) peakValue.textContent = `${track.peak.altitude.toFixed(0)}° · ${formatTime(track.peak.date)}`;
    const riseLabel = document.getElementById(`${prefix}RiseLabel`);
    if (riseLabel) riseLabel.textContent = `Rise ${formatTime(track.rise)}`;
    const setLabel = document.getElementById(`${prefix}SetLabel`);
    if (setLabel) setLabel.textContent = `Set ${formatTime(track.set)}`;

    return { track, current, direction };
  }

  function render() {
    if (rendering || !Number.isFinite(latitude) || !Number.isFinite(longitude)) return;
    rendering = true;
    try {
      const now = new Date();
      const midnight = localMidnightUtc(now);
      const sun = renderBody("sun", now, midnight, 42);
      const moon = renderBody("moon", now, midnight, 446);
      const phase = lunarPhase(now);

      addTicks("sunTicks", sun.track.horizonY);
      addTicks("moonTicks", moon.track.horizonY);

      const sunFooter = document.getElementById("sunFooter");
      if (sunFooter) sunFooter.textContent = `${formatTime(sun.track.rise)} sunrise  ·  ${formatTime(sun.track.set)} sunset  ·  ${sun.direction.text.toLowerCase()} now`;
      const moonFooterTitle = document.getElementById("moonFooterTitle");
      if (moonFooterTitle) moonFooterTitle.textContent = `${phase.name} · ${phase.illumination}% illuminated`;
      const moonFooter = document.getElementById("moonFooter");
      if (moonFooter) moonFooter.textContent = phaseContext(phase);
    } finally {
      rendering = false;
    }
  }

  function begin() {
    const svg = document.querySelector(".v2-orbit");
    if (!svg) {
      window.setTimeout(begin, 100);
      return;
    }

    installStyles();
    installScene();

    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(async (position) => {
      latitude = position.coords.latitude;
      longitude = position.coords.longitude;
      const locationLabel = document.getElementById("skyLocation");
      if (locationLabel) locationLabel.textContent = `Current location · ${latitude.toFixed(2)}°, ${longitude.toFixed(2)}°`;

      try {
        const params = new URLSearchParams({ latitude, longitude, timezone: "auto", forecast_days: "1" });
        const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`, { cache: "no-store" });
        if (response.ok) {
          const data = await response.json();
          timeZone = data.timezone || timeZone;
        }
      } catch (_) {
        // Browser timezone is a suitable fallback.
      }

      render();
      window.setInterval(render, 30000);

      observer?.disconnect();
      observer = new MutationObserver(() => {
        if (!rendering && document.querySelector(".v2-orbit")?.getAttribute("viewBox") !== "0 0 900 900") {
          installScene();
          render();
        }
      });
      observer.observe(svg, { attributes: true, childList: true, subtree: true });
    }, () => {
      const locationLabel = document.getElementById("skyLocation");
      if (locationLabel) locationLabel.textContent = "Enable location access for live sky positions";
    }, { enableHighAccuracy: false, timeout: 10000, maximumAge: 900000 });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => window.setTimeout(begin, 100));
  else window.setTimeout(begin, 100);
})();