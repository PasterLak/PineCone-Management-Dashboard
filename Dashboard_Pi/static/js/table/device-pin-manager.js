/**
 * Device Pin Manager
 * Manages the display of device pin details
 */
class DevicePinManager {
  constructor(dom, pinRenderer) {
    this.dom = dom;
    this.pinRenderer = pinRenderer;
    this.expandedPinRow = null;
  }

  // Toggles pin details for a device
  togglePinDetails(deviceId, deviceData) {
    if (!deviceData) return;

    const deviceRow = this.dom.getRow(deviceId);
    if (!deviceRow) return;

    const existingPinRow = this.dom.getNextRow(deviceRow);
    const isCurrentlyExpanded = existingPinRow && 
                                existingPinRow.classList.contains(DeviceConfig.CSS_CLASSES.PIN_DETAILS_ROW);

    // Close other open pin details
    if (this.expandedPinRow && this.expandedPinRow !== existingPinRow) {
      this.dom.removeRow(this.expandedPinRow);
      this._deactivatePinsButton(this.expandedPinRow.dataset.deviceId);
    }

    // Toggle current device
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

  // Updates pin details if expanded
  updateExpandedPins(deviceId, pins) {
    if (!this.expandedPinRow) return;
    if (this.expandedPinRow.dataset.deviceId !== deviceId) return;

    this.pinRenderer.updatePinDetailsContent(this.expandedPinRow, pins);
    
    if (window.feather) feather.replace();
  }

  // Restores expanded pins after re-render
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

  // Activates Pins button
  _activatePinsButton(deviceId, deviceRow = null) {
    const row = deviceRow || this.dom.getRow(deviceId);
    const btn = this.dom.findButton(row, DeviceConfig.BUTTONS.PINS);
    if (btn) {
      btn.classList.add(DeviceConfig.CSS_CLASSES.ACTIVE);
    }
  }

  // Deactivates Pins button
  _deactivatePinsButton(deviceId, deviceRow = null) {
    const row = deviceRow || this.dom.getRow(deviceId);
    const btn = this.dom.findButton(row, DeviceConfig.BUTTONS.PINS);
    if (btn) {
      btn.classList.remove(DeviceConfig.CSS_CLASSES.ACTIVE);
    }
  }

  // Returns currently expanded device ID
  getExpandedDeviceId() {
    return this.expandedPinRow?.dataset.deviceId || null;
  }
}
