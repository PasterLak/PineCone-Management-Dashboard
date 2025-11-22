// Simulator API Service - Backend Communication for Simulators
class SimulatorAPIService extends APIService {
  async start(id, interval, payload, autoUpdate) {
    return await this.post(SimulatorConfig.API.START, { id, interval, payload, autoUpdate });
  }

  async stop(id) {
    return await this.post(SimulatorConfig.API.STOP, { id });
  }

  async sendOnce(id, payload) {
    return await this.post(SimulatorConfig.API.SEND, { id, payload });
  }

  async getStatus(id) {
    return await this.get(`${SimulatorConfig.API.STATUS}/${id}`);
  }

  async updateConfig(id, autoUpdate) {
    return await this.post(SimulatorConfig.API.UPDATE, { id, autoUpdate });
  }

  async updatePayload(id, payload) {
    return await this.post('/api/simulator/update_payload', { id, payload });
  }

  async clearResponses(id) {
    return await this.post('/api/simulator/clear', { id });
  }

  async deleteResponses(id) {
    return await this.post('/api/simulator/delete', { id });
  }
}
