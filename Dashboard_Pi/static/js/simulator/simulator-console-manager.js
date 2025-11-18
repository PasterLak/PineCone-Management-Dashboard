/**
 * Simulator Console Manager
 * Manages console output and scrolling behavior
 */
class SimulatorConsoleManager {
  constructor(dom) {
    this.dom = dom;
  }

  // Update console output
  updateConsole(simId, text) {
    const consoleEl = this.dom.findConsoleOutput(simId);
    if (!consoleEl) return;

    const isAtBottom = this._isScrolledToBottom(consoleEl);
    consoleEl.textContent = text;

    // Auto-scroll if user was at bottom
    if (isAtBottom) {
      this.scrollToBottom(consoleEl);
    }

    this.updateScrollButton(consoleEl);
  }

  // Update payload textarea
  updatePayload(simId, json) {
    const jsonEl = this.dom.findPayloadTextarea(simId);
    if (jsonEl) {
      jsonEl.value = json;
    }
  }

  // Scroll console to bottom
  scrollToBottom(consoleEl) {
    if (consoleEl) {
      consoleEl.scrollTop = consoleEl.scrollHeight;
    }
  }

  // Update scroll button visibility
  updateScrollButton(consoleEl) {
    if (!consoleEl) return;

    const scrollBtn = this.dom.findScrollButton(consoleEl);
    if (!scrollBtn) return;

    const isAtBottom = this._isScrolledToBottom(consoleEl);
    scrollBtn.classList.toggle(SimulatorConfig.CSS_CLASSES.VISIBLE, !isAtBottom);
  }

  // Handle scroll button click
  handleScrollButtonClick(simId) {
    const consoleEl = this.dom.findConsoleOutput(simId);
    if (consoleEl) {
      this.scrollToBottom(consoleEl);
      const scrollBtn = this.dom.findScrollButton(consoleEl);
      if (scrollBtn) {
        scrollBtn.classList.remove(SimulatorConfig.CSS_CLASSES.VISIBLE);
      }
    }
  }

  // Check if scrolled to bottom
  _isScrolledToBottom(consoleEl) {
    if (!consoleEl) return false;
    return consoleEl.scrollHeight - consoleEl.scrollTop <= consoleEl.clientHeight + 5;
  }
}
