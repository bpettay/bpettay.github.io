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

    const updatePointerPosition = (event) => {
      const rect = panel.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 100;
      const y = ((event.clientY - rect.top) / rect.height) * 100;
      const clampedX = Math.min(100, Math.max(0, x));
      const clampedY = Math.min(100, Math.max(0, y));

      panel.style.setProperty("--pointer-x", `${clampedX.toFixed(2)}%`);
      panel.style.setProperty("--pointer-y", `${clampedY.toFixed(2)}%`);
    };

    panel.addEventListener("pointerenter", (event) => {
      panel.classList.add("is-pointer-active");
      updatePointerPosition(event);
      panel.style.setProperty("--glow-opacity", "1");
    });

    panel.addEventListener("pointermove", updatePointerPosition);

    panel.addEventListener("pointerleave", () => {
      panel.classList.remove("is-pointer-active");
      panel.style.setProperty("--glow-opacity", "0");
      panel.style.setProperty("--pointer-x", "50%");
      panel.style.setProperty("--pointer-y", "50%");
    });
  });
}
