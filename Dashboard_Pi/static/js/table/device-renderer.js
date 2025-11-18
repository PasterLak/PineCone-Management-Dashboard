/**
 * Device Renderer
 * Contains rendering logic for Device Table
 */
class DeviceRenderer {
  constructor(dom, dataService, rowRenderer, pinManager, settingsManager) {
    this.dom = dom;
    this.dataService = dataService;
    this.rowRenderer = rowRenderer;
    this.pinManager = pinManager;
    this.settings = settingsManager;
  }

  // Full re-render
  render(devices) {
    if (!this.dom.isAvailable()) return;
    
    const rows = this.dataService.toSortedRows(devices);
    const expandedDeviceId = this.pinManager.getExpandedDeviceId();

    // No devices available
    if (rows.length === 0) {
      this.dom.replaceContent(this.rowRenderer.createEmptyRow());
      this.dataService.setAll(devices);
      return;
    }

    // Create rows
    const fragment = document.createDocumentFragment();
    const offlineThreshold = this.settings.get('offlineThreshold');

    rows.forEach(row => {
      fragment.appendChild(this.rowRenderer.createRow(row, offlineThreshold));
    });

    this.dom.replaceContent(fragment);
    this.dataService.setAll(devices);

    if (window.feather) feather.replace();

    // Restore expanded pins
    if (expandedDeviceId && devices[expandedDeviceId]) {
      this.pinManager.restoreExpandedPins(expandedDeviceId, devices[expandedDeviceId]);
    }
  }

  // In-Place Update (without full re-render)
  updateInPlace(newDevices, changedIds) {
    changedIds.forEach(deviceId => {
      const row = this.dom.getRow(deviceId);
      if (!row) return;

      const deviceData = newDevices[deviceId];
      
      // Update row data
      this.rowRenderer.updateRowInPlace(row, deviceData);

      // Update pin details if expanded
      this.pinManager.updateExpandedPins(deviceId, deviceData.pins || {});
    });

    this.dataService.setAll(newDevices);
  }

  // Updates offline status of all rows
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
