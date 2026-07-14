function initializeNavigation() {
  const tabs = document.querySelectorAll(".nav-link[data-page]");
  const pages = document.querySelectorAll(".page");
  const pageButtons = document.querySelectorAll("[data-page-target]");

  if (!tabs.length || !pages.length) return;

  const validPages = Array.from(pages).map((page) => page.id);
  const defaultPage = validPages.includes("home") ? "home" : validPages[0];

  function normalizePage(target) {
    return validPages.includes(target) ? target : defaultPage;
  }

  function getCurrentPageFromUrl() {
    return normalizePage(window.location.hash.replace("#", ""));
  }

  function syncUrl(pageId, replace = false) {
    const url = `${window.location.pathname}${window.location.search}#${pageId}`;

    if (replace) {
      history.replaceState(null, "", url);
    } else {
      history.pushState(null, "", url);
    }
  }

  async function canOpenPage(pageId) {
    if (pageId !== "pyro") return true;

    if (typeof window.isPyroOperatorLoggedIn === "function" && window.isPyroOperatorLoggedIn()) {
      return true;
    }

    if (typeof window.requestPyroOperatorLogin !== "function") {
      return false;
    }

    const session = await window.requestPyroOperatorLogin("Operator login required before opening Pyro.");
    return Boolean(session);
  }

  async function openPage(target, options = {}) {
    const { updateUrl = true, replaceState = false, force = false } = options;
    const pageId = normalizePage(target);

    if (!force && !(await canOpenPage(pageId))) {
      const fallbackPage = normalizePage(document.querySelector(".page.active")?.id || defaultPage);
      if (updateUrl) syncUrl(fallbackPage, true);
      return fallbackPage;
    }

    tabs.forEach((tab) => {
      const isActive = tab.dataset.page === pageId;
      tab.classList.toggle("active", isActive);
      tab.setAttribute("aria-current", isActive ? "page" : "false");
    });

    pages.forEach((page) => {
      const isActive = page.id === pageId;
      page.classList.toggle("active", isActive);
      page.hidden = !isActive;
    });

    if (updateUrl) syncUrl(pageId, replaceState);
    return pageId;
  }

  tabs.forEach((tab) => tab.addEventListener("click", () => openPage(tab.dataset.page)));
  pageButtons.forEach((button) => button.addEventListener("click", () => openPage(button.dataset.pageTarget)));

  window.addEventListener("popstate", () => {
    openPage(getCurrentPageFromUrl(), { updateUrl: false });
  });

  const initialPage = getCurrentPageFromUrl();
  openPage(initialPage, { updateUrl: true, replaceState: true });

  window.siteNavigation = { openPage, pages: validPages };
  return window.siteNavigation;
}

function loadVersionedScript(id, path, onload) {
  if (document.getElementById(id)) {
    onload?.();
    return;
  }

  const script = document.createElement("script");
  script.id = id;
  script.src = window.versionedAsset ? window.versionedAsset(path) : path;
  if (onload) script.addEventListener("load", onload, { once: true });
  document.body.appendChild(script);
}

document.addEventListener("DOMContentLoaded", () => {
  window.setTimeout(() => {
    loadVersionedScript("homeDashboardV2Script", "./assets/js/home-dashboard-v2.js", () => {
      loadVersionedScript("dashboardPolishScript", "./assets/js/dashboard-polish.js", () => {
        loadVersionedScript("skyArcFixScript", "./assets/js/sky-arc-fix.js", () => {
          loadVersionedScript("celestialContextScript", "./assets/js/celestial-context.js");
        });
      });
    });
  }, 0);
});
