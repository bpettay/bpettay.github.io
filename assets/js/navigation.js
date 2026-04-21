function initializeNavigation() {
  const tabs = Array.from(document.querySelectorAll(".nav-link"));
  const pages = Array.from(document.querySelectorAll(".page"));
  const pageButtons = Array.from(document.querySelectorAll("[data-page-target]"));

  if (!tabs.length || !pages.length) {
    return { openPage: () => null, pages: [] };
  }

  const validPages = pages.map((page) => page.id);
  const defaultPage = validPages.includes("home") ? "home" : validPages[0];

  function normalizePage(target) {
    return validPages.includes(target) ? target : defaultPage;
  }

  function getCurrentPageFromUrl() {
    return normalizePage(window.location.hash.replace("#", ""));
  }

  function syncUrl(pageId, replaceState = false) {
    const nextUrl = `${window.location.pathname}${window.location.search}#${pageId}`;
    const method = replaceState ? "replaceState" : "pushState";
    window.history[method](null, "", nextUrl);
  }

  function openPage(target, options = {}) {
    const { updateUrl = true, replaceState = false } = options;
    const pageId = normalizePage(target);

    tabs.forEach((item) => {
      const isActive = item.dataset.page === pageId;
      item.classList.toggle("active", isActive);
      item.setAttribute("aria-current", isActive ? "page" : "false");
    });

    pages.forEach((page) => {
      const isActive = page.id === pageId;
      page.classList.toggle("active", isActive);
      page.hidden = !isActive;
    });

    if (updateUrl) {
      syncUrl(pageId, replaceState);
    }

    return pageId;
  }

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      openPage(tab.dataset.page);
    });
  });

  pageButtons.forEach((button) => {
    button.addEventListener("click", () => {
      openPage(button.dataset.pageTarget);
    });
  });

  window.addEventListener("popstate", () => {
    openPage(getCurrentPageFromUrl(), { updateUrl: false });
  });

  const initialPage = getCurrentPageFromUrl();
  openPage(initialPage, { updateUrl: true, replaceState: true });

  window.siteNavigation = {
    openPage,
    pages: validPages.slice()
  };

  return window.siteNavigation;
}
