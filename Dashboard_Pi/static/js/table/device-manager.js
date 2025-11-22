/**
 * Device Manager
 */
class DeviceManager {
  constructor(settingsManager) {
    this.settings = settingsManager;
    
    // Initialize services
    this.dom = new DeviceDOM();
    this.dataService = new DeviceDataService();
    this.apiService = new DeviceAPIService();
    
    // Initialize renderers
    this.rowRenderer = new DeviceRowRenderer(this.dataService);
    this.pinRenderer = new PinDetailsRenderer();
    
    // Initialize managers
    this.editHandler = new DeviceEditHandler(this.dom);
    this.pinManager = new DevicePinManager(this.dom, this.pinRenderer);
    this.renderer = new DeviceRenderer(
      this.dom,
      this.dataService,
      this.rowRenderer,
      this.pinManager,
      this.settings
    );
    
    // Initialize actions
    this.actions = new DeviceActions(
      this.dataService,
      this.apiService,
      this.rowRenderer,
      this.editHandler,
      this.pinRenderer
    );
    
    // Initialize polling
    this.pollingService = new DevicePollingService(
      this.apiService,
      this.dataService,
      this.renderer,
      this.actions,
      this.settings
    );
    
    // Initialize event handler
    this.eventHandler = new DeviceEventHandler(
      this.actions,
      this.pinManager,
      this.renderer
    );
  }

  // Initializes the Device Manager
  init() {
    if (!this.dom.isAvailable()) {
      console.warn('Device table not found in DOM');
      return;
    }

    // Initial render
    this.renderer.render(this.dataService.getAll());

    // Setup events
    this.eventHandler.setup();

    // Start polling
    this.pollingService.start();

    // Listen for settings changes
    this._setupSettingsListener();
  }

  _setupSettingsListener() {
    this.settings.onUpdate((changes) => {
      if (changes.pollInterval || changes.offlineThreshold || changes.tickOffline) {
        if (changes.offlineThreshold) {
          this.renderer.updateOfflineStatus();
        }
        
        if (changes.pollInterval) {
          this.pollingService.setInterval(changes.pollInterval);
        }
        
        if (changes.tickOffline) {
          this.pollingService.restart();
        }
      }
    });
  }
}
