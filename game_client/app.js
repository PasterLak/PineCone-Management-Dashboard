let es = null;

const apiBaseEl = document.getElementById("apiBase");
const idsEl = document.getElementById("ids");
const intervalEl = document.getElementById("interval");
const statusEl = document.getElementById("status");
const outEl = document.getElementById("output");

const connectBtn = document.getElementById("connectBtn");
const disconnectBtn = document.getElementById("disconnectBtn");
const snapshotBtn = document.getElementById("snapshotBtn");

function setStatus(text) {
  statusEl.textContent = text;
}

function setConnectedUI(isConnected) {
  connectBtn.style.display = isConnected ? "none" : "";
  snapshotBtn.style.display = isConnected ? "none" : "";
  disconnectBtn.style.display = isConnected ? "" : "none";
}

function buildQuery() {
  const ids = encodeURIComponent(idsEl.value.trim());
  const interval = Math.max(50, Math.min(2000, Number(intervalEl.value || 100)));
  return `ids=${ids}&interval=${interval}`;
}

async function fetchSnapshot() {
  const base = apiBaseEl.value.replace(/\/+$/, "");
  const url = `${base}/api/realtime/snapshot?${buildQuery()}`;
  const res = await fetch(url);
  const data = await res.json();
  outEl.textContent = JSON.stringify(data, null, 2);
}

function connectStream() {
  disconnectStream();

  const base = apiBaseEl.value.replace(/\/+$/, "");
  const url = `${base}/api/realtime/stream?${buildQuery()}`;
  es = new EventSource(url);

  setStatus("connecting");

  es.onopen = () => {
    setStatus("connected");
    setConnectedUI(true);
  };
  es.onerror = () => {
    setStatus("error/disconnected");
    setConnectedUI(false);
  };

  es.addEventListener("devices", (ev) => {
    try {
      outEl.textContent = JSON.stringify(JSON.parse(ev.data), null, 2);
    } catch {
      outEl.textContent = ev.data;
    }
  });
}

function disconnectStream() {
  if (es) {
    es.close();
    es = null;
  }
  setStatus("disconnected");
  setConnectedUI(false);
}

connectBtn.addEventListener("click", connectStream);
disconnectBtn.addEventListener("click", disconnectStream);
snapshotBtn.addEventListener("click", fetchSnapshot);

setConnectedUI(false);