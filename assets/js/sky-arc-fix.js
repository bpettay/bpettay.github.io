(() => {
  const DEG = Math.PI / 180;
  const RAD = 180 / Math.PI;
  const DAY_MS = 86400000;
  const LEFT = 46;
  const WIDTH = 808;
  const SUN_TOP = 50;
  const MOON_TOP = 244;
  const HORIZON_OFFSET = 119;
  const ALTITUDE_HEIGHT = 126;

  let latitude = null;
  let longitude = null;
  let timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  let observer = null;
  let rendering = false;

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
    return {
      year: value("year"),
      month: value("month"),
      day: value("day"),
      hour: value("hour"),
      minute: value("minute"),
      second: value("second"),
    };
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
    return new Intl.DateTimeFormat("en-US", {
      timeZone,
      hour: "numeric",
      minute: "2-digit",
    }).format(date);
  }

  function pointFor(date, altitudeDegrees, rowTop, midnight) {
    const progress = Math.max(0, Math.min(1, (date - midnight) / DAY_MS));
    const x = LEFT + progress * WIDTH;
    const visibleAltitude = Math.max(0, Math.min(90, altitudeDegrees));
    const horizonY = rowTop + HORIZON_OFFSET;
    const y = horizonY - (visibleAltitude / 90) * ALTITUDE_HEIGHT;
    return { x, y };
  }

  function buildTrack(kind, midnight, rowTop) {
    const stepMs = 5 * 60000;
    const end = new Date(midnight.getTime() + DAY_MS);
    const samples = [];
    const crossings = [];
    let peak = null;

    for (let time = midnight.getTime(); time <= end.getTime(); time += stepMs) {
      const date = new Date(time);
      const alt = altitude(kind, date);
      const sample = { date, altitude: alt };
      samples.push(sample);
      if (!peak || alt > peak.altitude) peak = sample;

      const previous = samples[samples.length - 2];
      if (previous && previous.altitude * alt < 0) {
        const fraction = Math.abs(previous.altitude) / (Math.abs(previous.altitude) + Math.abs(alt));
        const crossingDate = new Date(previous.date.getTime() + fraction * (date - previous.date));
        crossings.push({
          date: crossingDate,
          type: previous.altitude < alt ? "rise" : "set",
        });
      }
    }

    const commands = [];
    let segmentOpen = false;
    samples.forEach((sample) => {
      if (sample.altitude >= 0) {
        const point = pointFor(sample.date, sample.altitude, rowTop, midnight);
        commands.push(`${segmentOpen ? "L" : "M"}${point.x.toFixed(1)},${point.y.toFixed(1)}`);
        segmentOpen = true;
      } else {
        segmentOpen = false;
      }
    });

    return { path: commands.join(" "), crossings, peak };
  }

  function crossingSummary(crossings) {
    if (!crossings.length) return "No horizon crossing today";
    return crossings.map((crossing) => `${formatTime(crossing.date)} ${crossing.type}`).join(" · ");
  }

  function installTimeAxis() {
    const labels = document.querySelector(".v2-time-labels");
    if (!labels) return;
    labels.innerHTML = `
      <text x="46" y="418">12 AM</text>
      <text x="248" y="418" text-anchor="middle">6 AM</text>
      <text x="450" y="418" text-anchor="middle">12 PM</text>
      <text x="652" y="418" text-anchor="middle">6 PM</text>
      <text x="854" y="418" text-anchor="end">12 AM</text>`;
  }

  function render() {
    if (rendering || !Number.isFinite(latitude) || !Number.isFinite(longitude)) return;
    const sunPath = document.getElementById("v2SunPathLine");
    const moonPath = document.getElementById("v2MoonPathLine");
    if (!sunPath || !moonPath) return;

    rendering = true;
    try {
      installTimeAxis();
      const now = new Date();
      const midnight = localMidnightUtc(now);
      const sunAltitude = altitude("sun", now);
      const moonAltitude = altitude("moon", now);
      const sunTrack = buildTrack("sun", midnight, SUN_TOP);
      const moonTrack = buildTrack("moon", midnight, MOON_TOP);
      const sunPoint = pointFor(now, sunAltitude, SUN_TOP, midnight);
      const moonPoint = pointFor(now, moonAltitude, MOON_TOP, midnight);

      sunPath.setAttribute("d", sunTrack.path);
      moonPath.setAttribute("d", moonTrack.path);

      const sunMarker = document.getElementById("v2SunLiveMarker");
      const moonMarker = document.getElementById("v2MoonLiveMarker");
      if (sunMarker) {
        sunMarker.setAttribute("transform", `translate(${sunPoint.x.toFixed(1)} ${sunPoint.y.toFixed(1)})`);
        sunMarker.style.opacity = sunAltitude >= 0 ? "1" : "0";
      }
      if (moonMarker) {
        moonMarker.setAttribute("transform", `translate(${moonPoint.x.toFixed(1)} ${moonPoint.y.toFixed(1)})`);
        moonMarker.style.opacity = moonAltitude >= 0 ? "1" : "0";
      }

      const sunStatus = document.getElementById("v2SunStatus");
      const moonStatus = document.getElementById("v2MoonStatus");
      const sunPeak = document.getElementById("v2SunPeakLabel");
      const moonPeak = document.getElementById("v2MoonPeakLabel");

      if (sunStatus) sunStatus.textContent = `${sunAltitude >= 0 ? "Above" : "Below"} horizon · ${Math.abs(sunAltitude).toFixed(0)}° · ${crossingSummary(sunTrack.crossings)}`;
      if (moonStatus) moonStatus.textContent = `${moonAltitude >= 0 ? "Above" : "Below"} horizon · ${Math.abs(moonAltitude).toFixed(0)}° · ${crossingSummary(moonTrack.crossings)}`;
      if (sunPeak && sunTrack.peak) sunPeak.textContent = `Peak ${sunTrack.peak.altitude.toFixed(0)}° at ${formatTime(sunTrack.peak.date)}`;
      if (moonPeak && moonTrack.peak) moonPeak.textContent = `Peak ${moonTrack.peak.altitude.toFixed(0)}° at ${formatTime(moonTrack.peak.date)}`;
    } finally {
      rendering = false;
    }
  }

  function begin() {
    const svg = document.querySelector(".v2-orbit");
    if (!svg || !navigator.geolocation) {
      window.setTimeout(begin, 100);
      return;
    }

    navigator.geolocation.getCurrentPosition(async (position) => {
      latitude = position.coords.latitude;
      longitude = position.coords.longitude;

      try {
        const params = new URLSearchParams({ latitude, longitude, timezone: "auto", forecast_days: "1" });
        const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`, { cache: "no-store" });
        if (response.ok) {
          const data = await response.json();
          timeZone = data.timezone || timeZone;
        }
      } catch (_) {
        // Browser timezone remains a suitable fallback.
      }

      render();
      window.setInterval(render, 30000);

      observer?.disconnect();
      observer = new MutationObserver(() => {
        if (!rendering) window.requestAnimationFrame(render);
      });
      observer.observe(svg, { attributes: true, subtree: true, attributeFilter: ["d", "transform"] });
    }, () => {
      // The existing dashboard displays the location-permission message.
    }, { enableHighAccuracy: false, timeout: 10000, maximumAge: 900000 });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => window.setTimeout(begin, 100));
  } else {
    window.setTimeout(begin, 100);
  }
})();
