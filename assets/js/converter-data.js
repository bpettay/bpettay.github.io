const unitData = {
  Length: {
    type: "factor",
    units: {
      mm: 0.001, cm: 0.01, m: 1, km: 1000,
      in: 0.0254, ft: 0.3048, yd: 0.9144, mi: 1609.344
    },
    common: ["mm", "cm", "m", "km", "in", "ft", "mi"]
  },
  Area: {
    type: "factor",
    units: {
      "mm^2": 1e-6, "cm^2": 1e-4, "m^2": 1, "km^2": 1e6,
      "in^2": 0.00064516, "ft^2": 0.09290304, "yd^2": 0.83612736, "acre": 4046.8564224
    },
    common: ["mm^2", "cm^2", "m^2", "in^2", "ft^2", "acre"]
  },
  Volume: {
    type: "factor",
    units: {
      mL: 1e-6, L: 0.001, "m^3": 1,
      "in^3": 1.6387064e-5, "ft^3": 0.028316846592, gal: 0.003785411784,
      "US gal": 0.003785411784, "UK gal": 0.00454609
    },
    common: ["mL", "L", "in^3", "ft^3", "gal"]
  },
  Pressure: {
    type: "factor",
    units: {
      Pa: 1, kPa: 1000, MPa: 1e6, bar: 1e5, atm: 101325,
      psi: 6894.757293168, "inHg": 3386.389, "mmHg": 133.322387415
    },
    common: ["psi", "kPa", "bar", "atm"]
  },
  Force: {
    type: "factor",
    units: {
      N: 1, kN: 1000, lbf: 4.4482216153, kgf: 9.80665
    },
    common: ["N", "kN", "lbf"]
  },
  Speed: {
    type: "factor",
    units: {
      "m/s": 1, "km/h": 0.2777777778, mph: 0.44704, "ft/s": 0.3048, knot: 0.5144444444
    },
    common: ["m/s", "km/h", "mph", "knot"]
  },
  Temperature: {
    type: "temperature",
    units: ["C", "F", "K"],
    common: ["C", "F", "K"]
  },
  Torque: {
    type: "factor",
    units: {
      "N·m": 1, "ft·lb": 1.3558179483, "in·lb": 0.112984829, "kgf·m": 9.80665
    },
    common: ["N·m", "ft·lb", "in·lb"]
  },
  Density: {
    type: "factor",
    units: {
      "kg/m^3": 1, "g/cm^3": 1000, "lb/ft^3": 16.01846337396, "lb/in^3": 27679.90471
    },
    common: ["kg/m^3", "g/cm^3", "lb/ft^3"]
  },
  "Flow Rate": {
    type: "factor",
    units: {
      "m^3/s": 1, "L/s": 0.001, "L/min": 1.6667e-5,
      gpm: 6.309e-5, cfm: 4.7195e-4
    },
    common: ["L/min", "gpm", "cfm"]
  },
  Power: {
    type: "factor",
    units: {
      W: 1, kW: 1000, hp: 745.699871582, "ft·lb/s": 1.3558179483
    },
    common: ["W", "kW", "hp"]
  },
  Energy: {
    type: "factor",
    units: {
      J: 1, kJ: 1000, BTU: 1055.05585262, Wh: 3600, "ft·lb": 1.3558179483
    },
    common: ["J", "kJ", "BTU", "Wh"]
  },
  Mass: {
    type: "factor",
    units: {
      g: 0.001, kg: 1, tonne: 1000, lb: 0.45359237, oz: 0.028349523125
    },
    common: ["kg", "lb", "g", "oz"]
  },
  Angle: {
    type: "factor",
    units: {
      deg: 1, rad: 57.295779513, rev: 360
    },
    common: ["deg", "rad"]
  }
};

const unitAliases = {
  // (expand with your existing + new ones)
  mm: { category: "Length", unit: "mm" },
  cm: { category: "Length", unit: "cm" },
  m: { category: "Length", unit: "m" },
  km: { category: "Length", unit: "km" },
  in: { category: "Length", unit: "in" },
  ft: { category: "Length", unit: "ft" },
  // ... add more as needed
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
  Energy: ["BTU", "kJ"],
  Mass: ["lb", "kg"],
  Angle: ["deg", "rad"]
};
