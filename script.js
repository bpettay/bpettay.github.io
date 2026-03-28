// ================= NAVIGATION =================
const tabs = document.querySelectorAll(".nav-link");
const pages = document.querySelectorAll(".page");

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    const target = tab.dataset.page;

    tabs.forEach((t) => t.classList.remove("active"));
    tab.classList.add("active");

    pages.forEach((p) => {
      p.classList.remove("active");
      if (p.id === target) p.classList.add("active");
    });
  });
});

// ================= UNIT DATA =================
const unitData = {
  Length: {
    units: { mm: 0.001, cm: 0.01, m: 1, in: 0.0254, ft: 0.3048 }
  },
  Pressure: {
    units: { Pa: 1, kPa: 1000, MPa: 1e6, psi: 6894.757 }
  },
  Force: {
    units: { N: 1, kN: 1000, lbf: 4.44822 }
  },
  Speed: {
    units: { "m/s": 1, mph: 0.44704, "km/h": 0.27778 }
  }
};

// ================= ELEMENTS =================
const category = document.getElementById("category");
const fromUnit = document.getElementById("fromUnit");
const toUnit = document.getElementById("toUnit");
const inputValue = document.getElementById("inputValue");
const resultValue = document.getElementById("resultValue");

// ================= INIT =================
function init() {
  Object.keys(unitData).forEach((cat) => {
    const option = document.createElement("option");
    option.value = cat;
    option.textContent = cat;
    category.appendChild(option);
  });

  category.value = "Length";
  updateUnits();
  convert();
}

// ================= UPDATE UNITS =================
function updateUnits() {
  fromUnit.innerHTML = "";
  toUnit.innerHTML = "";

  const units = Object.keys(unitData[category.value].units);

  units.forEach((u) => {
    const o1 = document.createElement("option");
    const o2 = document.createElement("option");

    o1.value = o2.value = u;
    o1.textContent = o2.textContent = u;

    fromUnit.appendChild(o1);
    toUnit.appendChild(o2);
  });

  fromUnit.value = units[0];
  toUnit.value = units[1] || units[0];
}

// ================= CONVERT =================
function convert() {
  const val = parseFloat(inputValue.value);
  if (isNaN(val)) {
    resultValue.textContent = "—";
    return;
  }

  const data = unitData[category.value].units;
  const result = (val * data[fromUnit.value]) / data[toUnit.value];

  resultValue.textContent = result.toFixed(4) + " " + toUnit.value;
}

// ================= EVENTS =================
category.addEventListener("change", () => {
  updateUnits();
  convert();
});

fromUnit.addEventListener("change", convert);
toUnit.addEventListener("change", convert);
inputValue.addEventListener("input", convert);

// ================= START =================
init();
