document.addEventListener("DOMContentLoaded", () => {
  if (typeof initializeNavigation === "function") {
    initializeNavigation();
  }

  if (
    typeof initializeConverter === "function" &&
    document.getElementById("category") &&
    document.getElementById("fromUnit") &&
    document.getElementById("toUnit")
  ) {
    initializeConverter();
  }
});
