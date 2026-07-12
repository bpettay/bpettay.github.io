(() => {
  const NEW_MOON = Date.UTC(2000, 0, 6, 18, 14);
  const LUNAR_CYCLE_DAYS = 29.530588853;
  const EARTH_ORBIT_DAYS = 365.2422;
  const SVG_NS = "http://www.w3.org/2000/svg";

  function dayFraction(date = new Date()) {
    const start = Date.UTC(date.getUTCFullYear(), 0, 1);
    return ((date.getTime() - start) / 86400000) / EARTH_ORBIT_DAYS;
  }

  function lunarFraction(date = new Date()) {
    const age = (((date.getTime() - NEW_MOON) / 86400000) % LUNAR_CYCLE_DAYS + LUNAR_CYCLE_DAYS) % LUNAR_CYCLE_DAYS;
    return { age, fraction: age / LUNAR_CYCLE_DAYS };
  }

  function ellipsePoint(fraction, cx, cy, rx, ry, phaseOffset = -Math.PI / 2) {
    const angle = fraction * Math.PI * 2 + phaseOffset;
    return {
      x: cx + rx * Math.cos(angle),
      y: cy + ry * Math.sin(angle),
    };
  }

  function circlePoint(fraction, cx, cy, radius, phaseOffset = -Math.PI / 2) {
    const angle = fraction * Math.PI * 2 + phaseOffset;
    return {
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle),
    };
  }

  function ensureSunCentricScene() {
    const svg = document.querySelector(".v2-orbit");
    if (!svg) return null;

    if (svg.dataset.sunCentricBuilt === "true") {
      return {
        svg,
        earthGroup: document.getElementById("v2EarthSystem"),
        moonMarker: document.getElementById("v2MoonMarker"),
      };
    }

    svg.dataset.sunCentricBuilt = "true";
    svg.setAttribute("aria-label", "Live sun-centric view with Earth orbiting the Sun and Moon orbiting Earth");
    svg.innerHTML = `
      <defs>
        <radialGradient id="v2SunFill" cx="36%" cy="32%" r="70%">
          <stop offset="0" stop-color="#fff6b0" />
          <stop offset="0.35" stop-color="#ffd34d" />
          <stop offset="1" stop-color="#f39a18" />
        </radialGradient>
        <radialGradient id="v2EarthFill" cx="35%" cy="30%" r="75%">
          <stop offset="0" stop-color="#8bd3ff" />
          <stop offset="0.5" stop-color="#347fba" />
          <stop offset="1" stop-color="#102d47" />
        </radialGradient>
        <radialGradient id="v2MoonFill" cx="35%" cy="30%" r="75%">
          <stop offset="0" stop-color="#f3f4f6" />
          <stop offset="0.55" stop-color="#b8bec6" />
          <stop offset="1" stop-color="#5c636b" />
        </radialGradient>
        <filter id="v2SunGlow" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="10" result="blur" />
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      <text x="450" y="34" text-anchor="middle" class="v2-sun-centric-title">Sun-Centric View</text>
      <ellipse cx="450" cy="225" rx="350" ry="145" class="v2-earth-orbit" />
      <line x1="100" y1="225" x2="800" y2="225" class="v2-axis" />
      <line x1="450" y1="80" x2="450" y2="370" class="v2-axis" />

      <g id="v2SunCenter">
        <circle cx="450" cy="225" r="37" class="v2-sun-halo" />
        <circle cx="450" cy="225" r="27" fill="url(#v2SunFill)" class="v2-sun-center" filter="url(#v2SunGlow)" />
      </g>

      <g id="v2EarthSystem">
        <circle id="v2MoonOrbit" cx="0" cy="0" r="48" class="v2-moon-orbit" />
        <circle cx="0" cy="0" r="23" fill="url(#v2EarthFill)" class="v2-earth-body" />
        <text x="0" y="4" text-anchor="middle" class="v2-earth-label">Earth</text>
        <g id="v2MoonMarker">
          <circle r="10" fill="url(#v2MoonFill)" class="v2-moon-body" />
        </g>
      </g>

      <text x="450" y="410" text-anchor="middle" class="v2-orbit-caption">Earth completes one orbit per year · Moon completes one orbit every 29.5 days</text>
    `;

    return {
      svg,
      earthGroup: document.getElementById("v2EarthSystem"),
      moonMarker: document.getElementById("v2MoonMarker"),
    };
  }

  function addOrbitTicks(svg) {
    if (!svg || svg.querySelector(".orbit-tick-layer")) return;
    const layer = document.createElementNS(SVG_NS, "g");
    layer.classList.add("orbit-tick-layer");

    for (let index = 0; index < 36; index += 1) {
      const angle = (index / 36) * Math.PI * 2;
      const major = index % 9 === 0;
      const line = document.createElementNS(SVG_NS, "line");
      line.setAttribute("x1", String(450 + (major ? 330 : 338) * Math.cos(angle)));
      line.setAttribute("y1", String(225 + (major ? 136 : 140) * Math.sin(angle)));
      line.setAttribute("x2", String(450 + 350 * Math.cos(angle)));
      line.setAttribute("y2", String(225 + 145 * Math.sin(angle)));
      line.classList.add("orbit-tick");
      if (major) line.classList.add("major");
      layer.appendChild(line);
    }

    const orbit = svg.querySelector(".v2-earth-orbit");
    orbit?.after(layer);
  }

  function updateSunCentricScene() {
    const scene = ensureSunCentricScene();
    if (!scene?.earthGroup || !scene.moonMarker) return;

    const now = new Date();
    const earth = ellipsePoint(dayFraction(now), 450, 225, 350, 145);
    const moon = lunarFraction(now);
    const moonPoint = circlePoint(moon.fraction, 0, 0, 48);

    scene.earthGroup.setAttribute("transform", `translate(${earth.x.toFixed(2)} ${earth.y.toFixed(2)})`);
    scene.moonMarker.setAttribute("transform", `translate(${moonPoint.x.toFixed(2)} ${moonPoint.y.toFixed(2)})`);
  }

  function injectStyles() {
    document.getElementById("dashboardPolishStyles")?.remove();
    const style = document.createElement("style");
    style.id = "dashboardPolishStyles";
    style.textContent = `
      #home { max-width: 1540px !important; margin: 0 auto !important; padding: 12px !important; }
      .v2-dashboard { grid-template-columns: minmax(250px,290px) minmax(0,1fr) !important; gap:12px !important; align-items:start !important; }
      .v2-card { border-radius:20px !important; border-color:rgba(115,170,225,.23) !important; background:linear-gradient(145deg,rgba(10,22,34,.97),rgba(5,13,22,.99)) !important; box-shadow:inset 0 1px 0 rgba(255,255,255,.035),0 18px 42px rgba(0,0,0,.26) !important; }
      .v2-time-panel,.v2-weather-panel,.v2-calculator-panel,.v2-shortcuts-panel { padding:22px !important; }
      .v2-weather-strip { grid-template-columns:minmax(145px,1.45fr) repeat(6,minmax(82px,1fr)) minmax(130px,1.15fr) !important; gap:0 !important; border-top:1px solid rgba(255,255,255,.12); border-bottom:1px solid rgba(255,255,255,.12); }
      .v2-current,.v2-stat,.v2-go { border:0 !important; border-right:1px solid rgba(255,255,255,.11) !important; border-radius:0 !important; padding:17px 13px !important; }
      .v2-go { border-right:0 !important; }
      .v2-orbit { width:100%; max-height:430px; overflow:visible; }
      .v2-earth-orbit { fill:none; stroke:#f6c945; stroke-width:2.5; opacity:.9; }
      .v2-axis { stroke:rgba(255,255,255,.10); stroke-width:1; stroke-dasharray:6 8; }
      .v2-moon-orbit { fill:none; stroke:rgba(220,230,242,.38); stroke-width:1.4; stroke-dasharray:5 5; }
      .v2-sun-halo { fill:rgba(255,190,50,.12); }
      .v2-sun-center { stroke:rgba(255,240,170,.8); stroke-width:1.2; }
      .v2-earth-body { stroke:rgba(170,220,255,.55); stroke-width:1.2; }
      .v2-moon-body { stroke:rgba(255,255,255,.55); stroke-width:.8; }
      .v2-sun-centric-title { fill:#f4f7fb; font-size:24px; font-weight:700; }
      .v2-orbit-caption { fill:rgba(220,228,238,.72); font-size:13px; }
      .v2-earth-label { fill:#f7fbff; font-size:10px; font-weight:700; pointer-events:none; }
      .orbit-tick { stroke:rgba(255,255,255,.18); stroke-width:1; }
      .orbit-tick.major { stroke:rgba(255,255,255,.42); stroke-width:2; }
      #v2EarthSystem,#v2MoonMarker { transition:transform .7s ease; }
      .v2-sky-footer { margin-top:2px !important; }
      .v2-calculator-panel { grid-column:1 !important; }
      .v2-shortcuts-panel { grid-column:2 !important; }
      .v2-shortcut-grid { grid-template-columns:repeat(4,minmax(0,1fr)) !important; }
      @media(max-width:1180px){
        .v2-weather-strip{grid-template-columns:repeat(4,minmax(105px,1fr)) !important;gap:10px !important;border:0 !important;}
        .v2-current,.v2-stat,.v2-go{border:1px solid rgba(255,255,255,.09) !important;border-radius:12px !important;}
        .v2-current,.v2-go{grid-column:span 2;}
      }
      @media(max-width:900px){
        .v2-dashboard{grid-template-columns:1fr !important;}
        .v2-time-panel,.v2-weather-panel,.v2-calculator-panel,.v2-shortcuts-panel{grid-column:1 !important;}
        .v2-time-panel{display:grid;grid-template-columns:1fr 1fr;column-gap:24px;}
        .v2-location,.v2-clock-row,.v2-date{grid-column:1;}
        .v2-today-list,.v2-daylight{grid-column:2;}
      }
      @media(max-width:680px){
        #home{padding:8px !important;}
        .v2-card{border-radius:16px !important;}
        .v2-time-panel,.v2-weather-panel,.v2-calculator-panel,.v2-shortcuts-panel{padding:18px !important;}
        .v2-time-panel{display:block;}
        .v2-weather-strip{grid-template-columns:repeat(2,minmax(0,1fr)) !important;}
        .v2-current,.v2-go{grid-column:1/-1;}
        .v2-shortcut-grid{grid-template-columns:repeat(2,minmax(0,1fr)) !important;}
        .v2-sun-centric-title{font-size:18px;}
        .v2-orbit-caption{font-size:11px;}
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
    const scene = ensureSunCentricScene();
    addOrbitTicks(scene?.svg);
    updateSunCentricScene();
    setInterval(updateSunCentricScene, 60000);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => setTimeout(start, 0));
  } else {
    setTimeout(start, 0);
  }
})();