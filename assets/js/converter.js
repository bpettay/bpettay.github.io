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

  function populateCategories() {
    categoryEl.innerHTML = "";
    Object.keys(unitData).forEach(group => {
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

    units.forEach(unit => {
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
      let c = value;
      if (from === "F") c = (value - 32) * 5 / 9;
      if (from === "K") c = value - 273.15;
      if (to === "F") return c * 9 / 5 + 32;
      if (to === "K") return c + 273.15;
      return c;
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
    // Temperature special cases omitted for brevity - keep your existing logic if needed
    const fromFactor = unitData[category].units[from];
    const toFactor = unitData[category].units[to];
    const factor = fromFactor / toFactor;
    return `1 ${from} = ${formatNumber(factor)} ${to}`;
  }

  function renderRelatedConversions(value, category, from, to) {
    relatedResultsEl.innerHTML = "";
    const units = unitData[category].common.filter(u => u !== from && u !== to);

    units.forEach(unit => {
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
  }

  function convertValue() {
    const raw = parseFloat(inputValueEl.value);
    if (Number.isNaN(raw)) {
      resultValueEl.textContent = "—";
      resultFormulaEl.textContent = "Enter a valid numeric value.";
      relatedResultsEl.innerHTML = "";
      return;
    }
    renderConversion(raw, categoryEl.value, fromUnitEl.value, toUnitEl.value);
  }

  // Live preview (your smart query parser) - keep as-is or simplify if needed
  // (Paste your existing updateLivePreview and parse functions here if you want me to clean them too)

  function bindEvents() {
    categoryEl.addEventListener("change", () => {
      updateUnits();
      setDefaultUnits();
      convertValue();
    });

    fromUnitEl.addEventListener("change", convertValue);
    toUnitEl.addEventListener("change", convertValue);
    inputValueEl.addEventListener("input", convertValue);
    queryInputEl.addEventListener("input", updateLivePreview); // your live preview function
  }

  // Initialize
  populateCategories();
  categoryEl.value = "Length";
  updateUnits();
  setDefaultUnits();
  bindEvents();
  convertValue();
}
