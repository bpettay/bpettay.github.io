const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const { getCalendarMetrics } = require("../assets/js/date-utils.js");

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
