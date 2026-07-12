(() => {
  const LOCATION = {
    label: "New Philadelphia, OH",
    latitude: 40.4898,
    longitude: -81.4457,
    timezone: "America/New_York",
  };

  const NEW_MOON_EPOCH = Date.UTC(2000, 0, 6, 18, 14);
  const LUNAR_CYCLE_DAYS = 29.530588853;

  function formatTime(value) {
    if (!value) return "--:--";
    return new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
      timeZone: LOCATION.timezone,
    }).format(new Date(value));
  }

  function localDateParts(date = new Date()) {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: LOCATION.timezone,
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
      hour12: false,
      weekday: "long",
    }).formatToParts(date);
    const get = (type) => parts.find((part) => part.type === type)?.value;
    return {
      year: Number(get("year")),
      month: Number(get("month")),
      day: Number(get("day")),
      hour: Number(get("hour")),
      minute: Number(get("minute")),
      second: Number(get("second")),
      weekday: get("weekday"),
    };
  }

  function dayOfYear(date) {
    const p = localDateParts(date);
    const current = Date.UTC(p.year, p.month - 1, p.day);
    const start = Date.UTC(p.year, 0, 0);
    return Math.floor((current - start) / 86400000);
  }

  function weekNumber(date) {
    const p = localDateParts(date);
    const current = new Date(Date.UTC(p.year, p.month - 1, p.day));
    const start = new Date(Date.UTC(p.year, 0, 1));
    return Math.ceil((((current - start) / 86400000) + start.getUTCDay() + 1) / 7);
  }

  function lunarPhase(date = new Date()) {
    const age = (((date.getTime() - NEW_MOON_EPOCH) / 86400000) % LUNAR_CYCLE_DAYS + LUNAR_CYCLE_DAYS) % LUNAR_CYCLE_DAYS;
    const fraction = age / LUNAR_CYCLE_DAYS;
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

  function weatherDetails(code) {
    const map = {
      0: ["Clear", "☀"], 1: ["Mostly clear", "🌤"], 2: ["Partly cloudy", "⛅"], 3: ["Cloudy", "☁"],
      45: ["Fog", "🌫"], 48: ["Rime fog", "🌫"], 51: ["Light drizzle", "🌦"], 53: ["Drizzle", "🌦"],
      55: ["Heavy drizzle", "🌧"], 61: ["Light rain", "🌧"], 63: ["Rain", "🌧"], 65: ["Heavy rain", "🌧"],
      71: ["Light snow", "❄"], 73: ["Snow", "❄"], 75: ["Heavy snow", "❄"], 80: ["Rain showers", "🌧"],
      81: ["Showers", "🌧"], 82: ["Heavy showers", "🌧"], 95: ["Thunderstorms", "⛈"],
    };
    return map[Number(code)] || ["Current conditions", "⛅"];
  }

  function aqiLabel(value) {
    if (!Number.isFinite(value)) return "--";
    const v = Math.round(value);
    if (v <= 50) return `${v} Good`;
    if (v <= 100) return `${v} Moderate`;
    if (v <= 150) return `${v} USG`;
    if (v <= 200) return `${v} Unhealthy`;
    return `${v} High`;
  }

  function buildDashboard() {
    const home = document.getElementById("home");
    if (!home) return;

    home.innerHTML = `
      <section class="v2-dashboard" aria-label="Personal dashboard">
        <aside class="v2-card v2-time-panel">
          <div class="v2-location">⌖ <span>${LOCATION.label}</span></div>
          <div class="v2-clock-row"><strong id="v2Time">--:--</strong><span id="v2Meridiem">--</span></div>
          <div class="v2-date" id="v2Date">Loading</div>
          <div class="v2-rule"></div>
          <div class="v2-today-list">
            <div><span>Day of Year</span><strong id="v2Day">--</strong></div>
            <div><span>Week Number</span><strong id="v2Week">--</strong></div>
            <div><span>Weekend</span><strong id="v2Weekend">--</strong></div>
            <div><span>Sunrise</span><strong id="v2SunriseSide">--:--</strong></div>
            <div><span>Sunset</span><strong id="v2SunsetSide">--:--</strong></div>
          </div>
          <div class="v2-rule"></div>
          <div class="v2-daylight"><span>Daylight Remaining</span><strong id="v2DaylightSide">--</strong></div>
        </aside>

        <section class="v2-card v2-weather-panel">
          <div class="v2-weather-title"><span class="v2-weather-glyph" id="v2WeatherGlyph">⛅</span><h2>Weather + Outside Conditions</h2></div>
          <div class="v2-weather-strip">
            <div class="v2-current"><strong id="v2Temp">--°</strong><small id="v2Summary">Loading</small></div>
            <div class="v2-stat"><span>High</span><strong id="v2High">--°</strong></div>
            <div class="v2-stat"><span>Low</span><strong id="v2Low">--°</strong></div>
            <div class="v2-stat"><span>Wind</span><strong id="v2Wind">-- mph</strong></div>
            <div class="v2-stat"><span>Humidity</span><strong id="v2Humidity">--%</strong></div>
            <div class="v2-stat"><span>AQI</span><strong id="v2Aqi">--</strong></div>
            <div class="v2-stat"><span>UV Index</span><strong id="v2Uv">--</strong></div>
            <div class="v2-go" id="v2Go"><strong>CHECK</strong><small>Loading</small></div>
          </div>

          <div class="v2-orbit-wrap">
            <svg class="v2-orbit" viewBox="0 0 900 430" role="img" aria-label="Sun and moon positions around Earth">
              <defs>
                <linearGradient id="v2OrbitStroke" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stop-color="#f7c948" />
                  <stop offset="0.5" stop-color="#f7c948" />
                  <stop offset="0.501" stop-color="#64a7ff" />
                  <stop offset="1" stop-color="#64a7ff" />
                </linearGradient>
                <radialGradient id="v2EarthFill" cx="35%" cy="30%" r="75%">
                  <stop offset="0" stop-color="#7fc8ff" />
                  <stop offset="0.55" stop-color="#2f6fa5" />
                  <stop offset="1" stop-color="#10273b" />
                </radialGradient>
              </defs>
              <line x1="450" y1="38" x2="450" y2="392" class="v2-axis" />
              <line x1="70" y1="215" x2="830" y2="215" class="v2-axis" />
              <ellipse cx="450" cy="215" rx="350" ry="155" fill="none" stroke="url(#v2OrbitStroke)" stroke-width="3" />
              <circle cx="450" cy="215" r="49" fill="url(#v2EarthFill)" class="v2-earth" />
              <text x="450" y="221" text-anchor="middle" class="v2-earth-label">Earth</text>
              <g id="v2SunMarker" class="v2-orbit-marker">
                <circle r="18" class="v2-sun-core" />
                <circle r="29" class="v2-sun-glow" />
              </g>
              <g id="v2MoonMarker" class="v2-orbit-marker">
                <circle r="22" class="v2-moon-dark" />
                <path id="v2MoonLight" class="v2-moon-light" />
              </g>
              <text x="450" y="26" text-anchor="middle" class="v2-orbit-label">Noon</text>
              <text x="450" y="419" text-anchor="middle" class="v2-orbit-label">Midnight</text>
              <text x="58" y="220" text-anchor="end" class="v2-orbit-label">Rise</text>
              <text x="842" y="220" class="v2-orbit-label">Set</text>
            </svg>
          </div>

          <div class="v2-sky-footer">
            <div><span>Rise</span><strong id="v2Sunrise">--:--</strong></div>
            <div><span>Set</span><strong id="v2Sunset">--:--</strong></div>
            <div><span>Daylight</span><strong id="v2Daylight">--</strong></div>
            <div class="v2-moon-info"><span>Moon</span><strong id="v2MoonPhase">Loading</strong><small id="v2MoonExtra">--</small></div>
          </div>
        </section>

        <section class="v2-card v2-calculator-panel">
          <h2>Calculator</h2>
          <div class="v2-calc-display"><span id="v2CalcExpression">0</span><strong id="v2CalcResult">0</strong></div>
          <div class="v2-keypad">
            ${["2nd","(",")","%","CLR","DEL","sin(","cos(","tan(","^","sqrt(","/","log(","ln(","7","8","9","*","π","e","4","5","6","-","ANS","+/-","1","2","3","+","0",".","ENTER"].map((key) => `<button type="button" data-v2-key="${key}">${key}</button>`).join("")}
          </div>
        </section>

        <section class="v2-card v2-shortcuts-panel">
          <h2>Shortcuts</h2>
          <div class="v2-shortcut-grid">
            <button type="button" data-page-target="tools"><span>⇄</span><strong>Unit Converter</strong></button>
            <button type="button" data-page-target="pyro"><span>◉</span><strong>Pyro Console</strong></button>
            <button type="button" data-v2-refresh><span>↻</span><strong>Refresh Weather</strong></button>
            <button type="button" data-v2-clear><span>⌫</span><strong>Clear Calculator</strong></button>
          </div>
        </section>
      </section>
    `;

    injectStyles();
    initClock();
    initCalculator();
    bindShortcuts();
    refreshDashboardData();
  }

  function injectStyles() {
    if (document.getElementById("v2DashboardStyles")) return;
    const style = document.createElement("style");
    style.id = "v2DashboardStyles";
    style.textContent = `
      #home { max-width: 1540px; margin: 0 auto; padding: 0.7rem; }
      .v2-dashboard { display:grid; grid-template-columns:minmax(250px,290px) minmax(0,1fr); gap:12px; }
      .v2-card { min-width:0; border:1px solid rgba(120,170,220,.22); border-radius:18px; background:linear-gradient(145deg,rgba(10,22,34,.96),rgba(5,13,22,.98)); box-shadow:inset 0 1px 0 rgba(255,255,255,.035),0 18px 40px rgba(0,0,0,.24); color:#f4f7fb; }
      .v2-time-panel { grid-row:span 1; padding:22px; }
      .v2-weather-panel { padding:22px; }
      .v2-location,.v2-weather-title { display:flex; align-items:center; gap:10px; }
      .v2-location { font-size:.95rem; font-weight:600; }
      .v2-clock-row { display:flex; align-items:baseline; gap:8px; margin-top:22px; }
      .v2-clock-row strong { font-size:clamp(2.5rem,5vw,4.6rem); line-height:.95; letter-spacing:-.055em; font-weight:500; }
      .v2-clock-row span { font-size:1.1rem; color:#9ec8ff; }
      .v2-date { margin-top:14px; color:#73b2ff; font-size:1rem; }
      .v2-rule { height:1px; margin:22px 0; background:rgba(255,255,255,.14); }
      .v2-today-list { display:grid; gap:18px; }
      .v2-today-list div,.v2-daylight { display:flex; align-items:center; justify-content:space-between; gap:12px; }
      .v2-today-list span,.v2-daylight span { color:#d7e0eb; font-size:.9rem; }
      .v2-today-list strong,.v2-daylight strong { font-size:.95rem; }
      .v2-weather-title h2,.v2-calculator-panel h2,.v2-shortcuts-panel h2 { margin:0; font-size:1.05rem; }
      .v2-weather-glyph { font-size:1.8rem; }
      .v2-weather-strip { display:grid; grid-template-columns:minmax(145px,1.2fr) repeat(6,minmax(80px,.72fr)) minmax(105px,.8fr); align-items:stretch; margin-top:18px; border-bottom:1px solid rgba(255,255,255,.14); padding-bottom:16px; }
      .v2-current,.v2-stat,.v2-go { display:grid; align-content:center; gap:4px; min-width:0; padding:0 14px; border-left:1px solid rgba(255,255,255,.11); }
      .v2-current { border-left:0; padding-left:0; }
      .v2-current strong { font-size:clamp(2.1rem,4vw,3.5rem); font-weight:500; line-height:1; }
      .v2-current small,.v2-stat span,.v2-go small { color:#b7c4d3; font-size:.76rem; }
      .v2-stat strong { font-size:1rem; overflow-wrap:anywhere; }
      .v2-go strong { color:#42dc82; font-size:1.2rem; }
      .v2-orbit-wrap { padding:12px 0 0; }
      .v2-orbit { width:100%; height:auto; display:block; }
      .v2-axis { stroke:rgba(255,255,255,.18); stroke-width:1.2; stroke-dasharray:7 7; }
      .v2-earth { filter:drop-shadow(0 0 14px rgba(78,156,235,.38)); }
      .v2-earth-label,.v2-orbit-label { fill:#e9f0f8; font:600 17px Inter,sans-serif; }
      .v2-earth-label { font-size:13px; }
      .v2-orbit-marker { transition:transform .5s ease,opacity .25s ease; }
      .v2-sun-core { fill:#ffc43d; filter:drop-shadow(0 0 12px rgba(255,196,61,.85)); }
      .v2-sun-glow { fill:none; stroke:rgba(255,196,61,.34); stroke-width:3; }
      .v2-moon-dark { fill:#101722; stroke:rgba(255,255,255,.28); stroke-width:1.5; }
      .v2-moon-light { fill:#e3e9ef; }
      .v2-sky-footer { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:10px; border-top:1px solid rgba(255,255,255,.14); padding-top:14px; }
      .v2-sky-footer>div { display:grid; gap:3px; padding:0 14px; border-left:1px solid rgba(255,255,255,.1); }
      .v2-sky-footer>div:first-child { border-left:0; padding-left:0; }
      .v2-sky-footer span,.v2-sky-footer small { color:#aebccc; font-size:.75rem; }
      .v2-sky-footer strong { font-size:.94rem; }
      .v2-calculator-panel,.v2-shortcuts-panel { padding:18px 20px; }
      .v2-calculator-panel { grid-column:1; }
      .v2-shortcuts-panel { grid-column:2; }
      .v2-calc-display { display:flex; justify-content:space-between; align-items:end; gap:12px; min-height:58px; margin:14px 0; padding:10px 14px; border:1px solid rgba(110,170,235,.35); border-radius:10px; background:#02070c; font-family:ui-monospace,SFMono-Regular,Menlo,monospace; }
      .v2-calc-display span { color:#aab8c6; overflow-wrap:anywhere; }
      .v2-calc-display strong { font-size:1.45rem; }
      .v2-keypad { display:grid; grid-template-columns:repeat(6,minmax(0,1fr)); gap:7px; }
      .v2-keypad button,.v2-shortcut-grid button { border:1px solid rgba(255,255,255,.08); border-radius:8px; color:#eef4fa; background:linear-gradient(180deg,rgba(44,57,72,.92),rgba(25,35,47,.96)); cursor:pointer; }
      .v2-keypad button { min-height:38px; padding:6px; font-size:.78rem; }
      .v2-keypad button:hover,.v2-keypad button:focus-visible,.v2-shortcut-grid button:hover,.v2-shortcut-grid button:focus-visible { border-color:rgba(107,173,255,.5); background:linear-gradient(180deg,rgba(55,72,91,.98),rgba(31,44,59,.98)); outline:none; }
      .v2-shortcut-grid { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:12px; margin-top:14px; }
      .v2-shortcut-grid button { min-height:108px; display:grid; place-items:center; align-content:center; gap:9px; padding:12px; }
      .v2-shortcut-grid button span { font-size:1.85rem; color:#76b7ff; }
      .v2-shortcut-grid button strong { font-size:.8rem; text-align:center; }
      @media(max-width:1180px){ .v2-weather-strip{grid-template-columns:repeat(4,minmax(90px,1fr)); gap:10px}.v2-current,.v2-stat,.v2-go{border:1px solid rgba(255,255,255,.08);border-radius:10px;padding:10px}.v2-current{grid-column:span 2}.v2-go{grid-column:span 2}.v2-sky-footer{grid-template-columns:repeat(2,1fr)} }
      @media(max-width:900px){ .v2-dashboard{grid-template-columns:1fr}.v2-time-panel,.v2-weather-panel,.v2-calculator-panel,.v2-shortcuts-panel{grid-column:1}.v2-time-panel{grid-row:auto}.v2-shortcut-grid{grid-template-columns:repeat(2,1fr)} }
      @media(max-width:600px){ #home{padding:.4rem}.v2-card{border-radius:14px}.v2-time-panel,.v2-weather-panel,.v2-calculator-panel,.v2-shortcuts-panel{padding:16px}.v2-weather-strip{grid-template-columns:repeat(2,1fr)}.v2-current,.v2-go{grid-column:1/-1}.v2-keypad{grid-template-columns:repeat(4,1fr)}.v2-sky-footer{grid-template-columns:1fr 1fr}.v2-orbit-label{font-size:14px} }
    `;
    document.head.appendChild(style);
  }

  function initClock() {
    const update = () => {
      const now = new Date();
      const time = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", second: "2-digit", timeZone: LOCATION.timezone }).format(now);
      const [clock, meridiem] = time.split(" ");
      document.getElementById("v2Time").textContent = clock;
      document.getElementById("v2Meridiem").textContent = meridiem || "";
      document.getElementById("v2Date").textContent = new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric", timeZone: LOCATION.timezone }).format(now);
      document.getElementById("v2Day").textContent = `${dayOfYear(now)} / 365`;
      document.getElementById("v2Week").textContent = String(weekNumber(now));
      const weekday = localDateParts(now).weekday;
      document.getElementById("v2Weekend").textContent = weekday === "Saturday" || weekday === "Sunday" ? "Now" : `${(6 - new Date(now).getDay() + 7) % 7}d`;
    };
    update();
    setInterval(update, 1000);
  }

  function ellipsePoint(angle) {
    return { x: 450 + 350 * Math.cos(angle), y: 215 + 155 * Math.sin(angle) };
  }

  function sunAngleForNow(now, sunrise, sunset) {
    const sr = new Date(sunrise);
    const ss = new Date(sunset);
    const nextRise = new Date(sr.getTime() + 86400000);
    const previousSet = new Date(ss.getTime() - 86400000);
    if (now >= sr && now <= ss) {
      const p = (now - sr) / (ss - sr);
      return Math.PI - p * Math.PI;
    }
    if (now > ss) {
      const p = (now - ss) / (nextRise - ss);
      return p * Math.PI;
    }
    const p = (now - previousSet) / (sr - previousSet);
    return p * Math.PI;
  }

  function updateOrbit(sunrise, sunset) {
    const now = new Date();
    const phase = lunarPhase(now);
    const sunAngle = sunAngleForNow(now, sunrise, sunset);
    const moonAngle = (sunAngle + phase.fraction * Math.PI * 2) % (Math.PI * 2);
    const sunPoint = ellipsePoint(sunAngle);
    const moonPoint = ellipsePoint(moonAngle);
    const sunMarker = document.getElementById("v2SunMarker");
    const moonMarker = document.getElementById("v2MoonMarker");
    sunMarker.setAttribute("transform", `translate(${sunPoint.x.toFixed(2)} ${sunPoint.y.toFixed(2)})`);
    moonMarker.setAttribute("transform", `translate(${moonPoint.x.toFixed(2)} ${moonPoint.y.toFixed(2)})`);
    sunMarker.style.opacity = sunPoint.y <= 215 ? "1" : ".34";
    moonMarker.style.opacity = moonPoint.y <= 215 ? "1" : ".42";
    updateMoonPath(phase);
    document.getElementById("v2MoonPhase").textContent = phase.name;
    document.getElementById("v2MoonExtra").textContent = `${phase.illumination}% illuminated · ${phase.age.toFixed(1)} days`;
  }

  function updateMoonPath(phase) {
    const path = document.getElementById("v2MoonLight");
    if (!path) return;
    const r = 20;
    const width = Math.max(0.8, (phase.illumination / 100) * 40);
    const waxing = phase.fraction <= 0.5;
    const x0 = waxing ? -r : r - width;
    path.setAttribute("d", `M ${x0} -20 h ${width} a 20 20 0 0 1 0 40 h -${width} z`);
  }

  function setGoNoGo(condition, wind, aqi, uv, temp) {
    const issues = [];
    if ([45,48,51,53,55,61,63,65,71,73,75,80,81,82,95].includes(Number(condition))) issues.push("weather");
    if (Number.isFinite(wind) && wind >= 15) issues.push("wind");
    if (Number.isFinite(aqi) && aqi > 100) issues.push("AQI");
    if (Number.isFinite(uv) && uv >= 8) issues.push("UV");
    if (Number.isFinite(temp) && (temp < 35 || temp > 92)) issues.push("temperature");
    const go = document.getElementById("v2Go");
    go.querySelector("strong").textContent = issues.length ? "CHECK" : "GO";
    go.querySelector("strong").style.color = issues.length ? "#ffc857" : "#42dc82";
    go.querySelector("small").textContent = issues.length ? `Watch ${issues.join(", ")}` : "Good for casual outdoor activity";
  }

  async function refreshDashboardData() {
    try {
      const forecastParams = new URLSearchParams({
        latitude: LOCATION.latitude,
        longitude: LOCATION.longitude,
        current: "temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,uv_index",
        daily: "temperature_2m_max,temperature_2m_min,sunrise,sunset",
        temperature_unit: "fahrenheit",
        wind_speed_unit: "mph",
        timezone: LOCATION.timezone,
        forecast_days: "1",
      });
      const airParams = new URLSearchParams({ latitude: LOCATION.latitude, longitude: LOCATION.longitude, current: "us_aqi", timezone: LOCATION.timezone });
      const [forecastResponse, airResponse] = await Promise.all([
        fetch(`https://api.open-meteo.com/v1/forecast?${forecastParams}`, { cache: "no-store" }),
        fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?${airParams}`, { cache: "no-store" }),
      ]);
      if (!forecastResponse.ok) throw new Error("Weather request failed");
      const forecast = await forecastResponse.json();
      const air = airResponse.ok ? await airResponse.json() : {};
      const current = forecast.current || {};
      const daily = forecast.daily || {};
      const [summary, glyph] = weatherDetails(current.weather_code);
      const sunrise = daily.sunrise?.[0];
      const sunset = daily.sunset?.[0];
      const aqi = air.current?.us_aqi;
      document.getElementById("v2WeatherGlyph").textContent = glyph;
      document.getElementById("v2Temp").textContent = Number.isFinite(current.temperature_2m) ? `${Math.round(current.temperature_2m)}°F` : "--°";
      document.getElementById("v2Summary").textContent = summary;
      document.getElementById("v2High").textContent = Number.isFinite(daily.temperature_2m_max?.[0]) ? `${Math.round(daily.temperature_2m_max[0])}°` : "--°";
      document.getElementById("v2Low").textContent = Number.isFinite(daily.temperature_2m_min?.[0]) ? `${Math.round(daily.temperature_2m_min[0])}°` : "--°";
      document.getElementById("v2Wind").textContent = Number.isFinite(current.wind_speed_10m) ? `${Math.round(current.wind_speed_10m)} mph` : "-- mph";
      document.getElementById("v2Humidity").textContent = Number.isFinite(current.relative_humidity_2m) ? `${Math.round(current.relative_humidity_2m)}%` : "--%";
      document.getElementById("v2Aqi").textContent = aqiLabel(aqi);
      document.getElementById("v2Uv").textContent = Number.isFinite(current.uv_index) ? String(Math.round(current.uv_index)) : "--";
      const sunriseText = formatTime(sunrise);
      const sunsetText = formatTime(sunset);
      ["v2Sunrise","v2SunriseSide"].forEach((id) => document.getElementById(id).textContent = sunriseText);
      ["v2Sunset","v2SunsetSide"].forEach((id) => document.getElementById(id).textContent = sunsetText);
      const sr = new Date(sunrise), ss = new Date(sunset), now = new Date();
      const daylightMinutes = Math.max(0, Math.round((ss - sr) / 60000));
      const remainingMinutes = now >= sr && now <= ss ? Math.max(0, Math.round((ss - now) / 60000)) : 0;
      const daylightText = `${Math.floor(daylightMinutes / 60)}h ${daylightMinutes % 60}m`;
      const remainingText = remainingMinutes ? `${Math.floor(remainingMinutes / 60)}h ${remainingMinutes % 60}m` : (now < sr ? "Before sunrise" : "After sunset");
      document.getElementById("v2Daylight").textContent = daylightText;
      document.getElementById("v2DaylightSide").textContent = remainingText;
      updateOrbit(sunrise, sunset);
      setGoNoGo(current.weather_code, current.wind_speed_10m, aqi, current.uv_index, current.temperature_2m);
    } catch (error) {
      document.getElementById("v2Summary").textContent = "Weather unavailable";
    }
  }

  function initCalculator() {
    let expression = "";
    let answer = 0;
    const expressionEl = document.getElementById("v2CalcExpression");
    const resultEl = document.getElementById("v2CalcResult");
    const render = () => expressionEl.textContent = expression || "0";
    const clear = () => { expression = ""; resultEl.textContent = "0"; render(); };
    const evaluate = () => {
      try {
        const source = expression
          .replace(/ANS/g, String(answer))
          .replace(/π/g, "Math.PI")
          .replace(/\be\b/g, "Math.E")
          .replace(/sin\(/g, "Math.sin(")
          .replace(/cos\(/g, "Math.cos(")
          .replace(/tan\(/g, "Math.tan(")
          .replace(/sqrt\(/g, "Math.sqrt(")
          .replace(/log\(/g, "Math.log10(")
          .replace(/ln\(/g, "Math.log(")
          .replace(/\^/g, "**");
        if (!/^[0-9+\-*/().\sMathPIEcosintaqrgl*]+$/.test(source)) throw new Error("Invalid expression");
        answer = Function(`"use strict"; return (${source});`)();
        resultEl.textContent = Number.isFinite(answer) ? Number(answer.toPrecision(10)).toString() : "Error";
      } catch { resultEl.textContent = "Error"; }
    };
    document.querySelector(".v2-keypad").addEventListener("click", (event) => {
      const button = event.target.closest("button");
      if (!button) return;
      const key = button.dataset.v2Key;
      if (key === "CLR") clear();
      else if (key === "DEL") expression = expression.slice(0, -1);
      else if (key === "ENTER") evaluate();
      else if (key === "+/-") expression = expression ? `-(${expression})` : "-";
      else if (key === "2nd") return;
      else expression += key;
      render();
    });
    document.querySelector("[data-v2-clear]").addEventListener("click", clear);
  }

  function bindShortcuts() {
    document.querySelectorAll("[data-page-target]").forEach((button) => {
      button.addEventListener("click", () => window.siteNavigation?.openPage(button.dataset.pageTarget));
    });
    document.querySelector("[data-v2-refresh]").addEventListener("click", refreshDashboardData);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", buildDashboard);
  else buildDashboard();
})();