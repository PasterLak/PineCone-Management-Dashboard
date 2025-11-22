/**
 * Simulator Renderer
 * Coordinates rendering of simulator UI
 */
class SimulatorRenderer {
  constructor(dom, dataService, cardRenderer) {
    this.dom = dom;
    this.dataService = dataService;
    this.cardRenderer = cardRenderer;
    this.pendingScrolls = {}; // Track simulators that need scroll after render
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

    // Clear and render cards
    this.dom.clearList();
    
    simulators.forEach(sim => {
      const card = this.cardRenderer.createCard(sim);
      this.dom.appendCard(card);
      
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
