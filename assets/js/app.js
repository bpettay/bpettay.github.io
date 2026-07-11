document.addEventListener("DOMContentLoaded", () => {
  configureConverterPrecision();
  initializeHomeDashboard();

  if (typeof initializeNavigation === "function") initializeNavigation();

  if (typeof initializeConverter === "function") {
    initializeConverter();
    initializeGroupedUnitSelectors();
  }

  if (typeof initializePyroSimulator === "function") initializePyroSimulator();
  if (typeof initializePyroTeamSync === "function") initializePyroTeamSync();
  if (typeof initializePyroGateWorkflow === "function") initializePyroGateWorkflow();

  initializeScrollHeader();
  initializeCompactPyroStatusBar();
  initializePanelTilt();
});

const DASHBOARD_LOCATION = {
  label: "New Philadelphia, OH",
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
    <section class="home-dashboard-only utility-dashboard grouped-dashboard" aria-label="Personal dashboard">
      <article class="dashboard-card surface time-today-card dashboard-span-2">
        <div class="dashboard-card-head">
          <span class="dashboard-label">Time + Today</span>
          <strong>${DASHBOARD_LOCATION.label}</strong>
        </div>

        <div class="time-today-layout">
          <div class="clock-layout compact-clock-layout">
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

          <div class="today-grid compact-today-grid">
            <div><span>Date</span><strong id="homeFullDate">--</strong></div>
            <div><span>Day #</span><strong id="homeDayOfYear">--</strong></div>
            <div><span>Week</span><strong id="homeWeekNumber">--</strong></div>
            <div><span>Weekend</span><strong id="homeWeekendCountdown">--</strong></div>
          </div>
          <span class="sr-only" id="homeWeekday">--</span>
        </div>
      </article>

      <article class="dashboard-card surface weather-dashboard-card dashboard-span-2">
        <div class="dashboard-card-head">
          <span class="dashboard-label">Weather + Outside</span>
          <strong id="homeDaylightLeft">--</strong>
        </div>

        <div class="weather-dashboard-layout">
          <div class="weather-primary-block">
            <div class="weather-current-row">
              <div class="condition-pictogram" id="homeWeatherIcon" aria-hidden="true"></div>
              <div>
                <strong id="homeWeatherTemp">--°</strong>
                <small id="homeWeatherSummary">Loading</small>
              </div>
            </div>

            <div class="go-card compact-go-card" id="homeGoCard">
              <div class="go-card-line">
                <strong id="homeGoTitle">Loading conditions</strong>
                <span id="homeGoPill" class="go-pill neutral">Checking</span>
              </div>
              <p id="homeGoReason" class="dashboard-note">Checking wind, rain risk, AQI, UV, and temperature.</p>
            </div>

            <div class="sun-position-card">
              <div class="sun-path" id="homeSunPath" aria-label="Sun progress from sunrise to sunset">
                <span class="sun-path-line"></span>
                <span class="sun-dot" id="homeSunDot"></span>
                <span class="horizon-line"></span>
              </div>
              <div class="sun-times-grid">
                <div><span>Sunrise</span><strong id="homeSunrise">--:--</strong></div>
                <div><span>Sunset</span><strong id="homeSunset">--:--</strong></div>
              </div>
            </div>
          </div>

          <div class="weather-side-grid">
            <div class="weather-mini-grid compact-weather-grid">
              <span>High <strong id="homeWeatherHigh">--°</strong></span>
              <span>Low <strong id="homeWeatherLow">--°</strong></span>
              <span>Wind <strong id="homeWeatherWind">-- mph</strong></span>
              <span>Humidity <strong id="homeWeatherHumidity">--%</strong></span>
              <span>AQI <strong id="homeWeatherAqi">--</strong></span>
              <span>UV <strong id="homeWeatherUv">--</strong></span>
            </div>

            <div class="moon-position-card">
              <div class="moon-position-visual" id="homeMoonPosition" aria-label="Moon phase cycle position">
                <span class="moon-orbit"></span>
                <span class="moon-dot" id="homeMoonDot"><span class="moon-disc" id="homeMoonDisc"></span></span>
              </div>
              <div>
                <span class="mini-label">Moon phase track</span>
                <strong id="homeMoonPhase">Loading</strong>
                <small id="homeMoonPercent">--%</small>
                <p id="homeMoonNote" class="dashboard-note">Phase-cycle estimate, not exact sky position.</p>
              </div>
            </div>
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
    .utility-dashboard { grid-template-columns: repeat(auto-fit, minmax(min(100%, 300px), 1fr)) !important; align-items: stretch; }
    .dashboard-span-2, .time-today-card, .weather-dashboard-card { grid-column: span 2; }
    .utility-dashboard .dashboard-card { min-height: 0; }
    .time-today-layout, .weather-primary-block, .weather-side-grid { display: grid; gap: 0.85rem; min-width: 0; }
    .compact-clock-layout { grid-template-columns: minmax(106px, 128px) minmax(0, 1fr); }
    .compact-today-grid { grid-template-columns: repeat(auto-fit, minmax(112px, 1fr)); }
    .weather-dashboard-layout { display: grid; grid-template-columns: minmax(230px, 0.85fr) minmax(0, 1.15fr); gap: 1rem; align-items: start; min-width: 0; }
    .compact-weather-grid { grid-template-columns: repeat(auto-fit, minmax(94px, 1fr)); }
    .go-card, .sun-position-card, .moon-position-card { min-width: 0; padding: 0.8rem; border-radius: 15px; border: 1px solid rgba(255, 255, 255, 0.07); background: rgba(255, 255, 255, 0.035); }
    .go-card[data-status="go"] { border-color: rgba(120, 255, 190, 0.22); }
    .go-card[data-status="caution"] { border-color: rgba(255, 202, 95, 0.28); }
    .go-card-line { display: flex; align-items: center; justify-content: space-between; gap: 0.65rem; min-width: 0; }
    .go-card-line strong { color: var(--ink); font-size: 1rem; line-height: 1.2; }
    .go-pill { display: inline-flex; align-items: center; justify-content: center; min-width: 68px; padding: 0.28rem 0.58rem; border-radius: 999px; font-size: 0.72rem; line-height: 1; text-transform: uppercase; letter-spacing: 0.08em; border: 1px solid rgba(255, 255, 255, 0.12); background: rgba(255, 255, 255, 0.04); }
    .go-pill.go { color: #c8ffd8; border-color: rgba(120, 255, 190, 0.28); background: rgba(120, 255, 190, 0.08); }
    .go-pill.caution { color: #ffe6a8; border-color: rgba(255, 202, 95, 0.28); background: rgba(255, 202, 95, 0.08); }
    .go-pill.neutral { color: var(--ink-soft); }
    .dashboard-note { margin: 0; color: var(--ink-soft); line-height: 1.55; }
    .sun-times-grid, .today-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(110px, 1fr)); gap: 0.65rem; }
    .sun-times-grid div, .today-grid div { display: grid; gap: 0.25rem; min-width: 0; padding: 0.72rem; border-radius: 14px; border: 1px solid rgba(255, 255, 255, 0.065); background: rgba(255, 255, 255, 0.035); }
    .sun-times-grid span, .today-grid span, .mini-label { color: var(--ink-soft); font-size: 0.68rem; letter-spacing: 0.08em; text-transform: uppercase; }
    .sun-times-grid strong, .today-grid strong, .moon-position-card strong { color: var(--ink); font-size: 1rem; line-height: 1.2; overflow-wrap: anywhere; }
    .sun-position-card { display: grid; gap: 0.7rem; }
    .sun-path { --sun-progress: 0.5; --sun-y: 1; position: relative; height: 88px; border-radius: 16px; overflow: hidden; background: linear-gradient(180deg, rgba(255, 202, 95, 0.08), rgba(255, 255, 255, 0.025)); border: 1px solid rgba(255, 255, 255, 0.06); }
    .sun-path-line { position: absolute; left: 10%; right: 10%; bottom: 18px; height: 58px; border: 2px solid rgba(255, 202, 95, 0.28); border-bottom: 0; border-radius: 90px 90px 0 0; }
    .horizon-line { position: absolute; left: 8%; right: 8%; bottom: 18px; height: 1px; background: rgba(255, 255, 255, 0.16); }
    .sun-dot { position: absolute; left: calc(10% + (80% * var(--sun-progress))); bottom: calc(18px + (58px * var(--sun-y))); width: 18px; height: 18px; border-radius: 999px; background: #ffca5f; box-shadow: 0 0 26px rgba(255, 202, 95, 0.55); transform: translate(-50%, 50%); }
    .moon-position-card { display: grid; grid-template-columns: 106px minmax(0, 1fr); gap: 0.8rem; align-items: center; }
    .moon-position-card small { display: block; margin: 0.18rem 0; color: var(--ink-soft); }
    .moon-position-visual { --moon-progress: 0.5; --moon-y: 1; position: relative; height: 86px; border-radius: 16px; background: linear-gradient(180deg, rgba(160, 190, 255, 0.08), rgba(255, 255, 255, 0.025)); border: 1px solid rgba(255, 255, 255, 0.06); overflow: hidden; }
    .moon-orbit { position: absolute; left: 12%; right: 12%; bottom: 18px; height: 52px; border: 1px dashed rgba(220, 230, 255, 0.22); border-bottom: 0; border-radius: 80px 80px 0 0; }
    .moon-dot { position: absolute; left: calc(12% + (76% * var(--moon-progress))); bottom: calc(18px + (52px * var(--moon-y))); transform: translate(-50%, 50%); }
    .moon-disc { --moon-light: 50%; position: relative; display: block; width: 34px; aspect-ratio: 1; border-radius: 999px; overflow: hidden; border: 1px solid rgba(255, 255, 255, 0.12); background: #101316; box-shadow: inset 0 1px 10px rgba(255, 255, 255, 0.08), 0 10px 18px rgba(0, 0, 0, 0.2); }
    .moon-disc::before { content: ""; position: absolute; inset: 0; border-radius: inherit; background: radial-gradient(circle at 35% 30%, rgba(255, 255, 255, 0.15), transparent 10%), radial-gradient(circle at 65% 58%, rgba(255, 255, 255, 0.09), transparent 8%), #dbe3e8; clip-path: inset(0 calc(100% - var(--moon-light)) 0 0); }
    .moon-disc[data-phase="waning"]::before { clip-path: inset(0 0 0 calc(100% - var(--moon-light))); }
    .calc-card { gap: 0.8rem; }
    .mini-calc { display: grid; gap: 0.72rem; min-width: 0; }
    .calc-display { display: grid; gap: 0.28rem; min-height: 72px; padding: 0.8rem; border-radius: 14px; border: 1px solid rgba(120, 255, 190, 0.14); background: rgba(5, 10, 9, 0.62); box-shadow: inset 0 1px 10px rgba(0, 0, 0, 0.22); }
    .calc-expression, .calc-result { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; line-height: 1.25; overflow-wrap: anywhere; }
    .calc-expression { color: rgba(243, 245, 247, 0.92); font-size: 0.95rem; min-height: 1.25rem; }
    .calc-result { color: #c8ffd8; font-size: 1.1rem; font-weight: 700; }
    .calc-keypad { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 0.42rem; }
    .calc-keypad button { min-width: 0; min-height: 42px; padding: 0.55rem 0.35rem; border-radius: 11px; border: 1px solid rgba(255, 255, 255, 0.08); color: var(--ink); background: rgba(255, 255, 255, 0.045); font: inherit; font-size: 0.86rem; cursor: pointer; transition: background 0.18s ease, border-color 0.18s ease, transform 0.18s ease; }
    .calc-keypad button:hover, .calc-keypad button:focus-visible { background: rgba(255, 255, 255, 0.08); border-color: rgba(255, 255, 255, 0.16); transform: translateY(-1px); outline: none; }
    .calc-key-danger { color: #ffd2cf !important; border-color: rgba(255, 122, 89, 0.2) !important; }
    .calc-key-enter { color: #c8ffd8 !important; border-color: rgba(120, 255, 190, 0.24) !important; background: rgba(120, 255, 190, 0.08) !important; }
    @media (max-width: 980px) { .dashboard-span-2, .time-today-card, .weather-dashboard-card { grid-column: 1 / -1; } .weather-dashboard-layout { grid-template-columns: 1fr; } }
    @media (max-width: 720px) { .compact-clock-layout, .moon-position-card { grid-template-columns: 1fr; } .calc-keypad { gap: 0.36rem; } .calc-keypad button { min-height: 40px; font-size: 0.82rem; } }
    @media (max-width: 420px) { .sun-times-grid, .today-grid { grid-template-columns: 1fr; } }
  `;
  document.head.appendChild(style);
}

function initializeDashboardShortcuts() {
  document.querySelectorAll("[data-page-target]").forEach((button) => {
    button.addEventListener("click", () => {
      const navButton = document.querySelector(`.nav-link[data-page="${button.dataset.pageTarget}"]`);
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
    timeEl.textContent = new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
      timeZone: DASHBOARD_LOCATION.timezone,
    }).format(now);

    dateEl.textContent = new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
      timeZone: DASHBOARD_LOCATION.timezone,
    }).format(now);

    const parts = new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
      hour12: false,
      timeZone: DASHBOARD_LOCATION.timezone,
    }).formatToParts(now);

    const partValue = (type) => Number(parts.find((part) => part.type === type)?.value || 0);
    const hours = partValue("hour");
    const minutes = partValue("minute");
    const seconds = partValue("second");

    if (hourHand) hourHand.style.transform = `translateX(-50%) rotate(${(hours % 12) * 30 + minutes * 0.5}deg)`;
    if (minuteHand) minuteHand.style.transform = `translateX(-50%) rotate(${minutes * 6 + seconds * 0.1}deg)`;
    if (secondHand) secondHand.style.transform = `translateX(-50%) rotate(${seconds * 6}deg)`;
  };

  updateClock();
  window.setInterval(updateClock, 1000);
}

function weatherCodeDetails(code) {
  const details = {
    0: { summary: "Clear", icon: "sun", go: true },
    1: { summary: "Mostly clear", icon: "sun", go: true },
    2: { summary: "Partly cloudy", icon: "partly", go: true },
    3: { summary: "Cloudy", icon: "cloud", go: true },
    45: { summary: "Fog", icon: "fog", go: false },
    48: { summary: "Rime fog", icon: "fog", go: false },
    51: { summary: "Light drizzle", icon: "rain", go: false },
    53: { summary: "Drizzle", icon: "rain", go: false },
    55: { summary: "Heavy drizzle", icon: "rain", go: false },
    61: { summary: "Light rain", icon: "rain", go: false },
    63: { summary: "Rain", icon: "rain", go: false },
    65: { summary: "Heavy rain", icon: "rain", go: false },
    71: { summary: "Light snow", icon: "snow", go: false },
    73: { summary: "Snow", icon: "snow", go: false },
    75: { summary: "Heavy snow", icon: "snow", go: false },
    80: { summary: "Rain showers", icon: "rain", go: false },
    81: { summary: "Showers", icon: "rain", go: false },
    82: { summary: "Heavy showers", icon: "rain", go: false },
    95: { summary: "Thunderstorms", icon: "storm", go: false },
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
  reason.textContent = caution
    ? `Watch: ${issues.join(", ")}.`
    : "No obvious weather red flags for casual outdoor activity right now.";
}

function formatDashboardTime(value) {
  if (!value) return "--:--";
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: DASHBOARD_LOCATION.timezone,
  }).format(new Date(value));
}

function updateSunPanel(sunrise, sunset) {
  const sunriseEl = document.getElementById("homeSunrise");
  const sunsetEl = document.getElementById("homeSunset");
  const leftEl = document.getElementById("homeDaylightLeft");
  const path = document.getElementById("homeSunPath");
  if (!sunriseEl || !sunsetEl || !leftEl) return;

  sunriseEl.textContent = formatDashboardTime(sunrise);
  sunsetEl.textContent = formatDashboardTime(sunset);

  const now = new Date();
  const sunriseDate = sunrise ? new Date(sunrise) : null;
  const sunsetDate = sunset ? new Date(sunset) : null;

  if (!sunriseDate || !sunsetDate || Number.isNaN(sunriseDate) || Number.isNaN(sunsetDate)) {
    leftEl.textContent = "--";
    return;
  }

  let progress = (now - sunriseDate) / (sunsetDate - sunriseDate);
  if (now < sunriseDate) {
    leftEl.textContent = "Before sunrise";
    progress = 0;
  } else if (now > sunsetDate) {
    leftEl.textContent = "After sunset";
    progress = 1;
  } else {
    const minutesLeft = Math.max(0, Math.round((sunsetDate - now) / 60000));
    leftEl.textContent = `${Math.floor(minutesLeft / 60)}h ${minutesLeft % 60}m left`;
  }

  if (path) {
    const clamped = Math.max(0, Math.min(1, progress));
    path.style.setProperty("--sun-progress", clamped.toFixed(3));
    path.style.setProperty("--sun-y", Math.sin(clamped * Math.PI).toFixed(3));
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
    const forecastParams = new URLSearchParams({
      latitude: DASHBOARD_LOCATION.latitude,
      longitude: DASHBOARD_LOCATION.longitude,
      current: "temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,uv_index",
      daily: "temperature_2m_max,temperature_2m_min,sunrise,sunset",
      temperature_unit: "fahrenheit",
      wind_speed_unit: "mph",
      forecast_days: "1",
      timezone: DASHBOARD_LOCATION.timezone,
    });
    const airParams = new URLSearchParams({
      latitude: DASHBOARD_LOCATION.latitude,
      longitude: DASHBOARD_LOCATION.longitude,
      current: "us_aqi",
      timezone: DASHBOARD_LOCATION.timezone,
    });

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
  }
}

function updateTodayPanel() {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: DASHBOARD_LOCATION.timezone,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    weekday: "short",
  }).formatToParts(now);

  const part = (type) => parts.find((item) => item.type === type)?.value;
  const localDate = new Date(Number(part("year")), Number(part("month")) - 1, Number(part("day")));
  const weekday = part("weekday");
  const weekdayEl = document.getElementById("homeWeekday");
  const fullDateEl = document.getElementById("homeFullDate");
  const dayEl = document.getElementById("homeDayOfYear");
  const weekEl = document.getElementById("homeWeekNumber");
  const weekendEl = document.getElementById("homeWeekendCountdown");

  const start = new Date(localDate.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((localDate - start) / 86400000);
  const weekNumber = Math.ceil((((localDate - new Date(localDate.getFullYear(), 0, 1)) / 86400000) + new Date(localDate.getFullYear(), 0, 1).getDay() + 1) / 7);
  const daysUntilSaturday = (6 - localDate.getDay() + 7) % 7;

  if (weekdayEl) {
    weekdayEl.textContent = new Intl.DateTimeFormat("en-US", { weekday: "long", timeZone: DASHBOARD_LOCATION.timezone }).format(now);
  }
  if (fullDateEl) {
    fullDateEl.textContent = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: DASHBOARD_LOCATION.timezone }).format(now);
  }
  if (dayEl) dayEl.textContent = String(dayOfYear);
  if (weekEl) weekEl.textContent = String(weekNumber);
  if (weekendEl) {
    if (weekday === "Sat" || weekday === "Sun") {
      weekendEl.textContent = "Now";
    } else {
      weekendEl.textContent = `${daysUntilSaturday}d`;
    }
  }
}

function updateMoonPanel() {
  const phaseEl = document.getElementById("homeMoonPhase");
  const percentEl = document.getElementById("homeMoonPercent");
  const noteEl = document.getElementById("homeMoonNote");
  const discEl = document.getElementById("homeMoonDisc");
  const positionEl = document.getElementById("homeMoonPosition");
  if (!phaseEl || !percentEl || !noteEl || !discEl) return;

  const knownNewMoon = Date.UTC(2000, 0, 6, 18, 14);
  const lunarCycle = 29.530588853;
  const days = (Date.now() - knownNewMoon) / 86400000;
  const age = ((days % lunarCycle) + lunarCycle) % lunarCycle;
  const fraction = age / lunarCycle;
  const illumination = Math.round(((1 - Math.cos(2 * Math.PI * fraction)) / 2) * 100);

  let name = "New Moon";
  if (fraction > 0.03 && fraction < 0.22) name = "Waxing Crescent";
  else if (fraction < 0.28) name = "First Quarter";
  else if (fraction < 0.47) name = "Waxing Gibbous";
  else if (fraction < 0.53) name = "Full Moon";
  else if (fraction < 0.72) name = "Waning Gibbous";
  else if (fraction < 0.78) name = "Last Quarter";
  else if (fraction < 0.97) name = "Waning Crescent";

  phaseEl.textContent = name;
  percentEl.textContent = `${illumination}%`;
  noteEl.textContent = `Lunar day ${age.toFixed(1)}. Phase-cycle estimate, not exact sky position.`;
  discEl.dataset.phase = fraction > 0.5 ? "waning" : "waxing";
  discEl.style.setProperty("--moon-light", `${Math.max(5, illumination)}%`);

  if (positionEl) {
    positionEl.style.setProperty("--moon-progress", fraction.toFixed(3));
    positionEl.style.setProperty("--moon-y", Math.sin(fraction * Math.PI).toFixed(3));
  }
}

function initializeMiniCalculator() {
  const expressionEl = document.getElementById("calcExpression");
  const resultEl = document.getElementById("calcResult");
  const keypad = document.querySelector(".calc-keypad");
  if (!expressionEl || !resultEl || !keypad) return;

  let expression = "";
  const render = () => {
    expressionEl.textContent = expression || "0";
  };

  const evaluate = () => {
    try {
      const sanitized = expression
        .replace(/π/g, "pi")
        .replace(/sin\(/g, "Math.sin(")
        .replace(/cos\(/g, "Math.cos(")
        .replace(/tan\(/g, "Math.tan(")
        .replace(/sqrt\(/g, "Math.sqrt(")
        .replace(/log\(/g, "Math.log10(")
        .replace(/ln\(/g, "Math.log(")
        .replace(/pi/g, "Math.PI")
        .replace(/\^/g, "**");

      if (!/^[0-9+\-*/().\sMathPIcosintaqrgl*]+$/.test(sanitized)) throw new Error("Bad expression");

      const value = Function(`"use strict"; return (${sanitized});`)();
      resultEl.textContent = Number.isFinite(value)
        ? Number(value).toPrecision(6).replace(/\.0+$/, "").trim()
        : "Error";
    } catch (error) {
      resultEl.textContent = "Error";
    }
  };

  keypad.addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button) return;

    if (button.dataset.calcAction === "clear") {
      expression = "";
      resultEl.textContent = "Ready";
    } else if (button.dataset.calcAction === "backspace") {
      expression = expression.slice(0, -1);
    } else if (button.dataset.calcAction === "equals") {
      evaluate();
    } else if (button.dataset.calcKey) {
      expression += button.dataset.calcKey === "pi" ? "π" : button.dataset.calcKey;
    }

    render();
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

    if (nearTop || scrollingUp) {
      nav.classList.remove("nav-hidden");
    } else if (scrollingDown && currentY > 260) {
      nav.classList.add("nav-hidden");
    }

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
    .pyro-sticky-status {
      top: 0.35rem !important;
      z-index: 26 !important;
      display: flex !important;
      align-items: center !important;
      gap: 0 !important;
      width: fit-content !important;
      max-width: min(calc(100% - 1rem), 980px) !important;
      margin-inline: auto !important;
      padding: 0.16rem 0.42rem !important;
      min-height: 24px !important;
      border-radius: 999px !important;
      border: 1px solid rgba(120, 255, 190, 0.12) !important;
      background: rgba(4, 7, 7, 0.78) !important;
      box-shadow: 0 6px 18px rgba(0, 0, 0, 0.28) !important;
      backdrop-filter: blur(12px) !important;
      overflow-x: auto !important;
      scrollbar-width: none !important;
    }

    .pyro-sticky-status::-webkit-scrollbar { display: none !important; }

    .sticky-status-tile {
      display: inline-flex !important;
      align-items: baseline !important;
      gap: 0.22rem !important;
      min-width: 0 !important;
      min-height: 0 !important;
      padding: 0 0.46rem !important;
      border: 0 !important;
      border-radius: 0 !important;
      background: transparent !important;
      box-shadow: none !important;
      white-space: nowrap !important;
    }

    .sticky-status-tile + .sticky-status-tile { border-left: 1px solid rgba(255, 255, 255, 0.12) !important; }

    .sticky-status-tile span {
      flex: 0 0 auto !important;
      color: rgba(169, 176, 183, 0.74) !important;
      font-size: 0.48rem !important;
      letter-spacing: 0.07em !important;
      line-height: 1 !important;
      text-transform: uppercase !important;
    }

    .sticky-status-tile strong {
      min-width: 0 !important;
      max-width: 12ch !important;
      color: rgba(243, 245, 247, 0.92) !important;
      font-size: 0.64rem !important;
      font-weight: 600 !important;
      line-height: 1 !important;
      white-space: nowrap !important;
      overflow: hidden !important;
      text-overflow: ellipsis !important;
    }

    .sticky-status-tile.primary strong {
      color: #c8ffd8 !important;
      max-width: 16ch !important;
    }

    .sticky-status-tile.hold strong { color: #ffd2cf !important; }

    @media (max-width: 720px) {
      .pyro-sticky-status {
        top: 0.2rem !important;
        max-width: calc(100% - 0.5rem) !important;
        margin-inline: 0.25rem !important;
        padding: 0.14rem 0.34rem !important;
      }

      .sticky-status-tile { padding: 0 0.38rem !important; }
      .sticky-status-tile span { font-size: 0.44rem !important; }
      .sticky-status-tile strong { font-size: 0.58rem !important; max-width: 10ch !important; }
      .sticky-status-tile.primary strong { max-width: 14ch !important; }
    }
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

      if (Math.abs(targetTiltX - currentTiltX) < 0.01 &&
          Math.abs(targetTiltY - currentTiltY) < 0.01 &&
          Math.abs(targetLiftZ - currentLiftZ) < 0.01) {
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
