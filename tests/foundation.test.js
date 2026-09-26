const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const { getCalendarMetrics } = require("../assets/js/date-utils.js");
const { findWorkWindows } = require("../assets/js/weather-window.js");

test("calendar metrics are not shifted by daylight-saving time", () => {
  assert.deepEqual(getCalendarMetrics(2026, 8, 25), {
    dayOfYear: 268,
    weekNumber: 39,
    daysUntilSaturday: 1,
    weekday: 5,
  });
});

test("calendar metrics handle leap day", () => {
  assert.equal(getCalendarMetrics(2028, 1, 29).dayOfYear, 60);
});

test("converter defaults and aliases reference valid units", () => {
  const source = fs.readFileSync(path.join(__dirname, "../assets/js/converter-data.js"), "utf8");
  const context = {};
  vm.createContext(context);
  vm.runInContext(`${source};globalThis.converterData={unitData,defaultUnits,unitAliases};`, context);

  const { unitData, defaultUnits, unitAliases } = context.converterData;
  assert.equal(Object.keys(unitData).length, 34);

  const unitsFor = (category) => {
    const units = unitData[category].units;
    return Array.isArray(units) ? units : Object.keys(units);
  };

  Object.entries(defaultUnits).forEach(([category, defaults]) => {
    assert.ok(unitData[category], `Unknown default category: ${category}`);
    defaults.forEach((unit) => assert.ok(unitsFor(category).includes(unit), `Unknown default unit: ${category}/${unit}`));
  });

  Object.entries(unitAliases).forEach(([alias, target]) => {
    assert.ok(unitData[target.category], `Unknown alias category: ${alias}`);
    assert.ok(unitsFor(target.category).includes(target.unit), `Unknown alias unit: ${alias}`);
  });
});

test("weather window finder groups and ranks suitable daylight hours", () => {
  const hourly = {
    time: [
      "2026-09-25T08:00", "2026-09-25T09:00", "2026-09-25T10:00",
      "2026-09-25T11:00", "2026-09-25T12:00", "2026-09-25T13:00",
    ],
    temperature_2m: [58, 61, 64, 68, 70, 71],
    apparent_temperature: [57, 60, 63, 67, 69, 70],
    precipitation_probability: [10, 10, 10, 70, 5, 5],
    weather_code: [1, 1, 2, 61, 0, 0],
    wind_speed_10m: [6, 7, 7, 8, 4, 4],
    wind_gusts_10m: [10, 11, 12, 14, 7, 7],
    is_day: [1, 1, 1, 1, 1, 1],
  };

  const windows = findWorkWindows(hourly, "2026-09-25T08:00", "general", 2);
  assert.equal(windows.length, 2);
  assert.equal(windows[0].start, "2026-09-25T12:00");
  assert.equal(windows[0].hours, 2);
  assert.equal(windows[1].hours, 3);
});

test("weather window finder excludes nighttime and undersized windows", () => {
  const hourly = {
    time: ["2026-09-25T18:00", "2026-09-25T19:00", "2026-09-25T20:00"],
    temperature_2m: [70, 68, 66],
    apparent_temperature: [70, 68, 66],
    precipitation_probability: [0, 0, 0],
    weather_code: [0, 0, 0],
    wind_speed_10m: [3, 3, 3],
    wind_gusts_10m: [5, 5, 5],
    is_day: [1, 0, 0],
  };

  assert.deepEqual(findWorkWindows(hourly, "2026-09-25T18:00", "general", 2), []);
});
