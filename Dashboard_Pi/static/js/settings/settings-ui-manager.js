/**
 * Settings UI Manager
 * Handles the settings page UI interactions and input validation
 */
class SettingsUIManager {
  constructor(settingsManager) {
    // Initialize DOM handler
    this.dom = new SettingsDOM();
    
    // Initialize services
    this.validator = new SettingsValidator();
    this.feedback = new SettingsFeedback();
    this.form = new SettingsForm(this.dom, settingsManager);
    this.actions = new SettingsActions(
      this.form,
      this.validator,
      settingsManager,
      this.feedback
    );
  }

  // Initializes the UI Manager
  init() {
    if (!this.dom.isAvailable()) {
      return;
    }

    this.form.loadValues();
    this._setupEventHandlers();
  }

  // Sets up event handlers
  _setupEventHandlers() {
    const saveBtn = this.dom.getButton('save');
    const resetBtn = this.dom.getButton('reset');

    if (!saveBtn) return;

    // Save-Button
    saveBtn.addEventListener('click', () => {
      this.actions.save(saveBtn);
    });

    // Reset-Button
    resetBtn.addEventListener('click', () => {
      this.actions.reset(resetBtn);
    });

    // Enter key to save
    this._setupKeyboardShortcuts(saveBtn);

    // Numeric validation
    this._setupNumericValidation();
  }

  // Sets up keyboard shortcuts
  _setupKeyboardShortcuts(saveBtn) {
    const inputs = this.dom.getAllInputs();

    inputs.forEach(input => {
      input.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
          this.actions.save(saveBtn);
        }
      });
    });
  }

  // Sets up numeric validation
  _setupNumericValidation() {
    const inputs = this.dom.getAllInputs();
    
    // If external validation exists, use it   
    if (typeof setupNumericInputValidation === 'function') {
      setupNumericInputValidation(inputs);
    }
  }
}
