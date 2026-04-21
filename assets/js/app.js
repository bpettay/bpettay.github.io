document.addEventListener("DOMContentLoaded", () => {
  if (typeof initializeNavigation === "function") {
    initializeNavigation();
  }

  if (
    typeof initializeConverter === "function" &&
    document.getElementById("category") &&
    document.getElementById("fromUnit") &&
    document.getElementById("toUnit")
  ) {
    initializeConverter();
  }

  initializePanelTilt();
});

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

      const settled =
        Math.abs(targetTiltX - currentTiltX) < 0.01 &&
        Math.abs(targetTiltY - currentTiltY) < 0.01 &&
        Math.abs(targetLiftZ - currentLiftZ) < 0.01;

      if (settled) {
        frameId = 0;
        return;
      }

      frameId = window.requestAnimationFrame(render);
    };

    const scheduleRender = () => {
      if (!frameId) {
        frameId = window.requestAnimationFrame(render);
      }
    };

    const updateTargets = (event) => {
      const rect = panel.getBoundingClientRect();
      const px = (event.clientX - rect.left) / rect.width;
      const py = (event.clientY - rect.top) / rect.height;
      const clampedX = Math.min(1, Math.max(0, px));
      const clampedY = Math.min(1, Math.max(0, py));
      const centeredX = (clampedX - 0.5) * 2;
      const centeredY = (clampedY - 0.5) * 2;
      const distance = Math.min(1, Math.hypot(centeredX, centeredY));

      targetTiltY = centeredX * 1.05;
      targetTiltX = centeredY * -1.05;
      targetLiftZ = 1.6 - distance * 0.55;

      scheduleRender();
    };

    panel.addEventListener("pointerenter", (event) => {
      panel.classList.add("is-pointer-active");
      updateTargets(event);
    });

    panel.addEventListener("pointermove", updateTargets);

    panel.addEventListener("pointerleave", () => {
      panel.classList.remove("is-pointer-active");
      targetTiltX = 0;
      targetTiltY = 0;
      targetLiftZ = 0;
      scheduleRender();
    });
  });
}
