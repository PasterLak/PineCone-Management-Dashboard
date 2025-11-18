/**
 * Settings Configuration
 * Zentrale Konfiguration für alle Settings-Felder
 */
class SettingsConfig {
  static FIELDS = {
    pollInterval: {
      id: 'pollIntervalInput',
      min: 100,
      default: 1000,
      name: 'Polling Interval'
    },
    offlineThreshold: {
      id: 'offlineThresholdInput',
      min: 1000,
      default: 5000,
      name: 'Offline Threshold'
    },
    tickOffline: {
      id: 'tickOfflineInput',
      min: 100,
      default: 1000,
      name: 'Offline Check Interval'
    },
    simulatorPoll: {
      id: 'simulatorPollInput',
      min: 100,
      default: 500,
      name: 'Simulator Polling Interval'
    }
  };

  // Gibt alle Feldnamen zurück
  static getFieldNames() {
    return Object.keys(this.FIELDS);
  }

  // Gibt Default-Werte zurück
  static getDefaults() {
    const defaults = {};
    for (const [key, config] of Object.entries(this.FIELDS)) {
      defaults[key] = config.default;
    }
    return defaults;
  }

  // Gibt Validierungsregel für ein Feld zurück
  static getValidationRule(fieldName) {
    const field = this.FIELDS[fieldName];
    return field ? { min: field.min, name: field.name } : null;
  }
}
