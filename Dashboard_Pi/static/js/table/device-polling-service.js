/**
 * Device Polling Service
 * Verwaltet das Polling von Device-Updates
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

  // Startet Polling
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

  // Stoppt Polling
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

  // Neustart mit neuen Settings
  restart() {
    this.stop();
    this.start();
  }

  // Einmaliges Polling
  async _pollOnce() {
    try {
      const newDevices = await this.api.fetchDevices();

      // Bei Editing: State aktualisieren, aber nicht rendern
      if (this.actions.isEditing()) {
        this.dataService.setAll(newDevices);
        return;
      }

      // Änderungen erkennen
      const changes = this.dataService.detectChanges(newDevices);
      
      if (changes.structureChanged) {
        // Vollständiges Re-Rendering
        this.renderer.render(newDevices);
      } else if (changes.dataChanged) {
        // In-Place Update
        this.renderer.updateInPlace(newDevices, changes.changedIds);
      } else {
        // Nur State aktualisieren
        this.dataService.setAll(newDevices);
      }
    } catch (err) {
      console.error('Polling failed:', err);
    }
  }
}
