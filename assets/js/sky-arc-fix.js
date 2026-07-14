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
  let rendering = false;
  let observer = null;

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

  function formatTime(date) {
    if (!date) return "--:--";
    return new Intl.DateTimeFormat("en-US", {
      timeZone,
      hour: "numeric",
      minute: "2-digit",
    }).format(date);
  }

  function refineCrossing(kind, before, after) {
    let low = before.getTime();
    let high = after.getTime();
    let lowAltitude = altitude(kind, new Date(low));
    for (let i = 0; i < 18; i += 1) {
      const mid = (low + high) / 2;
      const midAltitude = altitude(kind, new Date(mid));
      if ((lowAltitude < 0 && midAltitude < 0) || (lowAltitude >= 0 && midAltitude >= 0)) {
        low = mid;
        lowAltitude = midAltitude;
      } else {
        high = mid;
      }
    }
    return new Date((low + high) / 2);
  }

  function findVisibilityArcs(kind, now) {
    const start = new Date(now.getTime() - DAY_MS);
    const end = new Date(now.getTime() + 2 * DAY_MS);
    const stepMs = 10 * 60000;
    const crossings = [];
    let previousDate = start;
    let previousAltitude = altitude(kind, previousDate);

    for (let time = start.getTime() + stepMs; time <= end.getTime(); time += stepMs) {
      const date = new Date(time);
      const currentAltitude = altitude(kind, date);
      if ((previousAltitude < 0 && currentAltitude >= 0) || (previousAltitude >= 0 && currentAltitude < 0)) {
        crossings.push({
          date: refineCrossing(kind, previousDate, date),
          type: previousAltitude < currentAltitude ? "rise" : "set",
        });
      }
      previousDate = date;
      previousAltitude = currentAltitude;
    }

    const arcs = [];
    for (let i = 0; i < crossings.length; i += 1) {
      if (crossings[i].type !== "rise") continue;
      const set = crossings.slice(i + 1).find((event) => event.type === "set");
      if (set) arcs.push({ rise: crossings[i].date, set: set.date });
    }
    return arcs;
  }

  function chooseArc(kind, now) {
    const arcs = findVisibilityArcs(kind, now);
    const active = arcs.find((arc) => now >= arc.rise && now <= arc.set);
    if (active) return { ...active, active: true };

    const next = arcs.find((arc) => arc.rise > now);
    if (next) return { ...next, active: false };

    const previous = [...arcs].reverse().find((arc) => arc.set < now);
    return previous ? { ...previous, active: false } : null;
  }

  function buildArc(kind, arc, rowTop) {
    const samples = [];
    const duration = arc.set - arc.rise;
    const stepMs = Math.max(60000, duration / 180);
    let peak = null;

    for (let time = arc.rise.getTime(); time <= arc.set.getTime(); time += stepMs) {
      const date = new Date(time);
      const alt = Math.max(0, altitude(kind, date));
      const progress = Math.max(0, Math.min(1, (date - arc.rise) / duration));
      const x = LEFT + progress * WIDTH;
      const horizonY = rowTop + HORIZON_OFFSET;
      const y = horizonY - (Math.min(90, alt) / 90) * ALTITUDE_HEIGHT;
      const sample = { date, altitude: alt, x, y };
      samples.push(sample);
      if (!peak || alt > peak.altitude) peak = sample;
    }

    const finalAltitude = Math.max(0, altitude(kind, arc.set));
    samples.push({
      date: arc.set,
      altitude: finalAltitude,
      x: LEFT + WIDTH,
      y: rowTop + HORIZON_OFFSET,
    });

    const path = samples.map((sample, index) => `${index ? "L" : "M"}${sample.x.toFixed(1)},${sample.y.toFixed(1)}`).join(" ");
    return { path, peak, duration };
  }

  function markerPoint(kind, now, arc, rowTop) {
    const duration = arc.set - arc.rise;
    const progress = Math.max(0, Math.min(1, (now - arc.rise) / duration));
    const alt = Math.max(0, altitude(kind, now));
    const x = LEFT + progress * WIDTH;
    const y = rowTop + HORIZON_OFFSET - (Math.min(90, alt) / 90) * ALTITUDE_HEIGHT;
    return { x, y, progress, altitude: alt };
  }

  function installAxisLabels() {
    const labels = document.querySelector(".v2-time-labels");
    if (!labels) return;
    labels.innerHTML = `
      <text id="v2AxisRise" x="46" y="418">Rise</text>
      <text id="v2AxisPeak" x="450" y="418" text-anchor="middle">Peak</text>
      <text id="v2AxisSet" x="854" y="418" text-anchor="end">Set</text>`;
  }

  function setRowTimeLabels(kind, arcData) {
    const rowTop = kind === "sun" ? SUN_TOP : MOON_TOP;
    const prefix = kind === "sun" ? "Sun" : "Moon";
    const old = document.getElementById(`v2${prefix}ArcTimes`);
    old?.remove();

    const path = document.getElementById(kind === "sun" ? "v2SunPathLine" : "v2MoonPathLine");
    const parent = path?.parentElement;
    if (!parent || !arcData?.peak) return;

    const ns = "http://www.w3.org/2000/svg";
    const group = document.createElementNS(ns, "g");
    group.id = `v2${prefix}ArcTimes`;
    group.setAttribute("class", "v2-time-labels");

    const labels = [
      { x: LEFT, anchor: "start", text: formatTime(arcData.rise) },
      { x: LEFT + WIDTH / 2, anchor: "middle", text: formatTime(arcData.peak.date) },
      { x: LEFT + WIDTH, anchor: "end", text: formatTime(arcData.set) },
    ];

    labels.forEach((item) => {
      const text = document.createElementNS(ns, "text");
      text.setAttribute("x", String(item.x));
      text.setAttribute("y", String(rowTop + 140));
      text.setAttribute("text-anchor", item.anchor);
      text.textContent = item.text;
      group.appendChild(text);
    });
    parent.appendChild(group);
  }

  function renderBody(kind, now) {
    const rowTop = kind === "sun" ? SUN_TOP : MOON_TOP;
    const path = document.getElementById(kind === "sun" ? "v2SunPathLine" : "v2MoonPathLine");
    const marker = document.getElementById(kind === "sun" ? "v2SunLiveMarker" : "v2MoonLiveMarker");
    const status = document.getElementById(kind === "sun" ? "v2SunStatus" : "v2MoonStatus");
    const peakLabel = document.getElementById(kind === "sun" ? "v2SunPeakLabel" : "v2MoonPeakLabel");
    if (!path || !marker) return;

    const arc = chooseArc(kind, now);
    if (!arc) return;
    const built = buildArc(kind, arc, rowTop);
    path.setAttribute("d", built.path);

    const liveAltitude = altitude(kind, now);
    if (arc.active && liveAltitude >= 0) {
      const point = markerPoint(kind, now, arc, rowTop);
      marker.setAttribute("transform", `translate(${point.x.toFixed(1)} ${point.y.toFixed(1)})`);
      marker.style.opacity = "1";
    } else {
      marker.style.opacity = "0";
    }

    setRowTimeLabels(kind, { ...arc, peak: built.peak });

    const bodyName = kind === "sun" ? "Sun" : "Moon";
    if (status) {
      status.textContent = arc.active
        ? `${bodyName} up now · ${Math.max(0, liveAltitude).toFixed(0)}° altitude · ${formatTime(arc.rise)} rise · ${formatTime(arc.set)} set`
        : `${bodyName} below horizon · next rise ${formatTime(arc.rise)}`;
    }
    if (peakLabel && built.peak) {
      peakLabel.textContent = `Peak ${built.peak.altitude.toFixed(0)}° at ${formatTime(built.peak.date)}`;
    }
  }

  function render() {
    if (rendering || !Number.isFinite(latitude) || !Number.isFinite(longitude)) return;
    rendering = true;
    try {
      installAxisLabels();
      const now = new Date();
      renderBody("sun", now);
      renderBody("moon", now);
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
      // Existing dashboard handles the location-permission message.
    }, { enableHighAccuracy: false, timeout: 10000, maximumAge: 900000 });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => window.setTimeout(begin, 100));
  } else {
    window.setTimeout(begin, 100);
  }
})();