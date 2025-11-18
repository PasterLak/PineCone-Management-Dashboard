/**
 * Settings UI Manager - Handles the settings page UI interactions and input validation
 */
class SettingsUIManager {
  constructor(settingsManager) {
    this.settings = settingsManager;
    
    // Input elements
    this.pollIntervalInput = document.getElementById('pollIntervalInput');
    this.offlineThresholdInput = document.getElementById('offlineThresholdInput');
    this.tickOfflineInput = document.getElementById('tickOfflineInput');
    this.simulatorPollInput = document.getElementById('simulatorPollInput');
    
    // Button elements
    this.saveBtn = document.getElementById('saveSettingsBtn');
    this.resetBtn = document.getElementById('resetSettingsBtn');

    // Validation rules
    this.validationRules = {
      pollInterval: { min: 100, name: 'Polling Interval' },
      offlineThreshold: { min: 1000, name: 'Offline Threshold' },
      tickOffline: { min: 100, name: 'Offline Check Interval' },
      simulatorPoll: { min: 100, name: 'Simulator Polling Interval' }
    };
  }

  // Load settings into form
  loadFormValues() {
    if (!this.pollIntervalInput) return;

    const values = {
      pollInterval: this.settings.get('pollInterval'),
      offlineThreshold: this.settings.get('offlineThreshold'),
      tickOffline: this.settings.get('tickOffline'),
      simulatorPoll: this.settings.get('simulatorPoll')
    };

    this.pollIntervalInput.value = values.pollInterval;
    this.offlineThresholdInput.value = values.offlineThreshold;
    this.tickOfflineInput.value = values.tickOffline;
    this.simulatorPollInput.value = values.simulatorPoll;
  }

  // Get current form values
  getFormValues() {
    return {
      pollInterval: parseInt(this.pollIntervalInput.value) || 1000,
      offlineThreshold: parseInt(this.offlineThresholdInput.value) || 5000,
      tickOffline: parseInt(this.tickOfflineInput.value) || 1000,
      simulatorPoll: parseInt(this.simulatorPollInput.value) || 500
    };
  }

  // Validate form values
  validateValues(values) {
    for (const [key, value] of Object.entries(values)) {
      const rule = this.validationRules[key];
      if (value < rule.min) {
        alert(`${rule.name} must be at least ${rule.min}ms!`);
        return false;
      }
    }
    return true;
  }

  // Save settings
  async saveSettings() {
    try {
      const values = this.getFormValues();

      // Validate
      if (!this.validateValues(values)) {
        return;
      }

      // Save to localStorage
      this.settings.update(values);

      // Show success feedback
      this.showButtonFeedback(this.saveBtn, 'Saved!', 'var(--btn-ok)');

      // Trigger settings update event
      window.dispatchEvent(new CustomEvent('settingsUpdated', {
        detail: values
      }));

    } catch (e) {
      console.error('Failed to save settings:', e);
      alert('Failed to save settings!');
    }
  }

  // Reset settings to defaults
  resetSettings() {
    const defaults = {
      pollInterval: 1000,
      offlineThreshold: 5000,
      tickOffline: 1000,
      simulatorPoll: 500
    };

    // Update form
    this.pollIntervalInput.value = defaults.pollInterval;
    this.offlineThresholdInput.value = defaults.offlineThreshold;
    this.tickOfflineInput.value = defaults.tickOffline;
    this.simulatorPollInput.value = defaults.simulatorPoll;

    // Save to localStorage
    this.settings.update(defaults);

    // Show success feedback
    this.showButtonFeedback(
      this.resetBtn,
      'Reset successful!',
      'var(--btn-ok)',
      true // isSecondary button
    );

    // Trigger settings update event
    window.dispatchEvent(new CustomEvent('settingsUpdated', {
      detail: defaults
    }));
  }

  // Show button feedback
  showButtonFeedback(button, text, bgColor, isSecondary = false) {
    const span = button.querySelector('span');
    const originalText = span.textContent;

    span.textContent = text;
    button.style.background = bgColor;

    if (isSecondary) {
      button.style.borderColor = bgColor;
      button.style.color = 'white';
    }

    setTimeout(() => {
      span.textContent = originalText;
      button.style.background = '';
      if (isSecondary) {
        button.style.borderColor = '';
        button.style.color = '';
      }
    }, 2000);
  }

  // Setup event handlers
  setupEventHandlers() {
    if (!this.saveBtn) return;

    // Save button
    this.saveBtn.addEventListener('click', () => {
      this.saveSettings();
    });

    // Reset button
    this.resetBtn.addEventListener('click', () => {
      this.resetSettings();
    });

    // Enter key to save
    const inputs = [
      this.pollIntervalInput,
      this.offlineThresholdInput,
      this.tickOfflineInput,
      this.simulatorPollInput
    ];

    inputs.forEach(input => {
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          this.saveSettings();
        }
      });
    });

    // Setup numeric validation
    setupNumericInputValidation(inputs);
  }

  // Initialize
  init() {
    if (!this.pollIntervalInput) return;

    this.loadFormValues();
    this.setupEventHandlers();
  }
}
