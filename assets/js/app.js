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

  home.innerHTML = `
    <section class="home-dashboard-only enhanced-dashboard" aria-label="Personal dashboard">
      <article class="home-clock-card dashboard-card surface">
        <div class="dashboard-card-head">
          <span class="dashboard-label">Local Time</span>
          <strong>New Philadelphia</strong>
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

      <article class="home-weather-card dashboard-card surface">
        <div class="dashboard-card-head">
          <span class="dashboard-label">Conditions</span>
          <strong>Weather</strong>
        </div>
        <div class="weather-current-row">
          <div class="condition-pictogram" id="homeWeatherIcon" aria-hidden="true">--</div>
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

      <article class="dashboard-card surface quick-actions-card shortcuts-card">
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
  loadHomeWeather();
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
      timeZone: "America/New_York",
    }).format(now);

    dateEl.textContent = new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
      timeZone: "America/New_York",
    }).format(now);

    const easternParts = new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
      hour12: false,
      timeZone: "America/New_York",
    }).formatToParts(now);

    const partValue = (type) => Number(easternParts.find((part) => part.type === type)?.value || 0);
    const hours = partValue("hour");
    const minutes = partValue("minute");
    const seconds = partValue("second");

    const hourDeg = ((hours % 12) * 30) + (minutes * 0.5);
    const minuteDeg = (minutes * 6) + (seconds * 0.1);
    const secondDeg = seconds * 6;

    if (hourHand) hourHand.style.transform = `translateX(-50%) rotate(${hourDeg}deg)`;
    if (minuteHand) minuteHand.style.transform = `translateX(-50%) rotate(${minuteDeg}deg)`;
    if (secondHand) secondHand.style.transform = `translateX(-50%) rotate(${secondDeg}deg)`;
  };

  updateClock();
  window.setInterval(updateClock, 1000);
}

function weatherCodeDetails(code) {
  const details = {
    0: { summary: "Clear", icon: "sun" },
    1: { summary: "Mostly clear", icon: "sun" },
    2: { summary: "Partly cloudy", icon: "partly" },
    3: { summary: "Cloudy", icon: "cloud" },
    45: { summary: "Fog", icon: "fog" },
    48: { summary: "Rime fog", icon: "fog" },
    51: { summary: "Light drizzle", icon: "rain" },
    53: { summary: "Drizzle", icon: "rain" },
    55: { summary: "Heavy drizzle", icon: "rain" },
    61: { summary: "Light rain", icon: "rain" },
    63: { summary: "Rain", icon: "rain" },
    65: { summary: "Heavy rain", icon: "rain" },
    71: { summary: "Light snow", icon: "snow" },
    73: { summary: "Snow", icon: "snow" },
    75: { summary: "Heavy snow", icon: "snow" },
    80: { summary: "Rain showers", icon: "rain" },
    81: { summary: "Showers", icon: "rain" },
    82: { summary: "Heavy showers", icon: "rain" },
    95: { summary: "Thunderstorms", icon: "storm" },
  };

  return details[code] || { summary: "Current conditions", icon: "partly" };
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
      latitude: "40.4898",
      longitude: "-81.4457",
      current: "temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,uv_index",
      daily: "temperature_2m_max,temperature_2m_min",
      temperature_unit: "fahrenheit",
      wind_speed_unit: "mph",
      forecast_days: "1",
      timezone: "America/New_York",
    });

    const airParams = new URLSearchParams({
      latitude: "40.4898",
      longitude: "-81.4457",
      current: "us_aqi",
      timezone: "America/New_York",
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

    tempEl.textContent = Number.isFinite(current.temperature_2m)
      ? `${Math.round(current.temperature_2m)}°`
      : "--°";
    summaryEl.textContent = condition.summary;
    iconEl.dataset.condition = condition.icon;
    iconEl.setAttribute("aria-label", condition.summary);

    highEl.textContent = Number.isFinite(daily.temperature_2m_max?.[0])
      ? `${Math.round(daily.temperature_2m_max[0])}°`
      : "--°";
    lowEl.textContent = Number.isFinite(daily.temperature_2m_min?.[0])
      ? `${Math.round(daily.temperature_2m_min[0])}°`
      : "--°";
    windEl.textContent = Number.isFinite(current.wind_speed_10m)
      ? `${Math.round(current.wind_speed_10m)} mph`
      : "-- mph";
    humidityEl.textContent = Number.isFinite(current.relative_humidity_2m)
      ? `${Math.round(current.relative_humidity_2m)}%`
      : "--%";
    uvEl.textContent = Number.isFinite(current.uv_index)
      ? `${Math.round(current.uv_index)}`
      : "--";
    aqiEl.textContent = formatAqi(airData.current?.us_aqi);
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

    rebuildSelectors(
      selected.category,
      selected.unit,
      previousTo?.category === selected.category ? previousTo.unit : (defaults[1] || defaults[0])
    );
  }, true);

  toUnitEl.addEventListener("change", () => {
    const selected = selectedUnit(toUnitEl);
    if (!selected) return;

    const previousFrom = selectedUnit(fromUnitEl);
    const defaults = defaultUnits?.[selected.category] || unitsFor(selected.category).slice(0, 2);
    categoryEl.value = selected.category;

    rebuildSelectors(
      selected.category,
      previousFrom?.category === selected.category ? previousFrom.unit : defaults[0],
      selected.unit
    );
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

    .pyro-sticky-status::-webkit-scrollbar {
      display: none !important;
    }

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

    .sticky-status-tile + .sticky-status-tile {
      border-left: 1px solid rgba(255, 255, 255, 0.12) !important;
    }

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

    .sticky-status-tile.primary {
      border-color: transparent !important;
      background: transparent !important;
    }

    .sticky-status-tile.primary strong {
      color: #c8ffd8 !important;
      max-width: 16ch !important;
    }

    .sticky-status-tile.hold strong {
      color: #ffd2cf !important;
    }

    @media (max-width: 720px) {
      .pyro-sticky-status {
        top: 0.2rem !important;
        max-width: calc(100% - 0.5rem) !important;
        margin-inline: 0.25rem !important;
        padding: 0.14rem 0.34rem !important;
      }

      .sticky-status-tile {
        padding: 0 0.38rem !important;
      }

      .sticky-status-tile span {
        font-size: 0.44rem !important;
      }

      .sticky-status-tile strong {
        font-size: 0.58rem !important;
        max-width: 10ch !important;
      }

      .sticky-status-tile.primary strong {
        max-width: 14ch !important;
      }
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