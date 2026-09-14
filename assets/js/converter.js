function initializeGroupedUnitSelectors() {
  // Compatibility shim: initializeConverter owns selector setup.
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
  const controlGrid = categoryEl?.closest(".tool-grid");
  const converterLayout = categoryEl?.closest(".compact-converter-layout");
  const queryGroup = queryInputEl?.closest(".field-group");
  const resultsGrid = resultValueEl?.closest(".compact-results-grid");
  const previewPanel = previewSummaryEl?.closest(".preview-panel");

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

  function applyStableLayout() {
    const width = window.innerWidth;

    if (converterLayout) {
      converterLayout.style.display = "grid";
      converterLayout.style.gridTemplateAreas = "none";
      converterLayout.style.gridTemplateColumns = "1fr";
      converterLayout.style.gap = width > 720 ? "0.8rem" : "0.65rem";
      converterLayout.style.alignItems = "stretch";
      converterLayout.style.minHeight = "0";
    }

    if (queryGroup) {
      queryGroup.style.gridArea = "auto";
      queryGroup.style.padding = "0";
      queryGroup.style.border = "0";
      queryGroup.style.background = "transparent";
    }

    if (controlGrid) {
      controlGrid.style.gridArea = "auto";
      controlGrid.style.display = "grid";
      controlGrid.style.alignItems = "end";
      controlGrid.style.padding = "0";
      controlGrid.style.border = "0";
      controlGrid.style.background = "transparent";
      controlGrid.style.gap = width > 720 ? "0.7rem" : "0.55rem";

      if (width > 980) {
        controlGrid.style.gridTemplateColumns = "repeat(4, minmax(0, 1fr))";
      } else if (width > 720) {
        controlGrid.style.gridTemplateColumns = "repeat(2, minmax(0, 1fr))";
      } else {
        controlGrid.style.gridTemplateColumns = "1fr";
      }
    }

    if (resultsGrid) {
      resultsGrid.style.gridArea = "auto";
      resultsGrid.style.display = "grid";
      resultsGrid.style.gridTemplateRows = "none";
      resultsGrid.style.gridTemplateColumns = width > 820
        ? "minmax(0, 1fr) minmax(280px, 0.9fr)"
        : "1fr";
      resultsGrid.style.gap = width > 720 ? "0.7rem" : "0.55rem";
      resultsGrid.style.minHeight = "0";
    }
  }

  applyStableLayout();
  window.addEventListener("resize", applyStableLayout, { passive: true });

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
      equation.style.marginTop = "0.55rem";
      equation.style.paddingTop = "0.55rem";
      equation.style.borderTop = "1px solid var(--line)";
      equation.style.color = "var(--ink)";
      equation.style.fontFamily = '"Cambria Math", "STIX Two Math", serif';
      equation.style.overflowX = "auto";
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
    if (!controlGrid || document.getElementById("swapUnits")) return;

    const row = document.createElement("div");
    row.className = "converter-swap-row";
    row.style.display = "flex";
    row.style.justifyContent = "flex-end";
    row.style.marginTop = "0.15rem";

    const button = document.createElement("button");
    button.id = "swapUnits";
    button.type = "button";
    button.textContent = "⇄ Swap units";
    button.setAttribute("aria-label", "Swap source and destination units");
    button.style.minHeight = "36px";
    button.style.padding = "0.45rem 0.75rem";
    button.style.border = "1px solid var(--line)";
    button.style.borderRadius = "7px";
    button.style.color = "var(--ink)";
    button.style.background = "#141b24";
    button.style.cursor = "pointer";

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

    row.appendChild(button);
    controlGrid.insertAdjacentElement("afterend", row);
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
