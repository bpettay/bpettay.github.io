document.addEventListener("DOMContentLoaded", () => {
  configureConverterPrecision();
  initializeHomeDashboard();

  if (typeof initializeNavigation === "function") {
    initializeNavigation();
  }

  if (typeof initializeConverter === "function") {
    initializeConverter();
    initializeGroupedUnitSelectors();
  }

  if (typeof initializePyroSimulator === "function") {
    initializePyroSimulator();
  }

  if (typeof initializePyroTeamSync === "function") {
    initializePyroTeamSync();
  }

  if (typeof initializePyroGateWorkflow === "function") {
    initializePyroGateWorkflow();
  }

  initializeScrollHeader();
  initializeCompactPyroStatusBar();
  initializePanelTilt();
});

const DASHBOARD_LOCATION = {
  label: "New Philadelphia",
  latitude: "40.4898",
  longitude: "-81.4457",
  timezone: "America/New_York",
};

function configureConverterPrecision() {
  const NativeNumberFormat = Intl.NumberFormat;
  if (NativeNumberFormat.__converterThreeSigFigs) return;

  function ThreeSigNumberFormat(locales, options = {}) {
    const adjustedOptions = options.maximumSignificantDigits === 10
      ? { ...options, maximumSignificantDigits: 3 }
      : options;
    return new NativeNumberFormat(locales, adjustedOptions);
  }

  ThreeSigNumberFormat.prototype = NativeNumberFormat.prototype;
  ThreeSigNumberFormat.supportedLocalesOf = NativeNumberFormat.supportedLocalesOf.bind(NativeNumberFormat);
  ThreeSigNumberFormat.__converterThreeSigFigs = true;
  Intl.NumberFormat = ThreeSigNumberFormat;
}

function initializeHomeDashboard() {
  const home = document.getElementById("home");
  if (!home) return;
  injectHomeDashboardStyles();

  home.innerHTML = `
    <section class="home-dashboard-only utility-dashboard" aria-label="Personal dashboard">
      <article class="home-clock-card dashboard-card surface dashboard-span-2">
        <div class="dashboard-card-head">
          <span class="dashboard-label">Local Time</span>
          <strong>${DASHBOARD_LOCATION.label}</strong>
        </div>
        <div class="clock-layout">
          <div class="analog-clock" aria-hidden="true">
            <div class="clock-face">
              <span class="clock-marker twelve"></span>
              <span class="clock-marker three"></span>
              <span class="clock-marker six"></span>
              <span class="clock-marker nine"></span>
              <span class="clock-hand hour" id="clockHourHand"></span>
              <span class="clock-hand minute" id="clockMinuteHand"></span>
              <span class="clock-hand second" id="clockSecondHand"></span>
              <span class="clock-center"></span>
            </div>
          </div>
          <div class="digital-clock">
            <strong id="homeClockTime">--:--</strong>
            <small id="homeClockDate">Loading</small>
          </div>
        </div>
      </article>

      <article class="home-weather-card dashboard-card surface dashboard-span-2">
        <div class="dashboard-card-head">
          <span class="dashboard-label">Conditions</span>
          <strong>Weather</strong>
        </div>
        <div class="weather-current-row">
          <div class="condition-pictogram" id="homeWeatherIcon" aria-hidden="true"></div>
          <div>
            <strong id="homeWeatherTemp">--°</strong>
            <small id="homeWeatherSummary">Loading</small>
          </div>
        </div>
        <div class="weather-mini-grid">
          <span>High <strong id="homeWeatherHigh">--°</strong></span>
          <span>Low <strong id="homeWeatherLow">--°</strong></span>
          <span>Wind <strong id="homeWeatherWind">-- mph</strong></span>
          <span>Humidity <strong id="homeWeatherHumidity">--%</strong></span>
          <span>AQI <strong id="homeWeatherAqi">--</strong></span>
          <span>UV <strong id="homeWeatherUv">--</strong></span>
        </div>
      </article>

      <article class="dashboard-card surface go-card" id="homeGoCard">
        <div class="dashboard-card-head">
          <span class="dashboard-label">Go / No-Go</span>
          <strong id="homeGoPill" class="go-pill neutral">Checking</strong>
        </div>
        <h2 id="homeGoTitle">Loading conditions</h2>
        <p id="homeGoReason" class="dashboard-note">Checking wind, rain risk, AQI, UV, and temperature.</p>
      </article>

      <article class="dashboard-card surface sun-card">
        <div class="dashboard-card-head">
          <span class="dashboard-label">Sun</span>
          <strong id="homeDaylightLeft">--</strong>
        </div>
        <div class="sun-times-grid">
          <div><span>Sunrise</span><strong id="homeSunrise">--:--</strong></div>
          <div><span>Sunset</span><strong id="homeSunset">--:--</strong></div>
        </div>
      </article>

      <article class="dashboard-card surface today-card">
        <div class="dashboard-card-head">
          <span class="dashboard-label">Today</span>
          <strong id="homeWeekday">--</strong>
        </div>
        <div class="today-grid">
          <div><span>Date</span><strong id="homeFullDate">--</strong></div>
          <div><span>Day #</span><strong id="homeDayOfYear">--</strong></div>
          <div><span>Week</span><strong id="homeWeekNumber">--</strong></div>
          <div><span>Weekend</span><strong id="homeWeekendCountdown">--</strong></div>
        </div>
      </article>

      <article class="dashboard-card surface moon-card">
        <div class="dashboard-card-head">
          <span class="dashboard-label">Moon</span>
          <strong id="homeMoonPercent">--%</strong>
        </div>
        <div class="moon-layout">
          <div class="moon-disc" id="homeMoonDisc" aria-hidden="true"></div>
          <div>
            <h2 id="homeMoonPhase">Loading</h2>
            <p id="homeMoonNote" class="dashboard-note">Moon phase estimate.</p>
          </div>
        </div>
      </article>

      <article class="dashboard-card surface calc-card dashboard-span-2">
        <div class="dashboard-card-head">
          <span class="dashboard-label">Calculator</span>
          <strong>TI-style</strong>
        </div>
        <div class="mini-calc" aria-label="Mini calculator">
          <div class="calc-display">
            <div id="calcExpression" class="calc-expression">0</div>
            <div id="calcResult" class="calc-result">Ready</div>
          </div>
          <div class="calc-keypad">
            <button type="button" data-calc-key="sin(">sin</button>
            <button type="button" data-calc-key="cos(">cos</button>
            <button type="button" data-calc-key="tan(">tan</button>
            <button type="button" data-calc-key="sqrt(">√</button>
            <button type="button" data-calc-key="log(">log</button>
            <button type="button" data-calc-key="ln(">ln</button>
            <button type="button" data-calc-key="pi">π</button>
            <button type="button" data-calc-key="^">^</button>
            <button type="button" data-calc-key="7">7</button>
            <button type="button" data-calc-key="8">8</button>
            <button type="button" data-calc-key="9">9</button>
            <button type="button" data-calc-key="/">÷</button>
            <button type="button" data-calc-key="4">4</button>
            <button type="button" data-calc-key="5">5</button>
            <button type="button" data-calc-key="6">6</button>
            <button type="button" data-calc-key="*">×</button>
            <button type="button" data-calc-key="1">1</button>
            <button type="button" data-calc-key="2">2</button>
            <button type="button" data-calc-key="3">3</button>
            <button type="button" data-calc-key="-">−</button>
            <button type="button" data-calc-key="0">0</button>
            <button type="button" data-calc-key=".">.</button>
            <button type="button" data-calc-key="(">(</button>
            <button type="button" data-calc-key=")">)</button>
            <button type="button" data-calc-action="clear" class="calc-key-danger">CLR</button>
            <button type="button" data-calc-action="backspace">DEL</button>
            <button type="button" data-calc-key="+">+</button>
            <button type="button" data-calc-action="equals" class="calc-key-enter">ENTER</button>
          </div>
        </div>
      </article>

      <article class="dashboard-card surface quick-actions-card shortcuts-card dashboard-span-2">
        <div class="section-heading">
          <p class="section-label">Shortcuts</p>
          <h2>Open</h2>
        </div>
        <div class="action-grid compact-action-grid">
          <button class="action-tile" type="button" data-page-target="tools">
            <span>Tools</span>
            <strong>Unit converter</strong>
            <small>3 sig figs, equation preview, grouped units.</small>
          </button>
          <button class="action-tile" type="button" data-page-target="pyro">
            <span>Pyro</span>
            <strong>Console</strong>
            <small>Login, cue bank, activity log.</small>
          </button>
        </div>
      </article>
    </section>
  `;

  startHomeClock();
  updateTodayPanel();
  updateMoonPanel();
  initializeMiniCalculator();
  initializeDashboardShortcuts();
  loadHomeWeather();
}

function injectHomeDashboardStyles() {
  if (document.getElementById("homeDashboardWidgetStyles")) return;
  const style = document.createElement("style");
  style.id = "homeDashboardWidgetStyles";
  style.textContent = `
    .utility-dashboard { grid-template-columns: repeat(auto-fit, minmax(min(100%, 260px), 1fr)) !important; align-items: stretch; }
    .dashboard-span-2 { grid-column: span 2; }
    .utility-dashboard .dashboard-card { min-height: 0; }
    .go-card[data-status="go"] { border-color: rgba(120,255,190,.22); }
    .go-card[data-status="caution"] { border-color: rgba(255,202,95,.28); }
    .go-pill { display:inline-flex; align-items:center; justify-content:center; min-width:68px; padding:.28rem .58rem; border-radius:999px; font-size:.72rem; line-height:1; text-transform:uppercase; letter-spacing:.08em; border:1px solid rgba(255,255,255,.12); background:rgba(255,255,255,.04); }
    .go-pill.go { color:#c8ffd8; border-color:rgba(120,255,190,.28); background:rgba(120,255,190,.08); }
    .go-pill.caution { color:#ffe6a8; border-color:rgba(255,202,95,.28); background:rgba(255,202,95,.08); }
    .go-pill.neutral { color: var(--ink-soft); }
    .dashboard-note { margin:0; color:var(--ink-soft); line-height:1.55; }
    .sun-times-grid, .today-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(110px,1fr)); gap:.65rem; }
    .sun-times-grid div, .today-grid div { display:grid; gap:.25rem; min-width:0; padding:.72rem; border-radius:14px; border:1px solid rgba(255,255,255,.065); background:rgba(255,255,255,.035); }
    .sun-times-grid span, .today-grid span { color:var(--ink-soft); font-size:.68rem; letter-spacing:.08em; text-transform:uppercase; }
    .sun-times-grid strong, .today-grid strong { color:var(--ink); font-size:1rem; line-height:1.2; overflow-wrap:anywhere; }
    .moon-layout { display:grid; grid-template-columns:86px minmax(0,1fr); gap:.95rem; align-items:center; min-width:0; }
    .moon-disc { --moon-light:50%; position:relative; width:78px; aspect-ratio:1; border-radius:999px; overflow:hidden; border:1px solid rgba(255,255,255,.12); background:#101316; box-shadow:inset 0 1px 10px rgba(255,255,255,.08),0 14px 24px rgba(0,0,0,.2); }
    .moon-disc::before { content:""; position:absolute; inset:0; border-radius:inherit; background:radial-gradient(circle at 35% 30%, rgba(255,255,255,.15), transparent 10%),radial-gradient(circle at 65% 58%, rgba(255,255,255,.09), transparent 8%),#dbe3e8; clip-path:inset(0 calc(100% - var(--moon-light)) 0 0); }
    .moon-disc[data-phase="waning"]::before { clip-path:inset(0 0 0 calc(100% - var(--moon-light))); }
    .moon-card h2 { margin:0 0 .35rem; }
    .calc-card { gap:.8rem; }
    .mini-calc { display:grid; gap:.72rem; min-width:0; }
    .calc-display { display:grid; gap:.28rem; min-height:72px; padding:.8rem; border-radius:14px; border:1px solid rgba(120,255,190,.14); background:rgba(5,10,9,.62); box-shadow:inset 0 1px 10px rgba(0,0,0,.22); }
    .calc-expression, .calc-result { font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace; line-height:1.25; overflow-wrap:anywhere; }
    .calc-expression { color:rgba(243,245,247,.92); font-size:.95rem; min-height:1.25rem; }
    .calc-result { color:#c8ffd8; font-size:1.1rem; font-weight:700; }
    .calc-keypad { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:.42rem; }
    .calc-keypad button { min-width:0; min-height:42px; padding:.55rem .35rem; border-radius:11px; border:1px solid rgba(255,255,255,.08); color:var(--ink); background:rgba(255,255,255,.045); font:inherit; font-size:.86rem; cursor:pointer; transition:background .18s ease,border-color .18s ease,transform .18s ease; }
    .calc-keypad button:hover, .calc-keypad button:focus-visible { background:rgba(255,255,255,.08); border-color:rgba(255,255,255,.16); transform:translateY(-1px); outline:none; }
    .calc-key-danger { color:#ffd2cf !important; border-color:rgba(255,122,89,.2) !important; }
    .calc-key-enter { color:#c8ffd8 !important; border-color:rgba(120,255,190,.24) !important; background:rgba(120,255,190,.08) !important; }
    @media (max-width:980px) { .dashboard-span-2 { grid-column:1 / -1; } }
    @media (max-width:720px) { .moon-layout { grid-template-columns:1fr; } .calc-keypad { gap:.36rem; } .calc-keypad button { min-height:40px; font-size:.82rem; } }
    @media (max-width:420px) { .sun-times-grid, .today-grid { grid-template-columns:1fr; } }
  `;
  document.head.appendChild(style);
}

function initializeDashboardShortcuts() {
  document.querySelectorAll("[data-page-target]").forEach((button) => {
    button.addEventListener("click", () => {
      const target = button.dataset.pageTarget;
      const navButton = document.querySelector(`.nav-link[data-page="${target}"]`);
      navButton?.click();
    });
  });
}

function startHomeClock() {
  const timeEl = document.getElementById("homeClockTime");
  const dateEl = document.getElementById("homeClockDate");
  const hourHand = document.getElementById("clockHourHand");
  const minuteHand = document.getElementById("clockMinuteHand");
  const secondHand = document.getElementById("clockSecondHand");
  if (!timeEl || !dateEl) return;

  const updateClock = () => {
    const now = new Date();
    timeEl.textContent = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", second: "2-digit", hour12: true, timeZone: DASHBOARD_LOCATION.timezone }).format(now);
    dateEl.textContent = new Intl.DateTimeFormat("en-US", { weekday: "long", month: "short", day: "numeric", timeZone: DASHBOARD_LOCATION.timezone }).format(now);
    const parts = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "numeric", second: "numeric", hour12: false, timeZone: DASHBOARD_LOCATION.timezone }).formatToParts(now);
    const partValue = (type) => Number(parts.find((part) => part.type === type)?.value || 0);
    const hours = partValue("hour");
    const minutes = partValue("minute");
    const seconds = partValue("second");
    if (hourHand) hourHand.style.transform = `translateX(-50%) rotate(${((hours % 12) * 30) + (minutes * 0.5)}deg)`;
    if (minuteHand) minuteHand.style.transform = `translateX(-50%) rotate(${(minutes * 6) + (seconds * 0.1)}deg)`;
    if (secondHand) secondHand.style.transform = `translateX(-50%) rotate(${seconds * 6}deg)`;
  };

  updateClock();
  window.setInterval(updateClock, 1000);
}

function weatherCodeDetails(code) {
  const details = {
    0: { summary: "Clear", icon: "sun", go: true }, 1: { summary: "Mostly clear", icon: "sun", go: true }, 2: { summary: "Partly cloudy", icon: "partly", go: true }, 3: { summary: "Cloudy", icon: "cloud", go: true },
    45: { summary: "Fog", icon: "fog", go: false }, 48: { summary: "Rime fog", icon: "fog", go: false }, 51: { summary: "Light drizzle", icon: "rain", go: false }, 53: { summary: "Drizzle", icon: "rain", go: false }, 55: { summary: "Heavy drizzle", icon: "rain", go: false },
    61: { summary: "Light rain", icon: "rain", go: false }, 63: { summary: "Rain", icon: "rain", go: false }, 65: { summary: "Heavy rain", icon: "rain", go: false }, 71: { summary: "Light snow", icon: "snow", go: false }, 73: { summary: "Snow", icon: "snow", go: false }, 75: { summary: "Heavy snow", icon: "snow", go: false },
    80: { summary: "Rain showers", icon: "rain", go: false }, 81: { summary: "Showers", icon: "rain", go: false }, 82: { summary: "Heavy showers", icon: "rain", go: false }, 95: { summary: "Thunderstorms", icon: "storm", go: false },
  };
  return details[code] || { summary: "Current conditions", icon: "partly", go: true };
}

function formatAqi(aqi) {
  if (!Number.isFinite(aqi)) return "--";
  const rounded = Math.round(aqi);
  if (rounded <= 50) return `${rounded} good`;
  if (rounded <= 100) return `${rounded} mod`;
  if (rounded <= 150) return `${rounded} USG`;
  if (rounded <= 200) return `${rounded} bad`;
  return `${rounded} high`;
}

function setGoNoGo({ condition, wind, aqi, uv, temp }) {
  const pill = document.getElementById("homeGoPill");
  const title = document.getElementById("homeGoTitle");
  const reason = document.getElementById("homeGoReason");
  const card = document.getElementById("homeGoCard");
  if (!pill || !title || !reason || !card) return;
  const issues = [];
  if (!condition.go) issues.push(condition.summary);
  if (Number.isFinite(wind) && wind >= 15) issues.push("windy");
  if (Number.isFinite(aqi) && aqi > 100) issues.push("AQI elevated");
  if (Number.isFinite(uv) && uv >= 8) issues.push("high UV");
  if (Number.isFinite(temp) && (temp < 35 || temp > 92)) issues.push("temperature edge");
  const caution = issues.length > 0;
  pill.textContent = caution ? "CHECK" : "GO";
  pill.className = `go-pill ${caution ? "caution" : "go"}`;
  card.dataset.status = caution ? "caution" : "go";
  title.textContent = caution ? "Use judgment" : "Good outside";
  reason.textContent = caution ? `Watch: ${issues.join(", ")}.` : "No obvious weather red flags right now.";
}

function formatDashboardTime(value) {
  if (!value) return "--:--";
  return new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: DASHBOARD_LOCATION.timezone }).format(new Date(value));
}

function updateSunPanel(sunrise, sunset) {
  const sunriseEl = document.getElementById("homeSunrise");
  const sunsetEl = document.getElementById("homeSunset");
  const leftEl = document.getElementById("homeDaylightLeft");
  if (!sunriseEl || !sunsetEl || !leftEl) return;
  sunriseEl.textContent = formatDashboardTime(sunrise);
  sunsetEl.textContent = formatDashboardTime(sunset);
  const now = new Date();
  const sunriseDate = sunrise ? new Date(sunrise) : null;
  const sunsetDate = sunset ? new Date(sunset) : null;
  if (!sunriseDate || !sunsetDate || Number.isNaN(sunriseDate) || Number.isNaN(sunsetDate)) {
    leftEl.textContent = "--";
  } else if (now < sunriseDate) {
    leftEl.textContent = "Before sunrise";
  } else if (now > sunsetDate) {
    leftEl.textContent = "After sunset";
  } else {
    const minutesLeft = Math.max(0, Math.round((sunsetDate - now) / 60000));
    leftEl.textContent = `${Math.floor(minutesLeft / 60)}h ${minutesLeft % 60}m left`;
  }
}

async function loadHomeWeather() {
  const tempEl = document.getElementById("homeWeatherTemp");
  const summaryEl = document.getElementById("homeWeatherSummary");
  const highEl = document.getElementById("homeWeatherHigh");
  const lowEl = document.getElementById("homeWeatherLow");
  const windEl = document.getElementById("homeWeatherWind");
  const humidityEl = document.getElementById("homeWeatherHumidity");
  const aqiEl = document.getElementById("homeWeatherAqi");
  const uvEl = document.getElementById("homeWeatherUv");
  const iconEl = document.getElementById("homeWeatherIcon");
  if (!tempEl || !summaryEl || !highEl || !lowEl || !windEl || !humidityEl || !aqiEl || !uvEl || !iconEl) return;
  try {
    const forecastParams = new URLSearchParams({ latitude: DASHBOARD_LOCATION.latitude, longitude: DASHBOARD_LOCATION.longitude, current: "temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,uv_index", daily: "temperature_2m_max,temperature_2m_min,sunrise,sunset", temperature_unit: "fahrenheit", wind_speed_unit: "mph", forecast_days: "1", timezone: DASHBOARD_LOCATION.timezone });
    const airParams = new URLSearchParams({ latitude: DASHBOARD_LOCATION.latitude, longitude: DASHBOARD_LOCATION.longitude, current: "us_aqi", timezone: DASHBOARD_LOCATION.timezone });
    const [forecastResponse, airResponse] = await Promise.all([
      fetch(`https://api.open-meteo.com/v1/forecast?${forecastParams.toString()}`, { cache: "no-store" }),
      fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?${airParams.toString()}`, { cache: "no-store" }),
    ]);
    if (!forecastResponse.ok) throw new Error("Weather request failed");
    const forecastData = await forecastResponse.json();
    const airData = airResponse.ok ? await airResponse.json() : {};
    const current = forecastData.current || {};
    const daily = forecastData.daily || {};
    const condition = weatherCodeDetails(current.weather_code);
    const aqi = airData.current?.us_aqi;
    tempEl.textContent = Number.isFinite(current.temperature_2m) ? `${Math.round(current.temperature_2m)}°` : "--°";
    summaryEl.textContent = condition.summary;
    iconEl.dataset.condition = condition.icon;
    iconEl.setAttribute("aria-label", condition.summary);
    highEl.textContent = Number.isFinite(daily.temperature_2m_max?.[0]) ? `${Math.round(daily.temperature_2m_max[0])}°` : "--°";
    lowEl.textContent = Number.isFinite(daily.temperature_2m_min?.[0]) ? `${Math.round(daily.temperature_2m_min[0])}°` : "--°";
    windEl.textContent = Number.isFinite(current.wind_speed_10m) ? `${Math.round(current.wind_speed_10m)} mph` : "-- mph";
    humidityEl.textContent = Number.isFinite(current.relative_humidity_2m) ? `${Math.round(current.relative_humidity_2m)}%` : "--%";
    uvEl.textContent = Number.isFinite(current.uv_index) ? `${Math.round(current.uv_index)}` : "--";
    aqiEl.textContent = formatAqi(aqi);
    updateSunPanel(daily.sunrise?.[0], daily.sunset?.[0]);
    setGoNoGo({ condition, wind: current.wind_speed_10m, aqi, uv: current.uv_index, temp: current.temperature_2m });
  } catch (error) {
    tempEl.textContent = "--°";
    highEl.textContent = "--°";
    lowEl.textContent = "--°";
    windEl.textContent = "-- mph";
    humidityEl.textContent = "--%";
    uvEl.textContent = "--";
    aqiEl.textContent = "--";
    summaryEl.textContent = "Weather unavailable";
    iconEl.dataset.condition = "unknown";
    updateSunPanel(null, null);
  }
}

function getEasternDateParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: DASHBOARD_LOCATION.timezone, year: "numeric", month: "numeric", day: "numeric", weekday: "long" }).formatToParts(date);
  const value = (type) => parts.find((part) => part.type === type)?.value;
  return { year: Number(value("year")), month: Number(value("month")), day: Number(value("day")), weekday: value("weekday") };
}

function getWeekNumber(date) {
  const target = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNumber = target.getUTCDay() || 7;
  target.setUTCDate(target.getUTCDate() + 4 - dayNumber);
  const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1));
  return Math.ceil((((target - yearStart) / 86400000) + 1) / 7);
}

function updateTodayPanel() {
  const parts = getEasternDateParts();
  const localDate = new Date(parts.year, parts.month - 1, parts.day);
  const start = new Date(parts.year, 0, 0);
  const dayOfYear = Math.floor((localDate - start) / 86400000);
  const weekdayIndex = localDate.getDay();
  const daysUntilWeekend = weekdayIndex === 0 || weekdayIndex === 6 ? 0 : 6 - weekdayIndex;
  document.getElementById("homeWeekday").textContent = parts.weekday || "--";
  document.getElementById("homeFullDate").textContent = `${parts.month}/${parts.day}/${parts.year}`;
  document.getElementById("homeDayOfYear").textContent = String(dayOfYear);
  document.getElementById("homeWeekNumber").textContent = String(getWeekNumber(localDate));
  document.getElementById("homeWeekendCountdown").textContent = daysUntilWeekend === 0 ? "Today" : `${daysUntilWeekend}d`;
}

function updateMoonPanel() {
  const phaseEl = document.getElementById("homeMoonPhase");
  const percentEl = document.getElementById("homeMoonPercent");
  const noteEl = document.getElementById("homeMoonNote");
  const discEl = document.getElementById("homeMoonDisc");
  if (!phaseEl || !percentEl || !noteEl || !discEl) return;
  const knownNewMoon = Date.UTC(2000, 0, 6, 18, 14);
  const lunarCycle = 29.530588853;
  const daysSince = (Date.now() - knownNewMoon) / 86400000;
  const phase = ((daysSince % lunarCycle) + lunarCycle) % lunarCycle;
  const fraction = phase / lunarCycle;
  const illumination = Math.round((1 - Math.cos(2 * Math.PI * fraction)) * 50);
  const names = [[0.03, "New Moon"], [0.22, "Waxing Crescent"], [0.28, "First Quarter"], [0.47, "Waxing Gibbous"], [0.53, "Full Moon"], [0.72, "Waning Gibbous"], [0.78, "Last Quarter"], [0.97, "Waning Crescent"], [1, "New Moon"]];
  const name = names.find(([limit]) => fraction <= limit)?.[1] || "Moon";
  phaseEl.textContent = name;
  percentEl.textContent = `${illumination}% lit`;
  noteEl.textContent = `Lunar day ${phase.toFixed(1)} of 29.5.`;
  discEl.style.setProperty("--moon-light", `${illumination}%`);
  discEl.dataset.phase = fraction < 0.5 ? "waxing" : "waning";
}

function initializeMiniCalculator() {
  const expressionEl = document.getElementById("calcExpression");
  const resultEl = document.getElementById("calcResult");
  const keypad = document.querySelector(".calc-keypad");
  if (!expressionEl || !resultEl || !keypad) return;
  let expression = "";
  const render = (message = "Ready") => {
    expressionEl.textContent = expression || "0";
    resultEl.textContent = message;
  };
  const evaluate = () => {
    if (!expression.trim()) return render("Ready");
    try {
      const safeExpression = expression
        .replace(/π/g, "pi")
        .replace(/÷/g, "/")
        .replace(/×/g, "*")
        .replace(/\^/g, "**")
        .replace(/\bpi\b/gi, "Math.PI")
        .replace(/\be\b/g, "Math.E")
        .replace(/\bsqrt\(/g, "Math.sqrt(")
        .replace(/\bsin\(/g, "Math.sin((Math.PI/180)*")
        .replace(/\bcos\(/g, "Math.cos((Math.PI/180)*")
        .replace(/\btan\(/g, "Math.tan((Math.PI/180)*")
        .replace(/\blog\(/g, "Math.log10(")
        .replace(/\bln\(/g, "Math.log(");
      if (!/^[0-9+\-*/().,\sMathPIElogsincotanqrt]+$/.test(safeExpression)) throw new Error("Unsafe expression");
      const value = Function(`"use strict"; return (${safeExpression});`)();
      if (!Number.isFinite(value)) throw new Error("Bad result");
      resultEl.textContent = `= ${Number(value.toPrecision(10)).toString()}`;
    } catch (error) {
      resultEl.textContent = "Syntax error";
    }
  };
  keypad.addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button) return;
    const key = button.dataset.calcKey;
    const action = button.dataset.calcAction;
    if (action === "clear") {
      expression = "";
      render("Ready");
    } else if (action === "backspace") {
      expression = expression.slice(0, -1);
      render("Ready");
    } else if (action === "equals") {
      evaluate();
    } else if (key) {
      expression += key;
      render("Ready");
    }
  });
  render();
}

function initializeGroupedUnitSelectors() {
  const categoryEl = document.getElementById("category");
  const fromUnitEl = document.getElementById("fromUnit");
  const toUnitEl = document.getElementById("toUnit");
  const queryInputEl = document.getElementById("queryInput");

  if (!categoryEl || !fromUnitEl || !toUnitEl || typeof unitData !== "object") return;

  const unitsFor = (category) => {
    const info = unitData[category];
    return Array.isArray(info.units) ? info.units : Object.keys(info.units);
  };

  const selectedUnit = (select) => {
    const option = select.selectedOptions[0];
    return option ? { category: option.dataset.category || categoryEl.value, unit: option.value } : null;
  };

  const populateGroupedSelect = (select, selectedCategory, selectedUnitValue) => {
    select.replaceChildren();
    Object.keys(unitData).forEach((category) => {
      const group = document.createElement("optgroup");
      group.label = category;
      unitsFor(category).forEach((unit) => {
        const option = document.createElement("option");
        option.value = unit;
        option.textContent = unit;
        option.dataset.category = category;
        option.selected = category === selectedCategory && unit === selectedUnitValue;
        group.appendChild(option);
      });
      select.appendChild(group);
    });
  };

  const rebuildSelectors = (category, fromUnit, toUnit) => {
    const defaults = defaultUnits?.[category] || unitsFor(category).slice(0, 2);
    const safeFrom = unitsFor(category).includes(fromUnit) ? fromUnit : defaults[0];
    const safeTo = unitsFor(category).includes(toUnit) ? toUnit : (defaults[1] || defaults[0]);
    populateGroupedSelect(fromUnitEl, category, safeFrom);
    populateGroupedSelect(toUnitEl, category, safeTo);
  };

  rebuildSelectors(categoryEl.value, fromUnitEl.value, toUnitEl.value);
  fromUnitEl.addEventListener("change", () => {
    const selected = selectedUnit(fromUnitEl);
    if (!selected) return;
    const previousTo = selectedUnit(toUnitEl);
    const defaults = defaultUnits?.[selected.category] || unitsFor(selected.category).slice(0, 2);
    categoryEl.value = selected.category;
    rebuildSelectors(selected.category, selected.unit, previousTo?.category === selected.category ? previousTo.unit : (defaults[1] || defaults[0]));
  }, true);

  toUnitEl.addEventListener("change", () => {
    const selected = selectedUnit(toUnitEl);
    if (!selected) return;
    const previousFrom = selectedUnit(fromUnitEl);
    const defaults = defaultUnits?.[selected.category] || unitsFor(selected.category).slice(0, 2);
    categoryEl.value = selected.category;
    rebuildSelectors(selected.category, previousFrom?.category === selected.category ? previousFrom.unit : defaults[0], selected.unit);
  }, true);

  categoryEl.addEventListener("change", () => {
    queueMicrotask(() => rebuildSelectors(categoryEl.value, fromUnitEl.value, toUnitEl.value));
  });

  if (queryInputEl) {
    queryInputEl.addEventListener("input", () => {
      queueMicrotask(() => rebuildSelectors(categoryEl.value, fromUnitEl.value, toUnitEl.value));
    });
  }
}

function initializeScrollHeader() {
  const nav = document.querySelector(".nav");
  if (!nav) return;
  let lastScrollY = window.scrollY;
  let ticking = false;
  function updateHeader() {
    const currentY = window.scrollY;
    const scrollingDown = currentY > lastScrollY + 6;
    const scrollingUp = currentY < lastScrollY - 6;
    const nearTop = currentY < 80;
    nav.classList.toggle("nav-compact", currentY > 80);
    if (nearTop || scrollingUp) nav.classList.remove("nav-hidden");
    else if (scrollingDown && currentY > 260) nav.classList.add("nav-hidden");
    lastScrollY = currentY;
    ticking = false;
  }
  window.addEventListener("scroll", () => {
    if (!ticking) {
      window.requestAnimationFrame(updateHeader);
      ticking = true;
    }
  }, { passive: true });
  updateHeader();
}

function initializeCompactPyroStatusBar() {
  if (document.getElementById("compactPyroStatusOverrides")) return;
  const style = document.createElement("style");
  style.id = "compactPyroStatusOverrides";
  style.textContent = `
    .pyro-sticky-status { top: 0.35rem !important; z-index: 26 !important; display: flex !important; align-items: center !important; gap: 0 !important; width: fit-content !important; max-width: min(calc(100% - 1rem), 980px) !important; margin-inline: auto !important; padding: 0.16rem 0.42rem !important; min-height: 24px !important; border-radius: 999px !important; border: 1px solid rgba(120, 255, 190, 0.12) !important; background: rgba(4, 7, 7, 0.78) !important; box-shadow: 0 6px 18px rgba(0, 0, 0, 0.28) !important; backdrop-filter: blur(12px) !important; overflow-x: auto !important; scrollbar-width: none !important; }
    .pyro-sticky-status::-webkit-scrollbar { display: none !important; }
    .sticky-status-tile { display: inline-flex !important; align-items: baseline !important; gap: 0.22rem !important; min-width: 0 !important; min-height: 0 !important; padding: 0 0.46rem !important; border: 0 !important; border-radius: 0 !important; background: transparent !important; box-shadow: none !important; white-space: nowrap !important; }
    .sticky-status-tile + .sticky-status-tile { border-left: 1px solid rgba(255, 255, 255, 0.12) !important; }
    .sticky-status-tile span { flex: 0 0 auto !important; color: rgba(169, 176, 183, 0.74) !important; font-size: 0.48rem !important; letter-spacing: 0.07em !important; line-height: 1 !important; text-transform: uppercase !important; }
    .sticky-status-tile strong { min-width: 0 !important; max-width: 12ch !important; color: rgba(243, 245, 247, 0.92) !important; font-size: 0.64rem !important; font-weight: 600 !important; line-height: 1 !important; white-space: nowrap !important; overflow: hidden !important; text-overflow: ellipsis !important; }
    .sticky-status-tile.primary { border-color: transparent !important; background: transparent !important; }
    .sticky-status-tile.primary strong { color: #c8ffd8 !important; max-width: 16ch !important; }
    .sticky-status-tile.hold strong { color: #ffd2cf !important; }
    @media (max-width: 720px) { .pyro-sticky-status { top: 0.2rem !important; max-width: calc(100% - 0.5rem) !important; margin-inline: 0.25rem !important; padding: 0.14rem 0.34rem !important; } .sticky-status-tile { padding: 0 0.38rem !important; } .sticky-status-tile span { font-size: 0.44rem !important; } .sticky-status-tile strong { font-size: 0.58rem !important; max-width: 10ch !important; } .sticky-status-tile.primary strong { max-width: 14ch !important; } }
  `;
  document.head.appendChild(style);
}

function initializePanelTilt() {
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const finePointer = window.matchMedia("(pointer: fine)");
  if (prefersReducedMotion.matches || !finePointer.matches) return;
  const panels = document.querySelectorAll("main .surface");
  panels.forEach((panel) => {
    let frameId = 0;
    let targetTiltX = 0;
    let targetTiltY = 0;
    let targetLiftZ = 0;
    let currentTiltX = 0;
    let currentTiltY = 0;
    let currentLiftZ = 0;
    const render = () => {
      const easing = panel.classList.contains("is-pointer-active") ? 0.12 : 0.08;
      currentTiltX += (targetTiltX - currentTiltX) * easing;
      currentTiltY += (targetTiltY - currentTiltY) * easing;
      currentLiftZ += (targetLiftZ - currentLiftZ) * easing;
      panel.style.setProperty("--tilt-x", `${currentTiltX.toFixed(2)}deg`);
      panel.style.setProperty("--tilt-y", `${currentTiltY.toFixed(2)}deg`);
      panel.style.setProperty("--lift-z", `${currentLiftZ.toFixed(2)}px`);
      if (Math.abs(targetTiltX - currentTiltX) < 0.01 && Math.abs(targetTiltY - currentTiltY) < 0.01 && Math.abs(targetLiftZ - currentLiftZ) < 0.01) {
        frameId = 0;
        return;
      }
      frameId = requestAnimationFrame(render);
    };
    const updateTargets = (event) => {
      const rect = panel.getBoundingClientRect();
      const px = (event.clientX - rect.left) / rect.width;
      const py = (event.clientY - rect.top) / rect.height;
      const centeredX = (Math.min(1, Math.max(0, px)) - 0.5) * 2;
      const centeredY = (Math.min(1, Math.max(0, py)) - 0.5) * 2;
      targetTiltY = centeredX * 1.05;
      targetTiltX = centeredY * -1.05;
      targetLiftZ = 1.6 - Math.min(1, Math.hypot(centeredX, centeredY)) * 0.55;
      if (!frameId) frameId = requestAnimationFrame(render);
    };
    panel.addEventListener("pointerenter", (event) => {
      panel.classList.add("is-pointer-active");
      updateTargets(event);
    });
    panel.addEventListener("pointermove", updateTargets);
    panel.addEventListener("pointerleave", () => {
      panel.classList.remove("is-pointer-active");
      targetTiltX = 0;
      targetTiltY = 0;
      targetLiftZ = 0;
      if (!frameId) frameId = requestAnimationFrame(render);
    });
  });
}
