function initializePyroSimulator() {
  const root = document.getElementById("pyro-controls");
  if (!root) return;

  const operatorCodes = {
    BP: { name: "Brock Pettay", code: "2626" },
    LD: { name: "Lead Operator", code: "1911" },
    TC: { name: "Test Crew", code: "7342" },
  };

  const zoneLabels = ["A", "B", "C"];
  const cuesPerZone = 10;

  const channelGrid = document.getElementById("simChannelGrid");
  const eventLog = document.getElementById("simEventLog");
  const stateText = document.getElementById("pyroStateText");
  const selectedCueText = document.getElementById("pyroSelectedCue");
  const continuitySummaryText = document.getElementById("pyroContinuitySummary");
  const continuityLamp = document.getElementById("continuityLamp");
  const operatorStatusText = document.getElementById("operatorStatusText");

  const masterPower = document.getElementById("simMasterPower");
  const trainingMode = document.getElementById("simTrainingMode");
  const keyEnable = document.getElementById("simSupervisorKey");
  const zoneClear = document.getElementById("simZoneClear");

  const continuityBtn = document.getElementById("simContinuityBtn");
  const armBtn = document.getElementById("simArmBtn");
  const disarmBtn = document.getElementById("simDisarmBtn");
  const fireBtn = document.getElementById("simFireBtn");
  const scrambleBtn = document.getElementById("simScrambleBtn");
  const clearLogBtn = document.getElementById("simClearLogBtn");

  const authDialog = document.getElementById("operatorAuthDialog");
  const authOperator = document.getElementById("authOperator");
  const authPinDisplay = document.getElementById("authPinDisplay");
  const authStatus = document.getElementById("authStatus");
  const authCancelBtn = document.getElementById("authCancelBtn");
  const authClearBtn = document.getElementById("authClearBtn");
  const authSubmitBtn = document.getElementById("authSubmitBtn");
  const authKeypadButtons = document.querySelectorAll("[data-auth-key]");

  const openCueKeys = new Set(["A-04", "B-09", "C-07"]);
  const channels = zoneLabels.flatMap((zone, zoneIndex) =>
    Array.from({ length: cuesPerZone }, (_, index) => {
      const cue = index + 1;
      const id = zoneIndex * cuesPerZone + cue;
      const key = `${zone}-${String(cue).padStart(2, "0")}`;

      return {
        id,
        zone,
        cue,
        key,
        continuity: !openCueKeys.has(key),
        used: false,
        selected: id === 1,
      };
    })
  );

  let armed = false;
  let authorizedOperator = window.pyroOperatorSession || null;
  let pendingPin = "";
  let pendingAuthPurpose = "key";
  let cueWheelSelect = null;
  let cueWheelStatus = null;
  let cueWheelPrev = null;
  let cueWheelNext = null;
  let loginResolver = null;

  function activeOperator() {
    return authorizedOperator || window.pyroOperatorSession || null;
  }

  function setOperatorSession(operator) {
    if (!operator) return;

    authorizedOperator = {
      id: operator.id || operator.initials || operator.value || "OP",
      name: operator.name,
      loginAt: operator.loginAt || new Date().toISOString(),
    };

    window.pyroOperatorSession = authorizedOperator;
    window.dispatchEvent(new CustomEvent("pyro-operator-session", { detail: authorizedOperator }));
    updateAuthDisplay();
  }

  function cueLabel(channel, compact = false) {
    if (!channel) return compact ? "A-01" : "Zone A / Cue 01";
    const cue = String(channel.cue).padStart(2, "0");
    return compact ? `${channel.zone}-${cue}` : `Zone ${channel.zone} / Cue ${cue}`;
  }

  function addLog(message, options = {}) {
    if (!eventLog) return;

    const item = document.createElement("li");
    const time = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

    const operator = options.system ? null : activeOperator();
    const actor = operator ? `${operator.name} · ` : "";

    item.innerHTML = `<span>${time}</span>${actor}${message}`;
    eventLog.prepend(item);

    while (eventLog.children.length > 8) {
      eventLog.removeChild(eventLog.lastElementChild);
    }
  }

  function selectedChannel() {
    return channels.find((channel) => channel.selected) || channels[0];
  }

  function selectChannelById(id, announce = true) {
    const target = channels.find((channel) => channel.id === Number(id));
    if (!target) return;

    channels.forEach((channel) => {
      channel.selected = channel.id === target.id;
    });

    if (announce) {
      addLog(`${cueLabel(target)} selected.`);
    }

    render();
  }

  function nudgeSelectedCue(direction) {
    const selected = selectedChannel();
    const selectedIndex = channels.findIndex((channel) => channel.id === selected.id);
    const nextIndex = (selectedIndex + direction + channels.length) % channels.length;
    selectChannelById(channels[nextIndex].id);
  }

  function continuityCounts() {
    return {
      good: channels.filter((channel) => channel.continuity && !channel.used).length,
      open: channels.filter((channel) => !channel.continuity && !channel.used).length,
    };
  }

  function readyToArm() {
    return Boolean(
      masterPower?.checked &&
      trainingMode?.checked &&
      keyEnable?.checked &&
      activeOperator() &&
      zoneClear?.checked &&
      channels.some((channel) => channel.continuity && !channel.used)
    );
  }

  function setLights(mode) {
    root.querySelectorAll("[data-status-light]").forEach((light) => {
      light.classList.toggle("active", light.dataset.statusLight === mode);
    });
  }

  function updateAuthDisplay() {
    if (authPinDisplay) {
      authPinDisplay.textContent = pendingPin ? "•".repeat(pendingPin.length) : "----";
    }

    if (operatorStatusText) {
      const operator = activeOperator();
      operatorStatusText.textContent = operator
        ? `Logged in: ${operator.name}`
        : "Operator login required";
    }
  }

  function openAuthorizationDialog(purpose = "key") {
    pendingAuthPurpose = purpose;
    pendingPin = "";
    const title = document.getElementById("authDialogTitle");
    if (title) title.textContent = purpose === "access" ? "Operator Login" : "Operator Keypad";
    if (authStatus) {
      authStatus.textContent = purpose === "access"
        ? "Operator login required before opening Pyro."
        : "Select operator and enter PIN.";
    }
    updateAuthDisplay();

    if (typeof authDialog?.showModal === "function") {
      authDialog.showModal();
    } else {
      authDialog?.classList.add("open");
    }
  }

  function closeAuthorizationDialog() {
    if (typeof authDialog?.close === "function") {
      authDialog.close();
    } else {
      authDialog?.classList.remove("open");
    }
  }

  function finishLogin(success) {
    if (loginResolver) {
      loginResolver(success ? activeOperator() : null);
      loginResolver = null;
    }
  }

  function submitAuthorization() {
    const selectedOperator = operatorCodes[authOperator?.value];

    if (!selectedOperator) {
      if (authStatus) authStatus.textContent = "Select a valid operator.";
      return;
    }

    if (pendingPin === selectedOperator.code) {
      setOperatorSession({ id: authOperator.value, name: selectedOperator.name });
      if (pendingAuthPurpose === "key") {
        keyEnable.checked = true;
        addLog("Key Enable accepted.");
      } else {
        addLog("Operator login accepted for Pyro access.");
      }
      closeAuthorizationDialog();
      finishLogin(true);
      render();
      return;
    }

    pendingPin = "";
    if (authStatus) authStatus.textContent = "Invalid code. Try again.";
    updateAuthDisplay();
    addLog("Operator authorization failed.", { system: true });
    finishLogin(false);
    render();
  }

  window.isPyroOperatorLoggedIn = function isPyroOperatorLoggedIn() {
    return Boolean(activeOperator()?.name);
  };

  window.requestPyroOperatorLogin = function requestPyroOperatorLogin() {
    if (activeOperator()) {
      return Promise.resolve(activeOperator());
    }

    return new Promise((resolve) => {
      loginResolver = resolve;
      openAuthorizationDialog("access");
    });
  };

  window.addEventListener("pyro-operator-login", (event) => {
    if (event.detail?.name) {
      setOperatorSession(event.detail);
      addLog("Operator login accepted for Pyro access.");
      render();
    }
  });

  function injectCueBankStyles() {
    if (document.getElementById("zoneCueBankStyles")) return;

    const style = document.createElement("style");
    style.id = "zoneCueBankStyles";
    style.textContent = `
      .channel-grid.zone-cue-bank {
        display: grid;
        grid-template-columns: 1fr;
        gap: 0.85rem;
      }

      .cue-zone-group {
        display: grid;
        gap: 0.55rem;
        min-width: 0;
      }

      .cue-zone-title {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        gap: 0.75rem;
        margin: 0;
        color: var(--ink);
        font-size: 0.86rem;
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }

      .cue-zone-title span {
        color: var(--ink-soft);
        font-size: 0.68rem;
        font-weight: 500;
      }

      .zone-channel-grid {
        display: grid;
        grid-template-columns: repeat(10, minmax(0, 1fr));
        gap: 0.45rem;
      }

      .zone-channel-grid .channel-button {
        min-height: 64px;
        padding: 0.5rem 0.35rem;
        border-radius: 12px;
      }

      .zone-channel-grid .channel-number {
        font-size: 0.98rem;
      }

      .channel-zone-label {
        color: var(--ink-soft);
        font-size: 0.58rem;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }

      @media (max-width: 980px) {
        .zone-channel-grid {
          grid-template-columns: repeat(5, minmax(0, 1fr));
        }
      }

      @media (max-width: 420px) {
        .zone-channel-grid {
          grid-template-columns: repeat(5, minmax(0, 1fr));
          gap: 0.38rem;
        }

        .zone-channel-grid .channel-button {
          min-height: 58px;
          padding: 0.42rem 0.25rem;
        }
      }
    `;

    document.head.appendChild(style);
  }

  function updateCueBankHeader() {
    const channelPanel = channelGrid?.closest(".pyro-panel");
    const title = channelPanel?.querySelector(".channel-header h3");
    if (title) title.textContent = "3 zones / 30-channel matrix";
  }

  function injectCueWheel() {
    const commandPanel = document.querySelector(".command-panel");
    if (!commandPanel || document.getElementById("cueQuickSelect")) return;

    const fireButton = document.getElementById("simFireBtn");
    const wheel = document.createElement("section");
    wheel.id = "cueQuickSelect";
    wheel.className = "cue-quick-select";
    wheel.innerHTML = `
      <div class="cue-quick-header">
        <span>Quick Select</span>
        <strong>Zone / Cue</strong>
      </div>
      <div class="cue-wheel-row">
        <button id="cueWheelPrev" class="cue-wheel-step" type="button" aria-label="Previous cue">‹</button>
        <select id="cueWheelSelect" class="cue-wheel-select" aria-label="Select zone and cue to command"></select>
        <button id="cueWheelNext" class="cue-wheel-step" type="button" aria-label="Next cue">›</button>
      </div>
      <p id="cueWheelStatus" class="cue-wheel-status">Cue status loading.</p>
    `;

    if (fireButton) {
      commandPanel.insertBefore(wheel, fireButton);
    } else {
      commandPanel.appendChild(wheel);
    }

    cueWheelSelect = document.getElementById("cueWheelSelect");
    cueWheelStatus = document.getElementById("cueWheelStatus");
    cueWheelPrev = document.getElementById("cueWheelPrev");
    cueWheelNext = document.getElementById("cueWheelNext");

    if (cueWheelSelect) {
      cueWheelSelect.innerHTML = zoneLabels.map((zone) => `
        <optgroup label="Zone ${zone}">
          ${channels.filter((channel) => channel.zone === zone).map((channel) => `
            <option value="${channel.id}">${cueLabel(channel)}</option>
          `).join("")}
        </optgroup>
      `).join("");

      cueWheelSelect.addEventListener("change", () => {
        selectChannelById(cueWheelSelect.value);
      });
    }

    cueWheelPrev?.addEventListener("click", () => nudgeSelectedCue(-1));
    cueWheelNext?.addEventListener("click", () => nudgeSelectedCue(1));
  }

  function updateCueWheel() {
    const selected = selectedChannel();
    if (cueWheelSelect) {
      cueWheelSelect.value = String(selected.id);
    }

    if (cueWheelStatus) {
      const status = selected.used ? "Used" : selected.continuity ? "Continuity good" : "Continuity open";
      cueWheelStatus.textContent = `${cueLabel(selected)} · ${status}`;
      cueWheelStatus.classList.toggle("good", selected.continuity && !selected.used);
      cueWheelStatus.classList.toggle("open", !selected.continuity && !selected.used);
      cueWheelStatus.classList.toggle("used", selected.used);
    }
  }

  function renderChannels() {
    if (!channelGrid) return;

    channelGrid.classList.add("zone-cue-bank");
    channelGrid.innerHTML = "";

    zoneLabels.forEach((zone) => {
      const zoneChannels = channels.filter((channel) => channel.zone === zone);
      const zoneGroup = document.createElement("section");
      zoneGroup.className = "cue-zone-group";
      zoneGroup.innerHTML = `
        <h4 class="cue-zone-title">Zone ${zone}<span>10 cues</span></h4>
        <div class="zone-channel-grid"></div>
      `;

      const zoneGrid = zoneGroup.querySelector(".zone-channel-grid");

      zoneChannels.forEach((channel) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = [
          "channel-button",
          channel.selected ? "selected" : "",
          channel.continuity ? "continuity-good" : "continuity-open",
          channel.used ? "channel-used" : "",
        ].filter(Boolean).join(" ");

        button.innerHTML = `
          <span class="channel-lamp" aria-hidden="true"></span>
          <span class="channel-number">${String(channel.cue).padStart(2, "0")}</span>
          <span class="channel-zone-label">Zone ${channel.zone}</span>
          <span class="channel-status">${channel.used ? "Used" : channel.continuity ? "Good" : "Open"}</span>
        `;

        button.addEventListener("click", () => {
          selectChannelById(channel.id);
        });

        zoneGrid.appendChild(button);
      });

      channelGrid.appendChild(zoneGroup);
    });
  }

  function render() {
    const ready = readyToArm();
    const selected = selectedChannel();
    const counts = continuityCounts();

    if (armed && !ready) {
      armed = false;
      addLog("Interlock changed. Controller returned to SAFE.");
    }

    if (armed) {
      stateText.textContent = `ARMED / ${cueLabel(selected, true)}`;
      setLights("armed");
    } else if (ready) {
      stateText.textContent = "READY TO ARM";
      setLights("ready");
    } else {
      stateText.textContent = "SAFE / LOCKED OUT";
      setLights("safe");
    }

    if (selectedCueText) {
      selectedCueText.textContent = cueLabel(selected, true);
    }

    if (continuitySummaryText) {
      continuitySummaryText.textContent = `${counts.good} GOOD / ${counts.open} OPEN`;
    }

    if (continuityLamp) {
      continuityLamp.classList.toggle("active", counts.good > 0);
    }

    updateAuthDisplay();

    armBtn.disabled = !ready || armed;
    fireBtn.disabled = !armed || !selected.continuity || selected.used;

    renderChannels();
    updateCueWheel();
  }

  function runContinuityCheck() {
    const counts = continuityCounts();
    addLog(`Continuity check complete: ${counts.good} good, ${counts.open} open across ${zoneLabels.length} zones.`);
    render();
  }

  [masterPower, trainingMode, zoneClear].forEach((control) => {
    control?.addEventListener("change", render);
  });

  keyEnable?.addEventListener("click", (event) => {
    if (activeOperator()) {
      return;
    }

    event.preventDefault();
    keyEnable.checked = false;
    openAuthorizationDialog("key");
    render();
  });

  keyEnable?.addEventListener("change", () => {
    if (!keyEnable.checked) {
      armed = false;
      addLog("Key Enable switched off.");
    }
    render();
  });

  authKeypadButtons.forEach((button) => {
    button.addEventListener("click", () => {
      if (pendingPin.length >= 6) return;
      pendingPin += button.dataset.authKey;
      if (authStatus) authStatus.textContent = "Enter operator PIN.";
      updateAuthDisplay();
    });
  });

  authClearBtn?.addEventListener("click", () => {
    pendingPin = "";
    if (authStatus) authStatus.textContent = "PIN cleared.";
    updateAuthDisplay();
  });

  authCancelBtn?.addEventListener("click", () => {
    pendingPin = "";
    keyEnable.checked = false;
    closeAuthorizationDialog();
    finishLogin(false);
    render();
  });

  authSubmitBtn?.addEventListener("click", submitAuthorization);

  authDialog?.addEventListener("cancel", () => {
    pendingPin = "";
    keyEnable.checked = false;
    finishLogin(false);
    render();
  });

  continuityBtn?.addEventListener("click", runContinuityCheck);

  armBtn?.addEventListener("click", () => {
    if (!readyToArm()) return;
    armed = true;
    addLog(`Controller armed for ${cueLabel(selectedChannel())}.`);
    render();
  });

  disarmBtn?.addEventListener("click", () => {
    armed = false;
    addLog("Controller returned to SAFE.");
    render();
  });

  fireBtn?.addEventListener("click", () => {
    const selected = selectedChannel();
    if (!armed || !selected.continuity || selected.used) return;

    selected.used = true;
    armed = false;
    addLog(`${cueLabel(selected)} command recorded.`);
    render();
  });

  scrambleBtn?.addEventListener("click", () => {
    channels.forEach((channel) => {
      if (!channel.used) {
        channel.continuity = Math.random() > 0.22;
      }
    });
    addLog("Continuity state randomized across all zones for display testing.");
    render();
  });

  clearLogBtn?.addEventListener("click", () => {
    eventLog.innerHTML = "";
    addLog("Event log cleared.");
  });

  injectCueBankStyles();
  updateCueBankHeader();
  injectCueWheel();
  addLog("Controller interface initialized in SAFE with 3 zones / 30 cues.", { system: true });
  render();
}
