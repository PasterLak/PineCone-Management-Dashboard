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
  async sendOnce(id, payload) {
    try {
      const response = await fetch(SimulatorConfig.API.SEND, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, payload })
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
    const response = await fetch(`${SimulatorConfig.API.STATUS}/${id}`);
    if (!response.ok) {
      const error = new Error('Status fetch failed');
      error.status = response.status;
      throw error;
    }
    return await response.json();
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

  // Clear simulator responses (clear button)
  async clearResponses(id) {
    try {
      const response = await fetch('/api/simulator/clear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });

      if (!response.ok) throw new Error('Clear failed');
      return await response.json();
    } catch (err) {
      console.error('Failed to clear simulator responses:', err);
      throw err;
    }
  }

  // Delete simulator responses (remove simulator)
  async deleteResponses(id) {
    try {
      const response = await fetch('/api/simulator/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });

      if (!response.ok) throw new Error('Delete failed');
      return await response.json();
    } catch (err) {
      console.error('Failed to delete simulator responses:', err);
      throw err;
    }
  }
}
