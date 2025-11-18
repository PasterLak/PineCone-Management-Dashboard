/**
 * Simulator Renderer
 * Coordinates rendering of simulator UI
 */
class SimulatorRenderer {
  constructor(dom, dataService, cardRenderer) {
    this.dom = dom;
    this.dataService = dataService;
    this.cardRenderer = cardRenderer;
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
    });

    // Replace feather icons
    if (window.feather) feather.replace();
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
