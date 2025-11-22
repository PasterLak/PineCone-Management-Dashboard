// Manages the console log viewer that shows Flask server output
// Polls /api/console/logs every 500ms and displays with color-coded categories
const ConsoleManager = {
  isActive: false,
  pollingService: null,
  apiService: null,

  // Set up console on page load
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
    
    // Update polling interval when settings change
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

  // Called when user navigates to console page
  activate() {
    if (this.isActive) return;
    this.isActive = true;
    this.pollingService.start();  // Start fetching logs
  },

  // Called when user navigates away
  deactivate() {
    if (!this.isActive) return;
    this.isActive = false;
    this.pollingService.stop();  // Stop fetching logs
  }
};

