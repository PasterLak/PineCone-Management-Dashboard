/**
 * Device Actions
 * runs actions (Delete, Blink, Edit, Pins)
 */
class DeviceActions {
  constructor(dataService, apiService, rowRenderer, editHandler, pinRenderer) {
    this.dataService = dataService;
    this.api = apiService;
    this.rowRenderer = rowRenderer;
    this.editHandler = editHandler;
    this.pinRenderer = pinRenderer;
  }

  // Deletes a device
  async deleteDevice(deviceId, onSuccess) {
    try {
      await this.api.deleteDevice(deviceId);
      this.dataService.deleteDevice(deviceId);
      
      if (onSuccess) onSuccess();
    } catch (err) {
      alert('Deleting failed.');
    }
  }

  // Toggles Blink
  async toggleBlink(deviceId, onSuccess) {
    try {
      const newBlinkState = await this.api.toggleBlink(deviceId);
      this.dataService.updateDevice(deviceId, { blink: newBlinkState });
      
      if (onSuccess) onSuccess(newBlinkState);
    } catch (err) {
      alert('Toggle blink failed.');
    }
  }

  // Starts Edit
  startEdit(deviceId) {
    this.editHandler.startEdit(deviceId);
  }

  // Finishes Edit
  async finishEdit(deviceId, cancel) {
    return await this.editHandler.finishEdit(deviceId, cancel);
  }

  // Checks if currently editing
  isEditing() {
    return this.editHandler.isCurrentlyEditing();
  }

  // Clear all devices from table
  async clearTable(onSuccess) {
    if (!confirm('Are you sure you want to clear the table data? This cannot be undone.')) {
      return;
    }

    try {
      const devices = this.dataService.getAll();
      const deviceIds = Object.keys(devices);
      
      // Delete all devices
      const deletePromises = deviceIds.map(id => this.api.deleteDevice(id));
      await Promise.all(deletePromises);
      
      // Clear local data
      deviceIds.forEach(id => this.dataService.deleteDevice(id));
      
      if (onSuccess) onSuccess();
    } catch (err) {
      alert('Clearing table failed.');
    }
  }
}
