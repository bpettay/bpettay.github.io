function initializeNavigation() {
  const tabs = document.querySelectorAll(".nav-link");
  const pages = document.querySelectorAll(".page");
  const pageButtons = document.querySelectorAll("[data-page-target]");

  if (!tabs.length || !pages.length) return;

  const validPages = Array.from(pages).map(page => page.id);
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

  function openPage(target, options = {}) {
    const { updateUrl = true, replaceState = false } = options;
    const pageId = normalizePage(target);

    // Update nav tabs
    tabs.forEach(tab => {
      const isActive = tab.dataset.page === pageId;
      tab.classList.toggle("active", isActive);
      tab.setAttribute("aria-current", isActive ? "page" : "false");
    });

    // Update pages
    pages.forEach(page => {
      const isActive = page.id === pageId;
      page.classList.toggle("active", isActive);
      page.hidden = !isActive;
    });

    if (updateUrl) {
      syncUrl(pageId, replaceState);
    }

    return pageId;
  }

  // Click handlers
  tabs.forEach(tab => {
    tab.addEventListener("click", () => openPage(tab.dataset.page));
  });

  pageButtons.forEach(btn => {
    btn.addEventListener("click", () => openPage(btn.dataset.pageTarget));
  });

  // Browser back/forward support
  window.addEventListener("popstate", () => {
    openPage(getCurrentPageFromUrl(), { updateUrl: false });
  });

  // Initial load
  const initialPage = getCurrentPageFromUrl();
  openPage(initialPage, { updateUrl: true, replaceState: true });

  // Expose for other scripts if needed
  window.siteNavigation = { openPage, pages: validPages };

  return window.siteNavigation;
}
