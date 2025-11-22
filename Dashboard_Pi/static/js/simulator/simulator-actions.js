/**
 * Simulator Actions
 * Handles simulator operations (start, stop, send, remove)
 */
class SimulatorActions {
  constructor(dataService, apiService, consoleManager, pollingService = null, renderer = null) {
    this.dataService = dataService;
    this.api = apiService;
    this.consoleManager = consoleManager;
    this.pollingService = pollingService;
    this.renderer = renderer;
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

    // Start on server first
    try {
      const result = await this.api.start(id, sim.interval, sim.json, sim.autoUpdate);
      console.log('Simulator started:', result);
      
      // Fetch initial status 
      const data = await this.api.getStatus(id);
      if (data.responses && data.responses.length > 0) {
        const initialConsole = data.responses.join('\n');
        sim.console = initialConsole;
      }
      
      // Update state
      this.dataService.update(id, { running: true });
      this.dataService.save();
      
      // Schedule scroll for after render
      if (this.renderer) {
        this.renderer.scheduleScroll(id);
      }
      
      if (onSuccess) onSuccess(); // This triggers render() with message from backend
      
      // Start polling service to fetch subsequent responses
      if (this.pollingService) {
        this.pollingService.start();
      }
      
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

    // Stop on server first
    try {
      const result = await this.api.stop(id);
      console.log('Simulator stopped:', result);
      
      // Fetch final status BEFORE updating UI
      const data = await this.api.getStatus(id);
      if (data.responses && data.responses.length > 0) {
        const finalConsole = data.responses.join('\n');
        sim.console = finalConsole;
        this.dataService.save();
      }
      
      // NOW update state and render
      this.dataService.update(id, { running: false });
      
      // Schedule scroll for after render
      if (this.renderer) {
        this.renderer.scheduleScroll(id);
      }
      
      if (onSuccess) onSuccess(); // This triggers render with updated console
      
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
      const result = await this.api.sendOnce(id, sim.json);
      console.log('Sent once:', result);
      
      // Backend will add to simulator_responses, just fetch updated status
      const data = await this.api.getStatus(id);
      if (data.responses && data.responses.length > 0) {
        const newConsole = data.responses.join('\n');
        sim.console = newConsole;
        this.consoleManager.updateConsole(id, newConsole);
      }
      
      return true;
    } catch (err) {
      alert('POST failed!');
      return false;
    }
  }

  // Clear server responses
  async clear(id, onSuccess) {
    const sim = this.dataService.getById(id);
    if (!sim) return;

    try {
      await this.api.clearResponses(id);
      
      // Clear console locally
      sim.console = '';
      
      // Clear cache and update console
      this.consoleManager.clearCache(id);
      this.consoleManager.updateConsole(id, 'No responses...');
      
      this.dataService.save();
      
      return true;
    } catch (err) {
      alert('Failed to clear responses!');
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

    // Delete responses from backend
    try {
      await this.api.deleteResponses(id);
    } catch (err) {
      console.error('Failed to delete simulator responses:', err);
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
