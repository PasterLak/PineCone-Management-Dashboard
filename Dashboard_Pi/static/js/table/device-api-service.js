/**
 * Device API Service
 * Kommuniziert mit Backend API
 */
class DeviceAPIService {
  // Holt alle Devices vom Server
  async fetchDevices() {
    try {
      const response = await fetch(DeviceConfig.API.DEVICES);
      if (!response.ok) throw new Error('Fetch failed');
      
      const data = await response.json();
      return data.devices || {};
    } catch (err) {
      console.error('Failed to fetch devices:', err);
      throw err;
    }
  }

  // Löscht ein Device
  async deleteDevice(deviceId) {
    try {
      const response = await fetch(DeviceConfig.API.DELETE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ node_id: deviceId })
      });

      if (!response.ok) throw new Error('Delete failed');
      return true;
    } catch (err) {
      console.error('Failed to delete device:', err);
      throw err;
    }
  }

  // Togglet Blink-Status
  async toggleBlink(deviceId) {
    try {
      const response = await fetch(DeviceConfig.API.TOGGLE_BLINK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ node_id: deviceId })
      });

      if (!response.ok) throw new Error('Toggle blink failed');
      
      const data = await response.json();
      return data.blink;
    } catch (err) {
      console.error('Failed to toggle blink:', err);
      throw err;
    }
  }
}
