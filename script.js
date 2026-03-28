// ===============================
// Navigation
// ===============================
const tabs = document.querySelectorAll(".nav-link");
const pages = document.querySelectorAll(".page");
const pageButtons = document.querySelectorAll("[data-page-target]");

function openPage(target) {
  tabs.forEach((item) => {
    item.classList.remove("active");
    if (item.dataset.page === target) {
      item.classList.add("active");
    }
  });

  pages.forEach((page) => {
    page.classList.remove("active");
    if (page.id === target) {
      page.classList.add("active");
    }
  });
}

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    openPage(tab.dataset.page);
  });
});

pageButtons.forEach((button) => {
  button.addEventListener("click", () => {
    openPage(button.dataset.pageTarget);
  });
});

// ===============================
// Unit Data
// ===============================
const unitData = {
  Length: {
    type: "factor",
    units: {
      mm: 0.001,
      cm: 0.01,
      m: 1,
      in: 0.0254,
      ft: 0.3048,
      yd: 0.9144
    },
    common: ["mm", "cm", "m", "in", "ft"]
  },
  Pressure: {
    type: "factor",
    units: {
      Pa: 1,
      kPa: 1000,
      MPa: 1000000,
      psi: 6894.757293168,
      bar: 100000,
      atm: 101325
    },
    common: ["psi", "kPa", "MPa", "bar", "atm"]
  },
  Force: {
    type: "factor",
    units: {
      N: 1,
      kN: 1000,
      lbf: 4.4482216153
    },
    common: ["N", "kN", "lbf"]
  },
  Speed: {
    type: "factor",
    units: {
      "m/s": 1,
      "ft/s": 0.3048,
      mph: 0.44704,
      "km/h": 0.2777777778
    },
    common: ["m/s", "ft/s", "mph", "km/h"]
  },
  Temperature: {
    type: "temperature",
    units: ["C", "F", "K"],
    common: ["C", "F", "K"]
  },
  Torque: {
    type: "factor",
    units: {
      "N·m": 1,
      "ft·lb": 1.3558179483,
      "in·lb": 0.112984829
    },
    common: ["N·m", "ft·lb", "in·lb"]
  }
};

// ===============================
// Unit Aliases
// ===============================
const unitAliases = {
  mm: { category: "Length", unit: "mm" },
  millimeter: { category: "Length", unit: "mm" },
  millimeters: { category: "Length", unit: "mm" },

  cm: { category: "Length", unit: "cm" },
  centimeter: { category: "Length", unit: "cm" },
  centimeters: { category: "Length", unit: "cm" },

  m: { category: "Length", unit: "m" },
  meter: { category: "Length", unit: "m" },
  meters: { category: "Length", unit: "m" },

  in: { category: "Length", unit: "in" },
  inch: { category: "Length", unit: "in" },
  inches: { category: "Length", unit: "in" },

  ft: { category: "Length", unit: "ft" },
  foot: { category: "Length", unit: "ft" },
  feet: { category: "Length", unit: "ft" },

  yd: { category: "Length", unit: "yd" },
  yard: { category: "Length", unit: "yd" },
  yards: { category: "Length", unit: "yd" },

  pa: { category: "Pressure", unit: "Pa" },
  kpa: { category: "Pressure", unit: "kPa" },
  mpa: { category: "Pressure", unit: "MPa" },
  psi: { category: "Pressure", unit: "psi" },
  bar: { category: "Pressure", unit: "bar" },
  atm: { category: "Pressure", unit: "atm" },

  n: { category: "Force", unit: "N" },
  kn: { category: "Force", unit: "kN" },
  lbf: { category: "Force", unit: "lbf" },

  "m/s": { category: "Speed", unit: "m/s" },
  ms: { category: "Speed", unit: "m/s" },
  "ft/s": { category: "Speed", unit: "ft/s" },
  fts: { category: "Speed", unit: "ft/s" },
  mph: { category: "Speed", unit: "mph" },
  "km/h": { category: "Speed", unit: "km/h" },
  kmh: { category: "Speed", unit: "km/h" },

  c: { category: "Temperature", unit: "C" },
  degc: { category: "Temperature", unit: "C" },
  celsius: { category: "Temperature", unit: "C" },

  f: { category: "Temperature", unit: "F" },
  degf: { category: "Temperature", unit: "F" },
  fahrenheit: { category: "Temperature", unit: "F" },

  k: { category: "Temperature", unit: "K" },
  kelvin: { category: "Temperature", unit: "K" },

  "n·m": { category: "Torque", unit: "N·m" },
  nm: { category: "Torque", unit: "N·m" },
  "n m": { category: "Torque", unit: "N·m" },

  "ft·lb": { category: "Torque", unit: "ft·lb" },
  ftlb: { category: "Torque", unit: "ft·lb" },
  "ft lb": { category: "Torque", unit: "ft·lb" },
  "lb-ft": { category: "Torque", unit: "ft·lb" },

  "in·lb": { category: "Torque", unit: "in·lb" },
  inlb: { category: "Torque", unit: "in·lb" },
  "in lb": { category: "Torque", unit: "in·lb" }
};

// ===============================
// Elements
// ===============================
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

// ===============================
// Initialize
// ===============================
function initConverter() {
  Object.keys(unitData).forEach((group) => {
    const option = document.createElement("option");
    option.value = group;
    option.textContent = group;
    category.appendChild(option);
  });

  category.value = "Length";
  updateUnits();
  setDefaultUnits();
  convertValue();
}

// ===============================
// Populate Units
// ===============================
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

// ===============================
// Defaults
// ===============================
function setDefaultUnits() {
  const defaults = {
    Length: ["in", "mm"],
    Pressure: ["psi", "kPa"],
    Force: ["lbf", "N"],
    Speed: ["mph", "m/s"],
    Temperature: ["F", "C"],
    Torque: ["ft·lb", "N·m"]
  };

  const selected = defaults[category.value];

  if (selected) {
    fromUnit.value = selected[0];
    toUnit.value = selected[1];
  }
}

// ===============================
// Conversion Helpers
// ===============================
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

// ===============================
// Main Converter
// ===============================
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

// ===============================
// Query Parsing
// ===============================
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

// ===============================
// Preview + Confirm Flow
// ===============================
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

// ===============================
// Events
// ===============================
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

// ===============================
// Start
// ===============================
initConverter();
