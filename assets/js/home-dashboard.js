(() => {
  const DASHBOARD_LOCATION = {
    label: "New Philadelphia",
    latitude: "40.4898",
    longitude: "-81.4457",
    timezone: "America/New_York",
  };

  function initializeHomeDashboard() {
    const home = document.getElementById("home");
    if (!home) return;

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

      if (hourHand) hourHand.style.transform = `translateX(-50%) rotate(${((hours % 12) * 30) + (minutes * 0.5)}deg)`;
      if (minuteHand) minuteHand.style.transform = `translateX(-50%) rotate(${(minutes * 6) + (seconds * 0.1)}deg)`;
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
      : "No obvious weather red flags right now.";
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

    if (now < sunriseDate) {
      leftEl.textContent = "Before sunrise";
    } else if (now > sunsetDate) {
      leftEl.textContent = "After sunset";
    } else {
      const minutesLeft = Math.max(0, Math.round((sunsetDate - now) / 60000));
      const hours = Math.floor(minutesLeft / 60);
      const minutes = minutesLeft % 60;
      leftEl.textContent = `${hours}h ${minutes}m left`;
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
      updateSunPanel(null, null);
    }
  }

  function getEasternDateParts(date = new Date()) {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: DASHBOARD_LOCATION.timezone,
      year: "numeric",
      month: "numeric",
      day: "numeric",
      weekday: "long",
    }).formatToParts(date);
    const value = (type) => parts.find((part) => part.type === type)?.value;
    return {
      year: Number(value("year")),
      month: Number(value("month")),
      day: Number(value("day")),
      weekday: value("weekday"),
    };
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

    const names = [
      [0.03, "New Moon"],
      [0.22, "Waxing Crescent"],
      [0.28, "First Quarter"],
      [0.47, "Waxing Gibbous"],
      [0.53, "Full Moon"],
      [0.72, "Waning Gibbous"],
      [0.78, "Last Quarter"],
      [0.97, "Waning Crescent"],
      [1, "New Moon"],
    ];
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

  window.initializeHomeDashboard = initializeHomeDashboard;
})();
