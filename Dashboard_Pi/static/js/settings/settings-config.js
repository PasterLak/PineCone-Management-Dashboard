/**
 * Settings Configuration
 * Configuration for all settings fields
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

  // Returns all field names
  static getFieldNames() {
    return Object.keys(this.FIELDS);
  }

  // Returns default values
  static getDefaults() {
    const defaults = {};
    for (const [key, config] of Object.entries(this.FIELDS)) {
      defaults[key] = config.default;
    }
    return defaults;
  }

  // Returns validation rule for a field
  static getValidationRule(fieldName) {
    const field = this.FIELDS[fieldName];
    return field ? { min: field.min, name: field.name } : null;
  }
}
