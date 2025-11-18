/**
 * Device Data Service
 * Verwaltet Device-Daten und Business-Logik
 */
class DeviceDataService {
  constructor() {
    this.devices = window.initialDevices || {};
  }

  // Gibt alle Devices zurück
  getAll() {
    return this.devices;
  }

  // Gibt ein Device zurück
  getDevice(deviceId) {
    return this.devices[deviceId];
  }

  // Setzt alle Devices
  setAll(devices) {
    this.devices = devices;
  }

  // Aktualisiert ein Device
  updateDevice(deviceId, updates) {
    if (this.devices[deviceId]) {
      this.devices[deviceId] = { ...this.devices[deviceId], ...updates };
    }
  }

  // Löscht ein Device
  deleteDevice(deviceId) {
    delete this.devices[deviceId];
  }

  // Konvertiert Devices zu sortierten Rows
  toSortedRows(devices = this.devices) {
    return Object.entries(devices).map(([id, d]) => ({
      id,
      ip: d.ip,
      description: d.description || '',
      last_seen: d.last_seen,
      timestamp: new Date(d.last_seen).getTime(),
      blink: d.blink || false,
      pins: d.pins || {}
    })).sort((a, b) => b.timestamp - a.timestamp);
  }

  // Prüft ob Device offline ist
  isOffline(device, offlineThreshold) {
    const now = Date.now();
    const timestamp = new Date(device.last_seen).getTime();
    return (now - timestamp) > offlineThreshold;
  }

  // Erkennt Änderungen zwischen alten und neuen Devices
  detectChanges(newDevices) {
    const prevIds = new Set(Object.keys(this.devices));
    const newIds = Object.keys(newDevices);

    // Struktur-Änderungen (Devices hinzugefügt/entfernt)
    const structureChanged = newIds.length !== prevIds.size || 
                            newIds.some(id => !prevIds.has(id));

    if (structureChanged) {
      return { structureChanged: true, dataChanged: false, changedIds: [] };
    }

    // Daten-Änderungen
    const changedIds = newIds.filter(id => {
      const prev = this.devices[id];
      const curr = newDevices[id];
      if (!prev) return true;
      
      return prev.last_seen !== curr.last_seen || 
             prev.description !== curr.description ||
             prev.blink !== curr.blink ||
             JSON.stringify(prev.pins || {}) !== JSON.stringify(curr.pins || {});
    });

    return {
      structureChanged: false,
      dataChanged: changedIds.length > 0,
      changedIds: changedIds
    };
  }
}
