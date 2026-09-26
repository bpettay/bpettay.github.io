(function graphingCalculatorModule(root) {
  const STORAGE_KEY = "engineering.graphingCalculator.v2";
  const LEGACY_STORAGE_KEY = "brock.graphingCalculator.v1";
  const FUNCTION_COLORS = ["#72b7ff", "#f0b55a", "#77c994", "#d48ac7", "#e5796e", "#9c91df", "#70c7c1", "#d59b6a", "#9ab86d", "#b98ac8"];
  const DEFAULT_WINDOW = { xmin: -10, xmax: 10, xscl: 1, ymin: -10, ymax: 10, yscl: 1, xres: 1 };
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
    if (!calculator) return;
    if (!root.math || typeof root.math.compile !== "function") {
      window.setTimeout(initializeGraphingCalculator, 80);
      return;
    }
    initialized = true;

    const canvas = document.getElementById("gcGraphCanvas");
    const context = canvas.getContext("2d");
    const expressionInput = document.getElementById("gcExpressionInput");
    const entryDisplay = document.getElementById("gcEntryDisplay");
    const entryRow = document.getElementById("gcEntryRow");
    const historyEl = document.getElementById("gcHistory");
    const functionList = document.getElementById("gcFunctionList");
    const windowGrid = document.getElementById("gcWindowGrid");
    const menuHeading = document.getElementById("gcMenuHeading");
    const menuList = document.getElementById("gcMenuList");
    const tableHead = document.getElementById("gcTableHead");
    const tableBody = document.getElementById("gcTableBody");
    const titleEl = document.getElementById("gcScreenTitle");
    const modeEl = document.getElementById("gcModeLabel");
    const traceReadout = document.getElementById("gcTraceReadout");
    const views = Array.from(calculator.querySelectorAll("[data-gc-view]"));

    const defaults = {
      angle: "RADIAN",
      functions: ["sin(x)", "", "", "", "", "", "", "", "", ""],
      enabled: [true, true, true, true, true, true, true, true, true, true],
      graphWindow: { ...DEFAULT_WINDOW },
      history: [],
      ans: 0,
      variables: {},
    };
    let state = { ...defaults, graphWindow: { ...DEFAULT_WINDOW } };
    let currentView = "home";
    let traceActive = false;
    let traceX = 0;
    let activeInput = expressionInput;
    let historyCursor = -1;
    let secondMode = false;

    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY));
      if (saved && typeof saved === "object") {
        state = {
          ...state,
          ...saved,
          graphWindow: { ...DEFAULT_WINDOW, ...(saved.graphWindow || {}) },
          functions: Array.isArray(saved.functions) ? saved.functions.slice(0, 10) : defaults.functions,
          enabled: Array.isArray(saved.enabled) ? saved.enabled.slice(0, 10) : defaults.enabled,
          history: Array.isArray(saved.history) ? saved.history.slice(-40) : [],
          variables: saved.variables && typeof saved.variables === "object" ? saved.variables : {},
        };
      }
    } catch (error) {
      // Invalid local state is ignored and replaced on the next successful action.
    }

    while (state.functions.length < 10) state.functions.push("");
    while (state.enabled.length < 10) state.enabled.push(true);

    function saveState() {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          angle: state.angle,
          functions: state.functions,
          enabled: state.enabled,
          graphWindow: state.graphWindow,
          history: state.history.slice(-40),
          ans: state.ans,
          variables: state.variables,
        }));
      } catch (error) {
        // Storage is optional; calculation remains available without it.
      }
    }

    function scopeFor(x) {
      const toRadians = (value) => state.angle === "DEGREE" ? value * Math.PI / 180 : value;
      return {
        ...state.variables,
        x,
        X: x,
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

    function normalizeExpression(expression) {
      return String(expression)
        .replace(/π/g, "pi")
        .replace(/×/g, "*")
        .replace(/÷/g, "/")
        .replace(/√\(/g, "sqrt(")
        .replace(/−/g, "-");
    }

    function compileExpression(expression) {
      if (!String(expression).trim()) return null;
      return root.math.compile(normalizeExpression(expression));
    }

    function formatResult(value) {
      if (typeof value === "number") return formatNumber(value);
      if (value && typeof value === "object" && value.isComplex) {
        const re = formatNumber(value.re);
        const im = formatNumber(Math.abs(value.im));
        const sign = value.im < 0 ? "-" : "+";
        if (value.re === 0) return `${value.im < 0 ? "-" : ""}${im}i`;
        if (value.im === 0) return re;
        return `${re}${sign}${im}i`;
      }
      if (Array.isArray(value)) return `{${value.map(formatResult).join(",")}}`;
      if (value && typeof value.toArray === "function") {
        const array = value.toArray();
        return Array.isArray(array)
          ? `[${array.map((row) => Array.isArray(row) ? row.map(formatResult).join(" ") : formatResult(row)).join("; ")}]`
          : String(value);
      }
      try {
        return root.math.format(value, { precision: 10 });
      } catch (error) {
        return String(value);
      }
    }

    function renderCurrentEntry() {
      if (!entryDisplay) return;
      entryDisplay.textContent = expressionInput.value || "";
      if (entryRow) entryRow.classList.toggle("gc-entry-empty", !expressionInput.value);
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
      const titles = { home: "HOME", functions: "Y=", window: "WINDOW", menu: "MENU", graph: "GRAPH", trace: "TRACE", table: "TABLE" };
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

    function renderMenu(title, items) {
      if (!menuHeading || !menuList) return;
      menuHeading.textContent = title;
      menuList.replaceChildren();
      items.forEach((item, index) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "gc-menu-item";
        button.innerHTML = `<span>${index < 9 ? index + 1 : 0}:</span><strong>${item.label}</strong>`;
        if (item.insert !== undefined) button.dataset.gcMenuInsert = item.insert;
        if (item.action) button.dataset.gcMenuAction = item.action;
        menuList.appendChild(button);
      });
      showView("menu");
      titleEl.textContent = title;
    }

    function openMathMenu() {
      renderMenu("MATH", [
        { label: "abs(", insert: "abs(" },
        { label: "round(", insert: "round(" },
        { label: "min(", insert: "min(" },
        { label: "max(", insert: "max(" },
        { label: "gcd(", insert: "gcd(" },
        { label: "lcm(", insert: "lcm(" },
        { label: "nCr", insert: "combinations(" },
        { label: "nPr", insert: "permutations(" },
        { label: "factorial", insert: "!" },
        { label: "π", insert: "pi" },
      ]);
    }

    function openModeMenu() {
      renderMenu("MODE", [
        { label: `Radian${state.angle === "RADIAN" ? "  ✓" : ""}`, action: "mode-radian" },
        { label: `Degree${state.angle === "DEGREE" ? "  ✓" : ""}`, action: "mode-degree" },
      ]);
    }

    function zoomAroundCenter(factor) {
      const graphWindow = state.graphWindow;
      const centerX = (graphWindow.xmin + graphWindow.xmax) / 2;
      const centerY = (graphWindow.ymin + graphWindow.ymax) / 2;
      const halfX = (graphWindow.xmax - graphWindow.xmin) * factor / 2;
      const halfY = (graphWindow.ymax - graphWindow.ymin) * factor / 2;
      Object.assign(graphWindow, {
        xmin: centerX - halfX,
        xmax: centerX + halfX,
        ymin: centerY - halfY,
        ymax: centerY + halfY,
      });
    }

    function zoomFit() {
      const functions = activeFunctions();
      if (!functions.length) return;
      const graphWindow = state.graphWindow;
      let minY = Infinity;
      let maxY = -Infinity;
      const samples = 320;
      for (let index = 0; index <= samples; index += 1) {
        const x = graphWindow.xmin + index / samples * (graphWindow.xmax - graphWindow.xmin);
        functions.forEach((fn) => {
          try {
            const y = Number(fn.compiled.evaluate(scopeFor(x)));
            if (Number.isFinite(y)) {
              minY = Math.min(minY, y);
              maxY = Math.max(maxY, y);
            }
          } catch (error) {
            // Undefined graph points are ignored.
          }
        });
      }
      if (!Number.isFinite(minY) || !Number.isFinite(maxY)) return;
      const span = Math.max(1e-6, maxY - minY);
      const padding = span * 0.1;
      graphWindow.ymin = minY - padding;
      graphWindow.ymax = maxY + padding;
    }

    function applyZoom(action) {
      const graphWindow = state.graphWindow;
      if (action === "zoom-standard") Object.assign(graphWindow, DEFAULT_WINDOW);
      else if (action === "zoom-in") zoomAroundCenter(0.5);
      else if (action === "zoom-out") zoomAroundCenter(2);
      else if (action === "zoom-decimal") Object.assign(graphWindow, { xmin: -4.7, xmax: 4.7, xscl: 1, ymin: -3.1, ymax: 3.1, yscl: 1, xres: 1 });
      else if (action === "zoom-square") {
        const centerY = (graphWindow.ymin + graphWindow.ymax) / 2;
        const xSpan = graphWindow.xmax - graphWindow.xmin;
        const ySpan = xSpan * canvas.height / canvas.width;
        graphWindow.ymin = centerY - ySpan / 2;
        graphWindow.ymax = centerY + ySpan / 2;
      } else if (action === "zoom-fit") zoomFit();
      renderWindowEditor();
      saveState();
      showView("graph");
    }

    function openZoomMenu() {
      renderMenu("ZOOM", [
        { label: "ZBox", action: "zoom-in" },
        { label: "Zoom In", action: "zoom-in" },
        { label: "Zoom Out", action: "zoom-out" },
        { label: "ZDecimal", action: "zoom-decimal" },
        { label: "ZSquare", action: "zoom-square" },
        { label: "ZStandard", action: "zoom-standard" },
        { label: "ZoomFit", action: "zoom-fit" },
      ]);
    }

    function handleMenuAction(action) {
      if (action === "mode-radian" || action === "mode-degree") {
        state.angle = action === "mode-degree" ? "DEGREE" : "RADIAN";
        updateModeLabel();
        saveState();
        openModeMenu();
        return;
      }
      if (action.startsWith("zoom-")) applyZoom(action);
    }

    function renderHistory() {
      historyEl.replaceChildren();
      state.history.slice(-20).forEach((item) => {
        const expression = document.createElement("div");
        expression.className = "gc-history-expression";
        expression.textContent = item.expression;
        const result = document.createElement("div");
        result.className = `gc-history-result${item.error ? " gc-history-error" : ""}`;
        result.textContent = item.result;
        historyEl.append(expression, result);
      });
      historyEl.scrollTop = historyEl.scrollHeight;
    }

    function evaluateHome() {
      const expression = expressionInput.value.trim();
      if (!expression) return;
      try {
        const storeMatch = expression.match(/^(.*)→([A-Za-z])$/);
        const sourceExpression = storeMatch ? storeMatch[1].trim() : expression;
        const compiled = compileExpression(sourceExpression);
        const raw = compiled.evaluate(scopeFor(0));
        const result = formatResult(raw);
        if (!result || result === "undefined" || result === "NaN") throw new Error("Invalid result");
        if (typeof raw === "number") state.ans = raw;
        if (storeMatch) state.variables[storeMatch[2].toUpperCase()] = raw;
        state.history.push({ expression, result });
      } catch (error) {
        const message = String(error && error.message ? error.message : "");
        const errorLabel = /domain|complex|real number|undefined value/i.test(message) ? "ERR:DOMAIN" : "ERR:SYNTAX";
        state.history.push({ expression, result: errorLabel, error: true });
      }
      state.history = state.history.slice(-40);
      expressionInput.value = "";
      historyCursor = -1;
      renderHistory();
      renderCurrentEntry();
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
        input.placeholder = index === 0 ? "Enter function…" : "";
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
      graphWindow.xres = Math.max(1, Math.min(8, Math.round(Number(graphWindow.xres) || 1)));
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
        const pixelStep = Math.max(1, Number(graphWindow.xres) || 1);
        for (let pixelX = 0; pixelX <= canvas.width; pixelX += pixelStep) {
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

      if (activeInput === expressionInput && !activeInput.value && /^[+*/^]$/.test(value)) {
        activeInput.value = "Ans";
      }

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
      if (activeInput === expressionInput) renderCurrentEntry();
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
      if (activeInput === expressionInput) renderCurrentEntry();
    }

    function recallHistory(direction) {
      if (currentView !== "home" || !state.history.length) return;
      historyCursor = Math.max(-1, Math.min(state.history.length - 1, historyCursor + direction));
      expressionInput.value = historyCursor < 0 ? "" : state.history[state.history.length - 1 - historyCursor].expression;
      renderCurrentEntry();
    }

    function handleAction(action) {
      if (action === "functions") showView("functions");
      else if (action === "window") showView("window");
      else if (action === "graph") showView("graph");
      else if (action === "trace") { traceX = 0; showView("trace"); }
      else if (action === "table") showView("table");
      else if (action === "zoom") openZoomMenu();
      else if (action === "mode") openModeMenu();
      else if (action === "math") openMathMenu();
      else if (action === "second") { secondMode = !secondMode; calculator.classList.toggle("gc-second-active", secondMode); }
      else if (action === "delete") deleteAtCursor();
      else if (action === "clear") {
        if (currentView !== "home") showView("home");
        else if (expressionInput.value) { expressionInput.value = ""; renderCurrentEntry(); }
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

      if (button.dataset.gcMenuInsert !== undefined) {
        showView("home");
        insertAtCursor(button.dataset.gcMenuInsert);
        return;
      }
      if (button.dataset.gcMenuAction) {
        handleMenuAction(button.dataset.gcMenuAction);
        return;
      }

      if (secondMode && button.dataset.gcSecondInsert !== undefined) {
        insertAtCursor(button.dataset.gcSecondInsert);
        secondMode = false;
        calculator.classList.remove("gc-second-active");
        return;
      }

      if (button.dataset.gcInsert !== undefined) insertAtCursor(button.dataset.gcInsert);
      else if (button.dataset.gcAction) handleAction(button.dataset.gcAction);
    });
    expressionInput.addEventListener("input", renderCurrentEntry);
    expressionInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") { event.preventDefault(); evaluateHome(); }
      else if (event.key === "ArrowUp") { event.preventDefault(); recallHistory(1); }
      else if (event.key === "ArrowDown") { event.preventDefault(); recallHistory(-1); }
    });
    const homeView = calculator.querySelector(".gc-home-view");
    if (homeView) {
      homeView.addEventListener("pointerdown", () => window.setTimeout(() => expressionInput.focus(), 0));
    }

    renderFunctionEditor();
    renderWindowEditor();
    renderHistory();
    renderCurrentEntry();
    updateModeLabel();
    showView("home");
    root.graphingCalculator = { showView, drawGraph, getState: () => ({ ...state }) };
  }

  root.initializeGraphingCalculator = initializeGraphingCalculator;
  if (typeof module !== "undefined" && module.exports) module.exports = { formatNumber };
})(typeof window !== "undefined" ? window : globalThis);
