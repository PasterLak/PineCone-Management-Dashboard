// Console Event Handler
const ConsoleEventHandler = {
  init() {
    this.attachClearButton();
    this.attachScrollButton();
    this.attachScrollListener();
  },

  attachClearButton() {
    if (ConsoleDOM.clearBtn) {
      ConsoleDOM.clearBtn.addEventListener('click', async () => {
        // Clear backend logs first
        await ConsoleApiService.clearLogs();
        // Clear frontend
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
