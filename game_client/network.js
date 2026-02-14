class NetworkManager {
    constructor() {
        this.es = null;
        this.onData = null;
        this.onStatus = null;
    }

    connect(baseUrl) {
        this.disconnect();
        
        const params = new URLSearchParams({
            ids: "",
            interval: "10"
        });

        const url = `${baseUrl.replace(/\/+$/, "")}/api/realtime/stream?${params}`;
        
        try {
            this.es = new EventSource(url);
            this.updateStatus("Connecting...", false);

            this.es.onopen = () => this.updateStatus("Connected", true);
            
            this.es.onerror = () => {
                this.updateStatus("Error / Disconnected", false);
                this.disconnect();
            };

            this.es.addEventListener("devices", (ev) => {
                try {
                    const data = JSON.parse(ev.data);
                    if (this.onData) this.onData(data);
                } catch (e) {
                    console.error(e);
                }
            });
        } catch (e) {
            this.updateStatus("Connection Failed", false);
        }
    }

    disconnect() {
        if (this.es) {
            this.es.close();
            this.es = null;
        }
        this.updateStatus("Disconnected", false);
    }

    updateStatus(text, isConnected) {
        if (this.onStatus) this.onStatus(text, isConnected);
    }
}