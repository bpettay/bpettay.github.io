function initializeNavigation() {
  const tabs = document.querySelectorAll(".nav-link");
  const pages = document.querySelectorAll(".page");
  const pageButtons = document.querySelectorAll("[data-page-target]");

  function openPage(target) {
    tabs.forEach((item) => {
      item.classList.remove("active");
      if (item.dataset.page === target) {
        item.classList.add("active");
      }
    });

    pages.forEach((page) => {
      page.classList.remove("active");
      if (page.id === target) {
        page.classList.add("active");
      }
    });
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

  window.siteNavigation = {
    openPage
  };
}
