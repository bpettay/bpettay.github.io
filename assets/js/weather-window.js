(function weatherWindowModule(root) {
  const PROFILES = {
    general: { label: "General outdoor", rain: 35, wind: 18, gust: 28, minTemp: 40, maxTemp: 88 },
    painting: { label: "Painting / coating", rain: 15, wind: 12, gust: 20, minTemp: 50, maxTemp: 85 },
    roof: { label: "Roof / ladder", rain: 20, wind: 12, gust: 18, minTemp: 40, maxTemp: 85 },
    precision: { label: "Precision setup", rain: 20, wind: 10, gust: 18, minTemp: 45, maxTemp: 82 },
  };

  let latestHourly = null;
  let latestCurrentTime = "";

  function valueAt(hourly, key, index) {
    const value = hourly?.[key]?.[index];
    return Number.isFinite(value) ? value : null;
  }

  function evaluateHour(hourly, index, profile) {
    const rain = valueAt(hourly, "precipitation_probability", index);
    const wind = valueAt(hourly, "wind_speed_10m", index);
    const gust = valueAt(hourly, "wind_gusts_10m", index);
    const temp = valueAt(hourly, "apparent_temperature", index) ?? valueAt(hourly, "temperature_2m", index);
    const code = valueAt(hourly, "weather_code", index);
    const daylight = valueAt(hourly, "is_day", index);
    const dryCode = code === null || code <= 3;
    const suitable = daylight !== 0 && dryCode
      && rain !== null && rain <= profile.rain
      && wind !== null && wind <= profile.wind
      && gust !== null && gust <= profile.gust
      && temp !== null && temp >= profile.minTemp && temp <= profile.maxTemp;

    const centerTemp = (profile.minTemp + profile.maxTemp) / 2;
    const tempPenalty = temp === null ? 18 : Math.abs(temp - centerTemp) * 0.55;
    const score = Math.max(0, Math.round(100
      - (rain ?? profile.rain) * 0.55
      - (wind ?? profile.wind) * 0.8
      - (gust ?? profile.gust) * 0.35
      - tempPenalty));

    return { suitable, rain, wind, gust, temp, score };
  }

  function findWorkWindows(hourly, currentTime, profileKey = "general", minimumHours = 2) {
    const profile = PROFILES[profileKey] || PROFILES.general;
    const times = Array.isArray(hourly?.time) ? hourly.time : [];
    const startIndex = Math.max(0, times.findIndex((time) => time >= currentTime));
    const windows = [];
    let active = [];

    const closeWindow = () => {
      if (active.length >= minimumHours) {
        const score = Math.round(active.reduce((total, hour) => total + hour.score, 0) / active.length);
        windows.push({
          start: active[0].time,
          end: active[active.length - 1].time,
          hours: active.length,
          score,
          rain: Math.max(...active.map((hour) => hour.rain)),
          wind: Math.max(...active.map((hour) => hour.wind)),
          gust: Math.max(...active.map((hour) => hour.gust)),
          low: Math.round(Math.min(...active.map((hour) => hour.temp))),
          high: Math.round(Math.max(...active.map((hour) => hour.temp))),
        });
      }
      active = [];
    };

    times.slice(startIndex, startIndex + 48).forEach((time, offset) => {
      const index = startIndex + offset;
      const evaluation = evaluateHour(hourly, index, profile);
      if (evaluation.suitable) {
        active.push({ time, ...evaluation });
      } else {
        closeWindow();
      }
    });
    closeWindow();

    return windows
      .map((window, index) => ({ ...window, rankScore: window.score + Math.min(window.hours, 8) - index * 0.5 }))
      .sort((a, b) => b.rankScore - a.rankScore)
      .slice(0, 3);
  }

  function parseForecastTime(value) {
    const match = String(value || "").match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
    if (!match) return null;
    return { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]), hour: Number(match[4]), minute: Number(match[5]) };
  }

  function formatHour(hour) {
    if (hour === 0) return "12 AM";
    if (hour === 12) return "12 PM";
    return `${hour % 12} ${hour < 12 ? "AM" : "PM"}`;
  }

  function dayLabel(value) {
    const parts = parseForecastTime(value);
    if (!parts) return "Forecast";
    const date = new Date(parts.year, parts.month - 1, parts.day);
    const today = new Date();
    const todayKey = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;
    const dateKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    if (dateKey === todayKey) return "Today";
    return new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric" }).format(date);
  }

  function formatWindowRange(window) {
    const start = parseForecastTime(window.start);
    const end = parseForecastTime(window.end);
    if (!start || !end) return "Forecast window";
    const endHour = (end.hour + 1) % 24;
    return `${formatHour(start.hour)}–${formatHour(endHour)}`;
  }

  function renderWeatherWorkWindows(hourly, currentTime) {
    latestHourly = hourly;
    latestCurrentTime = currentTime;

    const results = document.getElementById("workWindowResults");
    const criteria = document.getElementById("workWindowCriteria");
    const profileSelect = document.getElementById("workWindowProfile");
    const durationSelect = document.getElementById("workWindowDuration");
    if (!results || !criteria || !profileSelect || !durationSelect) return;

    const profile = PROFILES[profileSelect.value] || PROFILES.general;
    const minimumHours = Number(durationSelect.value) || 2;
    criteria.textContent = `Up to ${profile.rain}% rain · ${profile.wind} mph sustained · ${profile.gust} mph gusts · ${profile.minTemp}–${profile.maxTemp}°F`;

    const windows = findWorkWindows(hourly, currentTime, profileSelect.value, minimumHours);
    results.replaceChildren();

    if (!Array.isArray(hourly?.time) || !hourly.time.length) {
      const unavailable = document.createElement("p");
      unavailable.className = "work-window-empty";
      unavailable.textContent = "Forecast windows are unavailable right now.";
      results.appendChild(unavailable);
      return;
    }

    if (!windows.length) {
      const empty = document.createElement("p");
      empty.className = "work-window-empty";
      empty.textContent = `No ${minimumHours}-hour daylight window clears every limit in the next 48 hours.`;
      results.appendChild(empty);
      return;
    }

    windows.forEach((window, index) => {
      const article = document.createElement("article");
      article.className = "work-window-result";
      if (index === 0) article.dataset.best = "true";

      const heading = document.createElement("div");
      heading.className = "work-window-result-head";
      const label = document.createElement("span");
      label.textContent = index === 0 ? "Best window" : dayLabel(window.start);
      const score = document.createElement("strong");
      score.textContent = `${window.score}/100`;
      heading.append(label, score);

      const range = document.createElement("h4");
      range.textContent = `${dayLabel(window.start)} · ${formatWindowRange(window)}`;
      const detail = document.createElement("p");
      detail.textContent = `${window.hours} hr · ${window.low}–${window.high}° · rain ≤${Math.round(window.rain)}% · wind ≤${Math.round(window.wind)} mph`;
      article.append(heading, range, detail);
      results.appendChild(article);
    });
  }

  function initializeWeatherWorkWindow() {
    const profile = document.getElementById("workWindowProfile");
    const duration = document.getElementById("workWindowDuration");
    if (!profile || !duration) return;
    const rerender = () => renderWeatherWorkWindows(latestHourly || {}, latestCurrentTime);
    profile.addEventListener("change", rerender);
    duration.addEventListener("change", rerender);
  }

  root.WeatherWindow = { PROFILES, evaluateHour, findWorkWindows };
  root.renderWeatherWorkWindows = renderWeatherWorkWindows;
  if (typeof document !== "undefined") document.addEventListener("DOMContentLoaded", initializeWeatherWorkWindow);
  if (typeof module !== "undefined" && module.exports) module.exports = root.WeatherWindow;
})(typeof window !== "undefined" ? window : globalThis);
