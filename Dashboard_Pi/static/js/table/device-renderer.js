/**
 * Device Renderer
 * Koordiniert das Rendering der Device Table
 */
class DeviceRenderer {
  constructor(dom, dataService, rowRenderer, pinManager, settingsManager) {
    this.dom = dom;
    this.dataService = dataService;
    this.rowRenderer = rowRenderer;
    this.pinManager = pinManager;
    this.settings = settingsManager;
  }

  // Vollständiges Re-Rendering
  render(devices) {
    if (!this.dom.isAvailable()) return;
    
    const rows = this.dataService.toSortedRows(devices);
    const expandedDeviceId = this.pinManager.getExpandedDeviceId();

    // Keine Devices vorhanden
    if (rows.length === 0) {
      this.dom.replaceContent(this.rowRenderer.createEmptyRow());
      this.dataService.setAll(devices);
      return;
    }

    // Rows erstellen
    const fragment = document.createDocumentFragment();
    const offlineThreshold = this.settings.get('offlineThreshold');

    rows.forEach(row => {
      fragment.appendChild(this.rowRenderer.createRow(row, offlineThreshold));
    });

    this.dom.replaceContent(fragment);
    this.dataService.setAll(devices);

    if (window.feather) feather.replace();

    // Erweiterte Pins wiederherstellen
    if (expandedDeviceId && devices[expandedDeviceId]) {
      this.pinManager.restoreExpandedPins(expandedDeviceId, devices[expandedDeviceId]);
    }
  }

  // In-Place Update (ohne vollständiges Re-Rendering)
  updateInPlace(newDevices, changedIds) {
    changedIds.forEach(deviceId => {
      const row = this.dom.getRow(deviceId);
      if (!row) return;

      const deviceData = newDevices[deviceId];
      
      // Row-Daten aktualisieren
      this.rowRenderer.updateRowInPlace(row, deviceData);

      // Pin-Details aktualisieren falls geöffnet
      this.pinManager.updateExpandedPins(deviceId, deviceData.pins || {});
    });

    this.dataService.setAll(newDevices);
  }

  // Aktualisiert Offline-Status aller Rows
  updateOfflineStatus() {
    if (!this.dom.isAvailable()) return;
    
    const now = Date.now();
    const threshold = this.settings.get('offlineThreshold');
    const rows = this.dom.getAllRows();

    rows.forEach(row => {
      const device = this.dataService.getDevice(row.dataset.id);
      if (!device) return;

      const isOffline = this.dataService.isOffline(device, threshold);
      this.rowRenderer.updateOfflineStatus(row, isOffline);
    });
  }
}
