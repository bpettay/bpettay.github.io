document.addEventListener("DOMContentLoaded", () => {
  configureConverterPrecision();
  startHomeClock();
  updateTodayPanel();
  loadHomeWeather();
  initializeToolsSwitcher();
  initializeMiniCalculator();

  if (typeof initializeNavigation === "function") initializeNavigation();

  if (typeof initializeConverter === "function") {
    initializeConverter();
    initializeGroupedUnitSelectors();
  }

  if (typeof initializePyroSimulator === "function") initializePyroSimulator();
  if (typeof initializePyroTeamSync === "function") initializePyroTeamSync();
  if (typeof initializePyroGateWorkflow === "function") initializePyroGateWorkflow();

  initializeScrollHeader();
  initializePanelTilt();
});

const DASHBOARD_LOCATION = {
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

function initializeToolsSwitcher() {
  const select = document.getElementById("toolSelect");
  const panels = document.querySelectorAll("[data-tool-panel]");
  const description = document.getElementById("toolSwitcherDescription");
  if (!select || !panels.length) return;

  const descriptions = {
    converter: "Convert between common engineering units.",
    calculator: "Run arithmetic and common scientific functions.",
  };

  const showTool = (tool) => {
    const available = Array.from(panels).some((panel) => panel.dataset.toolPanel === tool);
    const activeTool = available ? tool : "converter";

    select.value = activeTool;
    panels.forEach((panel) => {
      panel.hidden = panel.dataset.toolPanel !== activeTool;
    });
    if (description) description.textContent = descriptions[activeTool];
  };

  select.addEventListener("change", () => showTool(select.value));
  showTool(select.value);
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
