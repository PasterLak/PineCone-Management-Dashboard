// Console Manager - Main orchestrator
const ConsoleManager = {
  isActive: false,

  init(settingsManager) {
    ConsoleDOM.init();
    ConsoleEventHandler.init();
    
    // Load saved state from localStorage
    ConsoleRenderer._loadState();
    
    // Update config from settings
    if (settingsManager) {
      ConsoleConfig.updateFromSettings(settingsManager.settings);
      
      // Listen for settings updates
      settingsManager.onUpdate((newSettings) => {
        ConsoleConfig.updateFromSettings(newSettings);
        
        // Restart polling with new interval if active
        if (this.isActive) {
          ConsolePollingService.stop();
          ConsolePollingService.start();
        }
      });
    }
    
    // Initialize feather icons for console buttons
    if (typeof feather !== 'undefined') {
      feather.replace();
    }
  },

  activate() {
    if (this.isActive) return;
    
    this.isActive = true;
    ConsolePollingService.start();
  },

  deactivate() {
    if (!this.isActive) return;
    
    this.isActive = false;
    ConsolePollingService.stop();
  }
};
