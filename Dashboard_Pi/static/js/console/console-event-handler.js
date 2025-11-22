// Handles user interactions on the console page
// Wires up clear button, scroll button, and auto-scroll detection
const ConsoleEventHandler = {
  init() {
    this.attachClearButton();
    this.attachScrollButton();
    this.attachScrollListener();
  },

  attachClearButton() {
    if (ConsoleDOM.clearBtn) {
      ConsoleDOM.clearBtn.addEventListener('click', async () => {
        await ConsoleManager.apiService.clearConsoleLogs();
        ConsoleRenderer.clear();
      });
    }
  },

  attachScrollButton() {
    if (ConsoleDOM.scrollBtn) {
      ConsoleDOM.scrollBtn.addEventListener('click', () => {
        ConsoleRenderer.scrollToBottom();
      });
    }
  },

  attachScrollListener() {
    if (ConsoleDOM.output) {
      ConsoleDOM.output.addEventListener('scroll', () => {
        ConsoleRenderer.updateScrollButton();
      });
    }
  }
};
