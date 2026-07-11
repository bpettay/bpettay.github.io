document.addEventListener("DOMContentLoaded", () => {
  // Keep converter output concise and consistent.
  configureConverterPrecision();

  // Initialize core features
  if (typeof initializeNavigation === "function") {
    initializeNavigation();
  }

  if (typeof initializeConverter === "function") {
    initializeConverter();
  }

  if (typeof initializePyroSimulator === "function") {
    initializePyroSimulator();
  }

  if (typeof initializePyroTeamSync === "function") {
    initializePyroTeamSync();
  }

  if (typeof initializePyroGateWorkflow === "function") {
    initializePyroGateWorkflow();
  }

  initializeScrollHeader();
  initializeCompactPyroStatusBar();

  // Optional fancy tilt effect (only on desktop with mouse)
  initializePanelTilt();
});

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

function initializeCompactPyroStatusBar() {
  if (document.getElementById("compactPyroStatusOverrides")) return;

  const style = document.createElement("style");
  style.id = "compactPyroStatusOverrides";
  style.textContent = `
    .pyro-sticky-status {
      top: 0.35rem !important;
      z-index: 26 !important;
      display: flex !important;
      align-items: center !important;
      gap: 0 !important;
      width: fit-content !important;
      max-width: min(calc(100% - 1rem), 980px) !important;
      margin-inline: auto !important;
      padding: 0.16rem 0.42rem !important;
      min-height: 24px !important;
      border-radius: 999px !important;
      border: 1px solid rgba(120, 255, 190, 0.12) !important;
      background: rgba(4, 7, 7, 0.78) !important;
      box-shadow: 0 6px 18px rgba(0, 0, 0, 0.28) !important;
      backdrop-filter: blur(12px) !important;
      overflow-x: auto !important;
      scrollbar-width: none !important;
    }

    .pyro-sticky-status::-webkit-scrollbar {
      display: none !important;
    }

    .sticky-status-tile {
      display: inline-flex !important;
      align-items: baseline !important;
      gap: 0.22rem !important;
      min-width: 0 !important;
      min-height: 0 !important;
      padding: 0 0.46rem !important;
      border: 0 !important;
      border-radius: 0 !important;
      background: transparent !important;
      box-shadow: none !important;
      white-space: nowrap !important;
    }

    .sticky-status-tile + .sticky-status-tile {
      border-left: 1px solid rgba(255, 255, 255, 0.12) !important;
    }

    .sticky-status-tile span {
      flex: 0 0 auto !important;
      color: rgba(169, 176, 183, 0.74) !important;
      font-size: 0.48rem !important;
      letter-spacing: 0.07em !important;
      line-height: 1 !important;
      text-transform: uppercase !important;
    }

    .sticky-status-tile strong {
      min-width: 0 !important;
      max-width: 12ch !important;
      color: rgba(243, 245, 247, 0.92) !important;
      font-size: 0.64rem !important;
      font-weight: 600 !important;
      line-height: 1 !important;
      white-space: nowrap !important;
      overflow: hidden !important;
      text-overflow: ellipsis !important;
    }

    .sticky-status-tile.primary {
      border-color: transparent !important;
      background: transparent !important;
    }

    .sticky-status-tile.primary strong {
      color: #c8ffd8 !important;
      max-width: 16ch !important;
    }

    .sticky-status-tile.hold strong {
      color: #ffd2cf !important;
    }

    .pyro-gate-tabs {
      top: 2.25rem !important;
    }

    @media (max-width: 720px) {
      .pyro-sticky-status {
        top: 0.2rem !important;
        max-width: calc(100% - 0.5rem) !important;
        margin-inline: 0.25rem !important;
        padding: 0.14rem 0.34rem !important;
      }

      .sticky-status-tile {
        padding: 0 0.38rem !important;
      }

      .sticky-status-tile span {
        font-size: 0.44rem !important;
      }

      .sticky-status-tile strong {
        font-size: 0.58rem !important;
        max-width: 10ch !important;
      }

      .sticky-status-tile.primary strong {
        max-width: 14ch !important;
      }

      .pyro-gate-tabs {
        top: 2.15rem !important;
        max-height: 34vh !important;
      }
    }
  `;

  document.head.appendChild(style);
}

function initializePanelTilt() {
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const finePointer = window.matchMedia("(pointer: fine)");

  if (prefersReducedMotion.matches || !finePointer.matches) {
    return;
  }

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

      if (!frameId) {
        frameId = requestAnimationFrame(render);
      }
    };

    panel.addEventListener("pointerenter", (e) => {
      panel.classList.add("is-pointer-active");
      updateTargets(e);
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