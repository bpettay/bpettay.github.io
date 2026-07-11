(function () {
  const LOCATION = {
    latitude: 40.4898,
    longitude: -81.4457,
  };

  const DEG = Math.PI / 180;
  const RAD = 180 / Math.PI;

  function normalizeDegrees(value) {
    return ((value % 360) + 360) % 360;
  }

  function julianDate(date) {
    return date.getTime() / 86400000 + 2440587.5;
  }

  function gmst(date) {
    const jd = julianDate(date);
    const d = jd - 2451545.0;
    return normalizeDegrees(280.46061837 + 360.98564736629 * d);
  }

  function equatorialToHorizontal(raDeg, decDeg, date) {
    const lat = LOCATION.latitude * DEG;
    const dec = decDeg * DEG;
    const lst = normalizeDegrees(gmst(date) + LOCATION.longitude);
    const hourAngle = normalizeDegrees(lst - raDeg) * DEG;

    const altitude = Math.asin(
      Math.sin(lat) * Math.sin(dec) +
      Math.cos(lat) * Math.cos(dec) * Math.cos(hourAngle)
    );

    const azimuth = Math.atan2(
      -Math.sin(hourAngle),
      Math.tan(dec) * Math.cos(lat) - Math.sin(lat) * Math.cos(hourAngle)
    );

    return {
      altitude: altitude * RAD,
      azimuth: normalizeDegrees(azimuth * RAD),
    };
  }

  function solarEquatorial(date) {
    const jd = julianDate(date);
    const n = jd - 2451545.0;
    const meanLongitude = normalizeDegrees(280.460 + 0.9856474 * n);
    const meanAnomaly = normalizeDegrees(357.528 + 0.9856003 * n) * DEG;
    const eclipticLongitude = normalizeDegrees(
      meanLongitude + 1.915 * Math.sin(meanAnomaly) + 0.020 * Math.sin(2 * meanAnomaly)
    ) * DEG;
    const obliquity = (23.439 - 0.0000004 * n) * DEG;

    const ra = Math.atan2(
      Math.cos(obliquity) * Math.sin(eclipticLongitude),
      Math.cos(eclipticLongitude)
    ) * RAD;
    const dec = Math.asin(Math.sin(obliquity) * Math.sin(eclipticLongitude)) * RAD;

    return {
      ra: normalizeDegrees(ra),
      dec,
    };
  }

  function moonEquatorial(date) {
    const jd = julianDate(date);
    const d = jd - 2451543.5;

    const n = normalizeDegrees(125.1228 - 0.0529538083 * d) * DEG;
    const i = 5.1454 * DEG;
    const w = normalizeDegrees(318.0634 + 0.1643573223 * d) * DEG;
    const a = 60.2666;
    const e = 0.0549;
    const m = normalizeDegrees(115.3654 + 13.0649929509 * d) * DEG;

    const eccentricAnomaly = m + e * Math.sin(m) * (1 + e * Math.cos(m));
    const xv = a * (Math.cos(eccentricAnomaly) - e);
    const yv = a * Math.sqrt(1 - e * e) * Math.sin(eccentricAnomaly);
    const v = Math.atan2(yv, xv);
    const r = Math.sqrt(xv * xv + yv * yv);

    const xh = r * (Math.cos(n) * Math.cos(v + w) - Math.sin(n) * Math.sin(v + w) * Math.cos(i));
    const yh = r * (Math.sin(n) * Math.cos(v + w) + Math.cos(n) * Math.sin(v + w) * Math.cos(i));
    const zh = r * (Math.sin(v + w) * Math.sin(i));

    const obliquity = (23.4393 - 3.563e-7 * d) * DEG;
    const xe = xh;
    const ye = yh * Math.cos(obliquity) - zh * Math.sin(obliquity);
    const ze = yh * Math.sin(obliquity) + zh * Math.cos(obliquity);

    return {
      ra: normalizeDegrees(Math.atan2(ye, xe) * RAD),
      dec: Math.atan2(ze, Math.sqrt(xe * xe + ye * ye)) * RAD,
    };
  }

  function skyToPictograph(position) {
    const azimuth = position.azimuth;
    const altitude = position.altitude;

    // Map east-south-west to left-center-right. North-side objects stay near the nearest edge.
    let x;
    if (azimuth <= 180) {
      x = azimuth / 180;
    } else {
      x = (360 - azimuth) / 180;
      x = azimuth > 270 ? 0 : 1;
    }

    const visibleAltitude = Math.max(-12, Math.min(75, altitude));
    const y = Math.max(0, Math.min(1, (visibleAltitude + 12) / 87));

    return { x, y, visible: altitude >= 0 };
  }

  function applySkyPosition(element, cssPrefix, position) {
    if (!element) return;
    const mapped = skyToPictograph(position);
    element.style.setProperty(`--${cssPrefix}-progress`, mapped.x.toFixed(3));
    element.style.setProperty(`--${cssPrefix}-y`, mapped.y.toFixed(3));
    element.dataset.belowHorizon = mapped.visible ? "false" : "true";
  }

  function updateTrueSkyPositions() {
    const now = new Date();
    const sun = equatorialToHorizontal(
      solarEquatorial(now).ra,
      solarEquatorial(now).dec,
      now
    );
    const moon = equatorialToHorizontal(
      moonEquatorial(now).ra,
      moonEquatorial(now).dec,
      now
    );

    applySkyPosition(document.getElementById("homeSunPath"), "sun", sun);
    applySkyPosition(document.getElementById("homeMoonPosition"), "moon", moon);

    const moonLabel = document.querySelector(".moon-position-card .mini-label");
    const moonNote = document.getElementById("homeMoonNote");
    if (moonLabel) moonLabel.textContent = "Moon in sky";
    if (moonNote) moonNote.textContent = "Phase shown on the disc; position tracks current sky location.";
  }

  function injectSkyPositionStyles() {
    if (document.getElementById("trueSkyPositionStyles")) return;
    const style = document.createElement("style");
    style.id = "trueSkyPositionStyles";
    style.textContent = `
      .sun-path::before,
      .moon-position-visual::before {
        content: "";
        position: absolute;
        inset: 10px 10px 18px;
        border-radius: 14px;
        background:
          linear-gradient(90deg, transparent 49.5%, rgba(255,255,255,.08) 49.5%, rgba(255,255,255,.08) 50.5%, transparent 50.5%),
          linear-gradient(180deg, transparent 49.5%, rgba(255,255,255,.055) 49.5%, rgba(255,255,255,.055) 50.5%, transparent 50.5%);
        pointer-events: none;
      }
      .sun-dot,
      .moon-dot {
        opacity: 1;
        transition: left .45s ease, bottom .45s ease, opacity .25s ease, filter .25s ease;
      }
      .sun-path[data-below-horizon="true"] .sun-dot,
      .moon-position-visual[data-below-horizon="true"] .moon-dot {
        opacity: .38;
        filter: grayscale(.35);
      }
    `;
    document.head.appendChild(style);
  }

  function startTrueSkyPositions() {
    injectSkyPositionStyles();
    updateTrueSkyPositions();
    window.setInterval(updateTrueSkyPositions, 60000);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => window.setTimeout(startTrueSkyPositions, 0));
  } else {
    window.setTimeout(startTrueSkyPositions, 0);
  }
})();