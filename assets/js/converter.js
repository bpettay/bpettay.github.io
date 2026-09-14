function initializeGroupedUnitSelectors() {
  // Kept for compatibility with app.js. initializeConverter handles selector setup.
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

  const controlGrid = categoryEl.closest(".tool-grid");
  const queryRow = queryInputEl?.closest(".field-group");
  const previewPanel = previewSummaryEl?.closest(".preview-panel");
  const categoryGroup = categoryEl.closest(".field-group");
  const valueGroup = inputValueEl.closest(".field-group");
  const fromGroup = fromUnitEl.closest(".field-group");
  const toGroup = toUnitEl.closest(".field-group");

  queryRow?.classList.add("converter-query-row");
  controlGrid?.classList.add("converter-controls-grid");
  categoryGroup?.classList.add("converter-category-group");
  valueGroup?.classList.add("converter-value-group");
  fromGroup?.classList.add("converter-from-group");
  toGroup?.classList.add("converter-to-group");

  installConverterStyles();

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
    const rawKey = canonicalText(rawUnit);
    const candidates = [rawKey];
    if (rawKey.endsWith("s")) candidates.push(rawKey.slice(0, -1));
    const alias = candidates.map((key) => aliases[key]).find(Boolean);

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

        const unitEl = document.createElement("span");
        unitEl.className = "related-item-label";
        unitEl.textContent = unit;

        const valueEl = document.createElement("span");
        valueEl.className = "related-item-value";
        valueEl.textContent = `${formatNumber(converted)} ${unit}`;

        row.append(unitEl, valueEl);
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
    const match = query.trim().match(/^([+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?)\s*(.+?)\s+(?:to|in|as|into)\s+(.+)$/i);
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
      previewFactorEl.textContent = "Type a conversion or use the controls below.";
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
    if (!controlGrid || !toGroup) return null;

    let wrapper = document.querySelector(".converter-swap-group");
    let button = document.getElementById("swapUnits");

    if (!wrapper) {
      wrapper = document.createElement("div");
      wrapper.className = "field-group converter-swap-group";

      const label = document.createElement("label");
      label.textContent = "Swap";
      label.setAttribute("aria-hidden", "true");

      button = document.createElement("button");
      button.id = "swapUnits";
      button.type = "button";
      button.className = "converter-swap-button";
      button.setAttribute("aria-label", "Swap source and destination units");
      button.title = "Swap units";
      button.textContent = "⇄";

      wrapper.append(label, button);
      controlGrid.insertBefore(wrapper, toGroup);
    }

    button?.addEventListener("click", () => {
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

    return button;
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

function installConverterStyles() {
  if (document.getElementById("converter-layout-v2")) return;

  const style = document.createElement("style");
  style.id = "converter-layout-v2";
  style.textContent = `
    .compact-tool-card {
      padding: .95rem 1rem !important;
    }

    .compact-tool-card .tool-header {
      margin-bottom: .75rem !important;
    }

    .compact-tool-card .tool-header h2 {
      font-size: clamp(1.35rem, 3vw, 1.9rem) !important;
    }

    .compact-tool-card .tool-intro {
      margin-top: .3rem !important;
      font-size: .84rem;
      line-height: 1.45 !important;
    }

    .compact-converter-layout {
      gap: .7rem !important;
    }

    .converter-query-row {
      display: grid !important;
      grid-template-columns: minmax(0, 1.3fr) minmax(260px, .9fr);
      grid-template-areas:
        "label preview"
        "input preview";
      gap: .35rem .7rem !important;
      align-items: stretch;
    }

    .converter-query-row > label {
      grid-area: label;
      align-self: end;
    }

    .converter-query-row > #queryInput {
      grid-area: input;
      min-width: 0;
      min-height: 40px !important;
      padding: .58rem .7rem !important;
      font-size: .9rem !important;
    }

    .converter-query-row > .preview-panel {
      grid-area: preview;
      min-width: 0;
      min-height: 0;
      padding: .55rem .7rem !important;
      display: grid;
      align-content: center;
      gap: .12rem;
    }

    .preview-summary,
    .preview-factor,
    .query-status,
    .result-formula,
    .result-factor {
      margin: 0 !important;
      line-height: 1.32 !important;
      font-size: .76rem !important;
    }

    .query-status {
      font-size: .68rem !important;
      text-transform: uppercase;
      letter-spacing: .06em;
    }

    #equationPreview {
      margin-top: .25rem;
      padding-top: .28rem;
      border-top: 1px solid var(--line);
      color: var(--ink);
      font-family: "Cambria Math", "STIX Two Math", serif;
      font-size: .9rem;
      white-space: nowrap;
      overflow-x: auto;
    }

    .converter-controls-grid {
      display: grid !important;
      grid-template-columns: minmax(135px, .95fr) minmax(110px, .72fr) minmax(130px, 1fr) 42px minmax(130px, 1fr) !important;
      grid-template-areas: "category value from swap to";
      gap: .55rem !important;
      align-items: end;
    }

    .converter-category-group { grid-area: category; }
    .converter-value-group { grid-area: value; }
    .converter-from-group { grid-area: from; }
    .converter-swap-group { grid-area: swap; }
    .converter-to-group { grid-area: to; }

    .converter-controls-grid .field-group {
      min-width: 0;
      gap: .25rem !important;
    }

    .converter-controls-grid .field-group label {
      min-height: 1em;
      font-size: .7rem !important;
      text-transform: uppercase;
      letter-spacing: .06em;
    }

    .converter-controls-grid input,
    .converter-controls-grid select {
      width: 100%;
      min-width: 0;
      min-height: 40px !important;
      padding: .5rem .58rem !important;
      font-size: .84rem !important;
      border-radius: 7px !important;
    }

    .converter-swap-button {
      width: 42px;
      min-width: 42px;
      min-height: 40px;
      padding: 0;
      border: 1px solid var(--line);
      border-radius: 7px;
      color: var(--ink);
      background: #141b24;
      cursor: pointer;
      font-size: 1.05rem;
    }

    .converter-swap-button:hover,
    .converter-swap-button:focus-visible {
      background: var(--surface-hover);
      border-color: var(--line-strong);
      outline: none;
    }

    .compact-results-grid {
      grid-template-columns: minmax(250px, .85fr) minmax(0, 1.15fr) !important;
      gap: .6rem !important;
    }

    .result-panel,
    .related-panel {
      padding: .72rem .8rem !important;
    }

    .result-value {
      margin-bottom: .25rem !important;
      font-size: clamp(1.45rem, 3.5vw, 2.15rem) !important;
    }

    .related-results {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: .35rem !important;
    }

    .related-item {
      min-width: 0;
      padding: .42rem .52rem !important;
      gap: .45rem !important;
      align-items: center !important;
      font-size: .78rem;
    }

    .related-item-label,
    .related-item-value {
      min-width: 0;
    }

    @media (max-width: 900px) {
      .converter-controls-grid {
        grid-template-columns: minmax(0, 1fr) minmax(0, .8fr) !important;
        grid-template-areas:
          "category value"
          "from from"
          "swap swap"
          "to to";
      }

      .converter-swap-group {
        justify-self: center;
      }

      .converter-swap-group label {
        display: none;
      }

      .converter-swap-button {
        width: 42px;
      }
    }

    @media (max-width: 720px) {
      .converter-query-row {
        grid-template-columns: 1fr;
        grid-template-areas:
          "label"
          "input"
          "preview";
      }

      .compact-results-grid {
        grid-template-columns: 1fr !important;
      }
    }

    @media (max-width: 520px) {
      .compact-tool-card {
        padding: .7rem !important;
      }

      .compact-tool-card .tool-intro {
        display: none;
      }

      .converter-controls-grid {
        grid-template-columns: minmax(0, 1fr) 42px minmax(0, 1fr) !important;
        grid-template-areas:
          "category category category"
          "value value value"
          "from swap to";
      }

      .converter-swap-group {
        align-self: end;
      }

      .related-results {
        grid-template-columns: 1fr;
      }
    }
  `;

  document.head.appendChild(style);
}
