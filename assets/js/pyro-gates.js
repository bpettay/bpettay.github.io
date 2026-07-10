function initializePyroGateWorkflow() {
  const root = document.getElementById("pyro-controls");
  if (!root || document.getElementById("pyroGateTabs")) return;

  const gateDefinitions = [
    {
      id: "overview",
      title: "Status",
      subtitle: "System + trace",
      sections: [".pyro-hmi-header"],
    },
    {
      id: "interlocks",
      title: "Interlocks",
      subtitle: "Power + auth",
      sections: [".pyro-grid"],
    },
    {
      id: "cues",
      title: "Cue Check",
      subtitle: "Continuity + cue bank",
      sections: ["#simChannelGrid"],
    },
    {
      id: "fire",
      title: "Fire Control",
      subtitle: "Device + command",
      sections: ["#teamSyncPanel", ".command-panel", ".event-log-panel"],
    },
  ];

  const statusBar = document.createElement("section");
  statusBar.className = "pyro-sticky-status";
  statusBar.setAttribute("aria-label", "Persistent controller status");
  statusBar.innerHTML = `
    <div class="sticky-status-tile primary">
      <span>State</span>
      <strong id="stickySystemState">SAFE / LOCKED OUT</strong>
    </div>
    <div class="sticky-status-tile">
      <span>Zone</span>
      <strong id="stickyZone">Zone A</strong>
    </div>
    <div class="sticky-status-tile">
      <span>Operator</span>
      <strong id="stickyOperator">Auth required</strong>
    </div>
    <div class="sticky-status-tile">
      <span>Cue</span>
      <strong id="stickyCue">CUE 01</strong>
    </div>
    <div class="sticky-status-tile">
      <span>Last Trace</span>
      <strong id="stickyTrace">TR-1000</strong>
    </div>
  `;

  const tabs = document.createElement("nav");
  tabs.id = "pyroGateTabs";
  tabs.className = "pyro-gate-tabs";
  tabs.setAttribute("aria-label", "Pyro workflow gates");
  tabs.innerHTML = gateDefinitions.map((gate, index) => `
    <button class="pyro-gate-tab" type="button" data-gate-target="${gate.id}">
      <strong>${String(index + 1).padStart(2, "0")} ${gate.title}</strong>
      <span>${gate.subtitle}</span>
    </button>
  `).join("");

  root.prepend(tabs);
  root.prepend(statusBar);

  const panels = new Map();

  gateDefinitions.forEach((gate) => {
    const panel = document.createElement("section");
    panel.className = "pyro-gate-panel";
    panel.dataset.gatePanel = gate.id;

    const selectedSections = gate.sections
      .map((selector) => selector === "#simChannelGrid" ? document.getElementById("simChannelGrid")?.closest(".pyro-panel") : document.querySelector(selector))
      .filter(Boolean);

    selectedSections.forEach((section) => {
      panel.appendChild(section);
    });

    const footer = document.createElement("div");
    footer.className = "pyro-gate-footer";
    footer.innerHTML = `
      <button class="pyro-gate-nav-button" type="button" data-gate-prev>Back</button>
      <button class="pyro-gate-nav-button primary" type="button" data-gate-next>Next Gate</button>
    `;
    panel.appendChild(footer);

    root.appendChild(panel);
    panels.set(gate.id, panel);
  });

  let activeGateIndex = 0;

  function gateIsComplete(gateId) {
    const masterPower = document.getElementById("simMasterPower")?.checked;
    const controlEnable = document.getElementById("simTrainingMode")?.checked;
    const keyEnable = document.getElementById("simSupervisorKey")?.checked;
    const areaClear = document.getElementById("simZoneClear")?.checked;
    const readyState = document.getElementById("localZoneState")?.textContent?.trim().toUpperCase() === "READY";

    if (gateId === "overview") return true;
    if (gateId === "interlocks") return Boolean(masterPower && controlEnable && keyEnable && areaClear);
    if (gateId === "cues") return true;
    if (gateId === "fire") return readyState || keyEnable;
    return false;
  }

  function refreshStickyStatus() {
    const state = document.getElementById("pyroStateText")?.textContent || "SAFE / LOCKED OUT";
    const cue = document.getElementById("pyroSelectedCue")?.textContent || "CUE 01";
    const zone = document.getElementById("teamAssignedZone")?.value || "A";
    const operator = document.getElementById("operatorStatusText")?.textContent?.replace("Authorized: ", "") || "Auth required";
    const trace = document.getElementById("traceLastAction")?.textContent || "TR-1000";

    const stickySystemState = document.getElementById("stickySystemState");
    const stickyZone = document.getElementById("stickyZone");
    const stickyOperator = document.getElementById("stickyOperator");
    const stickyCue = document.getElementById("stickyCue");
    const stickyTrace = document.getElementById("stickyTrace");
    const firstTile = statusBar.querySelector(".sticky-status-tile.primary");

    if (stickySystemState) stickySystemState.textContent = state;
    if (stickyZone) stickyZone.textContent = `Zone ${zone}`;
    if (stickyOperator) stickyOperator.textContent = operator;
    if (stickyCue) stickyCue.textContent = cue;
    if (stickyTrace) stickyTrace.textContent = trace;

    firstTile?.classList.toggle("hold", state.toUpperCase().includes("HOLD"));
  }

  function showGate(index) {
    activeGateIndex = Math.max(0, Math.min(index, gateDefinitions.length - 1));
    const activeGate = gateDefinitions[activeGateIndex];

    gateDefinitions.forEach((gate, gateIndex) => {
      const panel = panels.get(gate.id);
      const tab = tabs.querySelector(`[data-gate-target="${gate.id}"]`);
      const active = gate.id === activeGate.id;

      panel?.classList.toggle("active", active);
      tab?.classList.toggle("active", active);
      tab?.classList.toggle("complete", gateIsComplete(gate.id));
      tab?.setAttribute("aria-selected", String(active));

      const prev = panel?.querySelector("[data-gate-prev]");
      const next = panel?.querySelector("[data-gate-next]");
      if (prev) prev.disabled = gateIndex === 0;
      if (next) next.textContent = gateIndex === gateDefinitions.length - 1 ? "Stay Here" : "Next Gate";
    });

    refreshStickyStatus();
  }

  tabs.querySelectorAll("[data-gate-target]").forEach((button) => {
    button.addEventListener("click", () => {
      const index = gateDefinitions.findIndex((gate) => gate.id === button.dataset.gateTarget);
      showGate(index);
    });
  });

  root.addEventListener("click", (event) => {
    if (event.target.matches("[data-gate-prev]")) {
      showGate(activeGateIndex - 1);
    }

    if (event.target.matches("[data-gate-next]")) {
      showGate(activeGateIndex + 1);
    }

    window.setTimeout(() => {
      refreshStickyStatus();
      showGate(activeGateIndex);
    }, 0);
  });

  root.addEventListener("change", () => {
    window.setTimeout(() => {
      refreshStickyStatus();
      showGate(activeGateIndex);
    }, 0);
  });

  window.setInterval(refreshStickyStatus, 1000);
  showGate(0);
}
