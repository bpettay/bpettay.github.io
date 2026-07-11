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

  const requiredElements = [categoryEl, fromUnitEl, toUnitEl, inputValueEl, resultValueEl, resultFormulaEl, resultFactorEl, relatedResultsEl];
  if (requiredElements.some((element) => !element) || typeof unitData !== "object") return;

  const getUnits = (categoryName) => {
    const info = unitData[categoryName];
    return Array.isArray(info.units) ? info.units : Object.keys(info.units);
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

    Object.entries(unitData).forEach(([category, info]) => {
      getUnits(category).forEach((unit) => {
        if (comparableUnit(unit) === normalized) matches.push({ category, unit });
      });
    });

    const alias = typeof unitAliases === "object" ? unitAliases[canonicalText(rawUnit)] : null;
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
    categoryEl.innerHTML = "";
    Object.keys(unitData).forEach((group) => {
      const option = document.createElement("option");
      option.value = group;
      option.textContent = group;
      categoryEl.appendChild(option);
    });
  }

  function updateUnits() {
    fromUnitEl.innerHTML = "";
    toUnitEl.innerHTML = "";

    getUnits(categoryEl.value).forEach((unit) => {
      const optFrom = document.createElement("option");
      optFrom.value = unit;
      optFrom.textContent = unit;
      fromUnitEl.appendChild(optFrom);

      const optTo = document.createElement("option");
      optTo.value = unit;
      optTo.textContent = unit;
      toUnitEl.appendChild(optTo);
    });
  }

  function setDefaultUnits() {
    const defaults = defaultUnits[categoryEl.value];
    if (!defaults) return;
    fromUnitEl.value = defaults[0];
    toUnitEl.value = defaults[1];
  }

  function formatNumber(value) {
    if (!Number.isFinite(value)) return "Invalid";
    if (Object.is(value, -0)) value = 0;

    const abs = Math.abs(value);
    if (abs >= 1e9 || (abs > 0 && abs < 1e-6)) return value.toExponential(6);

    return new Intl.NumberFormat("en-US", {
      maximumSignificantDigits: 10,
      maximumFractionDigits: 8,
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

  function convertUnits(value, categoryName, from, to) {
    const info = unitData[categoryName];
    if (from === to) return value;

    if (info.type === "temperature") return fromCelsius(toCelsius(value, from), to);
    if (info.type === "fuelEconomy") return kmPerLiterToFuelEconomy(fuelEconomyToKmPerLiter(value, from), to);

    return (value * info.units[from]) / info.units[to];
  }

  function getFormulaText(value, category, from, to, converted) {
    const info = unitData[category];
    if (info.type === "temperature") return `${formatNumber(value)} ${from} = ${formatNumber(converted)} ${to} (absolute temperature scale conversion)`;
    if (info.type === "fuelEconomy") return `${formatNumber(value)} ${from} = ${formatNumber(converted)} ${to} (distance-per-volume / volume-per-distance conversion)`;

    return `${formatNumber(value)} ${from} × ${formatNumber(info.units[from] / info.units[to])} = ${formatNumber(converted)} ${to}`;
  }

  function getFactorText(category, from, to) {
    const info = unitData[category];
    if (info.type === "temperature") return "Temperature scales include an offset, so there is no single constant multiplier.";
    if (info.type === "fuelEconomy" && (from === "L/100 km" || to === "L/100 km")) return "L/100 km is an inverse fuel-consumption scale; the conversion depends on the entered value.";

    const factor = convertUnits(1, category, from, to);
    return `1 ${from} = ${formatNumber(factor)} ${to}`;
  }

  function renderRelatedConversions(value, category, from, to) {
    relatedResultsEl.innerHTML = "";
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

  function renderConversion(value, category, from, to) {
    const converted = convertUnits(value, category, from, to);
    resultValueEl.textContent = `${formatNumber(converted)} ${to}`;
    resultFormulaEl.textContent = getFormulaText(value, category, from, to, converted);
    resultFactorEl.textContent = getFactorText(category, from, to);
    renderRelatedConversions(value, category, from, to);
    return converted;
  }

  function convertValue() {
    const raw = Number.parseFloat(inputValueEl.value);
    if (!Number.isFinite(raw)) {
      resultValueEl.textContent = "—";
      resultFormulaEl.textContent = "Enter a valid numeric value.";
      resultFactorEl.textContent = "";
      relatedResultsEl.innerHTML = "";
      return;
    }

    renderConversion(raw, categoryEl.value, fromUnitEl.value, toUnitEl.value);
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
      return;
    }

    const parsed = parseQuickQuery(query);
    if (!parsed) {
      previewSummaryEl.textContent = "I couldn’t match that unit pair.";
      previewFactorEl.textContent = "Use: value unit to unit. Multi-word units work, for example: 30 mpg US to L/100 km.";
      queryStatusEl.textContent = "Check the unit spelling or select the category manually.";
      return;
    }

    categoryEl.value = parsed.category;
    updateUnits();
    fromUnitEl.value = parsed.from;
    toUnitEl.value = parsed.to;
    inputValueEl.value = parsed.value;

    const converted = renderConversion(parsed.value, parsed.category, parsed.from, parsed.to);
    previewSummaryEl.textContent = `${formatNumber(parsed.value)} ${parsed.from} = ${formatNumber(converted)} ${parsed.to}`;
    previewFactorEl.textContent = getFactorText(parsed.category, parsed.from, parsed.to);
    queryStatusEl.textContent = `Detected category: ${parsed.category}`;
  }

  function addSwapButton() {
    const grid = categoryEl.closest(".tool-grid");
    if (!grid || document.getElementById("swapUnits")) return;

    const wrapper = document.createElement("div");
    wrapper.className = "field-group converter-swap-group";

    const label = document.createElement("label");
    label.textContent = "Direction";

    const button = document.createElement("button");
    button.id = "swapUnits";
    button.type = "button";
    button.className = "converter-swap-button";
    button.textContent = "⇄ Swap units";
    button.addEventListener("click", () => {
      const previousFrom = fromUnitEl.value;
      fromUnitEl.value = toUnitEl.value;
      toUnitEl.value = previousFrom;
      convertValue();
    });

    wrapper.append(label, button);
    grid.appendChild(wrapper);
  }

  categoryEl.addEventListener("change", () => {
    updateUnits();
    setDefaultUnits();
    convertValue();
  });
  fromUnitEl.addEventListener("change", convertValue);
  toUnitEl.addEventListener("change", convertValue);
  inputValueEl.addEventListener("input", convertValue);
  if (queryInputEl) queryInputEl.addEventListener("input", updateLivePreview);

  populateCategories();
  categoryEl.value = "Length";
  updateUnits();
  setDefaultUnits();
  addSwapButton();
  convertValue();
}