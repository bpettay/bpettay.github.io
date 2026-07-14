(() => {
  const NEW_MOON = Date.UTC(2000, 0, 6, 18, 14);
  const LUNAR_CYCLE = 29.530588853;
  const MID_X = 450;

  let applying = false;

  function markerX(id) {
    const transform = document.getElementById(id)?.getAttribute("transform") || "";
    const match = transform.match(/translate\(\s*([-\d.]+)/);
    return match ? Number(match[1]) : NaN;
  }

  function lunarContext() {
    const age = ((((Date.now() - NEW_MOON) / 86400000) % LUNAR_CYCLE) + LUNAR_CYCLE) % LUNAR_CYCLE;
    const fraction = age / LUNAR_CYCLE;
    const illumination = Math.round(((1 - Math.cos(2 * Math.PI * fraction)) / 2) * 100);
    const waxing = fraction < 0.5;

    if (illumination <= 12) return `Near new moon · ${illumination}% lit · follows the Sun across the sky`;
    if (illumination >= 88) return `Near full moon · ${illumination}% lit · rises near sunset`;
    if (waxing) return `Waxing · ${illumination}% lit · generally trails the Sun`;
    return `Waning · ${illumination}% lit · generally leads the Sun`;
  }

  function directionText(markerId, statusText, bodyName) {
    if (/below horizon/i.test(statusText)) return `${bodyName} below horizon`;
    const x = markerX(markerId);
    if (!Number.isFinite(x)) return `${bodyName} position updating`;
    if (Math.abs(x - MID_X) < 28) return `${bodyName} near its highest point`;
    return x < MID_X ? `${bodyName} rising` : `${bodyName} setting`;
  }

  function applyContext() {
    if (applying) return;
    const sunStatus = document.getElementById("v2SunStatus");
    const moonStatus = document.getElementById("v2MoonStatus");
    if (!sunStatus || !moonStatus) return;

    applying = true;
    try {
      const rawSun = sunStatus.dataset.rawStatus || sunStatus.textContent;
      const rawMoon = moonStatus.dataset.rawStatus || moonStatus.textContent;

      if (!sunStatus.textContent.includes(" · ") || !sunStatus.textContent.includes("Sun ")) {
        sunStatus.dataset.rawStatus = sunStatus.textContent;
      } else if (!sunStatus.textContent.includes("rising") && !sunStatus.textContent.includes("setting") && !sunStatus.textContent.includes("highest point")) {
        sunStatus.dataset.rawStatus = sunStatus.textContent;
      }

      if (!moonStatus.textContent.includes("Near new moon") && !moonStatus.textContent.includes("Near full moon") && !moonStatus.textContent.includes("Waxing") && !moonStatus.textContent.includes("Waning")) {
        moonStatus.dataset.rawStatus = moonStatus.textContent;
      }

      const sunBase = sunStatus.dataset.rawStatus || rawSun;
      const moonBase = moonStatus.dataset.rawStatus || rawMoon;
      sunStatus.textContent = `${directionText("v2SunLiveMarker", sunBase, "Sun")} · ${sunBase.replace(/^Sun (?:up now|below horizon)\s*·?\s*/i, "")}`;
      moonStatus.textContent = `${directionText("v2MoonLiveMarker", moonBase, "Moon")} · ${lunarContext()} · ${moonBase.replace(/^Moon (?:up now|below horizon)\s*·?\s*/i, "")}`;
    } finally {
      applying = false;
    }
  }

  function begin() {
    const svg = document.querySelector(".v2-orbit");
    if (!svg) {
      window.setTimeout(begin, 100);
      return;
    }

    applyContext();
    const observer = new MutationObserver(() => window.requestAnimationFrame(applyContext));
    observer.observe(svg, { subtree: true, characterData: true, childList: true, attributes: true, attributeFilter: ["transform"] });
    window.setInterval(applyContext, 30000);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => window.setTimeout(begin, 200));
  else window.setTimeout(begin, 200);
})();
