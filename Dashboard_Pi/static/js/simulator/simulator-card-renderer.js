/**
 * Simulator Card Renderer
 * Creates and manages simulator card HTML
 */
class SimulatorCardRenderer {
  // Create simulator card element
  createCard(sim) {
    const card = document.createElement('div');
    card.className = SimulatorConfig.CSS_CLASSES.CARD;
    card.innerHTML = this._generateCardHTML(sim);
    return card;
  }

  // Generate card HTML
  _generateCardHTML(sim) {
    return `
      <div class="sim-header">
        <div class="sim-title">
          <i data-feather="cast"></i>
          <span>${sim.name}</span>
        </div>
        <div class="sim-status ${sim.running ? SimulatorConfig.CSS_CLASSES.RUNNING : SimulatorConfig.CSS_CLASSES.STOPPED}">
          <span class="sim-status-dot"></span>
          <span>${sim.running ? 'Running' : 'Stopped'}</span>
        </div>
      </div>

      ${this._generateConfigSection(sim)}
      ${this._generateAutoUpdateSwitch(sim)}
      ${this._generatePayloadSection(sim)}
      ${this._generateActionButtons(sim)}
    `;
  }

  // Generate config section
  _generateConfigSection(sim) {
    return `
      <div class="sim-config">
        <div class="sim-field">
          <label>Simulator Name</label>
          <input type="text" value="${sim.name}" data-id="${sim.id}" data-field="${SimulatorConfig.FIELDS.NAME}" />
        </div>
        <div class="sim-field">
          <label>Interval (ms)</label>
          <input type="number" min="100" step="100" value="${sim.interval}" 
                 data-id="${sim.id}" data-field="${SimulatorConfig.FIELDS.INTERVAL}" 
                 inputmode="numeric" pattern="[0-9]*" />
        </div>
      </div>
    `;
  }

  // Generate auto-update switch
  _generateAutoUpdateSwitch(sim) {
    return `
      <div class="sim-switch-field">
        <span>Adopt received configuration (node_id & description)</span>
        <label class="switch">
          <input type="checkbox" ${sim.autoUpdate ? 'checked' : ''} 
                 data-id="${sim.id}" data-field="${SimulatorConfig.FIELDS.AUTO_UPDATE}" />
          <span class="slider"></span>
        </label>
      </div>
    `;
  }

  // Generate payload section (JSON + Console)
  _generatePayloadSection(sim) {
    return `
      <div class="sim-payload-section">
        <div class="sim-json">
          <label>JSON Payload</label>
          <textarea data-id="${sim.id}" data-field="${SimulatorConfig.FIELDS.JSON}" ${sim.running ? 'disabled' : ''}>${sim.json}</textarea>
        </div>
        <div class="sim-console">
          <label>Server Response</label>
          <div class="sim-console-output" data-id="${sim.id}">${sim.console || 'No responses...'}</div>
          <button class="scroll-to-bottom-btn" data-id="${sim.id}" title="Scroll to bottom">
            <i data-feather="arrow-down"></i>
          </button>
        </div>
      </div>
    `;
  }

  // Generate action buttons
  _generateActionButtons(sim) {
    return `
      <div class="sim-actions">
        <button class="sim-btn sim-btn--start" data-id="${sim.id}" data-action="${SimulatorConfig.ACTIONS.START}" ${sim.running ? 'disabled' : ''}>
          <i data-feather="play"></i>
          <span>Start</span>
        </button>
        <button class="sim-btn sim-btn--stop" data-id="${sim.id}" data-action="${SimulatorConfig.ACTIONS.STOP}" ${!sim.running ? 'disabled' : ''}>
          <i data-feather="stop-circle"></i>
          <span>Stop</span>
        </button>
        <button class="sim-btn sim-btn--send" data-id="${sim.id}" data-action="${SimulatorConfig.ACTIONS.SEND}">
          <i data-feather="send"></i>
          <span>Send Once</span>
        </button>
        <button class="sim-btn sim-btn--clear" data-id="${sim.id}" data-action="${SimulatorConfig.ACTIONS.CLEAR}">
          <i data-feather="x-circle"></i>
          <span>Clear Responses</span>
        </button>
        <button class="sim-btn sim-btn--remove" data-id="${sim.id}" data-action="${SimulatorConfig.ACTIONS.REMOVE}">
          <i data-feather="trash-2"></i>
          <span>Remove</span>
        </button>
      </div>
    `;
  }

  // Create empty state message
  createEmptyMessage() {
    return '<p style="color: var(--text); text-align: center; padding: 40px;">No simulators available. Create a new simulator!</p>';
  }
}
