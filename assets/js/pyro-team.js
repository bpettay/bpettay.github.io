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

  let holdActive = false;

  function timestamp() {
    return new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  }

  function addSyncLog(message) {
    if (!syncLog) return;

    const item = document.createElement("li");
    item.innerHTML = `<span>${timestamp()}</span>${message}`;
    syncLog.prepend(item);

    while (syncLog.children.length > 6) {
      syncLog.removeChild(syncLog.lastElementChild);
    }
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
      localZoneDetail.textContent = `${device} / ${role}`;
    }

    if (peerZoneDetail) {
      peerZoneDetail.textContent = `Peer Zone ${peerZone} / simulated standby`;
    }
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
    syncPill.textContent = holdActive ? "Global Hold" : "Local Sync Demo";
  }

  root.querySelectorAll("[data-sync-action]").forEach((button) => {
    button.addEventListener("click", () => {
      const action = button.dataset.syncAction;
      const zone = assignedZone?.value || "A";
      const peerZone = zone === "A" ? "B" : "A";

      if (action === "ready") {
        holdActive = false;
        setLocalState("READY", `Zone ${zone} marked ready / ${roleSelect?.value || "Zone Operator"}`);
        addSyncLog(`Zone ${zone} marked READY.`);
      }

      if (action === "standby") {
        holdActive = false;
        setLocalState("SAFE", `Zone ${zone} standing by.`);
        addSyncLog(`Zone ${zone} standing by.`);
      }

      if (action === "peer-ready") {
        setPeerState("READY", `Peer Zone ${peerZone} reports ready.`);
        addSyncLog(`Peer Zone ${peerZone} ready message received.`);
      }

      if (action === "hold") {
        holdActive = true;
        setLocalState("HOLD", `Zone ${zone} hold requested.`);
        setPeerState("HOLD", `Peer Zone ${peerZone} notified of hold.`);
        addSyncLog(`GLOBAL HOLD requested from Zone ${zone}.`);
      }

      if (action === "clear-hold") {
        holdActive = false;
        setLocalState("SAFE", `Zone ${zone} returned to safe.`);
        setPeerState("SAFE", `Peer Zone ${peerZone} hold cleared.`);
        addSyncLog("Global hold cleared locally.");
      }

      updateSyncPill();
    });
  });

  [deviceName, assignedZone, roleSelect].forEach((control) => {
    control?.addEventListener("input", updateZoneLabels);
    control?.addEventListener("change", updateZoneLabels);
  });

  updateZoneLabels();
  updateSyncPill();
  addSyncLog("Team sync UI initialized in local demo mode.");
}
