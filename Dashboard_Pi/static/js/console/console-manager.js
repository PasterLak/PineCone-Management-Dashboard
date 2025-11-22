const ConsoleManager = {
  isActive: false,
  pollingService: null,
  apiService: null,

  init(settingsManager) {
    ConsoleDOM.init();
    ConsoleEventHandler.init();
    ConsoleRenderer._loadState();
    
    this.apiService = new APIService();
    this.pollingService = new ConsolePollingService(
      this.apiService,
      ConsoleRenderer,
      settingsManager.get('consolePoll')
    );
    
    if (settingsManager) {
      ConsoleConfig.updateFromSettings(settingsManager.settings);
      
      settingsManager.onUpdate((newSettings) => {
        ConsoleConfig.updateFromSettings(newSettings);
        if (this.isActive && newSettings.consolePoll) {
          this.pollingService.setInterval(newSettings.consolePoll);
        }
      });
    }
    
    if (typeof feather !== 'undefined') {
      feather.replace();
    }
  },

  activate() {
    if (this.isActive) return;
    this.isActive = true;
    this.pollingService.start();
  },

  deactivate() {
    if (!this.isActive) return;
    this.isActive = false;
    this.pollingService.stop();
  }
};
