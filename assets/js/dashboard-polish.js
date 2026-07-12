(() => {
  const LAT = 40.4898;
  const LON = -81.4457;
  const DEG = Math.PI / 180;
  const RAD = 180 / Math.PI;
  const NEW_MOON = Date.UTC(2000, 0, 6, 18, 14);
  const LUNAR_CYCLE = 29.530588853;

  const normalize = (value) => ((value % 360) + 360) % 360;
  const julian = (date) => date.getTime() / 86400000 + 2440587.5;
  const gmst = (date) => normalize(280.46061837 + 360.98564736629 * (julian(date) - 2451545));

  function solarEquatorial(date) {
    const n = julian(date) - 2451545;
    const meanLongitude = normalize(280.460 + 0.9856474 * n);
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

  function horizontalPosition(equatorial, date) {
    const latitude = LAT * DEG;
    const declination = equatorial.dec * DEG;
    const rawHourAngle = normalize(gmst(date) + LON - equatorial.ra);
    const hourAngle = rawHourAngle > 180 ? rawHourAngle - 360 : rawHourAngle;
    const h = hourAngle * DEG;
    const altitude = Math.asin(
      Math.sin(latitude) * Math.sin(declination) +
      Math.cos(latitude) * Math.cos(declination) * Math.cos(h)
    ) * RAD;
    return { hourAngle, altitude };
  }

  function ellipsePoint(hourAngle) {
    const angle = hourAngle * DEG;
    return {
      x: 450 + 350 * Math.sin(angle),
      y: 215 - 155 * Math.cos(angle),
    };
  }

  function phaseInfo(date) {
    const elapsed = (date.getTime() - NEW_MOON) / 86400000;
    const age = ((elapsed % LUNAR_CYCLE) + LUNAR_CYCLE) % LUNAR_CYCLE;
    const fraction = age / LUNAR_CYCLE;
    const illumination = Math.round(((1 - Math.cos(2 * Math.PI * fraction)) / 2) * 100);
    return { age, fraction, illumination };
  }

  function updateMoonShape(phase) {
    const path = document.getElementById("v2MoonLight");
    if (!path) return;
    const radius = 22;
    const width = Math.max(0.8, phase.illumination / 100 * radius * 2);
    const waxing = phase.fraction <= 0.5;
    const start = waxing ? -radius : radius - width;
    path.setAttribute("d", `M ${start.toFixed(2)} -22 h ${width.toFixed(2)} a 22 22 0 0 1 0 44 h ${(-width).toFixed(2)} z`);
  }

  function addOrbitTicks() {
    const svg = document.querySelector(".v2-orbit");
    const ellipse = svg?.querySelector("ellipse");
    if (!svg || !ellipse || svg.querySelector(".orbit-tick-layer")) return;
    const namespace = "http://www.w3.org/2000/svg";
    const layer = document.createElementNS(namespace, "g");
    layer.classList.add("orbit-tick-layer");
    for (let index = 0; index < 24; index += 1) {
      const angle = index / 24 * Math.PI * 2;
      const major = index % 6 === 0;
      const line = document.createElementNS(namespace, "line");
      line.setAttribute("x1", String(450 + (major ? 330 : 338) * Math.cos(angle)));
      line.setAttribute("y1", String(215 + (major ? 143 : 148) * Math.sin(angle)));
      line.setAttribute("x2", String(450 + 350 * Math.cos(angle)));
      line.setAttribute("y2", String(215 + 155 * Math.sin(angle)));
      line.classList.add("orbit-tick");
      if (major) line.classList.add("major");
      layer.appendChild(line);
    }
    ellipse.after(layer);
  }

  function updateOrbit() {
    const sunMarker = document.getElementById("v2SunMarker");
    const moonMarker = document.getElementById("v2MoonMarker");
    if (!sunMarker || !moonMarker) return;
    const now = new Date();
    const sun = horizontalPosition(solarEquatorial(now), now);
    const moon = horizontalPosition(moonEquatorial(now), now);
    const sunPoint = ellipsePoint(sun.hourAngle);
    const moonPoint = ellipsePoint(moon.hourAngle);
    sunMarker.setAttribute("transform", `translate(${sunPoint.x.toFixed(2)} ${sunPoint.y.toFixed(2)})`);
    moonMarker.setAttribute("transform", `translate(${moonPoint.x.toFixed(2)} ${moonPoint.y.toFixed(2)})`);
    sunMarker.style.opacity = sun.altitude >= 0 ? "1" : ".28";
    moonMarker.style.opacity = moon.altitude >= 0 ? "1" : ".34";
    updateMoonShape(phaseInfo(now));
  }

  function injectStyles() {
    document.getElementById("dashboardPolishStyles")?.remove();
    const style = document.createElement("style");
    style.id = "dashboardPolishStyles";
    style.textContent = `
      #home { max-width: 1540px !important; margin: 0 auto !important; padding: 12px !important; }
      .v2-dashboard { grid-template-columns: minmax(250px, 290px) minmax(0, 1fr) !important; gap: 12px !important; align-items: start !important; }
      .v2-card { border-radius: 20px !important; border-color: rgba(115,170,225,.23) !important; background: linear-gradient(145deg,rgba(10,22,34,.97),rgba(5,13,22,.99)) !important; box-shadow: inset 0 1px 0 rgba(255,255,255,.035),0 18px 42px rgba(0,0,0,.26) !important; }
      .v2-time-panel,.v2-weather-panel,.v2-calculator-panel,.v2-shortcuts-panel { padding: 22px !important; }
      .v2-weather-strip { grid-template-columns: minmax(145px,1.45fr) repeat(6,minmax(82px,1fr)) minmax(130px,1.15fr) !important; gap: 0 !important; border-top: 1px solid rgba(255,255,255,.12); border-bottom: 1px solid rgba(255,255,255,.12); }
      .v2-current,.v2-stat,.v2-go { border: 0 !important; border-right: 1px solid rgba(255,255,255,.11) !important; border-radius: 0 !important; padding: 17px 13px !important; }
      .v2-go { border-right: 0 !important; }
      .v2-orbit { max-height: 430px; overflow: visible; }
      .orbit-tick { stroke: rgba(255,255,255,.2); stroke-width: 1; }
      .orbit-tick.major { stroke: rgba(255,255,255,.45); stroke-width: 2; }
      .v2-earth { transform-origin: 450px 215px; transform: scale(.86); }
      .v2-orbit-marker { transition: transform .55s ease, opacity .3s ease; }
      .v2-sky-footer { margin-top: 2px !important; }
      .v2-calculator-panel { grid-column: 1 !important; }
      .v2-shortcuts-panel { grid-column: 2 !important; }
      .v2-shortcut-grid { grid-template-columns: repeat(4,minmax(0,1fr)) !important; }
      @media (max-width: 1180px) {
        .v2-weather-strip { grid-template-columns: repeat(4,minmax(105px,1fr)) !important; gap: 10px !important; border: 0 !important; }
        .v2-current,.v2-stat,.v2-go { border: 1px solid rgba(255,255,255,.09) !important; border-radius: 12px !important; }
        .v2-current,.v2-go { grid-column: span 2; }
      }
      @media (max-width: 900px) {
        .v2-dashboard { grid-template-columns: 1fr !important; }
        .v2-time-panel,.v2-weather-panel,.v2-calculator-panel,.v2-shortcuts-panel { grid-column: 1 !important; }
        .v2-time-panel { display: grid; grid-template-columns: 1fr 1fr; column-gap: 24px; }
        .v2-location,.v2-clock-row,.v2-date { grid-column: 1; }
        .v2-today-list,.v2-daylight { grid-column: 2; }
      }
      @media (max-width: 680px) {
        #home { padding: 8px !important; }
        .v2-card { border-radius: 16px !important; }
        .v2-time-panel,.v2-weather-panel,.v2-calculator-panel,.v2-shortcuts-panel { padding: 18px !important; }
        .v2-time-panel { display: block; }
        .v2-weather-strip { grid-template-columns: repeat(2,minmax(0,1fr)) !important; }
        .v2-current,.v2-go { grid-column: 1 / -1; }
        .v2-orbit-label { font-size: 13px !important; }
        .v2-shortcut-grid { grid-template-columns: repeat(2,minmax(0,1fr)) !important; }
      }
    `;
    document.head.appendChild(style);
  }

  function start() {
    if (!document.querySelector(".v2-dashboard")) {
      setTimeout(start, 50);
      return;
    }
    injectStyles();
    addOrbitTicks();
    updateOrbit();
    setInterval(updateOrbit, 60000);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => setTimeout(start, 0));
  } else {
    setTimeout(start, 0);
  }
})();