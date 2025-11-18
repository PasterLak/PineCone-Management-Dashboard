/**
 * Settings DOM Handler
 * Kümmert sich um alle DOM-Zugriffe für Settings
 */
class SettingsDOM {
  constructor() {
    this.inputs = {};
    this.buttons = {};
    this._initializeElements();
  }

  // Initialisiert alle DOM-Elemente
  _initializeElements() {
    // Input-Felder laden
    for (const [fieldName, config] of Object.entries(SettingsConfig.FIELDS)) {
      this.inputs[fieldName] = document.getElementById(config.id);
    }

    // Buttons laden
    this.buttons.save = document.getElementById('saveSettingsBtn');
    this.buttons.reset = document.getElementById('resetSettingsBtn');
  }

  // Prüft ob DOM-Elemente verfügbar sind
  isAvailable() {
    return Object.values(this.inputs).some(el => el !== null);
  }

  // Gibt ein Input-Element zurück
  getInput(fieldName) {
    return this.inputs[fieldName];
  }

  // Gibt alle Input-Elemente zurück
  getAllInputs() {
    return Object.values(this.inputs).filter(el => el !== null);
  }

  // Gibt einen Button zurück
  getButton(buttonName) {
    return this.buttons[buttonName];
  }

  // Liest Wert aus Input-Feld
  getValue(fieldName) {
    const input = this.getInput(fieldName);
    return input ? parseInt(input.value, 10) : null;
  }

  // Setzt Wert in Input-Feld
  setValue(fieldName, value) {
    const input = this.getInput(fieldName);
    if (input) {
      input.value = value;
    }
  }

  // Setzt alle Werte auf einmal
  setAllValues(values) {
    for (const [fieldName, value] of Object.entries(values)) {
      this.setValue(fieldName, value);
    }
  }
}
