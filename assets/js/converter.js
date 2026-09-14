function initializeGroupedUnitSelectors() {
  // Unit selectors are initialized and scoped by initializeConverter().
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
  const grid = categoryEl?.closest(".tool-grid");

  const required = [categoryEl, fromUnitEl, toUnitEl, inputValueEl, resultValueEl, resultFormulaEl, resultFactorEl, relatedResultsEl];
  if (required.some((el) => !el) || typeof unitData !== "object") return;
  if (categoryEl.dataset.converterReady === "true") return;
  categoryEl.dataset.converterReady = "true";

  installCompactConverterStyles();

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
    Object.entries(unitData).forEach(([category]) => {
      getUnits(category).forEach((unit) => {
        if (comparableUnit(unit) === normalized) matches.push({ category, unit });
      });
    });

    const aliases = typeof unitAliases === "object" ? unitAliases : {};
    const rawKey = canonicalText(rawUnit);
    const aliasCandidates = [rawKey];
    if (rawKey.endsWith("s")) aliasCandidates.push(rawKey.slice(0, -1));
    const alias = aliasCandidates.map((key) => aliases[key]).find(Boolean);
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
    if (preferred && units.includes(preferred)) selectEl.value = preferred;
  }

  function setDefaultUnits(category = categoryEl.value) {
    const units = getUnits(category);
    const defaults = (typeof defaultUnits === "object" && defaultUnits[category]) || units.slice(0, 2);
    populateUnitSelect(fromUnitEl, category, defaults[0] || units[0]);
    populateUnitSelect(toUnitEl, category, defaults[1] || defaults[0] || units[0]);
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
      useGrouping: abs >= 10000
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
    if (category === "Temperature") {
      const celsius = toCelsius(value, from);
      if (celsius < -273.15 - 1e-10) return "Temperature cannot be below absolute zero.";
    }
    return "";
  }

  function convertUnits(value, category, from, to) {
    const info = unitData[category];
    if (!info || !getUnits(category).includes(from) || !getUnits(category).includes(to)) return NaN;
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
    if (info.type === "fuelEconomy" && (from === "L/100 km" || to === "L/100 km")) return "Inverse scale — result depends on the entered value.";
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
    common.filter((unit) => unit !== from && unit !== to).slice(0, 4).forEach((unit) => {
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
      return NaN;
    }
    const converted = convertUnits(value, category, from, to);
    if (Number.isNaN(converted)) {
      clearResult("Those units are not compatible.");
      return NaN;
    }
    resultValueEl.textContent = `${formatNumber(converted)} ${to}`;
    resultFormulaEl.textContent = getFormulaText(value, category, from, to, converted);
    resultFactorEl.textContent = getFactorText(category, from, to);
    renderRelatedConversions(value, category, from, to);
    if (updatePreview) renderEquation(value, category, from, to, converted);
    return converted;
  }

  function convertValue(updatePreview = false) {
    const value = Number(inputValueEl.value);
    renderConversion(value, categoryEl.value, fromUnitEl.value, toUnitEl.value, updatePreview);
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

  function addSwapButton() {
    if (!grid || document.getElementById("swapUnits")) return;
    const wrapper = document.createElement("div");
    wrapper.className = "field-group converter-swap-group";
    const label = document.createElement("label");
    label.textContent = "Swap";
    const button = document.createElement("button");
    button.id = "swapUnits";
    button.type = "button";
    button.className = "converter-swap-button";
    button.setAttribute("aria-label", "Swap source and destination units");
    button.title = "Swap units";
    button.textContent = "⇄";
    button.addEventListener("click", () => {
      const previous = fromUnitEl.value;
      fromUnitEl.value = toUnitEl.value;
      toUnitEl.value = previous;
      convertValue(Boolean(queryInputEl?.value.trim()));
      if (queryInputEl?.value.trim()) {
        queryInputEl.value = `${inputValueEl.value} ${fromUnitEl.value} to ${toUnitEl.value}`;
        updateLivePreview();
      }
    });
    wrapper.append(label, button);
    grid.appendChild(wrapper);
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
  addSwapButton();
  convertValue();
  updateLivePreview();
}

function installCompactConverterStyles() {
  if (document.getElementById("compact-converter-overrides")) return;
  const style = document.createElement("style");
  style.id = "compact-converter-overrides";
  style.textContent = `
    .compact-tool-card { padding: .95rem 1rem !important; }
    .compact-tool-card .tool-header { margin-bottom: .75rem !important; align-items: end; }
    .compact-tool-card .tool-header h2 { font-size: clamp(1.35rem, 3vw, 1.9rem) !important; }
    .compact-tool-card .tool-intro { margin-top: .3rem !important; line-height: 1.45 !important; font-size: .84rem; }
    .compact-converter-layout { gap: .7rem !important; }
    .compact-converter-layout > .field-group:first-child { display: grid; grid-template-columns: minmax(220px, 1.45fr) minmax(280px, 1fr); gap: .55rem .75rem; align-items: end; }
    .compact-converter-layout > .field-group:first-child > label { grid-column: 1; }
    #queryInput { grid-column: 1; min-height: 39px !important; padding: .58rem .72rem !important; font-size: .9rem !important; }
    .preview-panel { grid-column: 2; grid-row: 1 / span 2; padding: .55rem .7rem !important; min-height: 0; display: grid; align-content: center; gap: .12rem; }
    .preview-summary, .preview-factor, .query-status, .result-formula, .result-factor { margin: 0 !important; line-height: 1.32 !important; font-size: .76rem !important; }
    .preview-factor { color: var(--ink-soft); }
    .query-status { font-size: .68rem !important; text-transform: uppercase; letter-spacing: .06em; }
    #equationPreview { margin-top: .25rem; padding-top: .28rem; border-top: 1px solid var(--line); color: var(--ink); font-family: "Cambria Math", "STIX Two Math", serif; font-size: .9rem; white-space: nowrap; overflow-x: auto; }
    .compact-tool-grid { grid-template-columns: minmax(130px, .9fr) minmax(115px, .75fr) minmax(125px, 1fr) 42px minmax(125px, 1fr) !important; gap: .55rem !important; align-items: end; }
    .compact-tool-grid .field-group { gap: .25rem !important; }
    .compact-tool-grid .field-group label { font-size: .7rem !important; text-transform: uppercase; letter-spacing: .06em; }
    .compact-tool-grid input, .compact-tool-grid select { min-height: 38px !important; padding: .5rem .58rem !important; font-size: .84rem !important; border-radius: 7px !important; }
    .converter-swap-group { grid-column: 4; }
    .converter-swap-button { min-height: 38px; width: 100%; padding: 0; border: 1px solid var(--line); border-radius: 7px; color: var(--ink); background: #141b24; cursor: pointer; font-size: 1.05rem; }
    .converter-swap-button:hover { background: var(--surface-hover); border-color: var(--line-strong); }
    .compact-results-grid { grid-template-columns: minmax(260px, .9fr) minmax(0, 1.1fr) !important; gap: .6rem !important; }
    .result-panel, .related-panel { padding: .72rem .8rem !important; }
    .result-value { font-size: clamp(1.45rem, 3.5vw, 2.15rem) !important; margin-bottom: .25rem !important; }
    .related-results { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .35rem !important; }
    .related-item { padding: .42rem .52rem !important; gap: .45rem !important; font-size: .78rem; align-items: center !important; }
    .related-item-label { color: var(--ink-soft); }
    .related-item-value { font-variant-numeric: tabular-nums; }
    @media (max-width: 780px) {
      .compact-converter-layout > .field-group:first-child { grid-template-columns: 1fr; }
      .preview-panel { grid-column: 1; grid-row: auto; }
      .compact-tool-grid { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
      .converter-swap-group { grid-column: auto; }
      .compact-results-grid { grid-template-columns: 1fr !important; }
    }
    @media (max-width: 520px) {
      .compact-tool-card { padding: .7rem !important; }
      .compact-tool-card .tool-intro { display: none; }
      .compact-tool-grid { grid-template-columns: minmax(0, 1fr) 42px minmax(0, 1fr) !important; }
      .compact-tool-grid .field-group:nth-child(1), .compact-tool-grid .field-group:nth-child(2) { grid-column: span 3; }
      .compact-tool-grid .field-group:nth-child(3) { grid-column: 1; }
      .converter-swap-group { grid-column: 2; }
      .compact-tool-grid .field-group:nth-child(4) { grid-column: 3; }
      .related-results { grid-template-columns: 1fr; }
    }
  `;
  document.head.appendChild(style);
}
