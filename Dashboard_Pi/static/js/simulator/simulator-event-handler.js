/**
 * Simulator Event Handler
 * Manages all event listeners for simulator UI
 */
class SimulatorEventHandler {
  constructor(dom, actions, consoleManager, renderer) {
    this.dom = dom;
    this.actions = actions;
    this.consoleManager = consoleManager;
    this.renderer = renderer;
    this.buttonFeedback = new ButtonFeedback();
  }

  // Setup all event listeners
  setup() {
    this._setupInputHandlers();
    this._setupClickHandlers();
    this._setupScrollHandlers();
    this._setupAddButtonHandler();
    this._setupBulkActionHandlers();
  }

  // Setup input change handlers
  _setupInputHandlers() {
    document.addEventListener('input', (e) => {
      this._handleInput(e.target);
    });
  }

  // Setup click handlers
  _setupClickHandlers() {
    document.addEventListener('click', (e) => {
      this._handleClick(e);
    });
  }

  // Setup scroll handlers
  _setupScrollHandlers() {
    document.addEventListener('scroll', (e) => {
      this._handleScroll(e);
    }, true);
  }

  // Setup add simulator button
  _setupAddButtonHandler() {
    const addBtn = this.dom.getAddButton();
    if (addBtn) {
      addBtn.addEventListener('click', () => {
        this._handleAddSimulator();
      });
    }
  }

  // Setup bulk action buttons
  _setupBulkActionHandlers() {
    const startAllBtn = this.dom.getStartAllButton();
    if (startAllBtn) {
      startAllBtn.addEventListener('click', async () => {
        await this.actions.startAll(() => {
          this.renderer.render();
        });
      });
    }

    const stopAllBtn = this.dom.getStopAllButton();
    if (stopAllBtn) {
      stopAllBtn.addEventListener('click', async () => {
        await this.actions.stopAll(() => {
          this.renderer.render();
        });
      });
    }

    const sendOnceAllBtn = this.dom.getSendOnceAllButton();
    if (sendOnceAllBtn) {
      sendOnceAllBtn.addEventListener('click', async () => {
        await this.actions.sendOnceAll(() => {
          this.renderer.render();
        });
      });
    }

    const clearAllBtn = this.dom.getClearAllButton();
    if (clearAllBtn) {
      clearAllBtn.addEventListener('click', async () => {
        await this.actions.clearAll(() => {
          this.renderer.render();
        });
      });
    }

    const removeAllBtn = this.dom.getRemoveAllButton();
    if (removeAllBtn) {
      removeAllBtn.addEventListener('click', async () => {
        await this.actions.removeAll(() => {
          this.renderer.render();
        });
      });
    }
  }

  // Handle input changes
  _handleInput(target) {
    if (!target.dataset.id || !target.dataset.field) return;

    const id = parseInt(target.dataset.id);
    const field = target.dataset.field;

    switch (field) {
      case SimulatorConfig.FIELDS.NAME:
        this.actions.updateField(id, field, target.value);
        break;
      case SimulatorConfig.FIELDS.INTERVAL:
        this.actions.updateField(id, field, parseInt(target.value) || SimulatorConfig.DEFAULTS.INTERVAL);
        break;
      case SimulatorConfig.FIELDS.JSON:
        this.actions.updateField(id, field, target.value);
        break;
      case SimulatorConfig.FIELDS.AUTO_UPDATE:
        this.actions.updateField(id, field, target.checked);
        break;
    }
  }

  // Handle click events
  _handleClick(e) {
    // Pin info toggle
    if (this._handlePinInfoToggle(e)) return;
    
    // Example button
    if (this._handleExampleButton(e)) return;
    
    // Copy response button
    if (this._handleCopyButton(e)) return;
    
    // Scroll button
    if (this._handleScrollButton(e)) return;
    
    // Action buttons
    this._handleActionButton(e);
  }

  // Handle pin info toggle
  _handlePinInfoToggle(e) {
    const pinInfoHeader = e.target.closest('#togglePinInfo');
    if (!pinInfoHeader) return false;

    const content = this.dom.findPinInfoContent();
    const toggle = this.dom.findPinInfoToggle();
    
    if (toggle) {
      toggle.classList.toggle(SimulatorConfig.CSS_CLASSES.ACTIVE);
    }
    if (content) {
      content.classList.toggle(SimulatorConfig.CSS_CLASSES.SHOW);
    }
    
    if (window.feather) feather.replace();
    return true;
  }

  // Handle example button
  _handleExampleButton(e) {
    const exampleBtn = e.target.closest('.sim-example-btn');
    if (!exampleBtn) return false;

    const exampleType = exampleBtn.dataset.example;
    const simId = this.actions.applyExample(exampleType);
    
    if (simId !== null && simId !== undefined) {
      this.renderer.render();
      this.renderer.scrollToSimulator(simId);
    }
    
    return true;
  }

  // Handle copy button
  _handleCopyButton(e) {
    const copyBtn = e.target.closest('.copy-response-btn');
    if (!copyBtn) return false;

    const simId = parseInt(copyBtn.dataset.id);
    const consoleEl = this.dom.findConsoleOutput(simId);
    
    if (!consoleEl) return false;
    
    const text = consoleEl.textContent;
    
    // Try modern Clipboard API first
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text)
        .then(() => {
          this.buttonFeedback.showSuccess(copyBtn);
        })
        .catch(err => {
          console.error('Copy failed:', err);
          this.buttonFeedback.showError(copyBtn);
        });
    } else {
      // Fallback for HTTP using execCommand
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      try {
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        
        if (successful) {
          this.buttonFeedback.showSuccess(copyBtn);
        } else {
          this.buttonFeedback.showError(copyBtn);
        }
      } catch (err) {
        document.body.removeChild(textArea);
        console.error('Copy failed:', err);
        this.buttonFeedback.showError(copyBtn);
      }
    }
    
    return true;
  }

  // Handle scroll button
  _handleScrollButton(e) {
    const scrollBtn = e.target.closest('.scroll-to-bottom-btn');
    if (!scrollBtn) return false;

    const simId = parseInt(scrollBtn.dataset.id);
    this.consoleManager.handleScrollButtonClick(simId);
    return true;
  }

  // Handle action buttons
  _handleActionButton(e) {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;

    const id = parseInt(btn.dataset.id);
    const action = btn.dataset.action;

    switch (action) {
      case SimulatorConfig.ACTIONS.START:
        this.actions.start(id, () => this.renderer.render());
        break;
      case SimulatorConfig.ACTIONS.STOP:
        this.actions.stop(id, () => this.renderer.render());
        break;
      case SimulatorConfig.ACTIONS.SEND:
        this.actions.sendOnce(id);
        break;
      case SimulatorConfig.ACTIONS.CLEAR:
        this.actions.clear(id);
        break;
      case SimulatorConfig.ACTIONS.REMOVE:
        this.actions.remove(id, () => this.renderer.render());
        break;
    }
  }

  // Handle scroll events
  _handleScroll(e) {
    if (e.target?.classList?.contains('sim-console-output')) {
      this.consoleManager.updateScrollButton(e.target);
    }
  }

  // Handle add simulator
  _handleAddSimulator() {
    const id = this.actions.dataService.getNextAvailableId();
    const newSim = this.actions.dataService.createSimulatorData(id);
    this.actions.dataService.add(newSim);
    this.actions.dataService.save();
    this.renderer.render();
  }
}
