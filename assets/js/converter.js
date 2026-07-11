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

  const required = [categoryEl, fromUnitEl, toUnitEl, inputValueEl, resultValueEl, resultFormulaEl, resultFactorEl, relatedResultsEl];
  if (required.some((el) => !el) || typeof unitData !== "object") return;

  const NS = "http://www.w3.org/1998/Math/MathML";
  const equationPreviewEl = document.createElement("div");
  equationPreviewEl.id = "equationPreview";
  equationPreviewEl.setAttribute("aria-live", "polite");
  Object.assign(equationPreviewEl.style, {
    marginTop: "0.8rem",
    padding: "0.85rem 1rem",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "10px",
    background: "rgba(0,0,0,0.24)",
    color: "var(--ink)",
    overflowX: "auto"
  });
  previewSummaryEl?.closest(".preview-panel")?.appendChild(equationPreviewEl);

  const getUnits = (category) => {
    const info = unitData[category];
    return Array.isArray(info.units) ? info.units : Object.keys(info.units);
  };

  function canonicalText(value) {
    return String(value || "").trim().replace(/μ/g, "µ").replace(/²/g, "^2").replace(/³/g, "^3")
      .replace(/[⋅×]/g, "·").replace(/degrees?\s*/gi, "°").replace(/\s+/g, " ").toLowerCase();
  }

  function comparableUnit(value) {
    return canonicalText(value).replace(/\^2/g, "²").replace(/\^3/g, "³").replace(/\s*·\s*/g, "·")
      .replace(/\s*\/\s*/g, "/").replace(/\s*\(\s*/g, "(").replace(/\s*\)\s*/g, ")");
  }

  function findUnitMatches(rawUnit) {
    const normalized = comparableUnit(rawUnit);
    const matches = [];
    Object.keys(unitData).forEach((category) => {
      getUnits(category).forEach((unit) => {
        if (comparableUnit(unit) === normalized) matches.push({ category, unit });
      });
    });
    const alias = typeof unitAliases === "object" ? unitAliases[canonicalText(rawUnit)] : null;
    if (alias && !matches.some((match) => match.category === alias.category && match.unit === alias.unit)) matches.unshift(alias);
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

  const encodedUnit = (category, unit) => `${category}|||${unit}`;
  const decodedUnit = (value) => {
    const [category, unit] = String(value).split("|||");
    return { category, unit };
  };

  function populateGroupedUnits(selectEl) {
    selectEl.replaceChildren();
    Object.keys(unitData).forEach((category) => {
      const group = document.createElement("optgroup");
      group.label = category;
      getUnits(category).forEach((unit) => {
        const option = document.createElement("option");
        option.value = encodedUnit(category, unit);
        option.textContent = unit;
        group.appendChild(option);
      });
      selectEl.appendChild(group);
    });
  }

  function setUnitSelections(category, from, to) {
    fromUnitEl.value = encodedUnit(category, from);
    toUnitEl.value = encodedUnit(category, to);
  }

  function getSelectedUnits() {
    return { from: decodedUnit(fromUnitEl.value), to: decodedUnit(toUnitEl.value) };
  }

  function setDefaultUnits(category = categoryEl.value) {
    const defaults = defaultUnits[category] || getUnits(category).slice(0, 2);
    setUnitSelections(category, defaults[0], defaults[1] || defaults[0]);
  }

  function formatNumber(value) {
    if (!Number.isFinite(value)) return "Invalid";
    if (Object.is(value, -0)) value = 0;
    const abs = Math.abs(value);
    if (abs >= 1e9 || (abs > 0 && abs < 1e-6)) return value.toExponential(2);
    return new Intl.NumberFormat("en-US", { maximumSignificantDigits: 3, useGrouping: abs >= 10000 }).format(value);
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

  function convertUnits(value, category, from, to) {
    const info = unitData[category];
    if (from === to) return value;
    if (info.type === "temperature") return fromCelsius(toCelsius(value, from), to);
    if (info.type === "fuelEconomy") return kmPerLiterToFuelEconomy(fuelEconomyToKmPerLiter(value, from), to);
    return (value * info.units[from]) / info.units[to];
  }

  function getFormulaText(value, category, from, to, converted) {
    const info = unitData[category];
    if (info.type === "temperature" || info.type === "fuelEconomy") return `${formatNumber(value)} ${from} = ${formatNumber(converted)} ${to}`;
    return `${formatNumber(value)} ${from} × ${formatNumber(info.units[from] / info.units[to])} = ${formatNumber(converted)} ${to}`;
  }

  function getFactorText(category, from, to) {
    const info = unitData[category];
    if (info.type === "temperature") return "Temperature scales include an offset, so there is no single constant multiplier.";
    if (info.type === "fuelEconomy" && (from === "L/100 km" || to === "L/100 km")) return "L/100 km is an inverse scale, so the conversion depends on the entered value.";
    return `1 ${from} = ${formatNumber(convertUnits(1, category, from, to))} ${to}`;
  }

  function mathNode(name, text) {
    const node = document.createElementNS(NS, name);
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function appendUnit(parent, unit) { parent.appendChild(mathNode("mtext", ` ${unit}`)); }
  function appendValueWithUnit(parent, value, unit) {
    parent.appendChild(mathNode("mn", formatNumber(value)));
    appendUnit(parent, unit);
  }
  function appendOperator(parent, operator) {
    const node = mathNode("mo", operator);
    node.setAttribute("lspace", "0.45em");
    node.setAttribute("rspace", "0.45em");
    parent.appendChild(node);
  }

  function buildMathEquation(value, category, from, to, converted) {
    const math = mathNode("math");
    math.setAttribute("display", "block");
    math.setAttribute("aria-label", getFormulaText(value, category, from, to, converted));
    Object.assign(math.style, {
      fontFamily: '"Cambria Math", "STIX Two Math", "Latin Modern Math", serif',
      fontSize: "1.35rem",
      margin: "0",
      minWidth: "max-content"
    });
    const row = mathNode("mrow");
    const info = unitData[category];

    if (info.type === "temperature" && from === "°F" && to === "°C") {
      const fenced = mathNode("mfenced");
      const inner = mathNode("mrow");
      appendValueWithUnit(inner, value, "°F");
      appendOperator(inner, "−");
      inner.appendChild(mathNode("mn", "32"));
      fenced.appendChild(inner);
      row.appendChild(fenced);
      appendOperator(row, "×");
      const fraction = mathNode("mfrac");
      fraction.append(mathNode("mn", "5"), mathNode("mn", "9"));
      row.appendChild(fraction);
      appendOperator(row, "=");
      appendValueWithUnit(row, converted, to);
    } else if (info.type === "temperature" && from === "°C" && to === "°F") {
      appendValueWithUnit(row, value, from);
      appendOperator(row, "×");
      const fraction = mathNode("mfrac");
      fraction.append(mathNode("mn", "9"), mathNode("mn", "5"));
      row.appendChild(fraction);
      appendOperator(row, "+");
      row.appendChild(mathNode("mn", "32"));
      appendOperator(row, "=");
      appendValueWithUnit(row, converted, to);
    } else if (info.type === "temperature" || (info.type === "fuelEconomy" && (from === "L/100 km" || to === "L/100 km"))) {
      appendValueWithUnit(row, value, from);
      appendOperator(row, "→");
      appendValueWithUnit(row, converted, to);
    } else {
      appendValueWithUnit(row, value, from);
      appendOperator(row, "×");
      row.appendChild(mathNode("mn", formatNumber(info.units[from] / info.units[to])));
      appendOperator(row, "=");
      appendValueWithUnit(row, converted, to);
    }
    math.appendChild(row);
    return math;
  }

  function renderEquationPreview(value, category, from, to, converted) {
    equationPreviewEl.replaceChildren();
    const label = document.createElement("div");
    label.textContent = category;
    Object.assign(label.style, { marginBottom: "0.45rem", color: "var(--ink-soft)", fontSize: "0.72rem", letterSpacing: "0.09em", textTransform: "uppercase" });
    const equationWrap = document.createElement("div");
    Object.assign(equationWrap.style, { display: "flex", alignItems: "center", justifyContent: "center", minHeight: "68px" });
    equationWrap.appendChild(buildMathEquation(value, category, from, to, converted));
    equationPreviewEl.append(label, equationWrap);
  }

  function renderPartialPreview(message, detail = "") {
    equationPreviewEl.replaceChildren();
    const main = document.createElement("div");
    main.textContent = message;
    Object.assign(main.style, { fontFamily: '"Cambria Math", "STIX Two Math", serif', fontSize: "1.15rem", textAlign: "center", padding: "0.65rem 0" });
    const sub = document.createElement("div");
    sub.textContent = detail;
    Object.assign(sub.style, { color: "var(--ink-soft)", fontSize: "0.82rem", textAlign: "center" });
    equationPreviewEl.append(main, sub);
  }

  function renderRelatedConversions(value, category, from, to) {
    relatedResultsEl.replaceChildren();
    const commonUnits = unitData[category].common || getUnits(category);
    const relatedUnits = commonUnits.filter((unit) => unit !== from && unit !== to).slice(0, 6);
    if (!relatedUnits.length) {
      relatedResultsEl.textContent = "No additional units in this category.";
      return;
    }
    relatedUnits.forEach((unit) => {
      const converted = convertUnits(value, category, from, unit);
      const row = document.createElement("div");
      row.className = "related-item";
      const label = document.createElement("span");
      label.className = "related-item-label";
      label.textContent = `${formatNumber(value)} ${from} → ${unit}`;
      const result = document.createElement("span");
      result.className = "related-item-value";
      result.textContent = `${formatNumber(converted)} ${unit}`;
      row.append(label, result);
      relatedResultsEl.appendChild(row);
    });
  }

  function renderConversion(value, category, from, to, updatePreview = false) {
    const converted = convertUnits(value, category, from, to);
    resultValueEl.textContent = `${formatNumber(converted)} ${to}`;
    resultFormulaEl.textContent = getFormulaText(value, category, from, to, converted);
    resultFactorEl.textContent = getFactorText(category, from, to);
    renderRelatedConversions(value, category, from, to);
    if (updatePreview) renderEquationPreview(value, category, from, to, converted);
    return converted;
  }

  function convertValue() {
    const raw = Number.parseFloat(inputValueEl.value);
    const { from, to } = getSelectedUnits();
    if (!Number.isFinite(raw)) {
      resultValueEl.textContent = "—";
      resultFormulaEl.textContent = "Enter a valid numeric value.";
      resultFactorEl.textContent = "";
      relatedResultsEl.replaceChildren();
      return;
    }
    renderConversion(raw, categoryEl.value, from.unit, to.unit);
  }

  function parseQuickQuery(query) {
    const match = query.trim().match(/^([+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?)\s+(.+?)\s+(?:to|in|as|into)\s+(.+)$/i);
    if (!match) return null;
    const value = Number.parseFloat(match[1]);
    const resolved = resolveQueryUnits(match[2], match[3]);
    return Number.isFinite(value) && resolved ? { value, ...resolved } : null;
  }

  function updateLivePreview() {
    if (!queryInputEl || !previewSummaryEl || !previewFactorEl || !queryStatusEl) return;
    const query = queryInputEl.value.trim();
    if (!query) {
      previewSummaryEl.textContent = "Try a quick conversion like “10 in to mm”.";
      previewFactorEl.textContent = "The converter supports mechanical, thermal, fluid, electrical, data, and everyday units.";
      queryStatusEl.textContent = "";
      renderPartialPreview("x · conversion factor = y", "Start typing a value, source unit, and destination unit");
      return;
    }
    const parsed = parseQuickQuery(query);
    if (!parsed) {
      previewSummaryEl.textContent = "Reading your conversion…";
      previewFactorEl.textContent = "Use: value unit to unit. Multi-word units are supported.";
      queryStatusEl.textContent = "Continue typing or check the unit spelling.";
      renderPartialPreview(query, "Waiting for a complete compatible unit pair");
      return;
    }
    categoryEl.value = parsed.category;
    setUnitSelections(parsed.category, parsed.from, parsed.to);
    inputValueEl.value = parsed.value;
    const converted = renderConversion(parsed.value, parsed.category, parsed.from, parsed.to, true);
    previewSummaryEl.textContent = `${formatNumber(parsed.value)} ${parsed.from} = ${formatNumber(converted)} ${parsed.to}`;
    previewFactorEl.textContent = getFactorText(parsed.category, parsed.from, parsed.to);
    queryStatusEl.textContent = `Detected category: ${parsed.category}`;
  }

  function handleUnitChange(changedSelect, otherSelect, changedSide) {
    const chosen = decodedUnit(changedSelect.value);
    const other = decodedUnit(otherSelect.value);
    categoryEl.value = chosen.category;
    if (other.category !== chosen.category) {
      const defaults = defaultUnits[chosen.category] || getUnits(chosen.category).slice(0, 2);
      const fallback = changedSide === "from" ? (defaults[1] || defaults[0]) : defaults[0];
      otherSelect.value = encodedUnit(chosen.category, fallback);
    }
    convertValue();
  }

  function addSwapButton() {
    const grid = categoryEl.closest(".tool-grid");
    if (!grid || document.getElementById("swapUnits")) return;
    const wrapper = document.createElement("div");
    wrapper.className = "field-group converter-swap-group";
    const label = document.createElement("label");
    label.textContent = "Direction";
    label.style.color = "var(--ink-soft)";
    const button = document.createElement("button");
    button.id = "swapUnits";
    button.type = "button";
    button.className = "converter-swap-button";
    button.textContent = "⇄ Swap units";
    Object.assign(button.style, { width: "100%", minHeight: "52px", padding: "0.85rem 1rem", border: "1px solid var(--line)", borderRadius: "12px", background: "rgba(255,255,255,0.08)", color: "var(--ink)", cursor: "pointer" });
    button.addEventListener("click", () => {
      const previousFrom = fromUnitEl.value;
      fromUnitEl.value = toUnitEl.value;
      toUnitEl.value = previousFrom;
      convertValue();
      if (queryInputEl?.value.trim()) updateLivePreview();
    });
    wrapper.append(label, button);
    grid.appendChild(wrapper);
  }

  categoryEl.addEventListener("change", () => { setDefaultUnits(categoryEl.value); convertValue(); });
  fromUnitEl.addEventListener("change", () => handleUnitChange(fromUnitEl, toUnitEl, "from"));
  toUnitEl.addEventListener("change", () => handleUnitChange(toUnitEl, fromUnitEl, "to"));
  inputValueEl.addEventListener("input", convertValue);
  queryInputEl?.addEventListener("input", updateLivePreview);

  populateCategories();
  populateGroupedUnits(fromUnitEl);
  populateGroupedUnits(toUnitEl);
  categoryEl.value = "Length";
  setDefaultUnits("Length");
  addSwapButton();
  convertValue();
  updateLivePreview();
}