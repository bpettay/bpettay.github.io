function initializeNavigation() {
  const tabs = document.querySelectorAll(".nav-link[data-page]");
  const pages = document.querySelectorAll(".page");
  const pageButtons = document.querySelectorAll("[data-page-target]");
  const nav = document.querySelector(".nav");
  const navRight = document.querySelector(".nav-right");

  if (!tabs.length || !pages.length) return;

  const validPages = Array.from(pages).map((page) => page.id);
  const defaultPage = validPages.includes("home") ? "home" : validPages[0];

  function initializeHamburgerMenu() {
    if (!nav || !navRight || nav.dataset.flyoutReady === "true") return;
    nav.dataset.flyoutReady = "true";

    const style = document.createElement("style");
    style.id = "primary-nav-flyout-styles";
    style.textContent = `
      .nav { overflow: visible; }

      .nav-right {
        position: relative;
        display: flex !important;
        width: auto !important;
        flex: 0 0 auto;
      }

      .nav-menu-toggle {
        position: relative;
        display: inline-grid;
        place-items: center;
        width: 42px;
        height: 38px;
        min-height: 38px;
        padding: 0;
        border: 1px solid rgba(255,255,255,.09);
        border-radius: 8px;
        color: var(--ink);
        background: #151d26;
        cursor: pointer;
        transition: background .18s ease, border-color .18s ease, transform .18s ease;
      }

      .nav-menu-toggle:hover {
        background: #1a2530;
        border-color: rgba(255,255,255,.15);
      }

      .nav-menu-toggle:active { transform: scale(.97); }

      .nav-menu-icon,
      .nav-menu-icon::before,
      .nav-menu-icon::after {
        display: block;
        width: 17px;
        height: 1.5px;
        border-radius: 999px;
        background: currentColor;
        transition: transform .2s ease, opacity .2s ease;
      }

      .nav-menu-icon {
        position: relative;
      }

      .nav-menu-icon::before,
      .nav-menu-icon::after {
        content: "";
        position: absolute;
        left: 0;
      }

      .nav-menu-icon::before { top: -5px; }
      .nav-menu-icon::after { top: 5px; }

      .nav-menu-toggle[aria-expanded="true"] .nav-menu-icon { background: transparent; }
      .nav-menu-toggle[aria-expanded="true"] .nav-menu-icon::before { transform: translateY(5px) rotate(45deg); }
      .nav-menu-toggle[aria-expanded="true"] .nav-menu-icon::after { transform: translateY(-5px) rotate(-45deg); }

      .nav-flyout {
        position: absolute;
        top: calc(100% + .55rem);
        right: 0;
        z-index: 120;
        display: grid;
        gap: .25rem;
        width: min(220px, calc(100vw - 2rem));
        padding: .4rem;
        border: 1px solid var(--line);
        border-radius: 10px;
        background: rgba(12,18,25,.98);
        box-shadow: 0 16px 36px rgba(0,0,0,.38);
        backdrop-filter: blur(18px);
        -webkit-backdrop-filter: blur(18px);
        transform: translateY(-6px) scale(.98);
        transform-origin: top right;
        opacity: 0;
        visibility: hidden;
        pointer-events: none;
        transition: opacity .16s ease, transform .16s ease, visibility .16s ease;
      }

      .nav-flyout.open {
        transform: translateY(0) scale(1);
        opacity: 1;
        visibility: visible;
        pointer-events: auto;
      }

      .nav-flyout .nav-link,
      .nav.nav-compact .nav-flyout .nav-link {
        display: flex;
        justify-content: flex-start;
        width: 100%;
        min-height: 42px;
        padding: .65rem .75rem;
        border-radius: 7px;
        font-size: .9rem;
        font-weight: 500;
        text-align: left;
      }

      .nav-flyout .nav-link.active {
        background: #1a2530;
        border-color: rgba(255,255,255,.1);
      }

      @media (max-width: 720px) {
        .nav-left { display: flex !important; }
        .nav-right,
        .nav.nav-compact .nav-right {
          display: flex !important;
          width: auto !important;
        }

        .nav-menu-toggle {
          width: 46px;
          height: 46px;
          min-height: 46px;
        }

        .nav-flyout {
          top: auto;
          right: 0;
          bottom: calc(100% + .55rem);
          width: min(240px, calc(100vw - 1.3rem));
          transform: translateY(6px) scale(.98);
          transform-origin: bottom right;
        }

        .nav-flyout.open { transform: translateY(0) scale(1); }

        .nav-flyout .nav-link,
        .nav.nav-compact .nav-flyout .nav-link {
          min-height: 48px;
          padding: .72rem .8rem;
          font-size: .92rem;
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .nav-menu-icon,
        .nav-menu-icon::before,
        .nav-menu-icon::after,
        .nav-flyout { transition: none; }
      }
    `;
    document.head.appendChild(style);

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

    tabs.forEach((tab) => flyout.appendChild(tab));
    navRight.append(toggle, flyout);

    const setOpen = (open) => {
      flyout.classList.toggle("open", open);
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Close navigation menu" : "Open navigation menu");
    };

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

function initializeDetailedHomeClock() {
  const face = document.querySelector(".clock-face");
  const hourHand = document.getElementById("clockHourHand");
  const minuteHand = document.getElementById("clockMinuteHand");
  const secondHand = document.getElementById("clockSecondHand");
  if (!face || !hourHand || !minuteHand || !secondHand || face.dataset.detailedClock === "true") return;

  face.dataset.detailedClock = "true";

  const style = document.createElement("style");
  style.id = "detailed-home-clock-styles";
  style.textContent = `
    .clock-face {
      overflow: hidden;
      border-color: rgba(190, 207, 220, 0.34) !important;
      background:
        radial-gradient(circle at 50% 44%, rgba(255,255,255,0.035), transparent 42%),
        radial-gradient(circle, #0d151e 0 59%, #0a1017 60% 64%, #111a23 65% 72%, #080d12 73% 100%) !important;
      box-shadow:
        inset 0 0 0 1px rgba(255,255,255,0.025),
        inset 0 0 0 5px #0e151d,
        inset 0 0 18px rgba(0,0,0,0.62),
        0 7px 18px rgba(0,0,0,0.24) !important;
    }

    .clock-face::before,
    .clock-face::after {
      content: "";
      position: absolute;
      inset: 12%;
      border-radius: 50%;
      pointer-events: none;
    }

    .clock-face::before {
      border: 1px solid rgba(205, 219, 228, 0.07);
      box-shadow: inset 0 0 14px rgba(255,255,255,0.018);
    }

    .clock-face::after {
      inset: 4%;
      border: 1px solid rgba(255,255,255,0.028);
    }

    .clock-marker { display: none !important; }

    .clock-tick-ring,
    .clock-numerals {
      position: absolute;
      inset: 0;
      border-radius: 50%;
      pointer-events: none;
    }

    .clock-tick {
      position: absolute;
      left: 50%;
      top: 50%;
      width: 1px;
      height: 4px;
      border-radius: 999px;
      background: rgba(217, 227, 233, 0.28);
      transform-origin: 50% 47px;
      transform: translate(-50%, -47px) rotate(var(--tick-angle));
    }

    .clock-tick.major {
      width: 2px;
      height: 7px;
      background: rgba(239, 244, 247, 0.68);
    }

    .clock-numeral {
      position: absolute;
      color: rgba(228, 235, 240, 0.76);
      font-size: 8px;
      font-weight: 600;
      line-height: 1;
      font-variant-numeric: tabular-nums;
      transform: translate(-50%, -50%);
      text-shadow: 0 1px 2px rgba(0,0,0,0.65);
    }

    .clock-numeral.n12 { left: 50%; top: 19%; }
    .clock-numeral.n3 { left: 81%; top: 50%; }
    .clock-numeral.n6 { left: 50%; top: 81%; }
    .clock-numeral.n9 { left: 19%; top: 50%; }

    .clock-hand {
      will-change: transform;
      box-shadow: 0 1px 3px rgba(0,0,0,0.45);
    }

    .clock-hand.hour {
      width: 5px !important;
      height: 25% !important;
      background: linear-gradient(to top, #dce4e9, #f6f8f9) !important;
    }

    .clock-hand.minute {
      width: 3px !important;
      height: 36% !important;
      background: linear-gradient(to top, #aebdc7, #e3eaee) !important;
    }

    .clock-hand.second {
      width: 1.5px !important;
      height: 42% !important;
      border-radius: 999px 999px 0 0 !important;
      background: #ff7352 !important;
      box-shadow: 0 0 5px rgba(255, 115, 82, 0.22) !important;
    }

    .clock-hand.second::after {
      content: "";
      position: absolute;
      left: 50%;
      top: 100%;
      width: 1.5px;
      height: 13px;
      border-radius: 0 0 999px 999px;
      background: #ff7352;
      transform: translateX(-50%);
    }

    .clock-center {
      z-index: 8 !important;
      width: 10px !important;
      height: 10px !important;
      border: 2px solid #dfe7ec;
      background: #17232e !important;
      box-shadow:
        0 0 0 2px #263442,
        0 2px 5px rgba(0,0,0,0.55) !important;
    }

    .clock-center::after {
      content: "";
      position: absolute;
      inset: 2px;
      border-radius: 50%;
      background: #ff7352;
    }

    @media (prefers-reduced-motion: reduce) {
      .clock-hand { will-change: auto; }
    }
  `;
  document.head.appendChild(style);

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

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let lastReducedSecond = -1;

  function drawClock() {
    const now = new Date();
    const parts = formatter.formatToParts(now);
    const value = (type) => Number(parts.find((part) => part.type === type)?.value || 0);
    const hours = value("hour");
    const minutes = value("minute");
    const seconds = value("second");
    const milliseconds = now.getMilliseconds();

    if (!reducedMotion || seconds !== lastReducedSecond) {
      const secondProgress = seconds + (reducedMotion ? 0 : milliseconds / 1000);
      const minuteProgress = minutes + secondProgress / 60;
      const hourProgress = (hours % 12) + minuteProgress / 60;

      hourHand.style.transform = `translateX(-50%) rotate(${hourProgress * 30}deg)`;
      minuteHand.style.transform = `translateX(-50%) rotate(${minuteProgress * 6}deg)`;
      secondHand.style.transform = `translateX(-50%) rotate(${secondProgress * 6}deg)`;
      lastReducedSecond = seconds;
    }

    window.requestAnimationFrame(drawClock);
  }

  window.requestAnimationFrame(drawClock);
}

document.addEventListener("DOMContentLoaded", initializeDetailedHomeClock);