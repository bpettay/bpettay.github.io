(function graphingCalculatorModule(root) {
  const STORAGE_KEY = "brock.graphingCalculator.v1";
  const FUNCTION_COLORS = ["#72b7ff", "#f0b55a", "#77c994", "#d48ac7", "#e5796e", "#9c91df"];
  const DEFAULT_WINDOW = { xmin: -10, xmax: 10, xscl: 1, ymin: -10, ymax: 10, yscl: 1 };
  let initialized = false;

  function formatNumber(value) {
    if (!Number.isFinite(Number(value))) return "ERROR";
    const number = Number(value);
    if (number === 0) return "0";
    if (Math.abs(number) >= 1e10 || Math.abs(number) < 1e-7) {
      return number.toExponential(7).replace(/(\.\d*?[1-9])0+e/, "$1e").replace(/\.0+e/, "e");
    }
    return Number(number.toPrecision(10)).toString();
  }

  function initializeGraphingCalculator() {
    if (initialized) return;
    const calculator = document.getElementById("graphingCalculator");
    if (!calculator || typeof root.math !== "object") return;
    initialized = true;

    const canvas = document.getElementById("gcGraphCanvas");
    const context = canvas.getContext("2d");
    const expressionInput = document.getElementById("gcExpressionInput");
    const historyEl = document.getElementById("gcHistory");
    const functionList = document.getElementById("gcFunctionList");
    const windowGrid = document.getElementById("gcWindowGrid");
    const tableHead = document.getElementById("gcTableHead");
    const tableBody = document.getElementById("gcTableBody");
    const titleEl = document.getElementById("gcScreenTitle");
    const modeEl = document.getElementById("gcModeLabel");
    const traceReadout = document.getElementById("gcTraceReadout");
    const views = Array.from(calculator.querySelectorAll("[data-gc-view]"));

    const defaults = {
      angle: "RADIAN",
      functions: ["sin(x)", "", "", "", "", ""],
      enabled: [true, true, true, true, true, true],
      graphWindow: { ...DEFAULT_WINDOW },
      history: [],
      ans: 0,
    };
    let state = { ...defaults, graphWindow: { ...DEFAULT_WINDOW } };
    let currentView = "home";
    let traceActive = false;
    let traceX = 0;
    let activeInput = expressionInput;
    let historyCursor = -1;
    let secondMode = false;

    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (saved && typeof saved === "object") {
        state = {
          ...state,
          ...saved,
          graphWindow: { ...DEFAULT_WINDOW, ...(saved.graphWindow || {}) },
          functions: Array.isArray(saved.functions) ? saved.functions.slice(0, 6) : defaults.functions,
          enabled: Array.isArray(saved.enabled) ? saved.enabled.slice(0, 6) : defaults.enabled,
          history: Array.isArray(saved.history) ? saved.history.slice(-6) : [],
        };
      }
    } catch (error) {
      // Invalid local state is ignored and replaced on the next successful action.
    }

    while (state.functions.length < 6) state.functions.push("");
    while (state.enabled.length < 6) state.enabled.push(true);

    function saveState() {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          angle: state.angle,
          functions: state.functions,
          enabled: state.enabled,
          graphWindow: state.graphWindow,
          history: state.history.slice(-6),
          ans: state.ans,
        }));
      } catch (error) {
        // Storage is optional; calculation remains available without it.
      }
    }

    function scopeFor(x) {
      const toRadians = (value) => state.angle === "DEGREE" ? value * Math.PI / 180 : value;
      return {
        x,
        Ans: state.ans,
        sin: (value) => Math.sin(toRadians(value)),
        cos: (value) => Math.cos(toRadians(value)),
        tan: (value) => Math.tan(toRadians(value)),
        asin: (value) => state.angle === "DEGREE" ? Math.asin(value) * 180 / Math.PI : Math.asin(value),
        acos: (value) => state.angle === "DEGREE" ? Math.acos(value) * 180 / Math.PI : Math.acos(value),
        atan: (value) => state.angle === "DEGREE" ? Math.atan(value) * 180 / Math.PI : Math.atan(value),
        ln: Math.log,
        log10: Math.log10,
      };
    }

    function compileExpression(expression) {
      if (!String(expression).trim()) return null;
      return root.math.compile(String(expression).replace(/π/g, "pi").replace(/×/g, "*").replace(/÷/g, "/"));
    }

    function updateModeLabel() {
      modeEl.textContent = `NORMAL · FLOAT · ${state.angle}`;
    }

    function showView(view) {
      currentView = view;
      traceActive = view === "trace";
      canvas.hidden = view !== "graph" && view !== "trace";
      traceReadout.hidden = !traceActive;
      views.forEach((element) => { element.hidden = element.dataset.gcView !== view; });
      const titles = { home: "HOME", functions: "Y=", window: "WINDOW", graph: "GRAPH", trace: "TRACE", table: "TABLE" };
      titleEl.textContent = titles[view] || "HOME";
      if (view === "graph" || view === "trace") drawGraph();
      if (view === "table") renderTable();
      if (view === "home") {
        activeInput = expressionInput;
        window.setTimeout(() => expressionInput.focus(), 0);
      } else if (view === "functions") {
        activeInput = functionList.querySelector('input[type="text"]') || expressionInput;
      } else if (view === "window") {
        activeInput = windowGrid.querySelector('input[type="number"]') || expressionInput;
      }
    }

    function renderHistory() {
      historyEl.replaceChildren();
      state.history.slice(-5).forEach((item) => {
        const row = document.createElement("div");
        row.className = "gc-history-item";
        const expression = document.createElement("span");
        expression.className = "gc-history-expression";
        expression.textContent = item.expression;
        const result = document.createElement("strong");
        result.className = `gc-history-result${item.error ? " gc-history-error" : ""}`;
        result.textContent = item.result;
        row.append(expression, result);
        historyEl.appendChild(row);
      });
    }

    function evaluateHome() {
      const expression = expressionInput.value.trim();
      if (!expression) return;
      try {
        const compiled = compileExpression(expression);
        const raw = compiled.evaluate(scopeFor(0));
        const value = typeof raw === "number" ? raw : Number(raw);
        const result = formatNumber(value);
        if (result === "ERROR") throw new Error("Non-real result");
        state.ans = value;
        state.history.push({ expression, result });
      } catch (error) {
        state.history.push({ expression, result: "ERROR", error: true });
      }
      state.history = state.history.slice(-6);
      expressionInput.value = "";
      historyCursor = -1;
      renderHistory();
      saveState();
    }

    function renderFunctionEditor() {
      functionList.replaceChildren();
      state.functions.forEach((value, index) => {
        const row = document.createElement("div");
        row.className = "gc-function-row";
        row.style.setProperty("--function-color", FUNCTION_COLORS[index]);
        const label = document.createElement("label");
        label.htmlFor = `gcFunction${index}`;
        label.textContent = `Y${index + 1}=`;
        const enabled = document.createElement("input");
        enabled.type = "checkbox";
        enabled.checked = state.enabled[index];
        enabled.setAttribute("aria-label", `Plot Y${index + 1}`);
        enabled.addEventListener("change", () => {
          state.enabled[index] = enabled.checked;
          saveState();
        });
        const input = document.createElement("input");
        input.type = "text";
        input.id = `gcFunction${index}`;
        input.value = value;
        input.autocomplete = "off";
        input.spellcheck = false;
        input.addEventListener("focus", () => { activeInput = input; });
        input.addEventListener("input", () => {
          state.functions[index] = input.value;
          saveState();
        });
        input.addEventListener("keydown", (event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            showView("graph");
          }
        });
        row.append(label, enabled, input);
        functionList.appendChild(row);
      });
    }

    function renderWindowEditor() {
      windowGrid.replaceChildren();
      Object.keys(DEFAULT_WINDOW).forEach((key) => {
        const label = document.createElement("label");
        label.textContent = `${key.toUpperCase()}=`;
        const input = document.createElement("input");
        input.type = "number";
        input.step = "any";
        input.value = state.graphWindow[key];
        input.dataset.windowKey = key;
        input.addEventListener("focus", () => { activeInput = input; });
        input.addEventListener("change", () => {
          const value = Number(input.value);
          if (Number.isFinite(value)) state.graphWindow[key] = value;
          validateWindow();
          saveState();
        });
        label.appendChild(input);
        windowGrid.appendChild(label);
      });
    }

    function validateWindow() {
      const graphWindow = state.graphWindow;
      if (graphWindow.xmin >= graphWindow.xmax) graphWindow.xmax = graphWindow.xmin + 1;
      if (graphWindow.ymin >= graphWindow.ymax) graphWindow.ymax = graphWindow.ymin + 1;
      if (graphWindow.xscl <= 0) graphWindow.xscl = 1;
      if (graphWindow.yscl <= 0) graphWindow.yscl = 1;
    }

    function activeFunctions() {
      return state.functions.map((expression, index) => {
        if (!state.enabled[index] || !expression.trim()) return null;
        try {
          return { expression, compiled: compileExpression(expression), color: FUNCTION_COLORS[index], index };
        } catch (error) {
          return null;
        }
      }).filter(Boolean);
    }

    function graphCoordinates(x, y) {
      const graphWindow = state.graphWindow;
      return {
        px: (x - graphWindow.xmin) / (graphWindow.xmax - graphWindow.xmin) * canvas.width,
        py: canvas.height - (y - graphWindow.ymin) / (graphWindow.ymax - graphWindow.ymin) * canvas.height,
      };
    }

    function drawGrid() {
      const graphWindow = state.graphWindow;
      context.fillStyle = "#050b07";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.lineWidth = 1;
      context.strokeStyle = "rgba(132, 155, 137, 0.12)";

      const drawLines = (min, max, step, vertical) => {
        const safeStep = Math.max(step, (max - min) / 40);
        const first = Math.ceil(min / safeStep) * safeStep;
        for (let value = first; value <= max + safeStep * 0.25; value += safeStep) {
          const point = vertical ? graphCoordinates(value, 0).px : graphCoordinates(0, value).py;
          context.beginPath();
          if (vertical) { context.moveTo(point, 0); context.lineTo(point, canvas.height); }
          else { context.moveTo(0, point); context.lineTo(canvas.width, point); }
          context.stroke();
        }
      };
      drawLines(graphWindow.xmin, graphWindow.xmax, graphWindow.xscl, true);
      drawLines(graphWindow.ymin, graphWindow.ymax, graphWindow.yscl, false);

      context.strokeStyle = "rgba(190, 205, 193, 0.5)";
      context.lineWidth = 1.5;
      if (graphWindow.xmin <= 0 && graphWindow.xmax >= 0) {
        const xAxis = graphCoordinates(0, 0).px;
        context.beginPath(); context.moveTo(xAxis, 0); context.lineTo(xAxis, canvas.height); context.stroke();
      }
      if (graphWindow.ymin <= 0 && graphWindow.ymax >= 0) {
        const yAxis = graphCoordinates(0, 0).py;
        context.beginPath(); context.moveTo(0, yAxis); context.lineTo(canvas.width, yAxis); context.stroke();
      }
    }

    function drawGraph() {
      validateWindow();
      drawGrid();
      const graphWindow = state.graphWindow;
      activeFunctions().forEach((fn) => {
        context.strokeStyle = fn.color;
        context.lineWidth = 2.25;
        context.beginPath();
        let drawing = false;
        let previousY = null;
        for (let pixelX = 0; pixelX <= canvas.width; pixelX += 1) {
          const x = graphWindow.xmin + pixelX / canvas.width * (graphWindow.xmax - graphWindow.xmin);
          let y;
          try { y = Number(fn.compiled.evaluate(scopeFor(x))); } catch (error) { y = NaN; }
          const point = graphCoordinates(x, y);
          const discontinuity = previousY !== null && Math.abs(point.py - previousY) > canvas.height * 0.7;
          if (!Number.isFinite(y) || point.py < -canvas.height * 3 || point.py > canvas.height * 4 || discontinuity) {
            drawing = false;
          } else if (!drawing) {
            context.moveTo(point.px, point.py);
            drawing = true;
          } else {
            context.lineTo(point.px, point.py);
          }
          previousY = Number.isFinite(point.py) ? point.py : null;
        }
        context.stroke();
      });
      if (traceActive) drawTrace();
    }

    function drawTrace() {
      const fn = activeFunctions()[0];
      if (!fn) {
        traceReadout.textContent = "NO FUNCTION";
        return;
      }
      let y;
      try { y = Number(fn.compiled.evaluate(scopeFor(traceX))); } catch (error) { y = NaN; }
      if (!Number.isFinite(y)) {
        traceReadout.textContent = `X=${formatNumber(traceX)}  Y=UNDEF`;
        return;
      }
      const point = graphCoordinates(traceX, y);
      context.strokeStyle = "#e5ece7";
      context.lineWidth = 1;
      context.beginPath();
      context.moveTo(point.px - 7, point.py); context.lineTo(point.px + 7, point.py);
      context.moveTo(point.px, point.py - 7); context.lineTo(point.px, point.py + 7);
      context.stroke();
      traceReadout.textContent = `Y${fn.index + 1}  X=${formatNumber(traceX)}  Y=${formatNumber(y)}`;
    }

    function moveTrace(direction) {
      if (!traceActive) return;
      const step = (state.graphWindow.xmax - state.graphWindow.xmin) / 80;
      traceX = Math.max(state.graphWindow.xmin, Math.min(state.graphWindow.xmax, traceX + direction * step));
      drawGraph();
    }

    function zoomGraph() {
      const graphWindow = state.graphWindow;
      if (secondMode) {
        Object.assign(graphWindow, DEFAULT_WINDOW);
        secondMode = false;
        calculator.classList.remove("gc-second-active");
      } else {
        const centerX = (graphWindow.xmin + graphWindow.xmax) / 2;
        const centerY = (graphWindow.ymin + graphWindow.ymax) / 2;
        const halfX = (graphWindow.xmax - graphWindow.xmin) / 4;
        const halfY = (graphWindow.ymax - graphWindow.ymin) / 4;
        Object.assign(graphWindow, { xmin: centerX - halfX, xmax: centerX + halfX, ymin: centerY - halfY, ymax: centerY + halfY });
      }
      renderWindowEditor();
      saveState();
      showView("graph");
    }

    function renderTable() {
      tableHead.replaceChildren();
      tableBody.replaceChildren();
      const functions = activeFunctions().slice(0, 4);
      const header = document.createElement("tr");
      ["X", ...functions.map((fn) => `Y${fn.index + 1}`)].forEach((name) => {
        const cell = document.createElement("th");
        cell.textContent = name;
        header.appendChild(cell);
      });
      tableHead.appendChild(header);
      const span = state.graphWindow.xmax - state.graphWindow.xmin;
      const step = state.graphWindow.xscl > 0 ? state.graphWindow.xscl : span / 10;
      const start = Math.ceil(state.graphWindow.xmin / step) * step;
      for (let rowIndex = 0; rowIndex < 21; rowIndex += 1) {
        const x = start + rowIndex * step;
        if (x > state.graphWindow.xmax + step * 0.1) break;
        const row = document.createElement("tr");
        const values = [formatNumber(x), ...functions.map((fn) => {
          try { return formatNumber(fn.compiled.evaluate(scopeFor(x))); } catch (error) { return "ERROR"; }
        })];
        values.forEach((value) => {
          const cell = document.createElement("td");
          cell.textContent = value;
          row.appendChild(cell);
        });
        tableBody.appendChild(row);
      }
    }

    function insertAtCursor(value) {
      if (currentView === "graph" || currentView === "trace" || currentView === "table") showView("home");
      if (!(activeInput instanceof HTMLInputElement) || activeInput.closest("[hidden]")) activeInput = expressionInput;

      if (activeInput.type === "number") {
        if (!/^[0-9.\-]$/.test(value)) return;
        activeInput.value += value;
        activeInput.dispatchEvent(new Event("change", { bubbles: true }));
        activeInput.focus();
        return;
      }

      const start = activeInput.selectionStart ?? activeInput.value.length;
      const end = activeInput.selectionEnd ?? start;
      activeInput.setRangeText(value, start, end, "end");
      activeInput.dispatchEvent(new Event("input", { bubbles: true }));
      activeInput.focus();
    }

    function deleteAtCursor() {
      if (currentView === "graph" || currentView === "trace" || currentView === "table") showView("home");
      if (!(activeInput instanceof HTMLInputElement) || activeInput.closest("[hidden]")) activeInput = expressionInput;
      if (activeInput.type === "number") {
        activeInput.value = activeInput.value.slice(0, -1);
        activeInput.dispatchEvent(new Event("change", { bubbles: true }));
        activeInput.focus();
        return;
      }
      const start = activeInput.selectionStart ?? activeInput.value.length;
      const end = activeInput.selectionEnd ?? start;
      if (start !== end) activeInput.setRangeText("", start, end, "end");
      else if (start > 0) activeInput.setRangeText("", start - 1, start, "end");
      activeInput.dispatchEvent(new Event("input", { bubbles: true }));
      activeInput.focus();
    }

    function recallHistory(direction) {
      if (currentView !== "home" || !state.history.length) return;
      historyCursor = Math.max(-1, Math.min(state.history.length - 1, historyCursor + direction));
      expressionInput.value = historyCursor < 0 ? "" : state.history[state.history.length - 1 - historyCursor].expression;
    }

    function handleAction(action) {
      if (action === "functions") showView("functions");
      else if (action === "window") showView("window");
      else if (action === "graph") showView("graph");
      else if (action === "trace") { traceX = 0; showView("trace"); }
      else if (action === "table") showView("table");
      else if (action === "zoom") zoomGraph();
      else if (action === "mode") { state.angle = state.angle === "RADIAN" ? "DEGREE" : "RADIAN"; updateModeLabel(); saveState(); }
      else if (action === "second") { secondMode = !secondMode; calculator.classList.toggle("gc-second-active", secondMode); }
      else if (action === "delete") deleteAtCursor();
      else if (action === "clear") {
        if (currentView !== "home") showView("home");
        else if (expressionInput.value) expressionInput.value = "";
        else { state.history = []; renderHistory(); saveState(); }
      }
      else if (action === "enter") {
        if (currentView === "home") evaluateHome();
        else if (currentView === "functions" || currentView === "window") showView("graph");
        else showView("home");
      }
      else if (action === "left") moveTrace(-1);
      else if (action === "right") moveTrace(1);
      else if (action === "up") recallHistory(1);
      else if (action === "down") recallHistory(-1);
    }

    calculator.addEventListener("focusin", (event) => {
      if (event.target instanceof HTMLInputElement) activeInput = event.target;
    });
    calculator.addEventListener("click", (event) => {
      const button = event.target.closest("button");
      if (!button) return;
      if (button.dataset.gcInsert !== undefined) insertAtCursor(button.dataset.gcInsert);
      else if (button.dataset.gcAction) handleAction(button.dataset.gcAction);
    });
    expressionInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") { event.preventDefault(); evaluateHome(); }
      else if (event.key === "ArrowUp") { event.preventDefault(); recallHistory(1); }
      else if (event.key === "ArrowDown") { event.preventDefault(); recallHistory(-1); }
    });

    renderFunctionEditor();
    renderWindowEditor();
    renderHistory();
    updateModeLabel();
    showView("home");
    root.graphingCalculator = { showView, drawGraph, getState: () => ({ ...state }) };
  }

  root.initializeGraphingCalculator = initializeGraphingCalculator;
  if (typeof module !== "undefined" && module.exports) module.exports = { formatNumber };
})(typeof window !== "undefined" ? window : globalThis);
