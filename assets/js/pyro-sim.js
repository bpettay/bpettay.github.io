function initializePyroSimulator() {
  const root = document.getElementById("pyro-controls");
  if (!root) return;

  const operatorCodes = {
    BP: { name: "Brock Pettay", code: "2626" },
    LD: { name: "Lead Operator", code: "1911" },
    TC: { name: "Test Crew", code: "7342" },
  };

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

  const channels = Array.from({ length: 12 }, (_, index) => ({
    id: index + 1,
    continuity: ![4, 9].includes(index + 1),
    used: false,
    selected: index === 0,
  }));

  let armed = false;
  let authorizedOperator = null;
  let pendingPin = "";
  let cueWheelSelect = null;
  let cueWheelStatus = null;
  let cueWheelPrev = null;
  let cueWheelNext = null;

  function addLog(message) {
    if (!eventLog) return;

    const item = document.createElement("li");
    const time = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

    item.innerHTML = `<span>${time}</span>${message}`;
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
      addLog(`Cue ${String(target.id).padStart(2, "0")} selected.`);
    }

    render();
  }

  function nudgeSelectedCue(direction) {
    const selected = selectedChannel();
    const nextId = ((selected.id - 1 + direction + channels.length) % channels.length) + 1;
    selectChannelById(nextId);
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
      authorizedOperator &&
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
      operatorStatusText.textContent = authorizedOperator
        ? `Authorized: ${authorizedOperator.name}`
        : "Authorization required";
    }
  }

  function openAuthorizationDialog() {
    pendingPin = "";
    if (authStatus) authStatus.textContent = "Select operator and enter PIN.";
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

  function clearAuthorization() {
    authorizedOperator = null;
    keyEnable.checked = false;
    addLog("Key Enable authorization cleared.");
    render();
  }

  function submitAuthorization() {
    const selectedOperator = operatorCodes[authOperator?.value];

    if (!selectedOperator) {
      if (authStatus) authStatus.textContent = "Select a valid operator.";
      return;
    }

    if (pendingPin === selectedOperator.code) {
      authorizedOperator = selectedOperator;
      keyEnable.checked = true;
      closeAuthorizationDialog();
      addLog(`Key Enable authorized by ${selectedOperator.name}.`);
      render();
      return;
    }

    pendingPin = "";
    keyEnable.checked = false;
    authorizedOperator = null;
    if (authStatus) authStatus.textContent = "Invalid code. Try again.";
    updateAuthDisplay();
    addLog("Key Enable authorization failed.");
    render();
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
        <strong>Selected Cue</strong>
      </div>
      <div class="cue-wheel-row">
        <button id="cueWheelPrev" class="cue-wheel-step" type="button" aria-label="Previous cue">‹</button>
        <select id="cueWheelSelect" class="cue-wheel-select" aria-label="Select cue to command"></select>
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
      cueWheelSelect.innerHTML = channels.map((channel) => `
        <option value="${channel.id}">Cue ${String(channel.id).padStart(2, "0")}</option>
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
      cueWheelStatus.textContent = `Cue ${String(selected.id).padStart(2, "0")} · ${status}`;
      cueWheelStatus.classList.toggle("good", selected.continuity && !selected.used);
      cueWheelStatus.classList.toggle("open", !selected.continuity && !selected.used);
      cueWheelStatus.classList.toggle("used", selected.used);
    }
  }

  function renderChannels() {
    if (!channelGrid) return;

    channelGrid.innerHTML = "";

    channels.forEach((channel) => {
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
        <span class="channel-number">${String(channel.id).padStart(2, "0")}</span>
        <span class="channel-status">${channel.used ? "Used" : channel.continuity ? "Good" : "Open"}</span>
      `;

      button.addEventListener("click", () => {
        selectChannelById(channel.id);
      });

      channelGrid.appendChild(button);
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
      stateText.textContent = `ARMED / CUE ${String(selected.id).padStart(2, "0")}`;
      setLights("armed");
    } else if (ready) {
      stateText.textContent = "READY TO ARM";
      setLights("ready");
    } else {
      stateText.textContent = "SAFE / LOCKED OUT";
      setLights("safe");
    }

    if (selectedCueText) {
      selectedCueText.textContent = `CUE ${String(selected.id).padStart(2, "0")}`;
    }

    if (continuitySummaryText) {
      continuitySummaryText.textContent = `${counts.good} GOOD / ${counts.open} OPEN`;
    }

    if (continuityLamp) {
      continuityLamp.classList.toggle("active", counts.good > 0);
    }

    if (!authorizedOperator && keyEnable?.checked) {
      keyEnable.checked = false;
    }

    updateAuthDisplay();

    armBtn.disabled = !ready || armed;
    fireBtn.disabled = !armed || !selected.continuity || selected.used;

    renderChannels();
    updateCueWheel();
  }

  function runContinuityCheck() {
    const counts = continuityCounts();
    addLog(`Continuity check complete: ${counts.good} good, ${counts.open} open.`);
    render();
  }

  [masterPower, trainingMode, zoneClear].forEach((control) => {
    control?.addEventListener("change", render);
  });

  keyEnable?.addEventListener("click", (event) => {
    if (authorizedOperator && keyEnable.checked) {
      return;
    }

    event.preventDefault();
    keyEnable.checked = false;
    openAuthorizationDialog();
    render();
  });

  keyEnable?.addEventListener("change", () => {
    if (!keyEnable.checked) {
      clearAuthorization();
    }
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
    render();
  });

  authSubmitBtn?.addEventListener("click", submitAuthorization);

  authDialog?.addEventListener("cancel", () => {
    pendingPin = "";
    keyEnable.checked = false;
    render();
  });

  continuityBtn?.addEventListener("click", runContinuityCheck);

  armBtn?.addEventListener("click", () => {
    if (!readyToArm()) return;
    armed = true;
    addLog(`Controller armed by ${authorizedOperator?.name || "authorized operator"}.`);
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
    addLog(`Cue ${String(selected.id).padStart(2, "0")} command recorded by ${authorizedOperator?.name || "operator"}.`);
    render();
  });

  scrambleBtn?.addEventListener("click", () => {
    channels.forEach((channel) => {
      if (!channel.used) {
        channel.continuity = Math.random() > 0.22;
      }
    });
    addLog("Continuity state randomized for display testing.");
    render();
  });

  clearLogBtn?.addEventListener("click", () => {
    eventLog.innerHTML = "";
    addLog("Event log cleared.");
  });

  injectCueWheel();
  addLog("Controller interface initialized in SAFE.");
  render();
}
