const API_URL = 'https://smartlot360-default-rtdb.firebaseio.com/liveState.json';
const COMMAND_URL = 'https://smartlot360-default-rtdb.firebaseio.com/command.json';

async function sendCommand(cmd) {
    try {
        await fetch(COMMAND_URL, {
            method: 'PUT',
            body: JSON.stringify(cmd),
            headers: { 'Content-Type': 'application/json' }
        });
        console.log("Command sent:", cmd);
    } catch (err) {
        console.error("Error sending command:", err);
    }
}

async function getLiveState() {
  try {
    const response = await fetch(API_URL);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Could not fetch live state:", error);
    return null;
  }
}

function updateSlotVisuals(liveState) {
  if (!liveState || typeof liveState.Slots !== 'object') {
    return;
  }

  for (let i = 1; i <= 5; i++) {
    const slotId = `Slot${i}`;
    const el = document.getElementById(slotId);
    if (!el) {
      continue;
    }

    const slotState = liveState.Slots[slotId];
    if (typeof slotState !== 'string') {
        console.warn(`Invalid state for ${slotId}:`, slotState);
        continue;
    }

    const isOccupied = slotState.toUpperCase() !== 'AVAILABLE';
    const newClassName = 'slot ' + (isOccupied ? 'occupied' : 'available');
    const newStatusText = isOccupied ? 'OCCUPIED' : 'AVAILABLE';

    // Update the container's class for styling
    if (el.className !== newClassName) {
        el.className = newClassName;
    }

    // Update the status text
    const statusEl = el.querySelector('.status');
    if (statusEl && statusEl.innerText !== newStatusText) {
        statusEl.innerText = newStatusText;
    }
  }
}

function updateGateStatusVisuals(liveState) {
    if (!liveState) return;

    if (typeof liveState.EntryGate === 'string') {
        updateGate('entry', liveState.EntryGate);
    }
    if (typeof liveState.ExitGate === 'string') {
        updateGate('exit', liveState.ExitGate);
    }
}

function updateGate(gateId, status) {
    const el = document.getElementById(`${gateId}-gate-status`);
    if (el) {
        const lowerStatus = status.toLowerCase();
        el.textContent = status.toUpperCase();
        // Ensure class is just 'open' or 'closed' plus any other base classes
        const baseClasses = el.className.split(' ').filter(c => c !== 'open' && c !== 'closed').join(' ');
        el.className = `${baseClasses} ${lowerStatus}`;
    }

    // For manager dashboard gate animation
    const gateEl = document.getElementById(`${gateId}-gate`);
    if (gateEl) {
        if (status === 'OPEN') {
            gateEl.classList.add('open');
        } else {
            gateEl.classList.remove('open');
        }
    }
}

function updateLog(liveState) {
    if (!liveState || !liveState.Remarks) return;
    const logContainer = document.getElementById('log-container');
    if (logContainer) {
        const timestamp = liveState.Timestamps ? new Date(liveState.Timestamps.Epoch * 1000).toLocaleTimeString() : new Date().toLocaleTimeString();
        // Prevent duplicate messages
        if (logContainer.innerHTML.includes(liveState.Remarks)) return;
        const p = document.createElement('p');
        p.innerHTML = `<strong>[${timestamp}]</strong> ${liveState.Remarks.replace(/\n/g, '<br>')}`;
        logContainer.prepend(p);
    }
}

function updateModeToggle(liveState) {
    if (!liveState || !liveState.Mode) return;
    const modeSwitch = document.getElementById('mode-switch'); // for checkbox
    const modeStatus = document.getElementById('mode-status'); // for text status

    if (modeStatus) {
        modeStatus.textContent = liveState.Mode;
    }

    if (modeSwitch && modeSwitch.type === 'checkbox') {
        const isAuto = liveState.Mode.toUpperCase() === 'AUTO';
        if (modeSwitch.checked !== isAuto) {
            modeSwitch.checked = isAuto;
        }
    }
}

async function refreshDashboard() {
    const state = await getLiveState();
    if (state) {
        updateSlotVisuals(state);
        updateGateStatusVisuals(state);
        updateLog(state);
        updateModeToggle(state);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    refreshDashboard();
    setInterval(refreshDashboard, 2000);
});
