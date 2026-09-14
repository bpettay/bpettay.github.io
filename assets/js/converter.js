function initializeGroupedUnitSelectors() {
  // Compatibility shim for app.js. initializeConverter owns selector setup.
}

function initializeConverter() {
  const categoryEl = document.getElementById("category");
  const fromUnitEl = document.getElementById("fromUnit");
  const toUnitEl = document.getElementById("toUnit");
  const inputValueEl = document.getElementById("inputValue");
  const resultValueEl = document.getElementById("resultValue");
  const resultFormulaEl = document.getElementById("resultFormula");
  const resultFactorEl = document.getElementById("resultFactor");
  const relatedResultsEl = document.getElementById("relatedResults");
  const queryInputEl = document.getElementById("queryInput");
  const queryStatusEl = document.getElementById("queryStatus");
  const previewSummaryEl = document.getElementById("previewSummary");
  const previewFactorEl = document.getElementById("previewFactor");
  const previewPanel = previewSummaryEl?.closest(".preview-panel");
  const controlGrid = categoryEl?.closest(".tool-grid");

  const required = [
    categoryEl,
    fromUnitEl,
    toUnitEl,
    inputValueEl,
    resultValueEl,
    resultFormulaEl,
    resultFactorEl,
    relatedResultsEl,
  ];

  if (required.some((el) => !el) || typeof unitData !== "object") return;
  if (categoryEl.dataset.converterReady === "true") return;
  categoryEl.dataset.converterReady = "true";

  installConverterLayout();

  const getUnits = (category) => {
    const info = unitData[category];
    return Array.isArray(info?.units) ? info.units : Object.keys(info?.units || {});
  };

  function canonicalText(value) {
    return String(value || "")
      .trim()
      .replace(/μ/g, "µ")
      .replace(/²/g, "^2")
      .replace(/³/g, "^3")
      .replace(/[⋅×]/g, "·")
      .replace(/degrees?\s*/gi, "°")
      .replace(/\s+/g, " ")
      .toLowerCase();
  }

  function comparableUnit(value) {
    return canonicalText(value)
      .replace(/\^2/g, "²")
      .replace(/\^3/g, "³")
      .replace(/\s*·\s*/g, "·")
      .replace(/\s*\/\s*/g, "/")
      .replace(/\s*\(\s*/g, "(")
      .replace(/\s*\)\s*/g, ")");
  }

  function findUnitMatches(rawUnit) {
    const normalized = comparableUnit(rawUnit);
    const matches = [];

    Object.keys(unitData).forEach((category) => {
      getUnits(category).forEach((unit) => {
        if (comparableUnit(unit) === normalized) matches.push({ category, unit });
      });
    });

    const aliases = typeof unitAliases === "object" ? unitAliases : {};
    const key = canonicalText(rawUnit);
    const candidates = [key];
    if (key.endsWith("s")) candidates.push(key.slice(0, -1));
    const alias = candidates.map((candidate) => aliases[candidate]).find(Boolean);

    if (alias && !matches.some((match) => match.category === alias.category && match.unit === alias.unit)) {
      matches.unshift(alias);
    }

    return matches;
  }

  function resolveQueryUnits(fromRaw, toRaw) {
    const fromMatches = findUnitMatches(fromRaw);
    const toMatches = findUnitMatches(toRaw);

    for (const fromMatch of fromMatches) {
      const toMatch = toMatches.find((candidate) => candidate.category === fromMatch.category);
      if (toMatch) return { category: fromMatch.category, from: fromMatch.unit, to: toMatch.unit };
    }

    return null;
  }

  function populateCategories() {
    categoryEl.replaceChildren();
    Object.keys(unitData).forEach((category) => {
      const option = document.createElement("option");
      option.value = category;
      option.textContent = category;
      categoryEl.appendChild(option);
    });
  }

  function populateUnitSelect(selectEl, category, preferred) {
    const units = getUnits(category);
    selectEl.replaceChildren();

    units.forEach((unit) => {
      const option = document.createElement("option");
      option.value = unit;
      option.textContent = unit;
      selectEl.appendChild(option);
    });

    selectEl.value = units.includes(preferred) ? preferred : (units[0] || "");
  }

  function setDefaultUnits(category = categoryEl.value) {
    const units = getUnits(category);
    const defaults = (typeof defaultUnits === "object" && defaultUnits[category]) || units.slice(0, 2);
    populateUnitSelect(fromUnitEl, category, defaults[0]);
    populateUnitSelect(toUnitEl, category, defaults[1] || defaults[0]);
  }

  function setUnitSelections(category, from, to) {
    categoryEl.value = category;
    populateUnitSelect(fromUnitEl, category, from);
    populateUnitSelect(toUnitEl, category, to);
  }

  function formatNumber(value) {
    if (value === Infinity) return "∞";
    if (value === -Infinity) return "−∞";
    if (!Number.isFinite(value)) return "—";
    if (Object.is(value, -0)) value = 0;

    const abs = Math.abs(value);
    if (abs >= 1e9 || (abs > 0 && abs < 1e-6)) return value.toExponential(2);

    return new Intl.NumberFormat("en-US", {
      maximumSignificantDigits: 3,
      useGrouping: abs >= 10000,
    }).format(value);
  }

  function toCelsius(value, unit) {
    if (unit === "°F") return (value - 32) * 5 / 9;
    if (unit === "K") return value - 273.15;
    if (unit === "°R") return (value - 491.67) * 5 / 9;
    return value;
  }

  function fromCelsius(value, unit) {
    if (unit === "°F") return value * 9 / 5 + 32;
    if (unit === "K") return value + 273.15;
    if (unit === "°R") return (value + 273.15) * 9 / 5;
    return value;
  }

  function fuelEconomyToKmPerLiter(value, unit) {
    if (unit === "mpg US") return value * 0.425143707430272;
    if (unit === "mpg UK") return value * 0.354006189934647;
    if (unit === "L/100 km") return value === 0 ? Infinity : 100 / value;
    return value;
  }

  function kmPerLiterToFuelEconomy(value, unit) {
    if (unit === "mpg US") return value / 0.425143707430272;
    if (unit === "mpg UK") return value / 0.354006189934647;
    if (unit === "L/100 km") return value === 0 ? Infinity : 100 / value;
    return value;
  }

  function validateInput(value, category, from) {
    if (!Number.isFinite(value)) return "Enter a valid numeric value.";
    if (category === "Fuel Economy" && value < 0) return "Fuel economy cannot be negative.";
    if (category === "Temperature" && toCelsius(value, from) < -273.15 - 1e-10) {
      return "Temperature cannot be below absolute zero.";
    }
    return "";
  }

  function convertUnits(value, category, from, to) {
    const info = unitData[category];
    const units = getUnits(category);

    if (!info || !units.includes(from) || !units.includes(to)) return NaN;
    if (from === to) return value;
    if (info.type === "temperature") return fromCelsius(toCelsius(value, from), to);
    if (info.type === "fuelEconomy") return kmPerLiterToFuelEconomy(fuelEconomyToKmPerLiter(value, from), to);

    const fromFactor = info.units[from];
    const toFactor = info.units[to];
    if (!Number.isFinite(fromFactor) || !Number.isFinite(toFactor) || toFactor === 0) return NaN;

    return (value * fromFactor) / toFactor;
  }

  function getFormulaText(value, category, from, to, converted) {
    const info = unitData[category];
    if (info.type === "temperature" || info.type === "fuelEconomy") {
      return `${formatNumber(value)} ${from} = ${formatNumber(converted)} ${to}`;
    }

    const factor = info.units[from] / info.units[to];
    return `${formatNumber(value)} ${from} × ${formatNumber(factor)} = ${formatNumber(converted)} ${to}`;
  }

  function getFactorText(category, from, to) {
    const info = unitData[category];
    if (info.type === "temperature") return "Offset scale — no single constant multiplier.";
    if (info.type === "fuelEconomy" && (from === "L/100 km" || to === "L/100 km")) {
      return "Inverse scale — result depends on the entered value.";
    }
    return `1 ${from} = ${formatNumber(convertUnits(1, category, from, to))} ${to}`;
  }

  function renderEquation(value, category, from, to, converted) {
    if (!previewPanel) return;

    let equation = document.getElementById("equationPreview");
    if (!equation) {
      equation = document.createElement("div");
      equation.id = "equationPreview";
      equation.setAttribute("aria-live", "polite");
      previewPanel.appendChild(equation);
    }

    equation.textContent = getFormulaText(value, category, from, to, converted);
  }

  function renderRelatedConversions(value, category, from, to) {
    relatedResultsEl.replaceChildren();
    const common = unitData[category].common || getUnits(category);

    common
      .filter((unit) => unit !== from && unit !== to)
      .slice(0, 4)
      .forEach((unit) => {
        const converted = convertUnits(value, category, from, unit);
        const row = document.createElement("div");
        row.className = "related-item";

        const label = document.createElement("span");
        label.className = "related-item-label";
        label.textContent = unit;

        const result = document.createElement("span");
        result.className = "related-item-value";
        result.textContent = `${formatNumber(converted)} ${unit}`;

        row.append(label, result);
        relatedResultsEl.appendChild(row);
      });
  }

  function clearResult(message) {
    resultValueEl.textContent = "—";
    resultFormulaEl.textContent = message;
    resultFactorEl.textContent = "";
    relatedResultsEl.replaceChildren();
  }

  function renderConversion(value, category, from, to, updatePreview = false) {
    const problem = validateInput(value, category, from);

    if (problem) {
      clearResult(problem);
      if (updatePreview) document.getElementById("equationPreview")?.remove();
      return NaN;
    }

    const converted = convertUnits(value, category, from, to);
    if (Number.isNaN(converted)) {
      clearResult("Those units are not compatible.");
      if (updatePreview) document.getElementById("equationPreview")?.remove();
      return NaN;
    }

    resultValueEl.textContent = `${formatNumber(converted)} ${to}`;
    resultFormulaEl.textContent = getFormulaText(value, category, from, to, converted);
    resultFactorEl.textContent = getFactorText(category, from, to);
    renderRelatedConversions(value, category, from, to);

    if (updatePreview) renderEquation(value, category, from, to, converted);
    return converted;
  }

  function readManualValue() {
    const raw = inputValueEl.value.trim();
    return raw === "" ? NaN : Number(raw);
  }

  function convertValue(updatePreview = false) {
    renderConversion(readManualValue(), categoryEl.value, fromUnitEl.value, toUnitEl.value, updatePreview);
  }

  function parseQuickQuery(query) {
    const match = query
      .trim()
      .match(/^([+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?)\s*(.+?)\s+(?:to|in|as|into)\s+(.+)$/i);

    if (!match) return null;

    const value = Number(match[1]);
    const resolved = resolveQueryUnits(match[2], match[3]);
    return Number.isFinite(value) && resolved ? { value, ...resolved } : null;
  }

  function updateLivePreview() {
    if (!queryInputEl || !previewSummaryEl || !previewFactorEl || !queryStatusEl) return;
    const query = queryInputEl.value.trim();

    if (!query) {
      previewSummaryEl.textContent = "Example: 10 in to mm";
      previewFactorEl.textContent = "Or use the controls below.";
      queryStatusEl.textContent = "";
      document.getElementById("equationPreview")?.remove();
      return;
    }

    const parsed = parseQuickQuery(query);
    if (!parsed) {
      previewSummaryEl.textContent = "Waiting for a complete conversion…";
      previewFactorEl.textContent = "Format: value unit to unit";
      queryStatusEl.textContent = "Check the unit spelling if this does not resolve.";
      document.getElementById("equationPreview")?.remove();
      return;
    }

    setUnitSelections(parsed.category, parsed.from, parsed.to);
    inputValueEl.value = parsed.value;
    const converted = renderConversion(parsed.value, parsed.category, parsed.from, parsed.to, true);

    if (Number.isNaN(converted)) {
      queryStatusEl.textContent = resultFormulaEl.textContent;
      return;
    }

    previewSummaryEl.textContent = `${formatNumber(parsed.value)} ${parsed.from} = ${formatNumber(converted)} ${parsed.to}`;
    previewFactorEl.textContent = getFactorText(parsed.category, parsed.from, parsed.to);
    queryStatusEl.textContent = parsed.category;
  }

  function installSwapButton() {
    if (!controlGrid || document.getElementById("swapUnits")) return;

    const fromGroup = fromUnitEl.closest(".field-group");
    const toGroup = toUnitEl.closest(".field-group");
    if (!fromGroup || !toGroup) return;

    fromGroup.classList.add("converter-from-group");
    toGroup.classList.add("converter-to-group");

    const wrapper = document.createElement("div");
    wrapper.className = "field-group converter-swap-group";

    const spacer = document.createElement("span");
    spacer.className = "converter-swap-label";
    spacer.setAttribute("aria-hidden", "true");
    spacer.textContent = "Swap";

    const button = document.createElement("button");
    button.id = "swapUnits";
    button.type = "button";
    button.className = "converter-swap-button";
    button.textContent = "⇄";
    button.title = "Swap units";
    button.setAttribute("aria-label", "Swap source and destination units");

    button.addEventListener("click", () => {
      const previous = fromUnitEl.value;
      fromUnitEl.value = toUnitEl.value;
      toUnitEl.value = previous;

      if (queryInputEl?.value.trim()) {
        queryInputEl.value = `${inputValueEl.value} ${fromUnitEl.value} to ${toUnitEl.value}`;
        updateLivePreview();
      } else {
        convertValue();
      }
    });

    wrapper.append(spacer, button);
    controlGrid.insertBefore(wrapper, toGroup);
  }

  categoryEl.addEventListener("change", () => {
    setDefaultUnits(categoryEl.value);
    convertValue();
  });

  fromUnitEl.addEventListener("change", () => convertValue(Boolean(queryInputEl?.value.trim())));
  toUnitEl.addEventListener("change", () => convertValue(Boolean(queryInputEl?.value.trim())));
  inputValueEl.addEventListener("input", () => convertValue(Boolean(queryInputEl?.value.trim())));
  queryInputEl?.addEventListener("input", updateLivePreview);

  populateCategories();
  categoryEl.value = Object.prototype.hasOwnProperty.call(unitData, "Length") ? "Length" : Object.keys(unitData)[0];
  setDefaultUnits(categoryEl.value);
  installSwapButton();
  convertValue();
  updateLivePreview();
}

function installConverterLayout() {
  if (document.getElementById("converter-workflow-layout")) return;

  const style = document.createElement("style");
  style.id = "converter-workflow-layout";
  style.textContent = `
    #tools .compact-tool-card {
      display: block !important;
      min-height: 0 !important;
      padding: .85rem 1rem !important;
    }

    #tools .compact-tool-card .tool-header {
      margin-bottom: .5rem !important;
    }

    #tools .compact-tool-card .tool-intro {
      margin-top: .25rem !important;
      line-height: 1.35 !important;
      font-size: .82rem !important;
    }

    #tools .compact-converter-layout {
      display: grid !important;
      grid-template-columns: 1fr !important;
      grid-template-areas: none !important;
      gap: .48rem !important;
      min-height: 0 !important;
      align-items: stretch !important;
    }

    #tools .compact-converter-layout > .field-group:first-child {
      display: grid !important;
      grid-template-columns: minmax(220px, 1fr) minmax(280px, .9fr) !important;
      grid-template-areas:
        "label preview"
        "query preview" !important;
      gap: .28rem .5rem !important;
      padding: 0 !important;
      border: 0 !important;
      background: transparent !important;
    }

    #tools .compact-converter-layout > .field-group:first-child > label {
      grid-area: label !important;
      align-self: end;
      margin: 0 !important;
      font-size: .72rem !important;
    }

    #tools #queryInput {
      grid-area: query !important;
      min-height: 38px !important;
      padding: .5rem .65rem !important;
      font-size: .86rem !important;
    }

    #tools .preview-panel {
      grid-area: preview !important;
      display: grid !important;
      align-content: center !important;
      min-height: 0 !important;
      margin: 0 !important;
      padding: .48rem .6rem !important;
    }

    #tools .preview-summary,
    #tools .preview-factor,
    #tools .query-status,
    #tools .result-formula,
    #tools .result-factor {
      margin: 0 !important;
      line-height: 1.28 !important;
      font-size: .75rem !important;
    }

    #tools #equationPreview {
      margin-top: .22rem !important;
      padding-top: .22rem !important;
      border-top: 1px solid var(--line) !important;
      font-size: .82rem !important;
      white-space: nowrap;
      overflow-x: auto;
    }

    #tools .compact-tool-grid {
      display: grid !important;
      grid-template-columns: minmax(130px, .9fr) minmax(110px, .7fr) minmax(130px, 1fr) 40px minmax(130px, 1fr) !important;
      gap: .42rem !important;
      align-items: end !important;
      padding: 0 !important;
      border: 0 !important;
      background: transparent !important;
    }

    #tools .compact-tool-grid .field-group {
      gap: .2rem !important;
      min-width: 0 !important;
    }

    #tools .compact-tool-grid .field-group label,
    #tools .converter-swap-label {
      min-height: 1em;
      color: var(--ink-soft);
      font-size: .68rem !important;
      line-height: 1 !important;
      text-transform: uppercase;
      letter-spacing: .05em;
    }

    #tools .compact-tool-grid input,
    #tools .compact-tool-grid select,
    #tools .converter-swap-button {
      width: 100%;
      min-width: 0;
      min-height: 38px !important;
      padding: .48rem .55rem !important;
      border-radius: 7px !important;
      font-size: .82rem !important;
    }

    #tools .converter-swap-group {
      min-width: 40px !important;
    }

    #tools .converter-swap-button {
      padding: 0 !important;
      border: 1px solid var(--line);
      color: var(--ink);
      background: #141b24;
      cursor: pointer;
      font-size: 1rem !important;
    }

    #tools .compact-results-grid {
      display: grid !important;
      grid-template-columns: minmax(250px, .9fr) minmax(0, 1.1fr) !important;
      grid-template-rows: none !important;
      gap: .42rem !important;
      min-height: 0 !important;
    }

    #tools .result-panel,
    #tools .related-panel {
      min-height: 0 !important;
      padding: .58rem .68rem !important;
    }

    #tools .result-value {
      margin: 0 0 .16rem !important;
      font-size: clamp(1.4rem, 3vw, 2rem) !important;
    }

    #tools .related-results {
      grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
      gap: .3rem !important;
    }

    #tools .related-item {
      padding: .36rem .45rem !important;
      gap: .35rem !important;
      font-size: .76rem !important;
    }

    @media (max-width: 900px) {
      #tools .compact-converter-layout > .field-group:first-child {
        grid-template-columns: 1fr !important;
        grid-template-areas:
          "label"
          "query"
          "preview" !important;
      }

      #tools .compact-tool-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
      }

      #tools .converter-swap-group {
        grid-column: 1 / -1 !important;
        justify-self: center;
        width: 40px;
      }

      #tools .converter-swap-label {
        display: none;
      }
    }

    @media (max-width: 620px) {
      #tools .compact-tool-card {
        padding: .7rem !important;
      }

      #tools .compact-tool-grid {
        grid-template-columns: minmax(0, 1fr) 40px minmax(0, 1fr) !important;
      }

      #tools .compact-tool-grid > .field-group:nth-child(1),
      #tools .compact-tool-grid > .field-group:nth-child(2) {
        grid-column: 1 / -1 !important;
      }

      #tools .converter-from-group {
        grid-column: 1 !important;
      }

      #tools .converter-swap-group {
        grid-column: 2 !important;
        width: 40px;
        align-self: end;
      }

      #tools .converter-to-group {
        grid-column: 3 !important;
      }

      #tools .compact-results-grid,
      #tools .related-results {
        grid-template-columns: 1fr !important;
      }
    }
  `;

  document.head.appendChild(style);
}