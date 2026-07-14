(() => {
  const DEG = Math.PI / 180;
  const RAD = 180 / Math.PI;
  const DAY_MS = 86400000;
  const TRACK_LEFT = 46;
  const TRACK_WIDTH = 808;
  const SAMPLE_MINUTES = 10;

  let latitude = null;
  let longitude = null;
  let timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

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
    const lat = latitude * DEG;
    const dec = equatorial.dec * DEG;
    const hourAngle = signedAngle(gmst(date) + longitude - equatorial.ra) * DEG;
    return Math.asin(
      Math.sin(lat) * Math.sin(dec) +
      Math.cos(lat) * Math.cos(dec) * Math.cos(hourAngle)
    ) * RAD;
  }

  function zonedParts(date) {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
      hourCycle: "h23",
    }).formatToParts(date);
    const value = (type) => Number(parts.find((part) => part.type === type)?.value || 0);
    return { year: value("year"), month: value("month"), day: value("day"), hour: value("hour"), minute: value("minute"), second: value("second") };
  }

  function timezoneOffsetMs(date) {
    const p = zonedParts(date);
    return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - date.getTime();
  }

  function localMidnightUtc(date) {
    const p = zonedParts(date);
    const guess = new Date(Date.UTC(p.year, p.month - 1, p.day));
    return new Date(guess.getTime() - timezoneOffsetMs(guess));
  }

  function formatTime(date) {
    return new Intl.DateTimeFormat("en-US", { timeZone, hour: "numeric", minute: "2-digit" }).format(date);
  }

  function point(minutes, altitudeDegrees, rowTop) {
    const x = TRACK_LEFT + (minutes / 1440) * TRACK_WIDTH;
    const clamped = Math.max(-28, Math.min(90, altitudeDegrees));
    const y = rowTop + 151 - ((clamped + 28) / 118) * 126;
    return { x, y };
  }

  function buildDailyTrack(kind, midnight, rowTop) {
    const samples = [];
    const crossings = [];
    let peak = { altitude: -90, date: midnight };
    let previous = null;

    for (let minutes = 0; minutes <= 1440; minutes += SAMPLE_MINUTES) {
      const date = new Date(midnight.getTime() + minutes * 60000);
      const alt = altitude(kind, date);
      if (alt > peak.altitude) peak = { altitude: alt, date };
      if (previous && previous.altitude * alt < 0) {
        const fraction = Math.abs(previous.altitude) / (Math.abs(previous.altitude) + Math.abs(alt));
        crossings.push(new Date(previous.date.getTime() + fraction * (date.getTime() - previous.date.getTime())));
      }
      samples.push(point(minutes, alt, rowTop));
      previous = { altitude: alt, date };
    }

    return {
      path: samples.map((sample, index) => `${index ? "L" : "M"}${sample.x.toFixed(1)},${sample.y.toFixed(1)}`).join(" "),
      crossings,
      peak,
    };
  }

  function crossingText(crossings) {
    if (crossings.length >= 2) return `${formatTime(crossings[0])} rise · ${formatTime(crossings[1])} set`;
    if (crossings.length === 1) return `Horizon crossing ${formatTime(crossings[0])}`;
    return "No horizon crossings today";
  }

  function setTimelineLabels() {
    const labels = document.querySelectorAll(".v2-time-labels text");
    if (labels.length < 3) return;
    const values = labels.length >= 5 ? ["12 AM", "6 AM", "12 PM", "6 PM", "12 AM"] : ["12 AM", "12 PM", "12 AM"];
    labels.forEach((label, index) => {
      label.textContent = values[index] || "";
    });
  }

  function render() {
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;
    if (!document.getElementById("v2SunPathLine")) return;

    const now = new Date();
    const midnight = localMidnightUtc(now);
    const elapsedMinutes = Math.max(0, Math.min(1440, (now - midnight) / 60000));
    const sunAltitude = altitude("sun", now);
    const moonAltitude = altitude("moon", now);
    const sunTrack = buildDailyTrack("sun", midnight, 50);
    const moonTrack = buildDailyTrack("moon", midnight, 244);
    const sunPoint = point(elapsedMinutes, sunAltitude, 50);
    const moonPoint = point(elapsedMinutes, moonAltitude, 244);

    document.getElementById("v2SunPathLine")?.setAttribute("d", sunTrack.path);
    document.getElementById("v2MoonPathLine")?.setAttribute("d", moonTrack.path);
    document.getElementById("v2SunLiveMarker")?.setAttribute("transform", `translate(${sunPoint.x.toFixed(1)} ${sunPoint.y.toFixed(1)})`);
    document.getElementById("v2MoonLiveMarker")?.setAttribute("transform", `translate(${moonPoint.x.toFixed(1)} ${moonPoint.y.toFixed(1)})`);
    document.getElementById("v2SunLiveMarker")?.classList.toggle("below", sunAltitude < 0);
    document.getElementById("v2MoonLiveMarker")?.classList.toggle("below", moonAltitude < 0);

    const sunStatus = document.getElementById("v2SunStatus");
    const moonStatus = document.getElementById("v2MoonStatus");
    const sunPeak = document.getElementById("v2SunPeakLabel");
    const moonPeak = document.getElementById("v2MoonPeakLabel");
    if (sunStatus) sunStatus.textContent = `${sunAltitude >= 0 ? "Above" : "Below"} horizon · ${Math.abs(sunAltitude).toFixed(0)}° · ${crossingText(sunTrack.crossings)}`;
    if (moonStatus) moonStatus.textContent = `${moonAltitude >= 0 ? "Above" : "Below"} horizon · ${Math.abs(moonAltitude).toFixed(0)}° · ${crossingText(moonTrack.crossings)}`;
    if (sunPeak) sunPeak.textContent = `Peak ${sunTrack.peak.altitude.toFixed(0)}° at ${formatTime(sunTrack.peak.date)}`;
    if (moonPeak) moonPeak.textContent = `Peak ${moonTrack.peak.altitude.toFixed(0)}° at ${formatTime(moonTrack.peak.date)}`;
    setTimelineLabels();
  }

  function begin(position) {
    latitude = position.coords.latitude;
    longitude = position.coords.longitude;
    render();
    window.setInterval(render, 60000);
  }

  function start() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(begin, () => {}, { enableHighAccuracy: false, timeout: 10000, maximumAge: 900000 });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => window.setTimeout(start, 300));
  else window.setTimeout(start, 300);
})();