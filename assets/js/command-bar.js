(function commandBarModule() {
  function initializeCommandBar() {
    const dialog = document.getElementById("engineeringCommandBar");
    const input = document.getElementById("commandInput");
    const results = document.getElementById("commandResults");
    const triggers = document.querySelectorAll("[data-command-open]");
    if (!dialog || !input || !results) return;

    let activeIndex = 0;
    let visibleCommands = [];

    const openPage = async (page) => {
      await window.siteNavigation?.openPage(page);
      window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const openTool = async (tool, focusId) => {
      await openPage("tools");
      window.siteTools?.showTool(tool);
      if (focusId) window.setTimeout(() => document.getElementById(focusId)?.focus(), 220);
    };

    const commands = [
      { title: "Open daily overview", detail: "Time, conditions, and shortcuts", group: "Navigate", terms: "home dashboard today", run: () => openPage("home") },
      { title: "Find a weather work window", detail: "Rank the next 48 hours by job limits", group: "Weather", terms: "forecast outside plan rain wind", run: async () => {
        await openPage("home");
        window.setTimeout(() => document.getElementById("weatherWorkWindow")?.scrollIntoView({ behavior: "smooth", block: "center" }), 180);
      } },
      { title: "Refresh weather", detail: "Request current conditions again", group: "Weather", terms: "reload update forecast", run: () => window.loadHomeWeather?.() },
      { title: "Open unit converter", detail: "Convert common engineering units", group: "Tools", terms: "conversion units measurement", run: () => openTool("converter", "queryInput") },
      { title: "Open scientific calculator", detail: "Arithmetic and scientific functions", group: "Tools", terms: "math calculate", run: () => openTool("calculator") },
      { title: "Open Pyro console", detail: "Operator interface concept", group: "Navigate", terms: "ignition cues simulation", run: () => openPage("pyro") },
    ];

    function conversionCommand(query) {
      if (!/^\s*[+-]?(?:\d+\.?\d*|\.\d+)\s+\S+\s+(?:to|in)\s+\S+/i.test(query)) return null;
      return {
        title: `Convert “${query.trim()}”`,
        detail: "Send this query to the engineering converter",
        group: "Quick action",
        terms: query,
        run: async () => {
          await openTool("converter", "queryInput");
          const queryInput = document.getElementById("queryInput");
          if (!queryInput) return;
          queryInput.value = query.trim();
          queryInput.dispatchEvent(new Event("input", { bubbles: true }));
        },
      };
    }

    function render() {
      const query = input.value.trim().toLowerCase();
      visibleCommands = commands.filter((command) => `${command.title} ${command.detail} ${command.group} ${command.terms}`.toLowerCase().includes(query));
      const directConversion = conversionCommand(input.value);
      if (directConversion) visibleCommands.unshift(directConversion);
      activeIndex = Math.min(activeIndex, Math.max(0, visibleCommands.length - 1));
      results.replaceChildren();

      if (!visibleCommands.length) {
        const empty = document.createElement("p");
        empty.className = "command-empty";
        empty.textContent = "No matching command.";
        results.appendChild(empty);
        return;
      }

      visibleCommands.forEach((command, index) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "command-item";
        button.setAttribute("role", "option");
        button.setAttribute("aria-selected", String(index === activeIndex));
        button.dataset.index = String(index);
        const copy = document.createElement("span");
        const title = document.createElement("strong");
        title.textContent = command.title;
        const detail = document.createElement("small");
        detail.textContent = command.detail;
        copy.append(title, detail);
        const group = document.createElement("span");
        group.className = "command-group";
        group.textContent = command.group;
        button.append(copy, group);
        button.addEventListener("pointerenter", () => {
          activeIndex = index;
          updateSelection();
        });
        button.addEventListener("click", () => runCommand(index));
        results.appendChild(button);
      });
    }

    function updateSelection() {
      results.querySelectorAll(".command-item").forEach((item, index) => item.setAttribute("aria-selected", String(index === activeIndex)));
      results.querySelector(`[data-index="${activeIndex}"]`)?.scrollIntoView({ block: "nearest" });
    }

    function runCommand(index) {
      const command = visibleCommands[index];
      if (!command) return;
      dialog.close();
      command.run();
    }

    function open() {
      if (!dialog.open) dialog.showModal();
      input.value = "";
      activeIndex = 0;
      render();
      window.requestAnimationFrame(() => input.focus());
    }

    triggers.forEach((trigger) => trigger.addEventListener("click", open));
    input.addEventListener("input", () => {
      activeIndex = 0;
      render();
    });
    input.addEventListener("keydown", (event) => {
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        if (!visibleCommands.length) return;
        const direction = event.key === "ArrowDown" ? 1 : -1;
        activeIndex = (activeIndex + direction + visibleCommands.length) % visibleCommands.length;
        updateSelection();
      } else if (event.key === "Enter") {
        event.preventDefault();
        runCommand(activeIndex);
      }
    });
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) dialog.close();
    });
    document.addEventListener("keydown", (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        dialog.open ? dialog.close() : open();
      }
    });
  }

  document.addEventListener("DOMContentLoaded", initializeCommandBar);
})();
