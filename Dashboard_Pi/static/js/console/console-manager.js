// Console Manager - Main orchestrator
const ConsoleManager = {
  isActive: false,

  init() {
    ConsoleDOM.init();
    ConsoleEventHandler.init();
    
    // Load saved state from localStorage
    ConsoleRenderer._loadState();
    
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
