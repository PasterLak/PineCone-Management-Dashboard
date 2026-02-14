const connectBtn = document.getElementById("connectBtn");
const disconnectBtn = document.getElementById("disconnectBtn");
const apiBaseEl = document.getElementById("apiBase");
const idsEl = document.getElementById("ids");
const intervalEl = document.getElementById("interval");
const statusEl = document.getElementById("status");
const ipListEl = document.getElementById("ip-history");

const STORAGE_KEY = "pinecone_ip_history";
const LAST_IP_KEY = "pinecone_last_ip";

const network = new NetworkManager();
const game = new GameManager(
    document.getElementById("renderCanvas"),
    document.getElementById("ui-layer")
);

function loadIpHistory() {
    const history = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    const lastIp = localStorage.getItem(LAST_IP_KEY);
    
    ipListEl.innerHTML = "";
    history.forEach(ip => {
        const option = document.createElement("option");
        option.value = ip;
        ipListEl.appendChild(option);
    });

    if (lastIp) {
        apiBaseEl.value = lastIp;
    }
}

function saveIp(ip) {
    if (!ip) return;
    let history = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    
    if (!history.includes(ip)) {
        history.push(ip);
        if (history.length > 5) history.shift();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
        
        const option = document.createElement("option");
        option.value = ip;
        ipListEl.appendChild(option);
    }
    localStorage.setItem(LAST_IP_KEY, ip);
}

network.onStatus = (text, isConnected) => {
    statusEl.textContent = text;
    statusEl.className = `status-badge ${isConnected ? 'connected' : 'disconnected'}`;
    connectBtn.style.display = isConnected ? "none" : "";
    disconnectBtn.style.display = isConnected ? "" : "none";
};

network.onData = (data) => {
    game.syncPlayers(data);
};

connectBtn.addEventListener("click", () => {
    const ip = apiBaseEl.value.trim();
    if (ip) {
        saveIp(ip);
        network.connect(ip, idsEl.value, intervalEl.value);
    }
});

disconnectBtn.addEventListener("click", () => {
    network.disconnect();
    game.removeAllPlayers(); 
});

loadIpHistory();