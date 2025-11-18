/**
 * Simulator Manager
 * Coordinates simulators for testing IoT device POST requests
 * Enables dashboard development and C++ code testing (for early state of dev)
 */
class SimulatorManager {
  constructor(settingsManager) {
    this.settings = settingsManager;
    
    // Initialize services
    this.dom = new SimulatorDOM();
    this.dataService = new SimulatorDataService();
    this.apiService = new SimulatorAPIService();
    
    // Initialize renderers and managers
    this.cardRenderer = new SimulatorCardRenderer();
    this.consoleManager = new SimulatorConsoleManager(this.dom);
    this.renderer = new SimulatorRenderer(this.dom, this.dataService, this.cardRenderer);
    
    // Initialize actions
    this.actions = new SimulatorActions(
      this.dataService,
      this.apiService,
      this.consoleManager
    );
    
    // Initialize polling
    this.pollingService = new SimulatorPollingService(
      this.dataService,
      this.apiService,
      this.consoleManager,
      this.settings
    );
    
    // Initialize event handler
    this.eventHandler = new SimulatorEventHandler(
      this.dom,
      this.actions,
      this.consoleManager,
      this.renderer
    );
  }

  // Initialize the Simulator Manager
  async init() {
    if (!this.dom.isAvailable()) {
      console.warn('Simulator UI not found in DOM');
      return;
    }

    // Load polling interval from settings
    const pollInterval = this.settings.get('simulatorPoll');
    this.pollingService.setInterval(pollInterval);

    // Setup numeric validation for interval fields
    if (typeof setupNumericInputValidationByField === 'function') {
      setupNumericInputValidationByField(SimulatorConfig.FIELDS.INTERVAL);
    }

    // Load simulators from localStorage
    this.dataService.load();
    
    // Sync running state from server
    await this.pollingService.syncRunningState();
    
    // Initial render
    this.renderer.render();
    
    // Setup event handlers
    this.eventHandler.setup();
    
    // Listen for settings changes
    this._setupSettingsListener();
  }

  // Setup settings listener
  _setupSettingsListener() {
    this.settings.onUpdate((changes) => {
      if (changes.simulatorPoll) {
        console.log('Simulator polling interval updated to:', changes.simulatorPoll);
        this.pollingService.setInterval(changes.simulatorPoll);
      }
    });
  }
}
