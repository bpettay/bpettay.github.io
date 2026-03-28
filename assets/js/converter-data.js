const unitData = {
  Length: {
    type: "factor",
    units: {
      mm: 0.001,
      cm: 0.01,
      m: 1,
      km: 1000,
      in: 0.0254,
      ft: 0.3048,
      yd: 0.9144
    },
    common: ["mm", "cm", "m", "in", "ft"]
  },

  Area: {
    type: "factor",
    units: {
      "mm^2": 0.000001,
      "cm^2": 0.0001,
      "m^2": 1,
      "in^2": 0.00064516,
      "ft^2": 0.09290304
    },
    common: ["mm^2", "cm^2", "m^2", "in^2", "ft^2"]
  },

  Volume: {
    type: "factor",
    units: {
      mL: 0.000001,
      L: 0.001,
      "m^3": 1,
      "cm^3": 0.000001,
      "mm^3": 0.000000001,
      "in^3": 0.000016387064,
      "ft^3": 0.028316846592,
      gal: 0.003785411784
    },
    common: ["mL", "L", "in^3", "ft^3", "gal"]
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
  },

  Density: {
    type: "factor",
    units: {
      "kg/m^3": 1,
      "g/cm^3": 1000,
      "lb/ft^3": 16.01846337396,
      "lb/in^3": 27679.904710203
    },
    common: ["kg/m^3", "g/cm^3", "lb/ft^3", "lb/in^3"]
  },

  "Flow Rate": {
    type: "factor",
    units: {
      "m^3/s": 1,
      "L/s": 0.001,
      "L/min": 0.0000166666666667,
      gpm: 0.0000630901964,
      cfm: 0.00047194745
    },
    common: ["L/min", "gpm", "cfm", "L/s", "m^3/s"]
  },

  Power: {
    type: "factor",
    units: {
      W: 1,
      kW: 1000,
      hp: 745.699871582
    },
    common: ["W", "kW", "hp"]
  },

  Energy: {
    type: "factor",
    units: {
      J: 1,
      kJ: 1000,
      BTU: 1055.05585262,
      "ft·lb": 1.3558179483,
      Wh: 3600
    },
    common: ["J", "kJ", "BTU", "ft·lb", "Wh"]
  }
};

const unitAliases = {
  // length
  mm: { category: "Length", unit: "mm" },
  millimeter: { category: "Length", unit: "mm" },
  millimeters: { category: "Length", unit: "mm" },

  cm: { category: "Length", unit: "cm" },
  centimeter: { category: "Length", unit: "cm" },
  centimeters: { category: "Length", unit: "cm" },

  m: { category: "Length", unit: "m" },
  meter: { category: "Length", unit: "m" },
  meters: { category: "Length", unit: "m" },

  km: { category: "Length", unit: "km" },
  kilometer: { category: "Length", unit: "km" },
  kilometers: { category: "Length", unit: "km" },

  in: { category: "Length", unit: "in" },
  inch: { category: "Length", unit: "in" },
  inches: { category: "Length", unit: "in" },

  ft: { category: "Length", unit: "ft" },
  foot: { category: "Length", unit: "ft" },
  feet: { category: "Length", unit: "ft" },

  yd: { category: "Length", unit: "yd" },
  yard: { category: "Length", unit: "yd" },
  yards: { category: "Length", unit: "yd" },

  // area
  "mm^2": { category: "Area", unit: "mm^2" },
  mm2: { category: "Area", unit: "mm^2" },
  "square mm": { category: "Area", unit: "mm^2" },
  "square millimeter": { category: "Area", unit: "mm^2" },
  "square millimeters": { category: "Area", unit: "mm^2" },

  "cm^2": { category: "Area", unit: "cm^2" },
  cm2: { category: "Area", unit: "cm^2" },
  "square cm": { category: "Area", unit: "cm^2" },
  "square centimeter": { category: "Area", unit: "cm^2" },
  "square centimeters": { category: "Area", unit: "cm^2" },

  "m^2": { category: "Area", unit: "m^2" },
  m2: { category: "Area", unit: "m^2" },
  "square m": { category: "Area", unit: "m^2" },
  "square meter": { category: "Area", unit: "m^2" },
  "square meters": { category: "Area", unit: "m^2" },

  "in^2": { category: "Area", unit: "in^2" },
  in2: { category: "Area", unit: "in^2" },
  "sq in": { category: "Area", unit: "in^2" },
  "square inch": { category: "Area", unit: "in^2" },
  "square inches": { category: "Area", unit: "in^2" },

  "ft^2": { category: "Area", unit: "ft^2" },
  ft2: { category: "Area", unit: "ft^2" },
  "sq ft": { category: "Area", unit: "ft^2" },
  "square foot": { category: "Area", unit: "ft^2" },
  "square feet": { category: "Area", unit: "ft^2" },

  // volume
  ml: { category: "Volume", unit: "mL" },
  mL: { category: "Volume", unit: "mL" },
  milliliter: { category: "Volume", unit: "mL" },
  milliliters: { category: "Volume", unit: "mL" },

  l: { category: "Volume", unit: "L" },
  L: { category: "Volume", unit: "L" },
  liter: { category: "Volume", unit: "L" },
  liters: { category: "Volume", unit: "L" },

  "m^3": { category: "Volume", unit: "m^3" },
  m3: { category: "Volume", unit: "m^3" },
  "cubic m": { category: "Volume", unit: "m^3" },
  "cubic meter": { category: "Volume", unit: "m^3" },
  "cubic meters": { category: "Volume", unit: "m^3" },

  "cm^3": { category: "Volume", unit: "cm^3" },
  cm3: { category: "Volume", unit: "cm^3" },
  cc: { category: "Volume", unit: "cm^3" },
  "cubic cm": { category: "Volume", unit: "cm^3" },
  "cubic centimeter": { category: "Volume", unit: "cm^3" },
  "cubic centimeters": { category: "Volume", unit: "cm^3" },

  "mm^3": { category: "Volume", unit: "mm^3" },
  mm3: { category: "Volume", unit: "mm^3" },

  "in^3": { category: "Volume", unit: "in^3" },
  in3: { category: "Volume", unit: "in^3" },
  "cubic in": { category: "Volume", unit: "in^3" },
  "cubic inch": { category: "Volume", unit: "in^3" },
  "cubic inches": { category: "Volume", unit: "in^3" },

  "ft^3": { category: "Volume", unit: "ft^3" },
  ft3: { category: "Volume", unit: "ft^3" },
  "cubic ft": { category: "Volume", unit: "ft^3" },
  "cubic foot": { category: "Volume", unit: "ft^3" },
  "cubic feet": { category: "Volume", unit: "ft^3" },

  gal: { category: "Volume", unit: "gal" },
  gallon: { category: "Volume", unit: "gal" },
  gallons: { category: "Volume", unit: "gal" },

  // pressure
  pa: { category: "Pressure", unit: "Pa" },
  kpa: { category: "Pressure", unit: "kPa" },
  mpa: { category: "Pressure", unit: "MPa" },
  psi: { category: "Pressure", unit: "psi" },
  bar: { category: "Pressure", unit: "bar" },
  atm: { category: "Pressure", unit: "atm" },

  // force
  n: { category: "Force", unit: "N" },
  kn: { category: "Force", unit: "kN" },
  lbf: { category: "Force", unit: "lbf" },

  // speed
  "m/s": { category: "Speed", unit: "m/s" },
  ms: { category: "Speed", unit: "m/s" },
  "ft/s": { category: "Speed", unit: "ft/s" },
  fts: { category: "Speed", unit: "ft/s" },
  mph: { category: "Speed", unit: "mph" },
  "km/h": { category: "Speed", unit: "km/h" },
  kmh: { category: "Speed", unit: "km/h" },

  // temp
  c: { category: "Temperature", unit: "C" },
  degc: { category: "Temperature", unit: "C" },
  celsius: { category: "Temperature", unit: "C" },

  f: { category: "Temperature", unit: "F" },
  degf: { category: "Temperature", unit: "F" },
  fahrenheit: { category: "Temperature", unit: "F" },

  k: { category: "Temperature", unit: "K" },
  kelvin: { category: "Temperature", unit: "K" },

  // torque
  "n·m": { category: "Torque", unit: "N·m" },
  nm: { category: "Torque", unit: "N·m" },
  "n m": { category: "Torque", unit: "N·m" },

  "ft·lb": { category: "Torque", unit: "ft·lb" },
  ftlb: { category: "Torque", unit: "ft·lb" },
  "ft lb": { category: "Torque", unit: "ft·lb" },
  "lb-ft": { category: "Torque", unit: "ft·lb" },

  "in·lb": { category: "Torque", unit: "in·lb" },
  inlb: { category: "Torque", unit: "in·lb" },
  "in lb": { category: "Torque", unit: "in·lb" },

  // density
  "kg/m^3": { category: "Density", unit: "kg/m^3" },
  "kg/m3": { category: "Density", unit: "kg/m^3" },
  "kilogram per cubic meter": { category: "Density", unit: "kg/m^3" },
  "kilograms per cubic meter": { category: "Density", unit: "kg/m^3" },

  "g/cm^3": { category: "Density", unit: "g/cm^3" },
  "g/cm3": { category: "Density", unit: "g/cm^3" },
  "gram per cubic centimeter": { category: "Density", unit: "g/cm^3" },
  "grams per cubic centimeter": { category: "Density", unit: "g/cm^3" },

  "lb/ft^3": { category: "Density", unit: "lb/ft^3" },
  "lb/ft3": { category: "Density", unit: "lb/ft^3" },
  "lbs/ft^3": { category: "Density", unit: "lb/ft^3" },
  "lbs/ft3": { category: "Density", unit: "lb/ft^3" },
  "pound per cubic foot": { category: "Density", unit: "lb/ft^3" },
  "pounds per cubic foot": { category: "Density", unit: "lb/ft^3" },

  "lb/in^3": { category: "Density", unit: "lb/in^3" },
  "lb/in3": { category: "Density", unit: "lb/in^3" },
  "lbs/in^3": { category: "Density", unit: "lb/in^3" },
  "lbs/in3": { category: "Density", unit: "lb/in^3" },
  "pound per cubic inch": { category: "Density", unit: "lb/in^3" },
  "pounds per cubic inch": { category: "Density", unit: "lb/in^3" },

  // flow rate
  "m^3/s": { category: "Flow Rate", unit: "m^3/s" },
  "m3/s": { category: "Flow Rate", unit: "m^3/s" },

  "l/s": { category: "Flow Rate", unit: "L/s" },
  "lps": { category: "Flow Rate", unit: "L/s" },

  "l/min": { category: "Flow Rate", unit: "L/min" },
  "lpm": { category: "Flow Rate", unit: "L/min" },

  gpm: { category: "Flow Rate", unit: "gpm" },
  "gal/min": { category: "Flow Rate", unit: "gpm" },
  "gallon per minute": { category: "Flow Rate", unit: "gpm" },
  "gallons per minute": { category: "Flow Rate", unit: "gpm" },

  cfm: { category: "Flow Rate", unit: "cfm" },
  "ft^3/min": { category: "Flow Rate", unit: "cfm" },
  "ft3/min": { category: "Flow Rate", unit: "cfm" },
  "cubic feet per minute": { category: "Flow Rate", unit: "cfm" },

  // power
  w: { category: "Power", unit: "W" },
  kw: { category: "Power", unit: "kW" },
  hp: { category: "Power", unit: "hp" },
  horsepower: { category: "Power", unit: "hp" },

  // energy
  j: { category: "Energy", unit: "J" },
  kj: { category: "Energy", unit: "kJ" },
  btu: { category: "Energy", unit: "BTU" },
  wh: { category: "Energy", unit: "Wh" }
};

const defaultUnits = {
  Length: ["in", "mm"],
  Area: ["in^2", "mm^2"],
  Volume: ["in^3", "L"],
  Pressure: ["psi", "kPa"],
  Force: ["lbf", "N"],
  Speed: ["mph", "m/s"],
  Temperature: ["F", "C"],
  Torque: ["ft·lb", "N·m"],
  Density: ["lb/in^3", "kg/m^3"],
  "Flow Rate": ["gpm", "L/min"],
  Power: ["hp", "kW"],
  Energy: ["BTU", "kJ"]
};
