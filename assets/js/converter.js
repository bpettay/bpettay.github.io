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

  const requiredElements = [
    categoryEl,
    fromUnitEl,
    toUnitEl,
    inputValueEl,
    resultValueEl,
    resultFormulaEl,
    resultFactorEl,
    relatedResultsEl
  ];

  if (requiredElements.some((element) => !element) || typeof unitData !== "object") {
    return;
  }

  function normalizeUnit(unit) {
    if (!unit) return "";
    const cleaned = unit
      .trim()
      .replace(/²/g, "^2")
      .replace(/³/g, "^3")
      .replace(/⋅/g, "·")
      .replace(/-/g, "·")
      .toLowerCase();

    const directMatch = findUnitByLowercase(cleaned);
    if (directMatch) return directMatch.unit;

    if (typeof unitAliases === "object" && unitAliases[cleaned]) {
      return unitAliases[cleaned].unit;
    }

    const aliases = {
      inches: "in",
      inch: "in",
      '"': "in",
      feet: "ft",
      foot: "ft",
      "'": "ft",
      pounds: "lb",
      pound: "lb",
      lbs: "lb",
      ounces: "oz",
      ounce: "oz",
      gallons: "gal",
      gallon: "gal",
      liter: "L",
      liters: "L",
      litre: "L",
      litres: "L",
      millimeter: "mm",
      millimeters: "mm",
      centimeter: "cm",
      centimeters: "cm",
      meter: "m",
      meters: "m",
      kilometer: "km",
      kilometers: "km",
      fahrenheit: "F",
      celsius: "C",
      kelvin: "K",
      rpm: "rev",
      horsepower: "hp"
    };

    return aliases[cleaned] || unit.trim();
  }

  function findUnitByLowercase(unitLower) {
    for (const [categoryName, info] of Object.entries(unitData)) {
      const units = info.type === "temperature" ? info.units : Object.keys(info.units);
      const unit = units.find((candidate) => candidate.toLowerCase() === unitLower);
      if (unit) return { category: categoryName, unit };
    }
    return null;
  }

  function findCategoryForUnits(from, to) {
    return Object.entries(unitData).find(([, info]) => {
      const units = info.type === "temperature" ? info.units : Object.keys(info.units);
      return units.includes(from) && units.includes(to);
    })?.[0] || null;
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

    const info = unitData[categoryEl.value];
    const units = info.type === "temperature" ? info.units : Object.keys(info.units);

    units.forEach((unit) => {
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

    if (defaults) {
      fromUnitEl.value = defaults[0];
      toUnitEl.value = defaults[1];
    }
  }

  function formatNumber(value) {
    if (!Number.isFinite(value)) return "Invalid";

    const abs = Math.abs(value);
    if (abs >= 1_000_000 || (abs > 0 && abs < 0.0001)) {
      return value.toExponential(4);
    }

    return Number(value).toFixed(4).replace(/\.?0+$/, "");
  }

  function convertUnits(value, categoryName, from, to) {
    const info = unitData[categoryName];

    if (info.type === "temperature") {
      let celsius = value;

      if (from === "F") celsius = (value - 32) * 5 / 9;
      if (from === "K") celsius = value - 273.15;

      if (to === "F") return celsius * 9 / 5 + 32;
      if (to === "K") return celsius + 273.15;

      return celsius;
    }

    const fromFactor = info.units[from];
    const toFactor = info.units[to];

    return (value * fromFactor) / toFactor;
  }

  function getFormulaText(value, category, from, to, converted) {
    if (category === "Temperature") {
      return `${formatNumber(value)} ${from} = ${formatNumber(converted)} ${to}`;
    }

    const fromFactor = unitData[category].units[from];
    const toFactor = unitData[category].units[to];

    return `${formatNumber(value)} × (${fromFactor}) / (${toFactor}) = ${formatNumber(converted)} ${to}`;
  }

  function getFactorText(category, from, to) {
    if (category === "Temperature") {
      return "Temperature conversions use an offset, not a single constant factor.";
    }

    const fromFactor = unitData[category].units[from];
    const toFactor = unitData[category].units[to];
    const factor = fromFactor / toFactor;

    return `1 ${from} = ${formatNumber(factor)} ${to}`;
  }

  function renderRelatedConversions(value, category, from, to) {
    relatedResultsEl.innerHTML = "";

    const commonUnits = unitData[category].common || [];
    const relatedUnits = commonUnits.filter((unit) => unit !== from && unit !== to);

    if (!relatedUnits.length) {
      relatedResultsEl.textContent = "No related conversions for this category.";
      return;
    }

    relatedUnits.forEach((unit) => {
      const converted = convertUnits(value, category, from, unit);
      const row = document.createElement("div");
      row.className = "related-item";
      row.innerHTML = `
        <span class="related-item-label">${formatNumber(value)} ${from} → ${unit}</span>
        <span class="related-item-value">${formatNumber(converted)} ${unit}</span>
      `;
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
    const raw = parseFloat(inputValueEl.value);

    if (Number.isNaN(raw)) {
      resultValueEl.textContent = "—";
      resultFormulaEl.textContent = "Enter a valid numeric value.";
      resultFactorEl.textContent = "";
      relatedResultsEl.innerHTML = "";
      return;
    }

    renderConversion(raw, categoryEl.value, fromUnitEl.value, toUnitEl.value);
  }

  function parseQuickQuery(query) {
    const match = query.trim().match(/^(-?\d+(?:\.\d+)?)\s*([^\s]+)\s+(?:to|in|as)\s+([^\s]+)$/i);

    if (!match) return null;

    const value = Number.parseFloat(match[1]);
    const from = normalizeUnit(match[2]);
    const to = normalizeUnit(match[3]);
    const category = findCategoryForUnits(from, to);

    if (!Number.isFinite(value) || !category) {
      return null;
    }

    return { value, from, to, category };
  }

  function updateLivePreview() {
    if (!queryInputEl || !previewSummaryEl || !previewFactorEl || !queryStatusEl) {
      return;
    }

    const query = queryInputEl.value.trim();

    if (!query) {
      previewSummaryEl.textContent = "Try a quick conversion like “10 in to mm”.";
      previewFactorEl.textContent = "The standard converter below is ready to use.";
      queryStatusEl.textContent = "";
      return;
    }

    const parsed = parseQuickQuery(query);

    if (!parsed) {
      previewSummaryEl.textContent = "I couldn’t read that conversion yet.";
      previewFactorEl.textContent = "Use the format: value unit to unit. Example: 10 in to mm.";
      queryStatusEl.textContent = "";
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

  function bindEvents() {
    categoryEl.addEventListener("change", () => {
      updateUnits();
      setDefaultUnits();
      convertValue();
    });

    fromUnitEl.addEventListener("change", convertValue);
    toUnitEl.addEventListener("change", convertValue);
    inputValueEl.addEventListener("input", convertValue);

    if (queryInputEl) {
      queryInputEl.addEventListener("input", updateLivePreview);
    }
  }

  populateCategories();
  categoryEl.value = "Length";
  updateUnits();
  setDefaultUnits();
  bindEvents();
  convertValue();
}
