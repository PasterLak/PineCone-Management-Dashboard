// Central settings manager that stores user preferences in localStorage
// Controls polling intervals, offline thresholds, and display limits
class SettingsManager {
  constructor() {
    // Default values for all configurable settings
    this.defaults = {
      offlineThreshold: 5000,      // Mark device offline after 5 seconds
      tickOffline: 1000,            // Check offline status every second
      pollInterval: 1000,           // Fetch device updates every second
      simulatorPoll: 500,           // Fetch simulator updates twice per second
      consolePoll: 500,             // Fetch console logs twice per second
      maxConsoleLines: 1000,        // Max console lines before truncation
      maxSimulatorResponses: 100    // Max simulator responses to keep
    };
    this.settings = this.load();
  }

  // Load settings from browser's localStorage
  load() {
    try {
      const saved = localStorage.getItem("dashboard_settings");
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...this.defaults, ...parsed };
      }
    } catch (e) {
      console.error("Failed to load settings:", e);
    }
    return { ...this.defaults };
  }

  // Get a specific setting value
  get(key) {
    return this.settings[key];
  }

  // Save new settings to localStorage
  update(newSettings) {
    this.settings = { ...this.settings, ...newSettings };
    try {
      localStorage.setItem("dashboard_settings", JSON.stringify(this.settings));
    } catch (e) {
      console.error("Failed to save settings:", e);
    }
  }

  // Register callback to be notified when settings change
  onUpdate(callback) {
    window.addEventListener('settingsUpdated', (e) => {
      if (e.detail) {
        this.settings = { ...this.settings, ...e.detail };
        callback(e.detail);
      }
    });
  }
}
