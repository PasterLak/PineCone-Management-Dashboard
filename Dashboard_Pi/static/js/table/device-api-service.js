// Device API Service - Backend Communication for Devices
class DeviceAPIService extends APIService {
  async fetchDevices() {
    const data = await this.get(DeviceConfig.API.DEVICES);
    return data.devices || {};
  }

  async deleteDevice(deviceId) {
    await this.post(DeviceConfig.API.DELETE, { node_id: deviceId });
    return true;
  }

  async toggleBlink(deviceId) {
    const data = await this.post(DeviceConfig.API.TOGGLE_BLINK, { node_id: deviceId });
    return data.blink;
  }
}
