/**
 * Settings Manager - Handles loading and updating of dashboard settings
 */
class SettingsManager {
  constructor() {
    this.defaults = {
      offlineThreshold: 5000,
      tickOffline: 1000,
      pollInterval: 1000,
      simulatorPoll: 500
    };
    this.settings = this.load();
  }

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

  get(key) {
    return this.settings[key];
  }

  update(newSettings) {
    this.settings = { ...this.settings, ...newSettings };
    try {
      localStorage.setItem("dashboard_settings", JSON.stringify(this.settings));
    } catch (e) {
      console.error("Failed to save settings:", e);
    }
  }

  // Listen for settings updates
  onUpdate(callback) {
    window.addEventListener('settingsUpdated', (e) => {
      if (e.detail) {
        this.settings = { ...this.settings, ...e.detail };
        callback(e.detail);
      }
    });
  }
}
