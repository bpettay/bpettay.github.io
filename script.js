/* =========================================================
   Unit Definitions
========================================================= */
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
    references: [
      "1 in = 25.4 mm",
      "1 ft = 12 in",
      "1 m = 39.3701 in"
    ]
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
    references: [
      "1 psi = 6.8948 kPa",
      "1 bar = 100 kPa",
      "1 atm = 14.6959 psi"
    ]
  },

  Force: {
    type: "factor",
    units: {
      N: 1,
      kN: 1000,
      lbf: 4.4482216153
    },
    references: [
      "1 lbf = 4.4482 N",
      "1 kN = 1000 N",
      "100 lbf = 444.82 N"
    ]
  },

  Torque: {
    type: "factor",
    units: {
      "N·m": 1,
      "ft·lb": 1.3558179483,
      "in·lb": 0.112984829
    },
    references: [
      "1 ft·lb = 1.3558 N·m",
      "1 in·lb = 0.1130 N·m",
      "1 ft·lb = 12 in·lb"
    ]
  },

  Mass: {
    type: "factor",
    units: {
      mg: 0.000001,
      g: 0.001,
      kg: 1,
      lbm: 0.45359237
    },
    references: [
      "1 lbm = 0.4536 kg",
      "1 kg = 1000 g",
      "1 g = 1000 mg"
    ]
  },

  Volume: {
    type: "factor",
    units: {
      mL: 0.000001,
      L: 0.001,
      "in³": 0.000016387064,
      "ft³": 0.028316846592,
      "m³": 1
    },
    references: [
      "1 L = 1000 mL",
      "1 in³ = 16.387 mL",
      "1 ft³ = 28.3168 L"
    ]
  },

  Speed: {
    type: "factor",
    units: {
      "m/s": 1,
      "ft/s": 0.3048,
      mph: 0.44704,
      "km/h": 0.2777777778
    },
    references: [
      "1 mph = 0.4470 m/s",
      "1 m/s = 3.2808 ft/s",
      "1 km/h = 0.6214 mph"
    ]
  },

  Temperature: {
    type: "temperature",
    units: ["°C", "°F", "K"],
    references: [
      "°F = (°C × 9/5) + 32",
      "°C = (°F - 32) × 5/9",
      "K = °C + 273.15"
    ]
  }
};

/* =========================================================
   DOM Elements
========================================================= */
const categorySelect = document.getElementById("category");
const fromUnitSelect = document.getElementById("fromUnit");
const toUnitSelect = document.getElementById("toUnit");
const inputValue = document.getElementById("inputValue");
const precisionSelect = document.getElementById("precision");
const resultValue = document.getElementById("resultValue");
const resultFormula = document.getElementById("resultFormula");
const referenceList = document.getElementById("referenceList");
const swapButton = document.getElementById("swapUnits");
const copyButton = document.getElementById("copyResult");

/* =========================================================
   Initialize
========================================================= */
function initializeConverter() {
  populateCategories();

  categorySelect.value = "Length";
  populateUnits("Length");

  fromUnitSelect.value = "in";
  toUnitSelect.value = "mm";

  updateReferences("Length");
  convertValue();
}

/* =========================================================
   Populate Categories
========================================================= */
function populateCategories() {
  categorySelect.innerHTML = "";

  Object.keys(unitData).forEach((category) => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    categorySelect.appendChild(option);
  });
}

/* =========================================================
   Populate Units
========================================================= */
function populateUnits(category) {
  fromUnitSelect.innerHTML = "";
  toUnitSelect.innerHTML = "";

  const categoryInfo = unitData[category];
  const units =
    categoryInfo.type === "temperature"
      ? categoryInfo.units
      : Object.keys(categoryInfo.units);

  units.forEach((unit) => {
    const fromOption = document.createElement("option");
    fromOption.value = unit;
    fromOption.textContent = unit;
    fromUnitSelect.appendChild(fromOption);

    const toOption = document.createElement("option");
    toOption.value = unit;
    toOption.textContent = unit;
    toUnitSelect.appendChild(toOption);
  });

  if (units.length >= 2) {
    fromUnitSelect.value = units[0];
    toUnitSelect.value = units[1];
  }
}

/* =========================================================
   Update Reference List
========================================================= */
function updateReferences(category) {
  referenceList.innerHTML = "";

  unitData[category].references.forEach((item) => {
    const li = document.createElement("li");
    li.textContent = item;
    referenceList.appendChild(li);
  });
}

/* =========================================================
   Temperature Conversion
========================================================= */
function convertTemperature(value, from, to) {
  let celsiusValue;

  if (from === "°C") {
    celsiusValue = value;
  } else if (from === "°F") {
    celsiusValue = (value - 32) * (5 / 9);
  } else if (from === "K") {
    celsiusValue = value - 273.15;
  }

  let convertedValue;

  if (to === "°C") {
    convertedValue = celsiusValue;
  } else if (to === "°F") {
    convertedValue = (celsiusValue * 9) / 5 + 32;
  } else if (to === "K") {
    convertedValue = celsiusValue + 273.15;
  }

  return convertedValue;
}

/* =========================================================
   Main Conversion
========================================================= */
function convertValue() {
  const category = categorySelect.value;
  const fromUnit = fromUnitSelect.value;
  const toUnit = toUnitSelect.value;
  const rawValue = parseFloat(inputValue.value);
  const precision = parseInt(precisionSelect.value, 10);

  if (Number.isNaN(rawValue)) {
    resultValue.textContent = "—";
    resultFormula.textContent = "Enter a valid numeric value.";
    return;
  }

  let converted;

  if (unitData[category].type === "temperature") {
    converted = convertTemperature(rawValue, fromUnit, toUnit);
  } else {
    const fromFactor = unitData[category].units[fromUnit];
    const toFactor = unitData[category].units[toUnit];
    converted = (rawValue * fromFactor) / toFactor;
  }

  const formatted = formatNumber(converted, precision);

  resultValue.textContent = `${formatted} ${toUnit}`;
  resultFormula.textContent = `${rawValue} ${fromUnit} = ${formatted} ${toUnit}`;
}

/* =========================================================
   Number Formatting
========================================================= */
function formatNumber(value, decimals) {
  if (!Number.isFinite(value)) return "Invalid";

  const absValue = Math.abs(value);

  if (absValue !== 0 && (absValue >= 1000000 || absValue < 0.0001)) {
    return value.toExponential(decimals);
  }

  return Number(value).toFixed(decimals).replace(/\.?0+$/, "");
}

/* =========================================================
   Swap Units
========================================================= */
function swapUnits() {
  const currentFrom = fromUnitSelect.value;
  fromUnitSelect.value = toUnitSelect.value;
  toUnitSelect.value = currentFrom;
  convertValue();
}

/* =========================================================
   Copy Result
========================================================= */
async function copyResult() {
  const textToCopy = resultValue.textContent;

  if (!textToCopy || textToCopy === "—") return;

  try {
    await navigator.clipboard.writeText(textToCopy);
    copyButton.textContent = "Copied";
    setTimeout(() => {
      copyButton.textContent = "Copy Result";
    }, 1200);
  } catch (error) {
    copyButton.textContent = "Copy Failed";
    setTimeout(() => {
      copyButton.textContent = "Copy Result";
    }, 1200);
  }
}

/* =========================================================
   Events
========================================================= */
categorySelect.addEventListener("change", () => {
  const category = categorySelect.value;
  populateUnits(category);
  updateReferences(category);

  const defaults = {
    Length: ["in", "mm"],
    Pressure: ["psi", "kPa"],
    Force: ["lbf", "N"],
    Torque: ["ft·lb", "N·m"],
    Mass: ["lbm", "kg"],
    Volume: ["in³", "L"],
    Speed: ["mph", "m/s"],
    Temperature: ["°F", "°C"]
  };

  if (defaults[category]) {
    fromUnitSelect.value = defaults[category][0];
    toUnitSelect.value = defaults[category][1];
  }

  convertValue();
});

fromUnitSelect.addEventListener("change", convertValue);
toUnitSelect.addEventListener("change", convertValue);
inputValue.addEventListener("input", convertValue);
precisionSelect.addEventListener("change", convertValue);
swapButton.addEventListener("click", swapUnits);
copyButton.addEventListener("click", copyResult);

/* =========================================================
   Start
========================================================= */
initializeConverter();
