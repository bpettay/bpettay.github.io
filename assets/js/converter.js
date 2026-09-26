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
  const queryGroup = queryInputEl?.closest(".field-group");
  const resultsGrid = resultValueEl?.closest(".compact-results-grid");

  const required = [
    categoryEl,
    fromUnitEl,
    toUnitEl,
    inputValueEl,
    resultValueEl,
    resultFormulaEl,
    resultFactorEl,
    relatedResultsEl,
    controlGrid,
    resultsGrid,
  ];

  if (required.some((el) => !el) || typeof unitData !== "object") return;
  if (categoryEl.dataset.converterReady === "true") return;
  categoryEl.dataset.converterReady = "true";

  const categoryGroup = categoryEl.closest(".field-group");
  const valueGroup = inputValueEl.closest(".field-group");
  const fromGroup = fromUnitEl.closest(".field-group");
  const toGroup = toUnitEl.closest(".field-group");

  queryGroup?.classList.add("converter-query-group");
  controlGrid.classList.add("converter-control-grid");
  resultsGrid.classList.add("converter-results-grid");
  categoryGroup?.classList.add("converter-category-group");
  valueGroup?.classList.add("converter-value-group");
  fromGroup?.classList.add("converter-from-group");
  toGroup?.classList.add("converter-to-group");

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

  function convertManual() {
    renderConversion(readManualValue(), categoryEl.value, fromUnitEl.value, toUnitEl.value, false);
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

  function setPreviewVisible(visible) {
    if (!previewPanel) return;
    previewPanel.hidden = !visible;
  }

  function resetQuickQuery() {
    if (!queryInputEl) return;
    queryInputEl.value = "";
    if (queryStatusEl) queryStatusEl.textContent = "";
    document.getElementById("equationPreview")?.remove();
    setPreviewVisible(false);
  }

  function updateQuickQuery() {
    if (!queryInputEl || !previewSummaryEl || !previewFactorEl || !queryStatusEl) return;
    const query = queryInputEl.value.trim();

    if (!query) {
      resetQuickQuery();
      return;
    }

    setPreviewVisible(true);
    const parsed = parseQuickQuery(query);

    if (!parsed) {
      previewSummaryEl.textContent = "Waiting for a complete conversion…";
      previewFactorEl.textContent = "Use: value unit to unit";
      queryStatusEl.textContent = "";
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
    if (document.getElementById("swapUnits") || !toGroup) return;

    const wrapper = document.createElement("div");
    wrapper.className = "field-group converter-swap-group";

    const label = document.createElement("span");
    label.className = "converter-swap-label";
    label.textContent = "Swap";
    label.setAttribute("aria-hidden", "true");

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
        updateQuickQuery();
      } else {
        convertManual();
      }
    });

    wrapper.append(label, button);
    controlGrid.insertBefore(wrapper, toGroup);
  }

  function switchToManualMode() {
    resetQuickQuery();
    convertManual();
  }

  categoryEl.addEventListener("change", () => {
    resetQuickQuery();
    setDefaultUnits(categoryEl.value);
    convertManual();
  });
  inputValueEl.addEventListener("input", switchToManualMode);
  fromUnitEl.addEventListener("change", switchToManualMode);
  toUnitEl.addEventListener("change", switchToManualMode);
  queryInputEl?.addEventListener("input", updateQuickQuery);

  populateCategories();
  categoryEl.value = Object.prototype.hasOwnProperty.call(unitData, "Length") ? "Length" : Object.keys(unitData)[0];
  setDefaultUnits(categoryEl.value);
  installSwapButton();
  setPreviewVisible(false);
  convertManual();
}
