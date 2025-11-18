/**
 * Simulator Data Service
 * Manages simulator data and business logic
 */
class SimulatorDataService {
  constructor() {
    this.simulators = [];
    this.storageKey = 'pinecone_simulators';
  }

  // Get all simulators
  getAll() {
    return this.simulators;
  }

  // Get simulator by ID
  getById(id) {
    return this.simulators.find(s => s.id === id);
  }

  // Add simulator
  add(simulator) {
    this.simulators.push(simulator);
  }

  // Remove simulator
  remove(id) {
    this.simulators = this.simulators.filter(s => s.id !== id);
  }

  // Update simulator
  update(id, updates) {
    const sim = this.getById(id);
    if (sim) {
      Object.assign(sim, updates);
    }
  }

  // Check if any simulator is running
  hasRunningSimulators() {
    return this.simulators.some(s => s.running);
  }

  // Get running simulators
  getRunning() {
    return this.simulators.filter(s => s.running);
  }

  // Get next available ID
  getNextAvailableId() {
    if (this.simulators.length === 0) return 1;

    const usedIds = new Set(this.simulators.map(s => s.id));
    let id = 1;
    while (usedIds.has(id)) {
      id++;
    }
    return id;
  }

  // Create new simulator data
  createSimulatorData(id, name = null) {
    return {
      id,
      name: name || `Simulator ${id}`,
      interval: SimulatorConfig.DEFAULTS.INTERVAL,
      json: JSON.stringify({ node_id: '', description: '' }, null, 2),
      running: false,
      autoUpdate: SimulatorConfig.DEFAULTS.AUTO_UPDATE,
      console: ''
    };
  }

  // Load simulators from localStorage
  load() {
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) {
        const data = JSON.parse(saved);
        this.simulators = data.simulators || [];
        // Reset running state after reload
        this.simulators.forEach(sim => sim.running = false);
        return true;
      }
    } catch (e) {
      console.error('Failed to load simulators:', e);
    }
    return false;
  }

  // Save simulators to localStorage
  save() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify({
        simulators: this.simulators.map(s => ({
          id: s.id,
          name: s.name,
          interval: s.interval,
          json: s.json,
          autoUpdate: s.autoUpdate,
          console: s.console
        }))
      }));
      return true;
    } catch (e) {
      console.error('Failed to save simulators:', e);
      return false;
    }
  }

  // Validate JSON payload
  validateJSON(jsonString) {
    try {
      JSON.parse(jsonString);
      return { valid: true };
    } catch (e) {
      return { valid: false, error: e.message };
    }
  }
}
