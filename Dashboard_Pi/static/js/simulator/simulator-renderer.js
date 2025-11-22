class SimulatorRenderer {
  constructor(dom, dataService, cardRenderer) {
    this.dom = dom;
    this.dataService = dataService;
    this.cardRenderer = cardRenderer;
    this.pendingScrolls = {}; // Track simulators that need scroll after render
    this.savedScrollPositions = {}; // Save scroll positions before re-render
  }

  // Render all simulators
  render() {
    if (!this.dom.isAvailable()) return;

    const simulators = this.dataService.getAll();

    // Empty state
    if (simulators.length === 0) {
      this.dom.replaceListContent(this.cardRenderer.createEmptyMessage());
      return;
    }

    // Save scroll positions before clearing
    this._saveScrollPositions(simulators);

    // Clear and render cards
    this.dom.clearList();
    
    simulators.forEach(sim => {
      const card = this.cardRenderer.createCard(sim);
      this.dom.appendCard(card);
      
      // Restore scroll position
      if (this.savedScrollPositions[sim.id] !== undefined) {
        const consoleEl = card.querySelector('.sim-console-output');
        if (consoleEl) {
          consoleEl.scrollTop = this.savedScrollPositions[sim.id];
        }
      }
      
      // Apply pending scroll after card is added to DOM
      if (this.pendingScrolls[sim.id]) {
        const consoleEl = card.querySelector('.sim-console-output');
        if (consoleEl) {
          consoleEl.scrollTop = consoleEl.scrollHeight;
        }
        delete this.pendingScrolls[sim.id];
      }
    });

    // Replace feather icons
    if (window.feather) feather.replace();
  }

  // Save scroll positions of all console outputs
  _saveScrollPositions(simulators) {
    simulators.forEach(sim => {
      const consoleEl = this.dom.findConsoleOutput(sim.id);
      if (consoleEl) {
        this.savedScrollPositions[sim.id] = consoleEl.scrollTop;
      }
    });
  }

  // Mark simulator for scroll on next render
  scheduleScroll(simId) {
    this.pendingScrolls[simId] = true;
  }

  // Scroll to specific simulator
  scrollToSimulator(simId) {
    setTimeout(() => {
      const simCard = document.querySelector(`.${SimulatorConfig.CSS_CLASSES.CARD}`);
      if (simCard) {
        simCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  }
}
