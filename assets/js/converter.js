function initializeConverter() {
  const category = document.getElementById("category");
  const fromUnit = document.getElementById("fromUnit");
  const toUnit = document.getElementById("toUnit");
  const inputValue = document.getElementById("inputValue");
  const resultValue = document.getElementById("resultValue");
  const resultFormula = document.getElementById("resultFormula");
  const resultFactor = document.getElementById("resultFactor");
  const relatedResults = document.getElementById("relatedResults");

  const queryInput = document.getElementById("queryInput");
  const previewQuery = document.getElementById("previewQuery");
  const confirmQuery = document.getElementById("confirmQuery");
  const queryStatus = document.getElementById("queryStatus");
  const previewSummary = document.getElementById("previewSummary");
  const previewFactor = document.getElementById("previewFactor");

  let pendingParsedQuery = null;

  function populateCategories() {
    category.innerHTML = "";

    Object.keys(unitData).forEach((group) => {
      const option = document.createElement("option");
      option.value = group;
      option.textContent = group;
      category.appendChild(option);
    });
  }

  function updateUnits() {
    fromUnit.innerHTML = "";
    toUnit.innerHTML = "";

    const info = unitData[category.value];
    const units = info.type === "temperature" ? info.units : Object.keys(info.units);

    units.forEach((unit) => {
      const optionFrom = document.createElement("option");
      optionFrom.value = unit;
      optionFrom.textContent = unit;
      fromUnit.appendChild(optionFrom);

      const optionTo = document.createElement("option");
      optionTo.value = unit;
      optionTo.textContent = unit;
      toUnit.appendChild(optionTo);
    });
  }

  function setDefaultUnits() {
    const selected = defaultUnits[category.value];

    if (selected) {
      fromUnit.value = selected[0];
      toUnit.value = selected[1];
    }
  }

  function convertTemperature(value, from, to) {
    let celsius;

    if (from === "C") celsius = value;
    if (from === "F") celsius = (value - 32) * (5 / 9);
    if (from === "K") celsius = value - 273.15;

    if (to === "C") return celsius;
    if (to === "F") return (celsius * 9) / 5 + 32;
    if (to === "K") return celsius + 273.15;

    return value;
  }

  function convertUnits(value, categoryName, from, to) {
    const info = unitData[categoryName];

    if (info.type === "temperature") {
      return convertTemperature(value, from, to);
    }

    const fromFactor = info.units[from];
    const toFactor = info.units[to];

    return (value * fromFactor) / toFactor;
  }

  function formatNumber(value) {
    if (!Number.isFinite(value)) return "Invalid";

    const absoluteValue = Math.abs(value);

    if (absoluteValue !== 0 && (absoluteValue >= 1000000 || absoluteValue < 0.0001)) {
      return value.toExponential(4);
    }

    return Number(value).toFixed(4).replace(/\.?0+$/, "");
  }

  function getFormulaText(value, categoryName, from, to, converted) {
    if (categoryName === "Temperature") {
      return `${formatNumber(value)} ${from} = ${formatNumber(converted)} ${to}`;
    }

    const fromFactor = unitData[categoryName].units[from];
    const toFactor = unitData[categoryName].units[to];

    return `${formatNumber(value)} × (${fromFactor}) ÷ (${toFactor}) = ${formatNumber(converted)} ${to}`;
  }

  function getFactorText(categoryName, from, to) {
    if (categoryName === "Temperature") {
      if (from === "C" && to === "F") return "Conversion rule: °F = (°C × 9/5) + 32";
      if (from === "F" && to === "C") return "Conversion rule: °C = (°F - 32) × 5/9";
      if (from === "C" && to === "K") return "Conversion rule: K = °C + 273.15";
      if (from === "K" && to === "C") return "Conversion rule: °C = K - 273.15";
      if (from === "F" && to === "K") return "Conversion rule: K = (°F - 32) × 5/9 + 273.15";
      if (from === "K" && to === "F") return "Conversion rule: °F = (K - 273.15) × 9/5 + 32";
      return "Conversion rule: temperature conversion is affine, not a single constant factor.";
    }

    const fromFactor = unitData[categoryName].units[from];
    const toFactor = unitData[categoryName].units[to];
    const factor = fromFactor / toFactor;

    return `Conversion factor: 1 ${from} = ${formatNumber(factor)} ${to}`;
  }

  function renderRelatedConversions(value, categoryName, from, to) {
    relatedResults.innerHTML = "";

    const units = unitData[categoryName].common.filter((unit) => unit !== from && unit !== to);

    units.forEach((unit) => {
      const converted = convertUnits(value, categoryName, from, unit);

      const row = document.createElement("div");
      row.className = "related-item";
      row.innerHTML = `
        <span class="related-item-label">${formatNumber(value)} ${from} to ${unit}</span>
        <span class="related-item-value">${formatNumber(converted)} ${unit}</span>
      `;

      relatedResults.appendChild(row);
    });

    if (!units.length) {
      relatedResults.innerHTML = `
        <div class="related-item">
          <span class="related-item-label">No additional common units.</span>
        </div>
      `;
    }
  }

  function convertValue() {
    const raw = parseFloat(inputValue.value);

    if (Number.isNaN(raw)) {
      resultValue.textContent = "—";
      resultFormula.textContent = "Enter a valid numeric value.";
      resultFactor.textContent = "Conversion factor: —";
      relatedResults.innerHTML = "";
      return;
    }

    const converted = convertUnits(raw, category.value, fromUnit.value, toUnit.value);

    resultValue.textContent = `${formatNumber(converted)} ${toUnit.value}`;
    resultFormula.textContent = getFormulaText(raw, category.value, fromUnit.value, toUnit.value, converted);
    resultFactor.textContent = getFactorText(category.value, fromUnit.value, toUnit.value);

    renderRelatedConversions(raw, category.value, fromUnit.value, toUnit.value);
  }

  function normalizeQuery(query) {
    return query
      .trim()
      .toLowerCase()
      .replace(/degrees/g, "deg")
      .replace(/degree/g, "deg")
      .replace(/°/g, "deg")
      .replace(/\s+/g, " ");
  }

  function resolveUnit(rawUnit) {
    const clean = rawUnit.trim().toLowerCase();
    return unitAliases[clean] || null;
  }

  function parseConversionQuery(query) {
    const normalized = normalizeQuery(query);
    const patterns = [
      /^(-?\d*\.?\d+(?:e[+-]?\d+)?)\s+([a-z\/·\-\s]+?)\s+(?:to|in)\s+([a-z\/·\-\s]+)$/i
    ];

    for (const pattern of patterns) {
      const match = normalized.match(pattern);

      if (!match) continue;

      const value = parseFloat(match[1]);
      const fromRaw = match[2].trim();
      const toRaw = match[3].trim();

      const fromResolved = resolveUnit(fromRaw);
      const toResolved = resolveUnit(toRaw);

      if (!fromResolved || !toResolved) {
        return { error: "Could not recognize one or both units." };
      }

      if (fromResolved.category !== toResolved.category) {
        return { error: "Units must belong to the same category." };
      }

      return {
        value,
        category: fromResolved.category,
        from: fromResolved.unit,
        to: toResolved.unit
      };
    }

    return { error: "Use a format like 10 in to mm." };
  }

  function previewNaturalLanguageConversion() {
    const query = queryInput.value.trim();

    pendingParsedQuery = null;
    confirmQuery.disabled = true;

    if (!query) {
      queryStatus.textContent = "Enter a conversion request like 10 in to mm.";
      previewSummary.textContent = "No request previewed yet.";
      previewFactor.textContent = "Conversion factor will appear here.";
      return;
    }

    const parsed = parseConversionQuery(query);

    if (parsed.error) {
      queryStatus.textContent = parsed.error;
      previewSummary.textContent = "Could not preview the request.";
      previewFactor.textContent = "Conversion factor will appear here.";
      return;
    }

    pendingParsedQuery = parsed;
    confirmQuery.disabled = false;

    queryStatus.textContent = "Preview looks good? Click Convert.";
    previewSummary.textContent =
      `Interpreted as: ${formatNumber(parsed.value)} ${parsed.from} to ${parsed.to} (${parsed.category})`;
    previewFactor.textContent = getFactorText(parsed.category, parsed.from, parsed.to);
  }

  function confirmNaturalLanguageConversion() {
    if (!pendingParsedQuery) {
      queryStatus.textContent = "Preview a request first.";
      return;
    }

    category.value = pendingParsedQuery.category;
    updateUnits();
    fromUnit.value = pendingParsedQuery.from;
    toUnit.value = pendingParsedQuery.to;
    inputValue.value = pendingParsedQuery.value;

    convertValue();

    queryStatus.textContent =
      `Converted: ${formatNumber(pendingParsedQuery.value)} ${pendingParsedQuery.from} to ${pendingParsedQuery.to}`;
  }

  function bindEvents() {
    category.addEventListener("change", () => {
      updateUnits();
      setDefaultUnits();
      convertValue();
    });

    fromUnit.addEventListener("change", convertValue);
    toUnit.addEventListener("change", convertValue);
    inputValue.addEventListener("input", convertValue);

    previewQuery.addEventListener("click", previewNaturalLanguageConversion);
    confirmQuery.addEventListener("click", confirmNaturalLanguageConversion);

    queryInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        previewNaturalLanguageConversion();
      }
    });
  }

  populateCategories();
  category.value = "Length";
  updateUnits();
  setDefaultUnits();
  bindEvents();
  convertValue();
}
