function initializeNavigation() {
  const tabs = document.querySelectorAll(".nav-link[data-page]");
  const pages = document.querySelectorAll(".page");
  const pageButtons = document.querySelectorAll("[data-page-target]");
  const nav = document.querySelector(".nav");
  const navRight = document.querySelector(".nav-right");
  const toolsMenu = document.querySelector(".nav-tools-menu");
  const toolsTrigger = document.querySelector(".nav-tools-trigger");
  const toolButtons = document.querySelectorAll("[data-tool-target]");
  let closeNavFlyout = () => {};

  if (!tabs.length || !pages.length) return;

  const validPages = Array.from(pages).map((page) => page.id);
  const defaultPage = validPages.includes("home") ? "home" : validPages[0];

  function initializeHamburgerMenu() {
    if (!nav || !navRight || nav.dataset.flyoutReady === "true") return;
    nav.dataset.flyoutReady = "true";

    const toggle = document.createElement("button");
    toggle.className = "nav-menu-toggle";
    toggle.type = "button";
    toggle.setAttribute("aria-label", "Open navigation menu");
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-controls", "primaryNavFlyout");
    toggle.innerHTML = '<span class="nav-menu-icon" aria-hidden="true"></span>';

    const flyout = document.createElement("div");
    flyout.className = "nav-flyout";
    flyout.id = "primaryNavFlyout";
    flyout.setAttribute("aria-label", "Site navigation");

    const primaryItems = Array.from(navRight.children)
      .filter((item) => !item.matches('[data-page="home"]'));
    primaryItems.forEach((item) => flyout.appendChild(item));
    navRight.append(toggle, flyout);

    const setOpen = (open) => {
      flyout.classList.toggle("open", open);
      nav?.classList.toggle("nav-flyout-open", open);
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Close navigation menu" : "Open navigation menu");
    };
    closeNavFlyout = () => setOpen(false);

    toggle.addEventListener("click", (event) => {
      event.stopPropagation();
      setOpen(!flyout.classList.contains("open"));
    });

    flyout.addEventListener("click", (event) => event.stopPropagation());
    document.addEventListener("click", () => setOpen(false));
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && flyout.classList.contains("open")) {
        setOpen(false);
        toggle.focus();
      }
    });

    tabs.forEach((tab) => tab.addEventListener("click", () => setOpen(false)));
  }

  initializeHamburgerMenu();

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

    if (typeof window.initializePyroFeatures === "function") {
      window.initializePyroFeatures();
    }

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
    if (toolsTrigger) {
      const isToolsPage = pageId === "tools";
      toolsTrigger.classList.toggle("active", isToolsPage);
      toolsTrigger.setAttribute("aria-current", isToolsPage ? "page" : "false");
    }

    pages.forEach((page) => {
      const isActive = page.id === pageId;
      page.classList.toggle("active", isActive);
      page.hidden = !isActive;
    });

    window.siteTools?.syncCalculatorScrollLock?.();

    if (updateUrl) syncUrl(pageId, replaceState);
    return pageId;
  }

  const setToolsMenuOpen = (open) => {
    if (!toolsMenu || !toolsTrigger) return;
    toolsMenu.classList.toggle("open", open);
    toolsTrigger.setAttribute("aria-expanded", String(open));
  };

  toolsTrigger?.addEventListener("click", (event) => {
    event.stopPropagation();
    setToolsMenuOpen(!toolsMenu.classList.contains("open"));
  });

  toolButtons.forEach((button) => {
    button.addEventListener("click", async (event) => {
      event.stopPropagation();
      await openPage("tools");
      if (window.siteTools?.showTool) window.siteTools.showTool(button.dataset.toolTarget);
      setToolsMenuOpen(false);
      closeNavFlyout();
    });
  });

  toolsMenu?.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      setToolsMenuOpen(false);
      toolsTrigger?.focus();
    }
  });

  document.addEventListener("click", () => setToolsMenuOpen(false));

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

function initializeDetailedHomeClock() {
  const face = document.querySelector(".clock-face");
  const hourRing = document.getElementById("clockHourRing");
  const minuteRing = document.getElementById("clockMinuteRing");
  const secondRing = document.getElementById("clockSecondRing");
  if (!face || !hourRing || !minuteRing || !secondRing || face.dataset.detailedClock === "true") return;

  face.dataset.detailedClock = "true";

  const tickRing = document.createElement("div");
  tickRing.className = "clock-tick-ring";
  for (let i = 0; i < 60; i += 1) {
    const tick = document.createElement("span");
    tick.className = `clock-tick${i % 5 === 0 ? " major" : ""}`;
    tick.style.setProperty("--tick-angle", `${i * 6}deg`);
    tickRing.appendChild(tick);
  }
  face.prepend(tickRing);

  const numeralRing = document.createElement("div");
  numeralRing.className = "clock-numerals";
  [["12", "n12"], ["3", "n3"], ["6", "n6"], ["9", "n9"]].forEach(([value, className]) => {
    const numeral = document.createElement("span");
    numeral.className = `clock-numeral ${className}`;
    numeral.textContent = value;
    numeralRing.appendChild(numeral);
  });
  face.prepend(numeralRing);

  const formatter = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hour12: false,
    timeZone: "America/New_York",
  });

  function drawClock() {
    const now = new Date();
    const parts = formatter.formatToParts(now);
    const value = (type) => Number(parts.find((part) => part.type === type)?.value || 0);
    const hours = value("hour");
    const minutes = value("minute");
    const seconds = value("second") + (now.getMilliseconds() / 1000);
    const minuteProgress = minutes + seconds / 60;
    const hourProgress = (hours % 12) + minuteProgress / 60;

    hourRing.style.setProperty("--ring-progress", `${(hourProgress / 12) * 100}%`);
    minuteRing.style.setProperty("--ring-progress", `${(minuteProgress / 60) * 100}%`);
    secondRing.style.setProperty("--ring-progress", `${(seconds / 60) * 100}%`);
  }

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    drawClock();
    window.setInterval(drawClock, 1000);
    return;
  }

  drawClock();
  window.setInterval(drawClock, 50);
}

document.addEventListener("DOMContentLoaded", initializeDetailedHomeClock);
