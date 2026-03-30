/* =========================================================
   Senior Project Demo
   Temporary event-only rendering logic
========================================================= */

(function () {
  const demoData = window.seniorDemoData;

  if (!demoData) {
    console.warn("seniorDemoData is not available.");
    return;
  }

  /* =========================================================
     Vehicle Order / Styling
  ========================================================= */
  const vehicleOrder = ["zr26Base", "zr26Aero", "zr25Aero"];

  const seriesStyles = {
    zr26Base: {
      color: "#87b8ff",
      lineWidth: 2.2,
      dash: []
    },
    zr26Aero: {
      color: "#8fe0b2",
      lineWidth: 2.4,
      dash: []
    },
    zr25Aero: {
      color: "#b69cff",
      lineWidth: 2.0,
      dash: [6, 4]
    },
    "zr26Base-front": {
      color: "#87b8ff",
      lineWidth: 2.0,
      dash: []
    },
    "zr26Base-rear": {
      color: "#87b8ff",
      lineWidth: 1.8,
      dash: [6, 4]
    },
    "zr26Aero-front": {
      color: "#8fe0b2",
      lineWidth: 2.0,
      dash: []
    },
    "zr26Aero-rear": {
      color: "#8fe0b2",
      lineWidth: 1.8,
      dash: [6, 4]
    },
    "zr25Aero-front": {
      color: "#b69cff",
      lineWidth: 2.0,
      dash: []
    },
    "zr25Aero-rear": {
      color: "#b69cff",
      lineWidth: 1.8,
      dash: [6, 4]
    },
    "zr26Base-fit": {
      color: "#87b8ff",
      lineWidth: 1.8,
      dash: [3, 3]
    },
    "zr26Aero-fit": {
      color: "#8fe0b2",
      lineWidth: 1.8,
      dash: [3, 3]
    },
    "zr25Aero-fit": {
      color: "#b69cff",
      lineWidth: 1.8,
      dash: [3, 3]
    },
    ackermann: {
      color: "#eaf1ff",
      lineWidth: 1.4,
      dash: [8, 6]
    }
  };

  /* =========================================================
     Init
  ========================================================= */
  function initSeniorDemo() {
    populateMetricGroup("sd-longitudinal-metrics", demoData.longitudinal.metrics);
    populateMetricGroup("sd-longitudinal-secondary", demoData.longitudinal.secondary);

    populateMetricGroup("sd-lateral-metrics", demoData.lateral.metrics);
    populateMetricGroup("sd-lateral-secondary", demoData.lateral.secondary);

    initTabs();
    renderAllCharts();
  }

  /* =========================================================
     Metrics
  ========================================================= */
  function populateMetricGroup(containerId, metricData) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const cards = Array.from(container.children);

    metricData.forEach((metric, index) => {
      const card = cards[index];
      if (!card) return;

      const labelEl =
        card.querySelector(".sd-metric-label") ||
        card.querySelector(".sd-secondary-label");

      const valuesEl =
        card.querySelector(".sd-metric-values") ||
        card.querySelector(".sd-secondary-values");

      if (labelEl) {
        labelEl.textContent = metric.label;
      }

      if (valuesEl) {
        valuesEl.innerHTML = "";

        vehicleOrder.forEach((vehicleKey) => {
          const vehicle = demoData.vehicles[vehicleKey];
          const value = metric.values[vehicleKey] ?? "—";
          const row = document.createElement("span");
          row.textContent = `${vehicle.name} ${value} ${metric.unit}`;
          valuesEl.appendChild(row);
        });
      }
    });
  }

  /* =========================================================
     Tabs
  ========================================================= */
  function initTabs() {
    const tabs = document.querySelectorAll(".sd-tab");

    tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        const group = tab.dataset.sdGroup;
        const target = tab.dataset.sdTab;

        document
          .querySelectorAll(`.sd-tab[data-sd-group="${group}"]`)
          .forEach((btn) => btn.classList.remove("active"));

        tab.classList.add("active");

        document
          .querySelectorAll(`.sd-chart-grid[data-sd-panel="${group}"]`)
          .forEach((panel) => {
            panel.classList.remove("active", "is-visible");
          });

        const targetPanel = document.querySelector(
          `.sd-chart-grid[data-sd-panel="${group}"][data-sd-content="${target}"]`
        );

        if (!targetPanel) return;

        if (targetPanel.classList.contains("active-large")) {
          targetPanel.classList.add("is-visible");
        } else {
          targetPanel.classList.add("active");
        }
      });
    });

    // Ensure initial large panel visibility
    const activeLargePanels = document.querySelectorAll(
      '.sd-tab.active[data-sd-group="lateral"][data-sd-tab="handling"]'
    );

    activeLargePanels.forEach((tab) => {
      const panel = document.querySelector(
        '.sd-chart-grid[data-sd-panel="lateral"][data-sd-content="handling"]'
      );
      if (panel) {
        panel.classList.add("is-visible");
      }
    });
  }

  /* =========================================================
     Charts
  ========================================================= */
  function renderAllCharts() {
    // Longitudinal - Accel
    renderChartById("sd-long-accel-position", demoData.longitudinal.charts.accel.position);
    renderChartById("sd-long-accel-velocity", demoData.longitudinal.charts.accel.velocity);
    renderChartById("sd-long-accel-acceleration", demoData.longitudinal.charts.accel.acceleration);
    renderChartById("sd-long-accel-loads", demoData.longitudinal.charts.accel.loads);

    // Longitudinal - Brake
    renderChartById("sd-long-brake-position", demoData.longitudinal.charts.brake.position);
    renderChartById("sd-long-brake-velocity", demoData.longitudinal.charts.brake.velocity);
    renderChartById("sd-long-brake-acceleration", demoData.longitudinal.charts.brake.acceleration);
    renderChartById("sd-long-brake-loads", demoData.longitudinal.charts.brake.loads);

    // Lateral - Sweep
    renderChartById("sd-lat-steer", demoData.lateral.charts.sweep.steer);
    renderChartById("sd-lat-accel", demoData.lateral.charts.sweep.accel);
    renderChartById("sd-lat-sideslip", demoData.lateral.charts.sweep.sideslip);
    renderChartById("sd-lat-yaw", demoData.lateral.charts.sweep.yaw);
    renderChartById("sd-lat-loads", demoData.lateral.charts.sweep.loads);

    // Lateral - Handling
    renderChartById("sd-lat-handling", demoData.lateral.charts.handling.main);
  }

  function renderChartById(canvasId, chartData) {
    const canvas = document.getElementById(canvasId);
    if (!canvas || !chartData) return;

    setupCanvasForDisplay(canvas);

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    drawLineChart(ctx, canvas, chartData);
  }

  function setupCanvasForDisplay(canvas) {
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    const displayWidth = Math.max(Math.floor(rect.width * dpr), 300);
    const displayHeight = Math.max(Math.floor(rect.height * dpr), 180);

    if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
      canvas.width = displayWidth;
      canvas.height = displayHeight;
    }
  }

  function drawLineChart(ctx, canvas, chartData) {
    const w = canvas.width;
    const h = canvas.height;

    const padding = {
      top: 24,
      right: 18,
      bottom: 42,
      left: 52
    };

    const plotW = w - padding.left - padding.right;
    const plotH = h - padding.top - padding.bottom;

    const allValues = chartData.series.flatMap((series) => series.data);
    const minValue = Math.min(...allValues);
    const maxValue = Math.max(...allValues);

    const hasFlatRange = Math.abs(maxValue - minValue) < 1e-9;
    const rangePadding = hasFlatRange ? 1 : (maxValue - minValue) * 0.12;

    const yMin = minValue - rangePadding;
    const yMax = maxValue + rangePadding;

    const count = chartData.labels.length;
    const xStep = count > 1 ? plotW / (count - 1) : plotW;

    ctx.clearRect(0, 0, w, h);

    // Background
    ctx.fillStyle = "rgba(5, 9, 18, 0.72)";
    ctx.fillRect(0, 0, w, h);

    // Gridlines
    ctx.strokeStyle = "rgba(135, 184, 255, 0.10)";
    ctx.lineWidth = 1;

    const horizontalLines = 4;
    for (let i = 0; i <= horizontalLines; i += 1) {
      const y = padding.top + (plotH / horizontalLines) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(w - padding.right, y);
      ctx.stroke();
    }

    const verticalLines = Math.min(count - 1, 5);
    for (let i = 0; i <= verticalLines; i += 1) {
      const x = padding.left + (plotW / Math.max(verticalLines, 1)) * i;
      ctx.beginPath();
      ctx.moveTo(x, padding.top);
      ctx.lineTo(x, h - padding.bottom);
      ctx.stroke();
    }

    // Axes
    ctx.strokeStyle = "rgba(234, 241, 255, 0.22)";
    ctx.lineWidth = 1.2;

    ctx.beginPath();
    ctx.moveTo(padding.left, padding.top);
    ctx.lineTo(padding.left, h - padding.bottom);
    ctx.lineTo(w - padding.right, h - padding.bottom);
    ctx.stroke();

    // Y labels
    ctx.fillStyle = "rgba(168, 186, 219, 0.95)";
    ctx.font = `${Math.max(11, Math.floor(h * 0.045))}px Inter, Arial, sans-serif`;
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";

    for (let i = 0; i <= horizontalLines; i += 1) {
      const value = yMax - ((yMax - yMin) / horizontalLines) * i;
      const y = padding.top + (plotH / horizontalLines) * i;
      ctx.fillText(formatAxisValue(value), padding.left - 8, y);
    }

    // X labels
    ctx.textAlign = "center";
    ctx.textBaseline = "top";

    const xLabelStep = Math.ceil(count / 5);
    chartData.labels.forEach((label, index) => {
      if (index % xLabelStep !== 0 && index !== count - 1) return;
      const x = padding.left + xStep * index;
      ctx.fillText(label, x, h - padding.bottom + 8);
    });

    // Series
    chartData.series.forEach((series) => {
      const style = seriesStyles[series.key] || {
        color: "#eaf1ff",
        lineWidth: 2,
        dash: []
      };

      ctx.beginPath();
      ctx.strokeStyle = style.color;
      ctx.lineWidth = style.lineWidth;
      ctx.setLineDash(style.dash || []);

      series.data.forEach((value, index) => {
        const x = padding.left + xStep * index;
        const y = padding.top + ((yMax - value) / (yMax - yMin)) * plotH;

        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });

      ctx.stroke();
      ctx.setLineDash([]);

      // Point markers
      series.data.forEach((value, index) => {
        const x = padding.left + xStep * index;
        const y = padding.top + ((yMax - value) / (yMax - yMin)) * plotH;

        ctx.beginPath();
        ctx.fillStyle = style.color;
        ctx.arc(x, y, 2.2, 0, Math.PI * 2);
        ctx.fill();
      });
    });

    // Axis labels
    ctx.save();
    ctx.fillStyle = "rgba(168, 186, 219, 0.92)";
    ctx.font = `${Math.max(11, Math.floor(h * 0.046))}px Inter, Arial, sans-serif`;

    // X axis label
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    ctx.fillText(chartData.xLabel || "", padding.left + plotW / 2, h - 4);

    // Y axis label
    ctx.translate(14, padding.top + plotH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText(chartData.yLabel || "", 0, 0);
    ctx.restore();

    // Legend
    drawLegend(ctx, canvas, chartData.series);
  }

  function drawLegend(ctx, canvas, seriesList) {
    const filteredSeries = seriesList.slice(0, 7);
    const startX = 14;
    let x = startX;
    let y = 10;
    const maxWidth = canvas.width - 20;

    ctx.font = `${Math.max(10, Math.floor(canvas.height * 0.042))}px Inter, Arial, sans-serif`;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";

    filteredSeries.forEach((series) => {
      const style = seriesStyles[series.key] || {
        color: "#eaf1ff",
        dash: [],
        lineWidth: 2
      };

      const labelWidth = ctx.measureText(series.label).width;
      const itemWidth = 22 + labelWidth + 18;

      if (x + itemWidth > maxWidth) {
        x = startX;
        y += 16;
      }

      ctx.strokeStyle = style.color;
      ctx.lineWidth = style.lineWidth;
      ctx.setLineDash(style.dash || []);
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + 14, y);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = "rgba(234, 241, 255, 0.88)";
      ctx.fillText(series.label, x + 18, y);

      x += itemWidth;
    });
  }

  function formatAxisValue(value) {
    if (Math.abs(value) >= 1000) {
      return Math.round(value).toString();
    }

    if (Math.abs(value) >= 100) {
      return value.toFixed(0);
    }

    if (Math.abs(value) >= 10) {
      return value.toFixed(1);
    }

    return value.toFixed(2);
  }

  /* =========================================================
     Resize
  ========================================================= */
  let resizeTimer = null;

  window.addEventListener("resize", () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      renderAllCharts();
    }, 120);
  });

  /* =========================================================
     Start
  ========================================================= */
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initSeniorDemo);
  } else {
    initSeniorDemo();
  }
})();
