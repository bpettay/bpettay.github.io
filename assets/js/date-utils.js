(function initializeDateUtils(root, factory) {
  const api = factory();

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  } else {
    root.SiteDateUtils = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this, () => {
  const DAY_MS = 86400000;

  function getCalendarMetrics(year, monthIndex, day) {
    const dateValue = Date.UTC(year, monthIndex, day);
    const yearStart = Date.UTC(year, 0, 0);
    const dayOfYear = Math.floor((dateValue - yearStart) / DAY_MS);
    const weekday = new Date(dateValue).getUTCDay();
    const januaryFirstWeekday = new Date(Date.UTC(year, 0, 1)).getUTCDay();
    const weekNumber = Math.ceil((dayOfYear + januaryFirstWeekday) / 7);
    const daysUntilSaturday = (6 - weekday + 7) % 7;

    return { dayOfYear, weekNumber, daysUntilSaturday, weekday };
  }

  return { getCalendarMetrics };
});
