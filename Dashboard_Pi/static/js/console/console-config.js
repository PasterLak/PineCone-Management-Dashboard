// Console Configuration
const ConsoleConfig = {
  pollInterval: 500, // Default: Poll every 500ms (overridden by settings)
  maxLines: 1000, // Default: Maximum number of lines to keep (overridden by settings)
  logTypes: {
    INFO: 'console-info',
    WARNING: 'console-warning',
    ERROR: 'console-error',
    SUCCESS: 'console-success',
    DEFAULT: ''
  },
  
  // Update from settings manager
  updateFromSettings(settings) {
    if (settings.consolePoll !== undefined) {
      this.pollInterval = settings.consolePoll;
    }
    if (settings.maxConsoleLines !== undefined) {
      this.maxLines = settings.maxConsoleLines;
    }
  }
};
