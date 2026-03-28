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
  const queryStatus = document.getElementById("queryStatus");
  const previewSummary = document.getElementById("previewSummary");
  const previewFactor = document.getElementById("previewFactor");

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

  function formatNumber(value) {
    if (!Number.isFinite(value)) return "Invalid";

    const absoluteValue = Math.abs(value);

    if (absoluteValue !== 0 && (absoluteValue >= 1000000 || absoluteValue < 0.0001)) {
      return value.toExponential(4);
    }

    return Number(value).toFixed(4).replace(/\.?0+$/, "");
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

  function renderConversion(value, categoryName, from, to) {
    const converted = convertUnits(value, categoryName, from, to);

    resultValue.textContent = `${formatNumber(converted)} ${to}`;
    resultFormula.textContent = getFormulaText(value, categoryName, from, to, converted);
    resultFactor.textContent = getFactorText(categoryName, from, to);

    renderRelatedConversions(value, categoryName, from, to);
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

    renderConversion(raw, category.value, fromUnit.value, toUnit.value);
  }

  function clearPreview(message = "Start typing a conversion request.") {
    previewSummary.textContent = message;
    previewFactor.textContent = "Conversion factor will appear here.";
  }

  function normalizeQuery(query) {
    return query
      .trim()
      .toLowerCase()
      .replace(/degrees/g, "deg")
      .replace(/degree/g, "deg")
      .replace(/°/g, "deg")
      .replace(/square inches/g, "in^2")
      .replace(/square inch/g, "in^2")
      .replace(/square feet/g, "ft^2")
      .replace(/square foot/g, "ft^2")
      .replace(/square millimeters/g, "mm^2")
      .replace(/square millimeter/g, "mm^2")
      .replace(/square centimeters/g, "cm^2")
      .replace(/square centimeter/g, "cm^2")
      .replace(/square meters/g, "m^2")
      .replace(/square meter/g, "m^2")
      .replace(/cubic inches/g, "in^3")
      .replace(/cubic inch/g, "in^3")
      .replace(/cubic feet/g, "ft^3")
      .replace(/cubic foot/g, "ft^3")
      .replace(/cubic centimeters/g, "cm^3")
      .replace(/cubic centimeter/g, "cm^3")
      .replace(/cubic meters/g, "m^3")
      .replace(/cubic meter/g, "m^3")
      .replace(/\s+/g, " ");
  }

  function parseSmartNumber(raw) {
    const text = raw.trim();

    if (/^-?\d+\/\d+$/.test(text)) {
      const [num, den] = text.split("/").map(Number);
      if (den === 0) return NaN;
      return num / den;
    }

    if (/^-?\d+\s+\d+\/\d+$/.test(text)) {
      const parts = text.split(" ");
      const whole = Number(parts[0]);
      const [num, den] = parts[1].split("/").map(Number);
      if (den === 0) return NaN;
      return whole >= 0 ? whole + num / den : whole - num / den;
    }

    return parseFloat(text);
  }

  function resolveUnit(rawUnit) {
    const clean = rawUnit.trim().toLowerCase();
    return unitAliases[clean] || null;
  }

  function parsePartialConversionQuery(query) {
    const normalized = normalizeQuery(query);

    const fullMatch = normalized.match(
      /^(-?(?:\d+(?:\.\d+)?|\d+\/\d+|\d+\s+\d+\/\d+)(?:e[+-]?\d+)?)\s+([a-z0-9\/\^\.\·\-\s]+?)\s+(?:to|in)\s+([a-z0-9\/\^\.\·\-\s]+)$/i
    );

    if (fullMatch) {
      const value = parseSmartNumber(fullMatch[1]);
      const fromRaw = fullMatch[2].trim();
      const toRaw = fullMatch[3].trim();

      const fromResolved = resolveUnit(fromRaw);
      const toResolved = resolveUnit(toRaw);

      if (!Number.isFinite(value)) {
        return { stage: "invalid", message: "Could not parse the value." };
      }

      if (!fromResolved || !toResolved) {
        return { stage: "invalid", message: "Could not recognize one or both units." };
      }

      if (fromResolved.category !== toResolved.category) {
        return { stage: "invalid", message: "Units must belong to the same category." };
      }

      return {
        stage: "complete",
        value,
        category: fromResolved.category,
        from: fromResolved.unit,
        to: toResolved.unit
      };
    }

    const transitionMatch = normalized.match(
      /^(-?(?:\d+(?:\.\d+)?|\d+\/\d+|\d+\s+\d+\/\d+)(?:e[+-]?\d+)?)\s+([a-z0-9\/\^\.\·\-\s]+?)\s+(?:to|in)\s*([a-z0-9\/\^\.\·\-\s]*)$/i
    );

    if (transitionMatch) {
      const value = parseSmartNumber(transitionMatch[1]);
      const fromRaw = transitionMatch[2].trim();
      const toRaw = transitionMatch[3].trim();
      const fromResolved = resolveUnit(fromRaw);

      if (!Number.isFinite(value)) {
        return { stage: "invalid", message: "Could not parse the value." };
      }

      if (!fromResolved) {
        return {
          stage: "partial",
          value,
          summary: `Value recognized: ${formatNumber(value)}. Waiting for a valid source unit.`,
          factor: "Source unit not recognized yet."
        };
      }

      if (!toRaw) {
        return {
          stage: "awaiting-target",
          value,
          category: fromResolved.category,
          from: fromResolved.unit
        };
      }

      const toResolved = resolveUnit(toRaw);

      if (!toResolved) {
        return {
          stage: "target-partial",
          value,
          category: fromResolved.category,
          from: fromResolved.unit,
          rawTarget: toRaw
        };
      }

      if (fromResolved.category !== toResolved.category) {
        return {
          stage: "invalid",
          message: "Units must belong to the same category."
        };
      }

      return {
        stage: "complete",
        value,
        category: fromResolved.category,
        from: fromResolved.unit,
        to: toResolved.unit
      };
    }

    const sourceMatch = normalized.match(
      /^(-?(?:\d+(?:\.\d+)?|\d+\/\d+|\d+\s+\d+\/\d+)(?:e[+-]?\d+)?)\s+([a-z0-9\/\^\.\·\-\s]+)$/i
    );

    if (sourceMatch) {
      const value = parseSmartNumber(sourceMatch[1]);
      const fromRaw = sourceMatch[2].trim();
      const fromResolved = resolveUnit(fromRaw);

      if (!Number.isFinite(value)) {
        return { stage: "invalid", message: "Could not parse the value." };
      }

      if (!fromResolved) {
        return {
          stage: "partial",
          value,
          summary: `Value recognized: ${formatNumber(value)}. Waiting for a valid source unit.`,
          factor: "Source unit not recognized yet."
        };
      }

      return {
        stage: "source",
        value,
        category: fromResolved.category,
        from: fromResolved.unit
      };
    }

    const valueOnlyMatch = normalized.match(
      /^(-?(?:\d+(?:\.\d+)?|\d+\/\d+|\d+\s+\d+\/\d+)(?:e[+-]?\d+)?)$/i
    );

    if (valueOnlyMatch) {
      const value = parseSmartNumber(valueOnlyMatch[1]);

      if (!Number.isFinite(value)) {
        return { stage: "invalid", message: "Could not parse the value." };
      }

      return {
        stage: "value",
        value
      };
    }

    return {
      stage: "idle"
    };
  }

  function updateLivePreview() {
    const query = queryInput.value.trim();

    if (!query) {
      queryStatus.textContent = "Live conversion updates as you type.";
      clearPreview();
      return;
    }

    const parsed = parsePartialConversionQuery(query);

    if (parsed.stage === "idle") {
      queryStatus.textContent = "Use a format like 10 in to mm.";
      clearPreview("Waiting for a numeric value.");
      return;
    }

    if (parsed.stage === "invalid") {
      queryStatus.textContent = parsed.message;
      clearPreview("Could not interpret the request.");
      return;
    }

    if (parsed.stage === "value") {
      inputValue.value = parsed.value;
      previewSummary.textContent = `Value recognized: ${formatNumber(parsed.value)}`;
      previewFactor.textContent = "Waiting for source unit.";
      queryStatus.textContent = "Number detected.";
      return;
    }

    if (parsed.stage === "partial") {
      inputValue.value = parsed.value;
      previewSummary.textContent = parsed.summary;
      previewFactor.textContent = parsed.factor;
      queryStatus.textContent = "Partial request detected.";
      return;
    }

    if (parsed.stage === "source") {
      category.value = parsed.category;
      updateUnits();
      fromUnit.value = parsed.from;
      inputValue.value = parsed.value;

      previewSummary.textContent =
        `Interpreted so far: ${formatNumber(parsed.value)} ${parsed.from} (${parsed.category})`;
      previewFactor.textContent = "Waiting for target unit.";
      queryStatus.textContent = "Source unit recognized.";
      return;
    }

    if (parsed.stage === "awaiting-target") {
      category.value = parsed.category;
      updateUnits();
      fromUnit.value = parsed.from;
      inputValue.value = parsed.value;

      previewSummary.textContent =
        `Interpreted so far: ${formatNumber(parsed.value)} ${parsed.from} → target unit pending`;
      previewFactor.textContent = "Waiting for target unit.";
      queryStatus.textContent = "Target unit not entered yet.";
      return;
    }

    if (parsed.stage === "target-partial") {
      category.value = parsed.category;
      updateUnits();
      fromUnit.value = parsed.from;
      inputValue.value = parsed.value;

      previewSummary.textContent =
        `Interpreted so far: ${formatNumber(parsed.value)} ${parsed.from} → "${parsed.rawTarget}"`;
      previewFactor.textContent = "Target unit is being typed.";
      queryStatus.textContent = "Target unit partially recognized.";
      return;
    }

    if (parsed.stage === "complete") {
      category.value = parsed.category;
      updateUnits();
      fromUnit.value = parsed.from;
      toUnit.value = parsed.to;
      inputValue.value = parsed.value;

      previewSummary.textContent =
        `Interpreted as: ${formatNumber(parsed.value)} ${parsed.from} to ${parsed.to} (${parsed.category})`;
      previewFactor.textContent = getFactorText(parsed.category, parsed.from, parsed.to);
      queryStatus.textContent = "Live conversion updated.";

      renderConversion(parsed.value, parsed.category, parsed.from, parsed.to);
    }
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
    queryInput.addEventListener("input", updateLivePreview);

    queryInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
      }
    });
  }

  populateCategories();
  category.value = "Length";
  updateUnits();
  setDefaultUnits();
  bindEvents();
  convertValue();
  clearPreview();
}
