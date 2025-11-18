/**
 * Simulator Manager - Handles PineCone device simulators 
 * 
 * (simulates for example post request that the IoT devices would send later on 
 * to be able to test the c++ code from pinecones better 
 * and to be able to code the dashboard in its full extend simultaneously)
 */
class SimulatorManager {
  constructor(settingsManager) {
    this.settings = settingsManager;
    this.simulators = [];
    this.pollInterval = null;
    this.pollIntervalMs = 500;
    
    this.simulatorList = document.getElementById('simulatorList');
    this.addSimulatorBtn = document.getElementById('addSimulator');
  }

  // Get next available simulator ID
  getNextAvailableId() {
    if (this.simulators.length === 0) return 1;

    const usedIds = new Set(this.simulators.map(s => s.id));
    let id = 1;
    while (usedIds.has(id)) {
      id++;
    }
    return id;
  }

  // Load simulators from localStorage
  loadSimulators() {
    try {
      const saved = localStorage.getItem('pinecone_simulators');
      if (saved) {
        const data = JSON.parse(saved);
        this.simulators = data.simulators || [];
        // Reset running state after reload
        this.simulators.forEach(sim => sim.running = false);
      }
    } catch (e) {
      console.error('Failed to load simulators:', e);
    }
  }

  // Save simulators to localStorage
  saveSimulators() {
    try {
      localStorage.setItem('pinecone_simulators', JSON.stringify({
        simulators: this.simulators.map(s => ({
          id: s.id,
          name: s.name,
          interval: s.interval,
          json: s.json,
          autoUpdate: s.autoUpdate,
          console: s.console
        }))
      }));
    } catch (e) {
      console.error('Failed to save simulators:', e);
    }
  }

  // Create new simulator
  createSimulator() {
    const id = this.getNextAvailableId();
    const simulator = {
      id,
      name: `Simulator ${id}`,
      interval: 1000,
      json: JSON.stringify({ node_id: '', description: '' }, null, 2),
      running: false,
      autoUpdate: true,
      console: ''
    };
    this.simulators.push(simulator);
    this.saveSimulators();
    this.render();
  }

  // Remove simulator
  removeSimulator(id) {
    const sim = this.simulators.find(s => s.id === id);
    if (sim && sim.running) {
      this.stopSimulator(id);
    }
    this.simulators = this.simulators.filter(s => s.id !== id);
    this.saveSimulators();
    this.render();
  }

  // Start simulator
  async startSimulator(id) {
    const sim = this.simulators.find(s => s.id === id);
    if (!sim || sim.running) return;

    // Validate JSON
    try {
      JSON.parse(sim.json);
    } catch (e) {
      alert(`Invalid JSON in payload of simulator ${sim.name}!\n\nError: ${e.message}`);
      return;
    }

    sim.running = true;
    this.render();

    try {
      const response = await fetch('/api/simulator/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: sim.id,
          interval: sim.interval,
          payload: sim.json,
          autoUpdate: sim.autoUpdate
        })
      });

      if (!response.ok) throw new Error('Start failed');
      
      const data = await response.json();
      console.log('Simulator started:', data);
      this.startPolling();
    } catch (err) {
      console.error('Failed to start simulator:', err);
      sim.running = false;
      this.render();
    }
  }

  // Stop simulator
  async stopSimulator(id) {
    const sim = this.simulators.find(s => s.id === id);
    if (!sim || !sim.running) return;

    sim.running = false;
    this.render();

    try {
      const response = await fetch('/api/simulator/stop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: sim.id })
      });

      if (!response.ok) throw new Error('Stop failed');
      
      const data = await response.json();
      console.log('Simulator stopped:', data);

      // Stop polling if no simulators running
      if (!this.simulators.some(s => s.running)) {
        this.stopPolling();
      }
    } catch (err) {
      console.error('Failed to stop simulator:', err);
    }
  }

  // Send once
  async sendOnce(id) {
    const sim = this.simulators.find(s => s.id === id);
    if (!sim) return;

    try {
      const response = await fetch('/api/simulator/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payload: sim.json })
      });

      if (!response.ok) throw new Error('Send failed');
      
      const data = await response.json();
      console.log('Sent once:', data);
      alert('POST sent successfully!');
    } catch (err) {
      console.error('Failed to send:', err);
      alert('POST failed!');
    }
  }

  // Start polling status
  startPolling() {
    if (this.pollInterval) return;
    this.pollInterval = setInterval(() => this.updateSimulatorStatus(), this.pollIntervalMs);
    console.log('Started simulator polling with interval:', this.pollIntervalMs);
  }

  // Stop polling
  stopPolling() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
  }

  // Update simulator status from server
  async updateSimulatorStatus() {
    const runningSimulators = this.simulators.filter(s => s.running);
    if (runningSimulators.length === 0) {
      this.stopPolling();
      return;
    }

    for (const sim of runningSimulators) {
      try {
        const response = await fetch(`/api/simulator/status/${sim.id}`);
        if (!response.ok) continue;
        
        const data = await response.json();

        // Update console output
        if (data.responses && data.responses.length > 0) {
          sim.console = data.responses.join('\n');
          this.updateConsole(sim.id, sim.console);
        }

        // Update JSON payload if autoUpdate enabled
        if (sim.autoUpdate && data.currentPayload) {
          const newJson = JSON.stringify(data.currentPayload, null, 2);
          if (newJson !== sim.json) {
            sim.json = newJson;
            this.updatePayload(sim.id, sim.json);
          }
        }
      } catch (err) {
        console.error(`Failed to fetch status for simulator ${sim.id}:`, err);
      }
    }
  }

  // Update console element
  updateConsole(simId, text) {
    const consoleEl = document.querySelector(`.sim-console-output[data-id="${simId}"]`);
    if (!consoleEl) return;

    const isAtBottom = consoleEl.scrollHeight - consoleEl.scrollTop <= consoleEl.clientHeight + 5;
    consoleEl.textContent = text;

    if (isAtBottom) {
      consoleEl.scrollTop = consoleEl.scrollHeight;
    }

    this.updateScrollButton(consoleEl);
  }

  // Update payload textarea
  updatePayload(simId, json) {
    const jsonEl = document.querySelector(`textarea[data-id="${simId}"][data-field="json"]`);
    if (jsonEl) {
      jsonEl.value = json;
    }
  }

  // Update scroll button visibility
  updateScrollButton(consoleEl) {
    if (!consoleEl) return;

    const scrollBtn = consoleEl.parentElement.querySelector('.scroll-to-bottom-btn');
    if (!scrollBtn) return;

    const isAtBottom = consoleEl.scrollHeight - consoleEl.scrollTop <= consoleEl.clientHeight + 5;
    scrollBtn.classList.toggle('visible', !isAtBottom);
  }

  // Render all simulators
  render() {
    if (!this.simulatorList) return;

    this.simulatorList.innerHTML = '';

    if (this.simulators.length === 0) {
      this.simulatorList.innerHTML = '<p style="color: var(--text); text-align: center; padding: 40px;">No simulators available. Create a new simulator!</p>';
      return;
    }

    this.simulators.forEach(sim => {
      const card = this.createSimulatorCard(sim);
      this.simulatorList.appendChild(card);
    });

    if (window.feather) feather.replace();
  }

  // Create simulator card element
  createSimulatorCard(sim) {
    const card = document.createElement('div');
    card.className = 'simulator-card';
    card.innerHTML = `
      <div class="sim-header">
        <div class="sim-title">
          <i data-feather="cast"></i>
          <span>${sim.name}</span>
        </div>
        <div class="sim-status sim-status--${sim.running ? 'running' : 'stopped'}">
          <span class="sim-status-dot"></span>
          <span>${sim.running ? 'Running' : 'Stopped'}</span>
        </div>
      </div>

      <div class="sim-config">
        <div class="sim-field">
          <label>Simulator Name</label>
          <input type="text" value="${sim.name}" data-id="${sim.id}" data-field="name" />
        </div>
        <div class="sim-field">
          <label>Interval (ms)</label>
          <input type="number" min="100" step="100" value="${sim.interval}" 
                 data-id="${sim.id}" data-field="interval" inputmode="numeric" pattern="[0-9]*" />
        </div>
      </div>

      <div class="sim-switch-field">
        <span>Adopt received configuration (node_id & description)</span>
        <label class="switch">
          <input type="checkbox" ${sim.autoUpdate ? 'checked' : ''} 
                 data-id="${sim.id}" data-field="autoUpdate" />
          <span class="slider"></span>
        </label>
      </div>

      <div class="sim-payload-section">
        <div class="sim-json">
          <label>JSON Payload</label>
          <textarea data-id="${sim.id}" data-field="json" ${sim.running ? 'disabled' : ''}>${sim.json}</textarea>
        </div>
        <div class="sim-console">
          <label>Server Response</label>
          <div class="sim-console-output" data-id="${sim.id}">${sim.console || 'No responses...'}</div>
          <button class="scroll-to-bottom-btn" data-id="${sim.id}" title="Scroll to bottom">
            <i data-feather="arrow-down"></i>
          </button>
        </div>
      </div>

      <div class="sim-actions">
        <button class="sim-btn sim-btn--start" data-id="${sim.id}" data-action="start" ${sim.running ? 'disabled' : ''}>
          <i data-feather="play"></i>
          <span>Start</span>
        </button>
        <button class="sim-btn sim-btn--stop" data-id="${sim.id}" data-action="stop" ${!sim.running ? 'disabled' : ''}>
          <i data-feather="stop-circle"></i>
          <span>Stop</span>
        </button>
        <button class="sim-btn sim-btn--send" data-id="${sim.id}" data-action="send">
          <i data-feather="send"></i>
          <span>Send Once</span>
        </button>
        <button class="sim-btn sim-btn--remove" data-id="${sim.id}" data-action="remove">
          <i data-feather="trash-2"></i>
          <span>Remove</span>
        </button>
      </div>
    `;
    return card;
  }

  // Handle input changes
  handleInput(target) {
    if (!target.dataset.id || !target.dataset.field) return;

    const id = parseInt(target.dataset.id);
    const field = target.dataset.field;
    const sim = this.simulators.find(s => s.id === id);
    if (!sim) return;

    switch (field) {
      case 'name':
        sim.name = target.value;
        this.saveSimulators();
        break;
      case 'interval':
        sim.interval = parseInt(target.value) || 1000;
        this.saveSimulators();
        break;
      case 'json':
        sim.json = target.value;
        this.saveSimulators();
        break;
      case 'autoUpdate':
        sim.autoUpdate = target.checked;
        this.saveSimulators();
        // Update backend if sim is running
        if (sim.running) {
          this.updateSimulatorConfig(sim.id, sim.autoUpdate);
        }
        break;
    }
  }

  // Update simulator config on server
  async updateSimulatorConfig(id, autoUpdate) {
    try {
      await fetch('/api/simulator/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, autoUpdate })
      });
    } catch (err) {
      console.error('Failed to update autoUpdate:', err);
    }
  }

  // Handle button clicks
  handleClick(e) {
    // Scroll to bottom button
    const scrollBtn = e.target.closest('.scroll-to-bottom-btn');
    if (scrollBtn) {
      const simId = scrollBtn.dataset.id;
      const consoleEl = document.querySelector(`.sim-console-output[data-id="${simId}"]`);
      if (consoleEl) {
        consoleEl.scrollTop = consoleEl.scrollHeight;
        scrollBtn.classList.remove('visible');
      }
      return;
    }

    // Action buttons
    const btn = e.target.closest('[data-action]');
    if (!btn) return;

    const id = parseInt(btn.dataset.id);
    const action = btn.dataset.action;

    switch (action) {
      case 'start':
        this.startSimulator(id);
        break;
      case 'stop':
        this.stopSimulator(id);
        break;
      case 'send':
        this.sendOnce(id);
        break;
      case 'remove':
        this.removeSimulator(id);
        break;
    }
  }

  // Handle scroll events
  handleScroll(e) {
    if (e.target && e.target.classList && e.target.classList.contains('sim-console-output')) {
      this.updateScrollButton(e.target);
    }
  }

  // Setup event handlers
  setupEventHandlers() {
    // Input changes
    document.addEventListener('input', (e) => {
      this.handleInput(e.target);
    });

    // Button clicks
    document.addEventListener('click', (e) => {
      this.handleClick(e);
    });

    // Console scroll
    document.addEventListener('scroll', (e) => {
      this.handleScroll(e);
    }, true);

    // Add simulator button
    if (this.addSimulatorBtn) {
      this.addSimulatorBtn.addEventListener('click', () => {
        this.createSimulator();
      });
    }
  }

  // Initialize
  init() {
    if (!this.simulatorList) return;

    // Load polling interval from settings
    this.pollIntervalMs = this.settings.get('simulatorPoll');

    // Listen for settings updates
    this.settings.onUpdate((changes) => {
      if (changes.simulatorPoll) {
        console.log('Simulator polling interval updated to:', changes.simulatorPoll);
        this.pollIntervalMs = changes.simulatorPoll;
        // Restart polling with new interval
        if (this.pollInterval) {
          this.stopPolling();
          this.startPolling();
        }
      }
    });

    // Setup numeric validation for interval fields
    setupNumericInputValidationByField('interval');

    // Load and render
    this.loadSimulators();
    this.render();
    this.setupEventHandlers();
  }
}
