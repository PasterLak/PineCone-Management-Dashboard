// Console Polling Service
const ConsolePollingService = {
  intervalId: null,

  start() {
    if (this.intervalId) return;
    
    // Initial fetch
    this.poll();

    // Start polling
    this.intervalId = setInterval(() => {
      this.poll();
    }, ConsoleConfig.pollInterval);
  },

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  },

  async poll() {
    try {
      const data = await ConsoleApiService.fetchLogs();
      if (data && data.logs) {
        ConsoleRenderer.renderLogs(data.logs);
      }
    } catch (error) {
      console.error('[ConsolePolling] Polling error:', error);
    }
  }
};
