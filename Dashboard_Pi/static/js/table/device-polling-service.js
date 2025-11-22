class DevicePollingService extends PollingService {
  constructor(apiService, dataService, renderer, actions, settingsManager) {
    super(settingsManager.get('pollInterval'));
    this.api = apiService;
    this.dataService = dataService;
    this.renderer = renderer;
    this.actions = actions;
    this.settings = settingsManager;
    this.offlineIntervalId = null;
  }

  start() {
    super.start();
    this.renderer.updateOfflineStatus();
    this.offlineIntervalId = setInterval(
      () => this.renderer.updateOfflineStatus(),
      this.settings.get('tickOffline')
    );
  }

  stop() {
    super.stop();
    if (this.offlineIntervalId) {
      clearInterval(this.offlineIntervalId);
      this.offlineIntervalId = null;
    }
  }

  restart() {
    this.stop();
    this.start();
  }

  async _pollOnce() {
    try {
      const newDevices = await this.api.fetchDevices();

      if (this.actions.isEditing()) {
        this.dataService.setAll(newDevices);
        return;
      }

      const changes = this.dataService.detectChanges(newDevices);
      
      if (changes.structureChanged) {
        this.renderer.render(newDevices);
      } else if (changes.dataChanged) {
        this.renderer.updateInPlace(newDevices, changes.changedIds);
      } else {
        this.dataService.setAll(newDevices);
      }
    } catch (err) {
      console.error('Device polling failed:', err);
    }
  }
}
