document.addEventListener("DOMContentLoaded", () => {
  startHomeClock();
  updateTodayPanel();
  loadHomeWeather();
  initializeToolsSwitcher();
  if (typeof initializeGraphingCalculator === "function") initializeGraphingCalculator();

  if (typeof initializeNavigation === "function") initializeNavigation();

  if (typeof initializeConverter === "function") {
    initializeConverter();
    initializeGroupedUnitSelectors();
  }

  initializeScrollHeader();
  registerServiceWorker();
});

const DASHBOARD_LOCATION = {
  latitude: "40.4898",
  longitude: "-81.4457",
  timezone: "America/New_York",
};

function startHomeClock() {
  const timeEl = document.getElementById("homeClockTime");
  const dateEl = document.getElementById("homeClockDate");
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

function setGoNoGo({ condition, wind, gusts, rainChance, aqi, uv, temp }) {
  const pill = document.getElementById("homeGoPill");
  const title = document.getElementById("homeGoTitle");
  const reason = document.getElementById("homeGoReason");
  const card = document.getElementById("homeGoCard");
  if (!pill || !title || !reason || !card) return;

  const issues = [];
  if (!condition.go) issues.push(condition.summary);
  if (Number.isFinite(wind) && wind >= 15) issues.push("windy");
  if (Number.isFinite(gusts) && gusts >= 25) issues.push("strong gusts");
  if (Number.isFinite(rainChance) && rainChance >= 50) issues.push(`${Math.round(rainChance)}% rain chance`);
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

function windDirectionLabel(degrees) {
  if (!Number.isFinite(degrees)) return "";
  const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  return directions[Math.round(degrees / 45) % directions.length];
}

function formatForecastHour(value) {
  const hour = Number(String(value || "").split("T")[1]?.slice(0, 2));
  if (!Number.isFinite(hour)) return "--";
  if (hour === 0) return "12 AM";
  if (hour === 12) return "12 PM";
  return `${hour % 12} ${hour < 12 ? "AM" : "PM"}`;
}

function renderHourlyForecast(hourly, currentTime) {
  const container = document.getElementById("homeHourlyForecast");
  if (!container) return;

  const times = Array.isArray(hourly?.time) ? hourly.time : [];
  const nextIndex = times.findIndex((time) => time > currentTime);
  const startIndex = nextIndex > 0 ? nextIndex - 1 : 0;
  const items = times.slice(startIndex, startIndex + 6).map((time, offset) => {
    const index = startIndex + offset;
    const temperature = hourly.temperature_2m?.[index];
    const rainChance = hourly.precipitation_probability?.[index];
    const condition = weatherCodeDetails(hourly.weather_code?.[index]);
    const item = document.createElement("div");
    item.className = "hourly-forecast-item";

    const timeEl = document.createElement("time");
    timeEl.dateTime = time;
    timeEl.textContent = offset === 0 ? "Now" : formatForecastHour(time);
    const tempEl = document.createElement("strong");
    tempEl.textContent = Number.isFinite(temperature) ? `${Math.round(temperature)}°` : "--°";
    const rainEl = document.createElement("span");
    rainEl.textContent = Number.isFinite(rainChance) ? `${Math.round(rainChance)}% rain` : "--% rain";
    const conditionEl = document.createElement("small");
    conditionEl.textContent = condition.summary;

    item.append(timeEl, tempEl, rainEl, conditionEl);
    return item;
  });

  container.replaceChildren(...items);
  if (!items.length) {
    const unavailable = document.createElement("span");
    unavailable.className = "forecast-loading";
    unavailable.textContent = "Hourly forecast unavailable.";
    container.appendChild(unavailable);
  }
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

  if (!sunriseDate || !sunsetDate || Number.isNaN(sunriseDate.getTime()) || Number.isNaN(sunsetDate.getTime())) {
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
  const feelsEl = document.getElementById("homeWeatherFeels");
  const gustsEl = document.getElementById("homeWeatherGusts");
  const rainChanceEl = document.getElementById("homeWeatherRainChance");
  const precipEl = document.getElementById("homeWeatherPrecip");
  const pressureEl = document.getElementById("homeWeatherPressure");
  const visibilityEl = document.getElementById("homeWeatherVisibility");
  const updatedEl = document.getElementById("homeWeatherUpdated");
  const required = [tempEl, summaryEl, highEl, lowEl, windEl, humidityEl, aqiEl, uvEl, iconEl,
    feelsEl, gustsEl, rainChanceEl, precipEl, pressureEl, visibilityEl, updatedEl];
  if (required.some((element) => !element)) return;

  try {
    const forecastParams = new URLSearchParams({
      latitude: DASHBOARD_LOCATION.latitude,
      longitude: DASHBOARD_LOCATION.longitude,
      current: "temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,pressure_msl,visibility,wind_speed_10m,wind_direction_10m,wind_gusts_10m,uv_index",
      hourly: "temperature_2m,apparent_temperature,precipitation_probability,weather_code,wind_speed_10m,wind_gusts_10m,is_day",
      daily: "temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,sunrise,sunset",
      temperature_unit: "fahrenheit",
      wind_speed_unit: "mph",
      precipitation_unit: "inch",
      forecast_days: "2",
      timezone: DASHBOARD_LOCATION.timezone,
    });
    const airParams = new URLSearchParams({
      latitude: DASHBOARD_LOCATION.latitude,
      longitude: DASHBOARD_LOCATION.longitude,
      current: "us_aqi",
      timezone: DASHBOARD_LOCATION.timezone,
    });

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 8000);
    const [forecastResult, airResult] = await Promise.allSettled([
      fetch(`https://api.open-meteo.com/v1/forecast?${forecastParams.toString()}`, { signal: controller.signal }),
      fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?${airParams.toString()}`, { signal: controller.signal }),
    ]);
    window.clearTimeout(timeoutId);

    if (forecastResult.status !== "fulfilled" || !forecastResult.value.ok) {
      throw new Error("Weather request failed");
    }

    const forecastData = await forecastResult.value.json();
    const airData = airResult.status === "fulfilled" && airResult.value.ok
      ? await airResult.value.json()
      : {};
    const current = forecastData.current || {};
    const hourly = forecastData.hourly || {};
    const daily = forecastData.daily || {};
    const condition = weatherCodeDetails(current.weather_code);
    const aqi = airData.current?.us_aqi;

    tempEl.textContent = Number.isFinite(current.temperature_2m) ? `${Math.round(current.temperature_2m)}°` : "--°";
    summaryEl.textContent = condition.summary;
    iconEl.dataset.condition = condition.icon;
    iconEl.setAttribute("aria-label", condition.summary);
    highEl.textContent = Number.isFinite(daily.temperature_2m_max?.[0]) ? `${Math.round(daily.temperature_2m_max[0])}°` : "--°";
    lowEl.textContent = Number.isFinite(daily.temperature_2m_min?.[0]) ? `${Math.round(daily.temperature_2m_min[0])}°` : "--°";
    const windDirection = windDirectionLabel(current.wind_direction_10m);
    windEl.textContent = Number.isFinite(current.wind_speed_10m)
      ? `${Math.round(current.wind_speed_10m)} mph${windDirection ? ` ${windDirection}` : ""}`
      : "-- mph";
    humidityEl.textContent = Number.isFinite(current.relative_humidity_2m) ? `${Math.round(current.relative_humidity_2m)}%` : "--%";
    feelsEl.textContent = Number.isFinite(current.apparent_temperature) ? `${Math.round(current.apparent_temperature)}°` : "--°";
    gustsEl.textContent = Number.isFinite(current.wind_gusts_10m) ? `${Math.round(current.wind_gusts_10m)} mph` : "-- mph";
    rainChanceEl.textContent = Number.isFinite(daily.precipitation_probability_max?.[0])
      ? `${Math.round(daily.precipitation_probability_max[0])}%`
      : "--%";
    precipEl.textContent = Number.isFinite(daily.precipitation_sum?.[0]) ? `${daily.precipitation_sum[0].toFixed(2)} in` : "-- in";
    pressureEl.textContent = Number.isFinite(current.pressure_msl) ? `${Math.round(current.pressure_msl)} mb` : "-- mb";
    visibilityEl.textContent = Number.isFinite(current.visibility) ? `${Math.round(current.visibility / 1609.344)} mi` : "-- mi";
    uvEl.textContent = Number.isFinite(current.uv_index) ? `${Math.round(current.uv_index)}` : "--";
    aqiEl.textContent = formatAqi(aqi);
    updatedEl.textContent = `Updated ${formatForecastHour(current.time)}`;

    updateSunPanel(daily.sunrise?.[0], daily.sunset?.[0]);
    renderHourlyForecast(hourly, current.time);
    if (typeof window.renderWeatherWorkWindows === "function") {
      window.renderWeatherWorkWindows(hourly, current.time);
    }
    setGoNoGo({
      condition,
      wind: current.wind_speed_10m,
      gusts: current.wind_gusts_10m,
      rainChance: daily.precipitation_probability_max?.[0],
      aqi,
      uv: current.uv_index,
      temp: current.temperature_2m,
    });
  } catch (error) {
    tempEl.textContent = "--°";
    highEl.textContent = "--°";
    lowEl.textContent = "--°";
    windEl.textContent = "-- mph";
    humidityEl.textContent = "--%";
    feelsEl.textContent = "--°";
    gustsEl.textContent = "-- mph";
    rainChanceEl.textContent = "--%";
    precipEl.textContent = "-- in";
    pressureEl.textContent = "-- mb";
    visibilityEl.textContent = "-- mi";
    uvEl.textContent = "--";
    aqiEl.textContent = "--";
    summaryEl.textContent = "Weather unavailable";
    updatedEl.textContent = "Update unavailable";
    iconEl.dataset.condition = "unknown";
    renderHourlyForecast({}, "");
    if (typeof window.renderWeatherWorkWindows === "function") {
      window.renderWeatherWorkWindows({}, "");
    }
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

  const calendarMetrics = window.SiteDateUtils?.getCalendarMetrics(
    localDate.getFullYear(),
    localDate.getMonth(),
    localDate.getDate()
  );
  const dayOfYear = calendarMetrics?.dayOfYear ?? "--";
  const weekNumber = calendarMetrics?.weekNumber ?? "--";
  const daysUntilSaturday = calendarMetrics?.daysUntilSaturday ?? 0;

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

function initializeToolsSwitcher() {
  const select = document.getElementById("toolSelect");
  const panels = document.querySelectorAll("[data-tool-panel]");
  const description = document.getElementById("toolSwitcherDescription");
  if (!panels.length) return;

  const syncCalculatorScrollLock = () => {
    const calculatorIsActive = Boolean(
      document.getElementById("tools")?.classList.contains("active")
      && document.querySelector('[data-tool-panel="calculator"]:not([hidden])')
    );
    document.documentElement.classList.toggle("calculator-scroll-locked", calculatorIsActive);
    document.body.classList.toggle("calculator-scroll-locked", calculatorIsActive);
  };

  const descriptions = {
    converter: "Convert between common engineering units.",
    calculator: "Graph functions, trace curves, inspect tables, and run scientific calculations.",
  };

  const showTool = (tool) => {
    const available = Array.from(panels).some((panel) => panel.dataset.toolPanel === tool);
    const activeTool = available ? tool : "converter";

    if (select) select.value = activeTool;
    panels.forEach((panel) => {
      panel.hidden = panel.dataset.toolPanel !== activeTool;
    });
    if (description) description.textContent = descriptions[activeTool];
    if (activeTool === "calculator") {
      window.scrollTo({ top: 0, behavior: "instant" });
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => window.fitGraphingCalculator?.());
      });
    }
    syncCalculatorScrollLock();
  };

  if (select) select.addEventListener("change", () => showTool(select.value));
  showTool(select?.value || "converter");
  window.siteTools = { showTool, syncCalculatorScrollLock };
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

let pyroFeaturesInitialized = false;

function initializePyroFeatures() {
  if (pyroFeaturesInitialized) return;
  pyroFeaturesInitialized = true;

  if (typeof initializePyroSimulator === "function") initializePyroSimulator();
  if (typeof initializePyroTeamSync === "function") initializePyroTeamSync();
  if (typeof initializePyroGateWorkflow === "function") initializePyroGateWorkflow();
}

window.initializePyroFeatures = initializePyroFeatures;

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  navigator.serviceWorker.register("./service-worker.js").catch(() => {
    // The dashboard remains fully functional when offline support is unavailable.
  });
}
