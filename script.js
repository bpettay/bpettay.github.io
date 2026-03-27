// =========================
// Sticky Header State
// =========================
const siteHeader = document.getElementById("siteHeader");

function handleHeaderScroll() {
  if (window.scrollY > 12) {
    siteHeader.classList.add("scrolled");
  } else {
    siteHeader.classList.remove("scrolled");
  }
}

window.addEventListener("scroll", handleHeaderScroll);
handleHeaderScroll();

// =========================
// Footer Year
// =========================
const yearEl = document.getElementById("year");
if (yearEl) {
  yearEl.textContent = new Date().getFullYear();
}

// =========================
// Reveal on Scroll
// =========================
const revealEls = document.querySelectorAll(".reveal");

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
      }
    });
  },
  {
    threshold: 0.12,
  }
);

revealEls.forEach((el) => revealObserver.observe(el));

// =========================
// Active Nav Link by Section
// =========================
const sections = document.querySelectorAll("main section[id]");
const navLinks = document.querySelectorAll(".nav-link");

function updateActiveNav() {
  let currentId = "";

  sections.forEach((section) => {
    const rect = section.getBoundingClientRect();
    if (rect.top <= 140 && rect.bottom >= 140) {
      currentId = section.id;
    }
  });

  navLinks.forEach((link) => {
    link.classList.toggle(
      "active",
      link.getAttribute("href") === `#${currentId}`
    );
  });
}

window.addEventListener("scroll", updateActiveNav);
updateActiveNav();
