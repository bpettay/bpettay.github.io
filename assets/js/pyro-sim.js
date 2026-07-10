function initializePyroSimulator() {
  const root = document.getElementById("pyro-controls");
  if (!root) return;

  const channelGrid = document.getElementById("simChannelGrid");
  const eventLog = document.getElementById("simEventLog");
  const stateText = document.getElementById("pyroStateText");
  const selectedCueText = document.getElementById("pyroSelectedCue");
  const continuitySummaryText = document.getElementById("pyroContinuitySummary");
  const continuityLamp = document.getElementById("continuityLamp");

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

  const channels = Array.from({ length: 12 }, (_, index) => ({
    id: index + 1,
    continuity: ![4, 9].includes(index + 1),
    used: false,
    selected: index === 0,
  }));

  let armed = false;

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
      zoneClear?.checked &&
      channels.some((channel) => channel.continuity && !channel.used)
    );
  }

  function setLights(mode) {
    root.querySelectorAll("[data-status-light]").forEach((light) => {
      light.classList.toggle("active", light.dataset.statusLight === mode);
    });
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
        channels.forEach((item) => {
          item.selected = false;
        });
        channel.selected = true;
        addLog(`Cue ${String(channel.id).padStart(2, "0")} selected.`);
        render();
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

    armBtn.disabled = !ready || armed;
    fireBtn.disabled = !armed || !selected.continuity || selected.used;

    renderChannels();
  }

  function runContinuityCheck() {
    const counts = continuityCounts();
    addLog(`Continuity check complete: ${counts.good} good, ${counts.open} open.`);
    render();
  }

  [masterPower, trainingMode, keyEnable, zoneClear].forEach((control) => {
    control?.addEventListener("change", render);
  });

  continuityBtn?.addEventListener("click", runContinuityCheck);

  armBtn?.addEventListener("click", () => {
    if (!readyToArm()) return;
    armed = true;
    addLog("Controller armed after interlock chain completed.");
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
    addLog(`Cue ${String(selected.id).padStart(2, "0")} command recorded.`);
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

  addLog("Controller interface initialized in SAFE.");
  render();
}