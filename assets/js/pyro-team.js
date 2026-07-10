function initializePyroTeamSync() {
  const root = document.getElementById("teamSyncPanel");
  if (!root) return;

  const syncPill = document.getElementById("syncStatePill");
  const deviceName = document.getElementById("teamDeviceName");
  const assignedZone = document.getElementById("teamAssignedZone");
  const roleSelect = document.getElementById("teamRole");
  const peerZoneState = document.getElementById("peerZoneState");
  const peerZoneDetail = document.getElementById("peerZoneDetail");
  const localZoneState = document.getElementById("localZoneState");
  const localZoneDetail = document.getElementById("localZoneDetail");
  const syncLog = document.getElementById("syncMiniLog");

  const sessionId = "DEMO-001";
  const deviceId = `HMI-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  const sessionStart = new Date();
  let holdActive = false;
  let traceNumber = 1000;
  let lastActionId = "TR-1000";

  function timestamp() {
    return new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  }

  function actionStamp(action) {
    traceNumber += 1;
    lastActionId = `TR-${traceNumber}`;
    return {
      id: lastActionId,
      time: timestamp(),
      action,
      zone: assignedZone?.value || "A",
      role: roleSelect?.value || "Zone Operator",
      device: deviceName?.value || "Mobile HMI",
    };
  }

  function injectTraceabilityUI() {
    if (document.getElementById("traceabilityPanel")) return;

    root.insertAdjacentHTML("afterbegin", `
      <section id="traceabilityPanel" class="traceability-strip" aria-label="Traceability summary">
        <div class="trace-tile priority">
          <span>Session</span>
          <strong id="traceSessionId">${sessionId}</strong>
        </div>
        <div class="trace-tile">
          <span>Device ID</span>
          <strong id="traceDeviceId">${deviceId}</strong>
        </div>
        <div class="trace-tile">
          <span>Last Action</span>
          <strong id="traceLastAction">${lastActionId}</strong>
        </div>
        <div class="trace-tile">
          <span>Session Start</span>
          <strong>${sessionStart.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</strong>
        </div>
      </section>
    `);

    const commandPanel = document.querySelector(".command-panel");
    commandPanel?.insertAdjacentHTML("afterbegin", `
      <div class="ergonomic-action-banner" role="status">
        <span>Control Focus</span>
        <strong id="controlFocusText">Confirm zone, operator, and hold state before command actions.</strong>
      </div>
    `);

    const eventPanel = document.querySelector(".event-log-panel .channel-header");
    eventPanel?.insertAdjacentHTML("afterend", `
      <div class="audit-note">
        <span>Audit mode</span>
        <strong>Every command should identify operator, zone, device, time, and action ID.</strong>
      </div>
    `);
  }

  function updateTraceabilityUI() {
    const traceLastAction = document.getElementById("traceLastAction");
    const controlFocusText = document.getElementById("controlFocusText");

    if (traceLastAction) {
      traceLastAction.textContent = lastActionId;
    }

    if (controlFocusText) {
      const zone = assignedZone?.value || "A";
      const role = roleSelect?.value || "Zone Operator";
      const device = deviceName?.value || "Mobile HMI";
      controlFocusText.textContent = `Zone ${zone} / ${role} / ${device}`;
    }
  }

  function addSyncLog(message, action = "STATUS") {
    if (!syncLog) return;

    const stamp = actionStamp(action);
    const item = document.createElement("li");
    item.innerHTML = `
      <span>${stamp.id} · ${stamp.time} · Zone ${stamp.zone}</span>
      <strong>${message}</strong>
      <em>${stamp.device} / ${stamp.role}</em>
    `;
    syncLog.prepend(item);

    while (syncLog.children.length > 8) {
      syncLog.removeChild(syncLog.lastElementChild);
    }

    updateTraceabilityUI();
  }

  function updateZoneLabels() {
    const zone = assignedZone?.value || "A";
    const peerZone = zone === "A" ? "B" : "A";
    const role = roleSelect?.value || "Zone Operator";
    const device = deviceName?.value || "Mobile HMI";

    document.querySelectorAll("[data-local-zone]").forEach((item) => {
      item.textContent = zone;
    });

    document.querySelectorAll("[data-peer-zone]").forEach((item) => {
      item.textContent = peerZone;
    });

    if (localZoneDetail) {
      localZoneDetail.textContent = `${device} / ${role} / ${deviceId}`;
    }

    if (peerZoneDetail) {
      peerZoneDetail.textContent = `Peer Zone ${peerZone} / awaiting sync`;
    }

    updateTraceabilityUI();
  }

  function setLocalState(state, detail) {
    if (!localZoneState) return;

    localZoneState.className = `zone-state ${state.toLowerCase()}`;
    localZoneState.textContent = state;

    if (detail && localZoneDetail) {
      localZoneDetail.textContent = detail;
    }
  }

  function setPeerState(state, detail) {
    if (!peerZoneState) return;

    peerZoneState.className = `zone-state ${state.toLowerCase()}`;
    peerZoneState.textContent = state;

    if (detail && peerZoneDetail) {
      peerZoneDetail.textContent = detail;
    }
  }

  function updateSyncPill() {
    if (!syncPill) return;

    syncPill.classList.toggle("hold", holdActive);
    syncPill.textContent = holdActive ? "Global Hold" : "Trace Local";
  }

  root.querySelectorAll("[data-sync-action]").forEach((button) => {
    button.addEventListener("click", () => {
      const action = button.dataset.syncAction;
      const zone = assignedZone?.value || "A";
      const peerZone = zone === "A" ? "B" : "A";
      const role = roleSelect?.value || "Zone Operator";
      const device = deviceName?.value || "Mobile HMI";

      if (action === "ready") {
        holdActive = false;
        setLocalState("READY", `Zone ${zone} ready / ${device} / ${role}`);
        addSyncLog(`Zone ${zone} marked READY.`, "READY");
      }

      if (action === "standby") {
        holdActive = false;
        setLocalState("SAFE", `Zone ${zone} standing by / ${device}`);
        addSyncLog(`Zone ${zone} standing by.`, "STANDBY");
      }

      if (action === "peer-ready") {
        setPeerState("READY", `Peer Zone ${peerZone} reports ready / local receipt only`);
        addSyncLog(`Peer Zone ${peerZone} ready message received.`, "PEER READY");
      }

      if (action === "hold") {
        holdActive = true;
        setLocalState("HOLD", `Zone ${zone} hold requested / ${device}`);
        setPeerState("HOLD", `Peer Zone ${peerZone} hold notice pending`);
        addSyncLog(`GLOBAL HOLD requested from Zone ${zone}.`, "HOLD");
      }

      if (action === "clear-hold") {
        holdActive = false;
        setLocalState("SAFE", `Zone ${zone} returned to safe / ${device}`);
        setPeerState("SAFE", `Peer Zone ${peerZone} hold clear pending`);
        addSyncLog("Global hold cleared locally.", "CLEAR HOLD");
      }

      updateSyncPill();
    });
  });

  [deviceName, assignedZone, roleSelect].forEach((control) => {
    control?.addEventListener("input", updateZoneLabels);
    control?.addEventListener("change", updateZoneLabels);
  });

  injectTraceabilityUI();
  updateZoneLabels();
  updateSyncPill();
  addSyncLog("Team sync UI initialized with traceability-first local audit.", "INIT");
}
