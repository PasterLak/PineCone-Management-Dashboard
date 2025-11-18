/**
 * Device Actions
 * Führt Device-Aktionen aus (Delete, Blink, Edit, Pins)
 */
class DeviceActions {
  constructor(dataService, apiService, rowRenderer, editHandler, pinRenderer) {
    this.dataService = dataService;
    this.api = apiService;
    this.rowRenderer = rowRenderer;
    this.editHandler = editHandler;
    this.pinRenderer = pinRenderer;
  }

  // Löscht ein Device
  async deleteDevice(deviceId, onSuccess) {
    try {
      await this.api.deleteDevice(deviceId);
      this.dataService.deleteDevice(deviceId);
      
      if (onSuccess) onSuccess();
    } catch (err) {
      alert('Deleting failed.');
    }
  }

  // Togglet Blink
  async toggleBlink(deviceId, onSuccess) {
    try {
      const newBlinkState = await this.api.toggleBlink(deviceId);
      this.dataService.updateDevice(deviceId, { blink: newBlinkState });
      
      if (onSuccess) onSuccess(newBlinkState);
    } catch (err) {
      alert('Toggle blink failed.');
    }
  }

  // Startet Edit
  startEdit(deviceId) {
    this.editHandler.startEdit(deviceId);
  }

  // Beendet Edit
  async finishEdit(deviceId, cancel) {
    return await this.editHandler.finishEdit(deviceId, cancel);
  }

  // Prüft ob gerade editiert wird
  isEditing() {
    return this.editHandler.isCurrentlyEditing();
  }
}
