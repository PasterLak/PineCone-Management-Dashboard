/**
 * Simulator API Service
 * Handles backend communication for simulators
 */
class SimulatorAPIService {
  // Start simulator on server
  async start(id, interval, payload, autoUpdate) {
    try {
      const response = await fetch(SimulatorConfig.API.START, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, interval, payload, autoUpdate })
      });

      if (!response.ok) throw new Error('Start failed');
      return await response.json();
    } catch (err) {
      console.error('Failed to start simulator:', err);
      throw err;
    }
  }

  // Stop simulator on server
  async stop(id) {
    try {
      const response = await fetch(SimulatorConfig.API.STOP, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });

      if (!response.ok) throw new Error('Stop failed');
      return await response.json();
    } catch (err) {
      console.error('Failed to stop simulator:', err);
      throw err;
    }
  }

  // Send payload once
  async sendOnce(payload) {
    try {
      const response = await fetch(SimulatorConfig.API.SEND, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payload })
      });

      if (!response.ok) throw new Error('Send failed');
      return await response.json();
    } catch (err) {
      console.error('Failed to send:', err);
      throw err;
    }
  }

  // Get simulator status
  async getStatus(id) {
    try {
      const response = await fetch(`${SimulatorConfig.API.STATUS}/${id}`);
      if (!response.ok) throw new Error('Status fetch failed');
      return await response.json();
    } catch (err) {
      console.error(`Failed to fetch status for simulator ${id}:`, err);
      throw err;
    }
  }

  // Update simulator configuration
  async updateConfig(id, autoUpdate) {
    try {
      const response = await fetch(SimulatorConfig.API.UPDATE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, autoUpdate })
      });

      if (!response.ok) throw new Error('Update failed');
      return await response.json();
    } catch (err) {
      console.error('Failed to update simulator config:', err);
      throw err;
    }
  }
}
