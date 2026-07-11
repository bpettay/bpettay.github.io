const unitData = {
  Length: {
    type: "factor", base: "m",
    units: { nm: 1e-9, "µm": 1e-6, mm: 1e-3, cm: 1e-2, m: 1, km: 1e3, in: 0.0254, ft: 0.3048, yd: 0.9144, mi: 1609.344, "nautical mi": 1852, mil: 0.0000254, "light-year": 9.4607304725808e15 },
    common: ["mm", "cm", "m", "km", "in", "ft", "yd", "mi"]
  },
  Area: {
    type: "factor", base: "m²",
    units: { "mm²": 1e-6, "cm²": 1e-4, "m²": 1, "km²": 1e6, "in²": 0.00064516, "ft²": 0.09290304, "yd²": 0.83612736, acre: 4046.8564224, hectare: 10000 },
    common: ["mm²", "cm²", "m²", "in²", "ft²", "acre", "hectare"]
  },
  Volume: {
    type: "factor", base: "m³",
    units: { "mm³": 1e-9, "cm³": 1e-6, mL: 1e-6, cL: 1e-5, dL: 1e-4, L: 1e-3, "m³": 1, "in³": 1.6387064e-5, "ft³": 0.028316846592, "yd³": 0.764554857984, tsp: 4.92892159375e-6, tbsp: 1.478676478125e-5, "fl oz": 2.95735295625e-5, cup: 0.0002365882365, pint: 0.000473176473, quart: 0.000946352946, "US gal": 0.003785411784, "UK gal": 0.00454609, "US bbl": 0.158987294928 },
    common: ["mL", "L", "m³", "in³", "ft³", "US gal"]
  },
  Mass: {
    type: "factor", base: "kg",
    units: { µg: 1e-9, mg: 1e-6, g: 1e-3, kg: 1, tonne: 1e3, oz: 0.028349523125, lb: 0.45359237, stone: 6.35029318, "short ton": 907.18474, "long ton": 1016.0469088, slug: 14.5939029372 },
    common: ["mg", "g", "kg", "oz", "lb", "tonne", "slug"]
  },
  Time: {
    type: "factor", base: "s",
    units: { ns: 1e-9, "µs": 1e-6, ms: 1e-3, s: 1, min: 60, h: 3600, day: 86400, week: 604800, year: 31557600 },
    common: ["ms", "s", "min", "h", "day", "week"]
  },
  Temperature: { type: "temperature", units: ["°C", "°F", "K", "°R"], common: ["°C", "°F", "K", "°R"] },
  Speed: {
    type: "factor", base: "m/s",
    units: { "mm/s": 0.001, "cm/s": 0.01, "m/s": 1, "km/s": 1000, "km/h": 0.2777777777777778, "in/s": 0.0254, "ft/s": 0.3048, "ft/min": 0.00508, mph: 0.44704, knot: 0.5144444444444445, Mach: 343 },
    common: ["m/s", "km/h", "ft/s", "mph", "knot", "Mach"]
  },
  Acceleration: {
    type: "factor", base: "m/s²",
    units: { "m/s²": 1, "cm/s²": 0.01, "mm/s²": 0.001, "ft/s²": 0.3048, "in/s²": 0.0254, g: 9.80665, Gal: 0.01 },
    common: ["m/s²", "ft/s²", "in/s²", "g"]
  },
  Force: {
    type: "factor", base: "N",
    units: { µN: 1e-6, mN: 1e-3, N: 1, kN: 1e3, MN: 1e6, dyn: 1e-5, lbf: 4.4482216152605, kip: 4448.2216152605, kgf: 9.80665, tonf: 8896.443230521 },
    common: ["N", "kN", "lbf", "kip", "kgf"]
  },
  Pressure: {
    type: "factor", base: "Pa",
    units: { Pa: 1, hPa: 100, kPa: 1e3, MPa: 1e6, GPa: 1e9, bar: 1e5, mbar: 100, atm: 101325, psi: 6894.757293168, ksi: 6894757.293168, psf: 47.88025898033584, inHg: 3386.389, mmHg: 133.322387415, torr: 133.32236842105263, "inH₂O": 249.08891, "ftH₂O": 2989.06692 },
    common: ["Pa", "kPa", "MPa", "bar", "atm", "psi", "ksi"]
  },
  Torque: {
    type: "factor", base: "N·m",
    units: { "N·mm": 0.001, "N·m": 1, "kN·m": 1000, "ozf·in": 0.00706155183333, "lbf·in": 0.1129848290276167, "lbf·ft": 1.3558179483314004, "kgf·cm": 0.0980665, "kgf·m": 9.80665 },
    common: ["N·mm", "N·m", "lbf·in", "lbf·ft", "kgf·m"]
  },
  Energy: {
    type: "factor", base: "J",
    units: { mJ: 0.001, J: 1, kJ: 1e3, MJ: 1e6, GJ: 1e9, cal: 4.184, kcal: 4184, BTU: 1055.05585262, "ft·lbf": 1.3558179483314004, Wh: 3600, kWh: 3.6e6, eV: 1.602176634e-19, therm: 105505585.262 },
    common: ["J", "kJ", "MJ", "BTU", "ft·lbf", "Wh", "kWh"]
  },
  Power: {
    type: "factor", base: "W",
    units: { mW: 0.001, W: 1, kW: 1e3, MW: 1e6, GW: 1e9, hp: 745.6998715822702, "metric hp": 735.49875, "ft·lbf/s": 1.3558179483314004, "BTU/h": 0.2930710701722222, "ton refrigeration": 3516.8528420667 },
    common: ["W", "kW", "MW", "hp", "BTU/h", "ton refrigeration"]
  },
  Density: {
    type: "factor", base: "kg/m³",
    units: { "kg/m³": 1, "g/mL": 1000, "g/cm³": 1000, "kg/L": 1000, "lb/ft³": 16.01846337396014, "lb/in³": 27679.904710191, "oz/in³": 1729.9940443869, "slug/ft³": 515.3788184 },
    common: ["kg/m³", "g/cm³", "kg/L", "lb/ft³", "lb/in³"]
  },
  "Volumetric Flow": {
    type: "factor", base: "m³/s",
    units: { "m³/s": 1, "m³/min": 1 / 60, "m³/h": 1 / 3600, "L/s": 0.001, "L/min": 1e-3 / 60, "L/h": 1e-3 / 3600, "mL/s": 1e-6, "mL/min": 1e-6 / 60, gpm: 0.003785411784 / 60, gph: 0.003785411784 / 3600, cfs: 0.028316846592, cfm: 0.028316846592 / 60, "ft³/h": 0.028316846592 / 3600 },
    common: ["L/s", "L/min", "m³/h", "gpm", "cfm", "cfs"]
  },
  "Mass Flow": {
    type: "factor", base: "kg/s",
    units: { "kg/s": 1, "kg/min": 1 / 60, "kg/h": 1 / 3600, "g/s": 0.001, "g/min": 0.001 / 60, "lb/s": 0.45359237, "lb/min": 0.45359237 / 60, "lb/h": 0.45359237 / 3600, "tonne/h": 1000 / 3600 },
    common: ["kg/s", "kg/h", "g/s", "lb/s", "lb/min", "lb/h"]
  },
  Angle: {
    type: "factor", base: "rad",
    units: { rad: 1, mrad: 0.001, deg: Math.PI / 180, arcmin: Math.PI / 10800, arcsec: Math.PI / 648000, rev: 2 * Math.PI, grad: Math.PI / 200 },
    common: ["rad", "deg", "rev", "mrad"]
  },
  "Angular Speed": {
    type: "factor", base: "rad/s",
    units: { "rad/s": 1, "deg/s": Math.PI / 180, rpm: 2 * Math.PI / 60, rps: 2 * Math.PI, "rev/h": 2 * Math.PI / 3600 },
    common: ["rad/s", "deg/s", "rpm", "rps"]
  },
  Frequency: {
    type: "factor", base: "Hz",
    units: { Hz: 1, kHz: 1e3, MHz: 1e6, GHz: 1e9, rpm: 1 / 60, "rad/s": 1 / (2 * Math.PI) },
    common: ["Hz", "kHz", "MHz", "GHz", "rpm"]
  },
  "Dynamic Viscosity": {
    type: "factor", base: "Pa·s",
    units: { "Pa·s": 1, "mPa·s": 0.001, cP: 0.001, P: 0.1, "lbm/(ft·s)": 1.48816394357, "lbf·s/ft²": 47.8802589803 },
    common: ["Pa·s", "mPa·s", "cP", "P"]
  },
  "Kinematic Viscosity": {
    type: "factor", base: "m²/s",
    units: { "m²/s": 1, "mm²/s": 1e-6, cSt: 1e-6, St: 1e-4, "ft²/s": 0.09290304 },
    common: ["m²/s", "mm²/s", "cSt", "St"]
  },
  "Thermal Conductivity": {
    type: "factor", base: "W/(m·K)",
    units: { "W/(m·K)": 1, "W/(cm·K)": 100, "BTU/(h·ft·°F)": 1.73073466637, "cal/(s·cm·°C)": 418.4 },
    common: ["W/(m·K)", "BTU/(h·ft·°F)"]
  },
  "Heat Transfer Coefficient": {
    type: "factor", base: "W/(m²·K)",
    units: { "W/(m²·K)": 1, "W/(cm²·K)": 10000, "BTU/(h·ft²·°F)": 5.67826334111 },
    common: ["W/(m²·K)", "BTU/(h·ft²·°F)"]
  },
  "Specific Heat": {
    type: "factor", base: "J/(kg·K)",
    units: { "J/(kg·K)": 1, "kJ/(kg·K)": 1000, "J/(g·K)": 1000, "BTU/(lbm·°F)": 4186.80058485, "cal/(g·°C)": 4184 },
    common: ["J/(kg·K)", "kJ/(kg·K)", "BTU/(lbm·°F)"]
  },
  "Fuel Economy": { type: "fuelEconomy", units: ["mpg US", "mpg UK", "km/L", "L/100 km"], common: ["mpg US", "mpg UK", "km/L", "L/100 km"] },
  "Data Storage": {
    type: "factor", base: "byte",
    units: { bit: 0.125, byte: 1, kB: 1e3, MB: 1e6, GB: 1e9, TB: 1e12, KiB: 1024, MiB: 1048576, GiB: 1073741824, TiB: 1099511627776 },
    common: ["byte", "kB", "MB", "GB", "KiB", "MiB", "GiB"]
  },
  "Data Rate": {
    type: "factor", base: "bit/s",
    units: { "bit/s": 1, "kbit/s": 1e3, "Mbit/s": 1e6, "Gbit/s": 1e9, "byte/s": 8, "kB/s": 8e3, "MB/s": 8e6, "GB/s": 8e9 },
    common: ["bit/s", "Mbit/s", "Gbit/s", "MB/s", "GB/s"]
  },
  Current: { type: "factor", base: "A", units: { nA: 1e-9, "µA": 1e-6, mA: 1e-3, A: 1, kA: 1e3 }, common: ["µA", "mA", "A", "kA"] },
  Voltage: { type: "factor", base: "V", units: { "µV": 1e-6, mV: 1e-3, V: 1, kV: 1e3, MV: 1e6 }, common: ["mV", "V", "kV"] },
  Resistance: { type: "factor", base: "Ω", units: { "µΩ": 1e-6, mΩ: 1e-3, Ω: 1, "kΩ": 1e3, "MΩ": 1e6, "GΩ": 1e9 }, common: ["mΩ", "Ω", "kΩ", "MΩ"] },
  Capacitance: { type: "factor", base: "F", units: { pF: 1e-12, nF: 1e-9, "µF": 1e-6, mF: 1e-3, F: 1 }, common: ["pF", "nF", "µF", "mF"] },
  Charge: { type: "factor", base: "C", units: { nC: 1e-9, "µC": 1e-6, mC: 1e-3, C: 1, Ah: 3600, mAh: 3.6 }, common: ["µC", "mC", "C", "mAh", "Ah"] },
  "Magnetic Flux Density": { type: "factor", base: "T", units: { nT: 1e-9, "µT": 1e-6, mT: 1e-3, T: 1, G: 1e-4 }, common: ["µT", "mT", "T", "G"] },
  Illuminance: { type: "factor", base: "lux", units: { lux: 1, klux: 1000, "foot-candle": 10.7639104167, phot: 10000 }, common: ["lux", "foot-candle"] }
};

const unitAliases = {
  micron: { category: "Length", unit: "µm" }, micrometer: { category: "Length", unit: "µm" }, micrometers: { category: "Length", unit: "µm" },
  inch: { category: "Length", unit: "in" }, inches: { category: "Length", unit: "in" }, foot: { category: "Length", unit: "ft" }, feet: { category: "Length", unit: "ft" }, mile: { category: "Length", unit: "mi" }, miles: { category: "Length", unit: "mi" },
  sqm: { category: "Area", unit: "m²" }, sqft: { category: "Area", unit: "ft²" }, sqin: { category: "Area", unit: "in²" },
  cc: { category: "Volume", unit: "cm³" }, gallon: { category: "Volume", unit: "US gal" }, gallons: { category: "Volume", unit: "US gal" }, gal: { category: "Volume", unit: "US gal" }, liter: { category: "Volume", unit: "L" }, liters: { category: "Volume", unit: "L" }, litre: { category: "Volume", unit: "L" }, litres: { category: "Volume", unit: "L" },
  pounds: { category: "Mass", unit: "lb" }, pound: { category: "Mass", unit: "lb" }, lbs: { category: "Mass", unit: "lb" }, ounces: { category: "Mass", unit: "oz" },
  second: { category: "Time", unit: "s" }, seconds: { category: "Time", unit: "s" }, hour: { category: "Time", unit: "h" }, hours: { category: "Time", unit: "h" },
  celsius: { category: "Temperature", unit: "°C" }, fahrenheit: { category: "Temperature", unit: "°F" }, kelvin: { category: "Temperature", unit: "K" }, rankine: { category: "Temperature", unit: "°R" },
  kph: { category: "Speed", unit: "km/h" }, fps: { category: "Speed", unit: "ft/s" }, knots: { category: "Speed", unit: "knot" },
  horsepower: { category: "Power", unit: "hp" }, btu: { category: "Energy", unit: "BTU" },
  cfm: { category: "Volumetric Flow", unit: "cfm" }, gpm: { category: "Volumetric Flow", unit: "gpm" },
  cps: { category: "Dynamic Viscosity", unit: "cP" }, centipoise: { category: "Dynamic Viscosity", unit: "cP" }, centistokes: { category: "Kinematic Viscosity", unit: "cSt" },
  ohm: { category: "Resistance", unit: "Ω" }, ohms: { category: "Resistance", unit: "Ω" }, amps: { category: "Current", unit: "A" }, amp: { category: "Current", unit: "A" }, volts: { category: "Voltage", unit: "V" }
};

const defaultUnits = {
  Length: ["in", "mm"], Area: ["in²", "mm²"], Volume: ["US gal", "L"], Mass: ["lb", "kg"], Time: ["min", "s"], Temperature: ["°F", "°C"], Speed: ["mph", "m/s"], Acceleration: ["g", "m/s²"], Force: ["lbf", "N"], Pressure: ["psi", "kPa"], Torque: ["lbf·ft", "N·m"], Energy: ["BTU", "kJ"], Power: ["hp", "kW"], Density: ["lb/ft³", "kg/m³"], "Volumetric Flow": ["gpm", "L/min"], "Mass Flow": ["lb/h", "kg/h"], Angle: ["deg", "rad"], "Angular Speed": ["rpm", "rad/s"], Frequency: ["Hz", "rpm"], "Dynamic Viscosity": ["cP", "Pa·s"], "Kinematic Viscosity": ["cSt", "m²/s"], "Thermal Conductivity": ["BTU/(h·ft·°F)", "W/(m·K)"], "Heat Transfer Coefficient": ["BTU/(h·ft²·°F)", "W/(m²·K)"], "Specific Heat": ["BTU/(lbm·°F)", "kJ/(kg·K)"], "Fuel Economy": ["mpg US", "L/100 km"], "Data Storage": ["GB", "GiB"], "Data Rate": ["Mbit/s", "MB/s"], Current: ["mA", "A"], Voltage: ["mV", "V"], Resistance: ["kΩ", "Ω"], Capacitance: ["µF", "nF"], Charge: ["mAh", "C"], "Magnetic Flux Density": ["G", "T"], Illuminance: ["foot-candle", "lux"]
};