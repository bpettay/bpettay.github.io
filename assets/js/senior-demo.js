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

  const vehicleOrder = ["zr26Base", "zr26Aero", "zr25Aero"];

  const seriesStyles = {
    zr26Base: { color: "#87b8ff", lineWidth: 2.4, dash: [] },
    zr26Aero: { color: "#8fe0b2", lineWidth: 2.6, dash: [] },
    zr25Aero: { color: "#b69cff", lineWidth: 2.2, dash: [6, 4] },

    "zr26Base-front": { color: "#87b8ff", lineWidth: 2.2, dash: [] },
    "zr26Base-rear": { color: "#87b8ff", lineWidth: 1.9, dash: [6, 4] },
    "zr26Aero-front": { color: "#8fe0b2", lineWidth: 2.2, dash: [] },
    "zr26Aero-rear": { color: "#8fe0b2", lineWidth: 1.9, dash: [6, 4] },
    "zr25Aero-front": { color: "#b69cff", lineWidth: 2.2, dash: [] },
    "zr25Aero-rear": { color: "#b69cff", lineWidth: 1.9, dash: [6, 4] },

    "zr26Base-fit": { color: "#87b8ff", lineWidth: 1.8, dash: [3, 3] },
    "zr26Aero-fit": { color: "#8fe0b2", lineWidth: 1.8, dash: [3, 3] },
    "zr25Aero-fit": { color: "#b69cff", lineWidth: 1.8, dash: [3, 3] },

    ackermann: { color: "#eaf1ff", lineWidth: 1.4, dash: [8, 6] }
  };

  const chartState = {
    longitudinal: {
      activeView: "accel",
      accel: "position",
      brake: "position"
    },
    lateral: {
      activeView: "sweep",
      sweep: "steer",
      handling: "main"
    }
  };

  const playbackState = {
    long: {
      isPlaying: false,
      progress: 0,
      frameId: null,
      durationMs: 6500,
      startTime: 0
    },
    lat: {
      isPlaying: false,
      progress: 0,
      frameId: null,
      durationMs: 7000,
      startTime: 0
    }
  };

  function initSeniorDemo() {
    populateTable("sd-longitudinal-metrics", demoData.longitudinal.metrics);
    populateTable("sd-longitudinal-secondary", demoData.longitudinal.secondary);
    populateTable("sd-lateral-metrics", demoData.lateral.metrics);
    populateTable("sd-lateral-secondary", demoData.lateral.secondary);

    initMainTabs();
    initSubTabs();
    initPlaybackControls();

    resetLongitudinalPlayback();
    resetLateralPlayback();
    renderVisibleCharts();
  }

  function populateTable(tableId, rows) {
    const table = document.getElementById(tableId);
    if (!table) return;

    const tbody = table.querySelector("tbody");
    if (!tbody) return;

    tbody.innerHTML = "";

    rows.forEach((rowData) => {
      const tr = document.createElement("tr");

      const metricCell = document.createElement("td");
      metricCell.textContent = rowData.label;
      tr.appendChild(metricCell);

      vehicleOrder.forEach((vehicleKey) => {
        const td = document.createElement("td");
        const value = rowData.values[vehicleKey] ?? "—";
        td.textContent = `${value} ${rowData.unit}`;
        tr.appendChild(td);
      });

      tbody.appendChild(tr);
    });
  }

  function initMainTabs() {
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
          .querySelectorAll(`.sd-chart-view[data-sd-panel="${group}"]`)
          .forEach((view) => view.classList.remove("active"));

        const targetView = document.querySelector(
          `.sd-chart-view[data-sd-panel="${group}"][data-sd-content="${target}"]`
        );

        if (targetView) targetView.classList.add("active");

        if (group === "longitudinal") {
          chartState.longitudinal.activeView = target;
          stopLongitudinalPlayback();
          resetLongitudinalPlayback();
        } else if (group === "lateral") {
          chartState.lateral.activeView = target;
          stopLateralPlayback();
          resetLateralPlayback();
        }

        renderVisibleCharts();
      });
    });
  }

  function initSubTabs() {
    const subtabs = document.querySelectorAll(".sd-subtab");

    subtabs.forEach((subtab) => {
      subtab.addEventListener("click", () => {
        const subgroup = subtab.dataset.sdSubgroup;
        const target = subtab.dataset.sdSubtab;

        document
          .querySelectorAll(`.sd-subtab[data-sd-subgroup="${subgroup}"]`)
          .forEach((btn) => btn.classList.remove("active"));

        subtab.classList.add("active");

        if (subgroup === "longitudinal-accel") {
          chartState.longitudinal.accel = target;
          stopLongitudinalPlayback();
          resetLongitudinalPlayback();
        } else if (subgroup === "longitudinal-brake") {
          chartState.longitudinal.brake = target;
          stopLongitudinalPlayback();
          resetLongitudinalPlayback();
        } else if (subgroup === "lateral-sweep") {
          chartState.lateral.sweep = target;
          stopLateralPlayback();
          resetLateralPlayback();
        }

        renderVisibleCharts();
      });
    });
  }

  function initPlaybackControls() {
    const longPlay = document.getElementById("sd-long-play");
    const longReset = document.getElementById("sd-long-reset");
    const latPlay = document.getElementById("sd-lat-play");
    const latReset = document.getElementById("sd-lat-reset");

    if (longPlay) {
      longPlay.addEventListener("click", () => {
        if (playbackState.long.isPlaying) return;
        startLongitudinalPlayback();
      });
    }

    if (longReset) {
      longReset.addEventListener("click", () => {
        stopLongitudinalPlayback();
        resetLongitudinalPlayback();
        renderVisibleCharts();
      });
    }

    if (latPlay) {
      latPlay.addEventListener("click", () => {
        if (playbackState.lat.isPlaying) return;
        startLateralPlayback();
      });
    }

    if (latReset) {
      latReset.addEventListener("click", () => {
        stopLateralPlayback();
        resetLateralPlayback();
        renderVisibleCharts();
      });
    }
  }

  function startLongitudinalPlayback() {
    const state = playbackState.long;
    state.isPlaying = true;
    state.startTime = performance.now() - state.progress * state.durationMs;
    setStatus("sd-long-status", "Playing");
    tickLongitudinal();
  }

  function tickLongitudinal() {
    const state = playbackState.long;
    if (!state.isPlaying) return;

    const now = performance.now();
    state.progress = Math.min((now - state.startTime) / state.durationMs, 1);

    updateLongitudinalAnimation();
    renderActiveLongitudinalChartOnly();

    if (state.progress >= 1) {
      state.isPlaying = false;
      state.frameId = null;
      setStatus("sd-long-status", "Complete");
      return;
    }

    state.frameId = requestAnimationFrame(tickLongitudinal);
  }

  function stopLongitudinalPlayback() {
    const state = playbackState.long;
    state.isPlaying = false;
    if (state.frameId) cancelAnimationFrame(state.frameId);
    state.frameId = null;
  }

  function resetLongitudinalPlayback() {
    playbackState.long.progress = 0;
    updateLongitudinalAnimation();
    setStatus("sd-long-status", "Ready");
  }

  function startLateralPlayback() {
    const state = playbackState.lat;
    state.isPlaying = true;
    state.startTime = performance.now() - state.progress * state.durationMs;
    setStatus("sd-lat-status", "Playing");
    tickLateral();
  }

  function tickLateral() {
    const state = playbackState.lat;
    if (!state.isPlaying) return;

    const now = performance.now();
    state.progress = Math.min((now - state.startTime) / state.durationMs, 1);

    updateLateralAnimation();
    renderActiveLateralChartOnly();

    if (state.progress >= 1) {
      state.isPlaying = false;
      state.frameId = null;
      setStatus("sd-lat-status", "Complete");
      return;
    }

    state.frameId = requestAnimationFrame(tickLateral);
  }

  function stopLateralPlayback() {
    const state = playbackState.lat;
    state.isPlaying = false;
    if (state.frameId) cancelAnimationFrame(state.frameId);
    state.frameId = null;
  }

  function resetLateralPlayback() {
    playbackState.lat.progress = 0;
    updateLateralAnimation();
    setStatus("sd-lat-status", "Ready");
  }

  function setStatus(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  function buildDenseSeries(series, samples = 320) {
    if (!series || series.length === 0) return [];
    if (series.length === 1) return new Array(samples).fill(series[0]);

    const dense = [];
    const maxIndex = series.length - 1;

    for (let i = 0; i < samples; i += 1) {
      const t = (i / (samples - 1)) * maxIndex;
      const low = Math.floor(t);
      const high = Math.min(maxIndex, Math.ceil(t));
      const frac = t - low;

      const lowVal = Number(series[low]) || 0;
      const highVal = Number(series[high]) || lowVal;

      dense.push(lowVal + (highVal - lowVal) * frac);
    }

    return dense;
  }

  function interpolateDenseSeries(series, progress) {
    if (!series || series.length === 0) return 0;
    if (series.length === 1) return series[0];

    const maxIndex = series.length - 1;
    const rawIndex = Math.max(0, Math.min(1, progress)) * maxIndex;
    const low = Math.floor(rawIndex);
    const high = Math.min(maxIndex, Math.ceil(rawIndex));
    const frac = rawIndex - low;

    const lowVal = Number(series[low]) || 0;
    const highVal = Number(series[high]) || lowVal;

    return lowVal + (highVal - lowVal) * frac;
  }

  function updateLongitudinalAnimation() {
    const progress = playbackState.long.progress;
    const car = document.getElementById("sd-long-car");
    const readout = document.getElementById("sd-long-readout");
    const track = document.querySelector("#sd-long-stage .sd-track");
    if (!car || !readout || !track) return;

    const activeChart = getCurrentLongitudinalChart();
    if (!activeChart) return;

    const trackRect = track.getBoundingClientRect();
    const usableWidth = Math.max(trackRect.width - 90, 0);

    const time = interpolateLabelValue(activeChart.labels, progress);
    const value = interpolateSeriesValue(activeChart.series[0]?.data || [], progress);

    let motionSeries = [];

    if (chartState.longitudinal.activeView === "accel") {
      motionSeries = demoData.longitudinal.charts.accel.position.series[0]?.data || [];
    } else {
      motionSeries = demoData.longitudinal.charts.brake.position.series[0]?.data || [];
    }

    const denseMotionSeries = buildDenseSeries(motionSeries, 400);
    const motionValue = interpolateDenseSeries(denseMotionSeries, progress);

    const motionMin = Math.min(...denseMotionSeries);
    const motionMax = Math.max(...denseMotionSeries);
    const motionRange = Math.max(motionMax - motionMin, 1e-6);

    const normalized = Math.max(0, Math.min(1, (motionValue - motionMin) / motionRange));
    const xPx = usableWidth * normalized;

    car.style.transform = `translate3d(${xPx}px, -50%, 0)`;

    readout.innerHTML = `
      <span>Time: ${formatPlaybackValue(time)} s</span>
      <span>${activeChart.yLabel}: ${formatPlaybackValue(value)}</span>
    `;
  }

  function updateLateralAnimation() {
    const progress = playbackState.lat.progress;
    const car = document.getElementById("sd-lat-car");
    const readout = document.getElementById("sd-lat-readout");
    const wrap = document.querySelector("#sd-lat-stage .sd-corner-wrap");
    if (!car || !readout || !wrap) return;

    const activeChart = getCurrentLateralChart();
    if (!activeChart) return;

    const wrapRect = wrap.getBoundingClientRect();
    const width = wrapRect.width;
    const height = wrapRect.height;

    const cx = width * 0.38;
    const cy = height * 0.78;
    const rx = width * 0.42;
    const ry = height * 0.54;

    const startAngle = Math.PI * 1.02;
    const endAngle = Math.PI * 1.88;
    const angle = startAngle + (endAngle - startAngle) * progress;

    const x = cx + Math.cos(angle) * rx;
    const y = cy + Math.sin(angle) * ry;

    const dx = -Math.sin(angle) * rx;
    const dy = Math.cos(angle) * ry;
    const rotation = Math.atan2(dy, dx);

    car.style.left = `${x}px`;
    car.style.top = `${y}px`;
    car.style.transform = `translate3d(-50%, -50%, 0) rotate(${rotation}rad)`;

    const time = interpolateLabelValue(activeChart.labels, progress);
    const value = interpolateSeriesValue(activeChart.series[0]?.data || [], progress);

    readout.innerHTML = `
      <span>Time: ${formatPlaybackValue(time)} s</span>
      <span>${activeChart.yLabel}: ${formatPlaybackValue(value)}</span>
    `;
  }

  function renderVisibleCharts() {
    renderLongitudinalAccelChart();
    renderLongitudinalBrakeChart();
    renderLateralSweepChart();
    renderLateralHandlingChart();
  }

  function renderActiveLongitudinalChartOnly() {
    if (chartState.longitudinal.activeView === "accel") {
      renderLongitudinalAccelChart();
    } else {
      renderLongitudinalBrakeChart();
    }
  }

  function renderActiveLateralChartOnly() {
    if (chartState.lateral.activeView === "sweep") {
      renderLateralSweepChart();
    } else {
      renderLateralHandlingChart();
    }
  }

  function renderLongitudinalAccelChart() {
    const titleEl = document.getElementById("sd-longitudinal-chart-title");
    const canvasId = "sd-longitudinal-main-chart";
    const key = chartState.longitudinal.accel;
    const chartData = demoData.longitudinal.charts.accel[key];

    if (titleEl && chartData) titleEl.textContent = chartData.title;
    renderChartById(
      canvasId,
      chartData,
      chartState.longitudinal.activeView === "accel" ? playbackState.long.progress : 1
    );
  }

  function renderLongitudinalBrakeChart() {
    const titleEl = document.getElementById("sd-longitudinal-brake-chart-title");
    const canvasId = "sd-longitudinal-brake-main-chart";
    const key = chartState.longitudinal.brake;
    const chartData = demoData.longitudinal.charts.brake[key];

    if (titleEl && chartData) titleEl.textContent = chartData.title;
    renderChartById(
      canvasId,
      chartData,
      chartState.longitudinal.activeView === "brake" ? playbackState.long.progress : 1
    );
  }

  function renderLateralSweepChart() {
    const titleEl = document.getElementById("sd-lateral-chart-title");
    const canvasId = "sd-lateral-main-chart";
    const key = chartState.lateral.sweep;
    const chartData = demoData.lateral.charts.sweep[key];

    if (titleEl && chartData) titleEl.textContent = chartData.title;
    renderChartById(
      canvasId,
      chartData,
      chartState.lateral.activeView === "sweep" ? playbackState.lat.progress : 1
    );
  }

  function renderLateralHandlingChart() {
    const titleEl = document.getElementById("sd-lateral-handling-chart-title");
    const canvasId = "sd-lateral-handling-chart";
    const chartData = demoData.lateral.charts.handling.main;

    if (titleEl && chartData) titleEl.textContent = chartData.title;
    renderChartById(
      canvasId,
      chartData,
      chartState.lateral.activeView === "handling" ? playbackState.lat.progress : 1
    );
  }

  function getCurrentLongitudinalChart() {
    const view = chartState.longitudinal.activeView;
    const key = chartState.longitudinal[view];
    return demoData.longitudinal.charts[view]?.[key];
  }

  function getCurrentLateralChart() {
    const view = chartState.lateral.activeView;
    if (view === "handling") return demoData.lateral.charts.handling.main;
    const key = chartState.lateral.sweep;
    return demoData.lateral.charts.sweep[key];
  }

  function renderChartById(canvasId, chartData, progress = 1) {
    const canvas = document.getElementById(canvasId);
    if (!canvas || !chartData) return;

    setupCanvasForDisplay(canvas);

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    drawLineChart(ctx, canvas, chartData, progress);
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

  function drawLineChart(ctx, canvas, chartData, progress = 1) {
    const w = canvas.width;
    const h = canvas.height;

    const padding = {
      top: 48,
      right: 18,
      bottom: 46,
      left: 58
    };

    const plotW = w - padding.left - padding.right;
    const plotH = h - padding.top - padding.bottom;

    const allValues = chartData.series.flatMap((series) => series.data);
    const minValue = Math.min(...allValues);
    const maxValue = Math.max(...allValues);

    const flatRange = Math.abs(maxValue - minValue) < 1e-9;
    const rangePadding = flatRange ? 1 : (maxValue - minValue) * 0.12;

    const yMin = minValue - rangePadding;
    const yMax = maxValue + rangePadding;

    const count = chartData.labels.length;
    const xStep = count > 1 ? plotW / (count - 1) : plotW;

    const visibleCount = Math.max(1, Math.ceil(progress * count));

    ctx.clearRect(0, 0, w, h);

    ctx.fillStyle = "rgba(5, 9, 18, 0.72)";
    ctx.fillRect(0, 0, w, h);

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

    ctx.strokeStyle = "rgba(234, 241, 255, 0.22)";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(padding.left, padding.top);
    ctx.lineTo(padding.left, h - padding.bottom);
    ctx.lineTo(w - padding.right, h - padding.bottom);
    ctx.stroke();

    ctx.fillStyle = "rgba(168, 186, 219, 0.95)";
    ctx.font = `${Math.max(11, Math.floor(h * 0.038))}px Inter, Arial, sans-serif`;
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";

    for (let i = 0; i <= horizontalLines; i += 1) {
      const value = yMax - ((yMax - yMin) / horizontalLines) * i;
      const y = padding.top + (plotH / horizontalLines) * i;
      ctx.fillText(formatAxisValue(value), padding.left - 8, y);
    }

    ctx.textAlign = "center";
    ctx.textBaseline = "top";

    const xLabelStep = Math.ceil(count / 5);
    chartData.labels.forEach((label, index) => {
      if (index % xLabelStep !== 0 && index !== count - 1) return;
      const x = padding.left + xStep * index;
      ctx.fillText(label, x, h - padding.bottom + 8);
    });

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

      series.data.slice(0, visibleCount).forEach((value, index) => {
        const x = padding.left + xStep * index;
        const y = padding.top + ((yMax - value) / (yMax - yMin)) * plotH;

        if (index === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });

      ctx.stroke();
      ctx.setLineDash([]);

      series.data.slice(0, visibleCount).forEach((value, index) => {
        const x = padding.left + xStep * index;
        const y = padding.top + ((yMax - value) / (yMax - yMin)) * plotH;

        ctx.beginPath();
        ctx.fillStyle = style.color;
        ctx.arc(x, y, 2.6, 0, Math.PI * 2);
        ctx.fill();
      });
    });

    ctx.save();
    ctx.fillStyle = "rgba(168, 186, 219, 0.92)";
    ctx.font = `${Math.max(11, Math.floor(h * 0.04))}px Inter, Arial, sans-serif`;

    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    ctx.fillText(chartData.xLabel || "", padding.left + plotW / 2, h - 4);

    ctx.translate(16, padding.top + plotH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText(chartData.yLabel || "", 0, 0);
    ctx.restore();

    drawLegend(ctx, canvas, chartData.series);
  }

  function drawLegend(ctx, canvas, seriesList) {
    const filteredSeries = seriesList.slice(0, 7);
    const startX = 14;
    let x = startX;
    let y = 18;
    const maxWidth = canvas.width - 20;

    ctx.font = `${Math.max(10, Math.floor(canvas.height * 0.032))}px Inter, Arial, sans-serif`;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";

    filteredSeries.forEach((series) => {
      const style = seriesStyles[series.key] || {
        color: "#eaf1ff",
        dash: [],
        lineWidth: 2
      };

      const labelWidth = ctx.measureText(series.label).width;
      const itemWidth = 22 + labelWidth + 16;

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

  function interpolateLabelValue(labels, progress) {
    if (!labels || !labels.length) return 0;
    const maxIndex = labels.length - 1;
    const rawIndex = progress * maxIndex;
    const low = Math.floor(rawIndex);
    const high = Math.min(maxIndex, Math.ceil(rawIndex));

    const lowVal = parseFloat(labels[low]) || 0;
    const highVal = parseFloat(labels[high]) || lowVal;
    const frac = rawIndex - low;

    return lowVal + (highVal - lowVal) * frac;
  }

  function interpolateSeriesValue(series, progress) {
    if (!series || !series.length) return 0;
    const maxIndex = series.length - 1;
    const rawIndex = progress * maxIndex;
    const low = Math.floor(rawIndex);
    const high = Math.min(maxIndex, Math.ceil(rawIndex));
    const lowVal = Number(series[low]) || 0;
    const highVal = Number(series[high]) || lowVal;
    const frac = rawIndex - low;

    return lowVal + (highVal - lowVal) * frac;
  }

  function formatPlaybackValue(value) {
    if (!Number.isFinite(value)) return "—";
    return Math.abs(value) >= 100 ? value.toFixed(1) : value.toFixed(2);
  }

  function formatAxisValue(value) {
    if (Math.abs(value) >= 1000) return Math.round(value).toString();
    if (Math.abs(value) >= 100) return value.toFixed(0);
    if (Math.abs(value) >= 10) return value.toFixed(1);
    return value.toFixed(2);
  }

  let resizeTimer = null;

  window.addEventListener("resize", () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      updateLongitudinalAnimation();
      updateLateralAnimation();
      renderVisibleCharts();
    }, 120);
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initSeniorDemo);
  } else {
    initSeniorDemo();
  }
})();
