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

const defaultUnits = {
  Length: ["in", "mm"],
  Pressure: ["psi", "kPa"],
  Force: ["lbf", "N"],
  Speed: ["mph", "m/s"],
  Temperature: ["F", "C"],
  Torque: ["ft·lb", "N·m"]
};
