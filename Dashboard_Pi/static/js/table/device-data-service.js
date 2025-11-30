// Manages device data in memory
// Handles sorting, offline detection, and last-seen timestamps
class DeviceDataService {
  constructor() {
    this.devices = window.initialDevices || {};
  }

  // Returns all devices
  getAll() {
    return this.devices;
  }

  // Returns a device
  getDevice(deviceId) {
    return this.devices[deviceId];
  }

  // Sets all devices
  setAll(devices) {
    this.devices = devices;
  }

  // Updates a device
  updateDevice(deviceId, updates) {
    if (this.devices[deviceId]) {
      this.devices[deviceId] = { ...this.devices[deviceId], ...updates };
    }
  }

  // Deletes a device
  deleteDevice(deviceId) {
    delete this.devices[deviceId];
  }

  // Converts devices to sorted rows
  toSortedRows(devices = this.devices) {
    return Object.entries(devices).map(([id, d]) => {
      const timestamp = new Date(d.last_seen).getTime();
      const offline = (typeof d.online === 'boolean') ? !d.online : this.isOffline(d, 5 * 60 * 1000);

      return {
        id,
        ip: d.ip,
        description: d.description || '',
          last_seen: (window.TimeUtils && typeof window.TimeUtils.formatRelativeTime === 'function')
            ? window.TimeUtils.formatRelativeTime(timestamp)
            : new Date(timestamp).toISOString(),
        timestamp,
        blink: d.blink || false,
        pins: d.pins || {},
        offline
      };
    }).sort((a, b) => b.timestamp - a.timestamp);
  }

  // Checks if device is offline
  isOffline(device, offlineThreshold) {
    if (typeof device.online === 'boolean') return !device.online;

    const now = Date.now();
    const ts = new Date(device.last_seen).getTime();
    if (Number.isNaN(ts)) return true;
    return (now - ts) > offlineThreshold;
  }

  // Detects changes between old and new devices
  detectChanges(newDevices) {
    const prevIds = new Set(Object.keys(this.devices));
    const newIds = Object.keys(newDevices);

    // Structure changes (devices added/removed)
    const structureChanged = newIds.length !== prevIds.size || 
                            newIds.some(id => !prevIds.has(id));

    if (structureChanged) {
      return { structureChanged: true, dataChanged: false, changedIds: [] };
    }

    // Data changes
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
