/**
 * Device Polling Service
 * Handles periodic polling of device data
 */
class DevicePollingService {
  constructor(apiService, dataService, renderer, actions, settingsManager) {
    this.api = apiService;
    this.dataService = dataService;
    this.renderer = renderer;
    this.actions = actions;
    this.settings = settingsManager;
    
    this.pollIntervalId = null;
    this.offlineIntervalId = null;
  }

  // Starts polling
  start() {
    const pollInterval = this.settings.get('pollInterval');
    const tickOffline = this.settings.get('tickOffline');

    this._pollOnce();
    this.pollIntervalId = setInterval(() => this._pollOnce(), pollInterval);

    this.renderer.updateOfflineStatus();
    this.offlineIntervalId = setInterval(() => {
      this.renderer.updateOfflineStatus();
    }, tickOffline);
  }

  // Stops polling
  stop() {
    if (this.pollIntervalId) {
      clearInterval(this.pollIntervalId);
      this.pollIntervalId = null;
    }
    if (this.offlineIntervalId) {
      clearInterval(this.offlineIntervalId);
      this.offlineIntervalId = null;
    }
  }

  // Restarts with new settings
  restart() {
    this.stop();
    this.start();
  }

  // Single poll
  async _pollOnce() {
    try {
      const newDevices = await this.api.fetchDevices();

      // If editing: update state but do not render
      if (this.actions.isEditing()) {
        this.dataService.setAll(newDevices);
        return;
      }

      // Detect changes
      const changes = this.dataService.detectChanges(newDevices);
      
      if (changes.structureChanged) {
        // Full re-render
        this.renderer.render(newDevices);
      } else if (changes.dataChanged) {
        // In-Place Update
        this.renderer.updateInPlace(newDevices, changes.changedIds);
      } else {
        // Update state only
        this.dataService.setAll(newDevices);
      }
    } catch (err) {
      console.error('Polling failed:', err);
    }
  }
}
