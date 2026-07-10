document.addEventListener("DOMContentLoaded", () => {
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
      top: 0.55rem !important;
      z-index: 26 !important;
      grid-template-columns: minmax(120px, 1.15fr) repeat(4, minmax(76px, 0.72fr)) !important;
      gap: 0.28rem !important;
      padding: 0.32rem !important;
      border-radius: 999px !important;
      background: rgba(5, 8, 8, 0.86) !important;
      box-shadow: 0 10px 26px rgba(0, 0, 0, 0.32) !important;
      backdrop-filter: blur(14px) !important;
    }

    .sticky-status-tile {
      display: flex !important;
      align-items: center !important;
      gap: 0.34rem !important;
      padding: 0.25rem 0.46rem !important;
      border-radius: 999px !important;
      border-color: rgba(255, 255, 255, 0.06) !important;
      background: rgba(255, 255, 255, 0.025) !important;
      min-height: 30px !important;
    }

    .sticky-status-tile span {
      flex: 0 0 auto !important;
      font-size: 0.52rem !important;
      letter-spacing: 0.07em !important;
      line-height: 1 !important;
    }

    .sticky-status-tile strong {
      min-width: 0 !important;
      font-size: 0.7rem !important;
      line-height: 1 !important;
      white-space: nowrap !important;
      overflow: hidden !important;
      text-overflow: ellipsis !important;
    }

    .sticky-status-tile.primary {
      border-color: rgba(120, 255, 190, 0.18) !important;
      background: rgba(20, 45, 32, 0.18) !important;
    }

    .pyro-gate-tabs {
      top: 3.35rem !important;
    }

    @media (max-width: 720px) {
      .pyro-sticky-status {
        top: 0.25rem !important;
        display: flex !important;
        overflow-x: auto !important;
        scrollbar-width: none !important;
      }

      .pyro-sticky-status::-webkit-scrollbar {
        display: none !important;
      }

      .sticky-status-tile {
        flex: 0 0 auto !important;
        min-width: 118px !important;
      }

      .pyro-gate-tabs {
        top: 3.35rem !important;
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
