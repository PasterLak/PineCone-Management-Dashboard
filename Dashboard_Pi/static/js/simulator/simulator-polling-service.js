/**
 * Simulator Polling Service
 * Manages automatic status polling for running simulators
 */
class SimulatorPollingService {
  constructor(dataService, apiService, consoleManager, settingsManager) {
    this.dataService = dataService;
    this.api = apiService;
    this.consoleManager = consoleManager;
    this.settings = settingsManager;
    
    this.pollInterval = null;
    this.pollIntervalMs = SimulatorConfig.DEFAULTS.POLL_INTERVAL;
  }

  // Start polling
  start() {
    if (this.pollInterval) return; // Already running
    
    this.pollInterval = setInterval(() => this._pollOnce(), this.pollIntervalMs);
    console.log('Started simulator polling with interval:', this.pollIntervalMs);
  }

  // Stop polling
  stop() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
      console.log('Stopped simulator polling');
    }
  }

  // Restart with new interval
  restart() {
    this.stop();
    this.start();
  }

  // Update polling interval
  setInterval(ms) {
    this.pollIntervalMs = ms;
    if (this.pollInterval) {
      this.restart();
    }
  }

  // Single poll cycle
  async _pollOnce() {
    const runningSimulators = this.dataService.getRunning();
    
    // Stop if no simulators running
    if (runningSimulators.length === 0) {
      this.stop();
      return;
    }

    // Poll each running simulator
    for (const sim of runningSimulators) {
      await this._pollSimulator(sim);
    }
  }

  // Poll single simulator
  async _pollSimulator(sim) {
    try {
      const data = await this.api.getStatus(sim.id);

      // Update console output with all responses from backend
      if (data.responses && data.responses.length > 0) {
        const newConsole = data.responses.join('\n');
        
        // Only update if content has changed
        if (newConsole !== sim.console) {
          sim.console = newConsole;
          this.consoleManager.updateConsole(sim.id, newConsole);
          this.dataService.save(); // Save console to localStorage
        }
      }

      // Update JSON payload if autoUpdate enabled
      if (sim.autoUpdate && data.currentPayload) {
        const newJson = JSON.stringify(data.currentPayload, null, 2);
        if (newJson !== sim.json) {
          sim.json = newJson;
          this.consoleManager.updatePayload(sim.id, newJson);
          this.dataService.save(); // Save updated payload to localStorage
        }
      }
    } catch (err) {
      console.error(`Failed to poll simulator ${sim.id}:`, err);
    }
  }

  // Sync running state from server (on init)
  async syncRunningState() {
    const simulators = this.dataService.getAll();
    
    for (const sim of simulators) {
      try {
        const data = await this.api.getStatus(sim.id);
        
        // Update running state from server
        sim.running = data.running || false;
        
        // Update console if responses available
        if (data.responses && data.responses.length > 0) {
          sim.console = data.responses.join('\n');
        }
        
        // Update payload if autoUpdate enabled and payload available
        if (sim.autoUpdate && data.currentPayload) {
          sim.json = JSON.stringify(data.currentPayload, null, 2);
        }
      } catch (err) {
        // Silently ignore 404 errors (simulator doesn't exist on backend yet)
        if (err.status === 404) {
          sim.running = false;
        } else {
          console.error(`Failed to sync status for simulator ${sim.id}:`, err);
          sim.running = false;
        }
      }
    }

    // Start polling if any simulator is running
    if (this.dataService.hasRunningSimulators()) {
      this.start();
    }
  }
}
