/**
 * Settings Actions
 * Does Save- and Reset actions
 */
class SettingsActions {
  constructor(form, validator, settingsManager, buttonFeedback) {
    this.form = form;
    this.validator = validator;
    this.settings = settingsManager;
    this.buttonFeedback = buttonFeedback;
  }

  // Saves settings
  async save(saveButton) {
    try {
      // Get values from form
      const values = this.form.getCurrentValues();

      // Validate
      if (!this.validator.validate(values)) {
        return;
      }

      // Save
      this.settings.update(values);

      // Show feedback
      this.buttonFeedback.showTextFeedback(saveButton, 'Saved!');

      // Trigger event
      this._dispatchSettingsUpdated(values);

    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('Failed to save settings!');
    }
  }

  // Resets settings to defaults
  reset(resetButton) {
    // Apply defaults
    const defaults = this.form.applyDefaults();
    
    // Save
    this.settings.update(defaults);
    
    // Show feedback
    this.buttonFeedback.showTextFeedback(resetButton, 'Reset successful!', {
      resetBorder: true
    });
    
    // Trigger event
    this._dispatchSettingsUpdated(defaults);
  }

  // Triggers settings update event
  _dispatchSettingsUpdated(values) {
    window.dispatchEvent(new CustomEvent('settingsUpdated', {
      detail: values
    }));
  }
}
