/**
 * Device Pin Manager
 * Verwaltet das Ein-/Ausklappen von Pin-Details
 */
class DevicePinManager {
  constructor(dom, pinRenderer) {
    this.dom = dom;
    this.pinRenderer = pinRenderer;
    this.expandedPinRow = null;
  }

  // Togglet Pin-Details für ein Device
  togglePinDetails(deviceId, deviceData) {
    if (!deviceData) return;

    const deviceRow = this.dom.getRow(deviceId);
    if (!deviceRow) return;

    const existingPinRow = this.dom.getNextRow(deviceRow);
    const isCurrentlyExpanded = existingPinRow && 
                                existingPinRow.classList.contains(DeviceConfig.CSS_CLASSES.PIN_DETAILS_ROW);

    // Schließe andere offene Pin-Details
    if (this.expandedPinRow && this.expandedPinRow !== existingPinRow) {
      this.dom.removeRow(this.expandedPinRow);
      this._deactivatePinsButton(this.expandedPinRow.dataset.deviceId);
    }

    // Toggle aktuelles Device
    if (isCurrentlyExpanded) {
      this.dom.removeRow(existingPinRow);
      this.expandedPinRow = null;
      this._deactivatePinsButton(deviceId, deviceRow);
    } else {
      const pinRow = this.pinRenderer.createPinDetailsRow(deviceId, deviceData.pins || {});
      this.dom.insertAfter(pinRow, deviceRow);
      this.expandedPinRow = pinRow;
      this._activatePinsButton(deviceId, deviceRow);
      
      if (window.feather) feather.replace();
    }
  }

  // Aktualisiert Pin-Details falls geöffnet
  updateExpandedPins(deviceId, pins) {
    if (!this.expandedPinRow) return;
    if (this.expandedPinRow.dataset.deviceId !== deviceId) return;

    this.pinRenderer.updatePinDetailsContent(this.expandedPinRow, pins);
    
    if (window.feather) feather.replace();
  }

  // Stellt erweiterte Pins nach Re-Render wieder her
  restoreExpandedPins(deviceId, deviceData) {
    if (!this.expandedPinRow) return;
    if (this.expandedPinRow.dataset.deviceId !== deviceId) return;
    if (!deviceData) return;

    const deviceRow = this.dom.getRow(deviceId);
    if (!deviceRow) {
      this.expandedPinRow = null;
      return;
    }

    const pinRow = this.pinRenderer.createPinDetailsRow(deviceId, deviceData.pins || {});
    this.dom.insertAfter(pinRow, deviceRow);
    this.expandedPinRow = pinRow;
    this._activatePinsButton(deviceId, deviceRow);
    
    if (window.feather) feather.replace();
  }

  // Aktiviert Pins-Button
  _activatePinsButton(deviceId, deviceRow = null) {
    const row = deviceRow || this.dom.getRow(deviceId);
    const btn = this.dom.findButton(row, DeviceConfig.BUTTONS.PINS);
    if (btn) {
      btn.classList.add(DeviceConfig.CSS_CLASSES.ACTIVE);
    }
  }

  // Deaktiviert Pins-Button
  _deactivatePinsButton(deviceId, deviceRow = null) {
    const row = deviceRow || this.dom.getRow(deviceId);
    const btn = this.dom.findButton(row, DeviceConfig.BUTTONS.PINS);
    if (btn) {
      btn.classList.remove(DeviceConfig.CSS_CLASSES.ACTIVE);
    }
  }

  // Gibt aktuell erweiterte Device-ID zurück
  getExpandedDeviceId() {
    return this.expandedPinRow?.dataset.deviceId || null;
  }
}
