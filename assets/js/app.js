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

  initializeGlassTracking();
});

function initializeGlassTracking() {
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const finePointer = window.matchMedia("(pointer: fine)");

  if (prefersReducedMotion.matches || !finePointer.matches) {
    return;
  }

  const panels = document.querySelectorAll(
    ".surface, .preview-panel, .result-panel, .related-panel, .related-item"
  );

  panels.forEach((panel) => {
    panel.classList.add("glass-track");

    let frameId = 0;
    let activeEvent = null;

    const applyPointerState = () => {
      frameId = 0;

      if (!activeEvent) {
        return;
      }

      const rect = panel.getBoundingClientRect();
      const px = (activeEvent.clientX - rect.left) / rect.width;
      const py = (activeEvent.clientY - rect.top) / rect.height;
      const clampedX = Math.min(1, Math.max(0, px));
      const clampedY = Math.min(1, Math.max(0, py));
      const centeredX = (clampedX - 0.5) * 2;
      const centeredY = (clampedY - 0.5) * 2;
      const rotateY = centeredX * 4;
      const rotateX = centeredY * -4;
      const depth = 6 - Math.min(1, Math.hypot(centeredX, centeredY)) * 2;

      panel.style.setProperty("--pointer-x", `${(clampedX * 100).toFixed(2)}%`);
      panel.style.setProperty("--pointer-y", `${(clampedY * 100).toFixed(2)}%`);
      panel.style.setProperty("--tilt-x", `${rotateX.toFixed(2)}deg`);
      panel.style.setProperty("--tilt-y", `${rotateY.toFixed(2)}deg`);
      panel.style.setProperty("--lift-z", `${depth.toFixed(2)}px`);
    };

    const scheduleUpdate = (event) => {
      activeEvent = event;

      if (!frameId) {
        frameId = window.requestAnimationFrame(applyPointerState);
      }
    };

    panel.addEventListener("pointerenter", (event) => {
      panel.classList.add("is-pointer-active");
      panel.style.setProperty("--glow-opacity", "1");
      scheduleUpdate(event);
    });

    panel.addEventListener("pointermove", scheduleUpdate);

    panel.addEventListener("pointerleave", () => {
      activeEvent = null;
      panel.classList.remove("is-pointer-active");
      panel.style.setProperty("--glow-opacity", "0");
      panel.style.setProperty("--pointer-x", "50%");
      panel.style.setProperty("--pointer-y", "50%");
      panel.style.setProperty("--tilt-x", "0deg");
      panel.style.setProperty("--tilt-y", "0deg");
      panel.style.setProperty("--lift-z", "0px");
    });
  });
}
