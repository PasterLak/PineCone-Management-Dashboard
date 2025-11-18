/**
 * Simulator Actions
 * Handles simulator operations (start, stop, send, remove)
 */
class SimulatorActions {
  constructor(dataService, apiService, consoleManager) {
    this.dataService = dataService;
    this.api = apiService;
    this.consoleManager = consoleManager;
  }

  // Start simulator
  async start(id, onSuccess) {
    const sim = this.dataService.getById(id);
    if (!sim || sim.running) return;

    // Validate JSON
    const validation = this.dataService.validateJSON(sim.json);
    if (!validation.valid) {
      alert(`Invalid JSON in payload of simulator ${sim.name}!\n\nError: ${validation.error}`);
      return;
    }

    // Update state
    this.dataService.update(id, { running: true });
    if (onSuccess) onSuccess();

    // Start on server
    try {
      const result = await this.api.start(id, sim.interval, sim.json, sim.autoUpdate);
      console.log('Simulator started:', result);
      return true;
    } catch (err) {
      // Revert on failure
      this.dataService.update(id, { running: false });
      if (onSuccess) onSuccess();
      return false;
    }
  }

  // Stop simulator
  async stop(id, onSuccess) {
    const sim = this.dataService.getById(id);
    if (!sim || !sim.running) return;

    // Update state
    this.dataService.update(id, { running: false });
    if (onSuccess) onSuccess();

    // Stop on server
    try {
      const result = await this.api.stop(id);
      console.log('Simulator stopped:', result);
      return true;
    } catch (err) {
      return false;
    }
  }

  // Send once
  async sendOnce(id) {
    const sim = this.dataService.getById(id);
    if (!sim) return;

    try {
      const result = await this.api.sendOnce(sim.json);
      console.log('Sent once:', result);
      alert('POST sent successfully!');
      return true;
    } catch (err) {
      alert('POST failed!');
      return false;
    }
  }

  // Remove simulator
  async remove(id, onSuccess) {
    const sim = this.dataService.getById(id);
    
    // Stop if running
    if (sim && sim.running) {
      await this.stop(id);
    }

    // Remove from data
    this.dataService.remove(id);
    this.dataService.save();
    
    if (onSuccess) onSuccess();
    return true;
  }

  // Update simulator field
  updateField(id, field, value) {
    const updates = { [field]: value };
    this.dataService.update(id, updates);
    this.dataService.save();

    // If autoUpdate changed and sim is running, update server
    if (field === SimulatorConfig.FIELDS.AUTO_UPDATE) {
      const sim = this.dataService.getById(id);
      if (sim && sim.running) {
        this.api.updateConfig(id, value).catch(err => {
          console.error('Failed to update autoUpdate:', err);
        });
      }
    }
  }

  // Apply example to simulator
  applyExample(exampleType, targetSimId = null) {
    const example = SimulatorConfig.getExample(exampleType);
    if (!example) return null;

    // Find target simulator or create new one
    let targetSim = null;
    if (targetSimId) {
      targetSim = this.dataService.getById(targetSimId);
    } else {
      // Find first non-running simulator
      targetSim = this.dataService.getAll().find(s => !s.running);
    }

    if (!targetSim) {
      // Create new simulator
      const id = this.dataService.getNextAvailableId();
      targetSim = this.dataService.createSimulatorData(id);
      this.dataService.add(targetSim);
    }

    // Apply example
    targetSim.json = JSON.stringify(example, null, 2);
    this.dataService.save();

    return targetSim.id;
  }
}
