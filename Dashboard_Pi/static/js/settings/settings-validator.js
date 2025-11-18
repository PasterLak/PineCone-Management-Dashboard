/**
 * Settings Validator
 * Validates input values
 */
class SettingsValidator {
  // Validates all values
  validate(values) {
    for (const [fieldName, value] of Object.entries(values)) {
      const rule = SettingsConfig.getValidationRule(fieldName);
      
      if (!rule) continue;

      // Check if number is valid
      if (!this._isValidNumber(value)) {
        alert(`${rule.name} must be a valid number!`);
        return false;
      }

      // Check minimum
      if (value < rule.min) {
        alert(`${rule.name} must be at least ${rule.min}ms!`);
        return false;
      }
    }

    return true;
  }

  // Checks if value is a valid number
  _isValidNumber(value) {
    return !isNaN(value) && isFinite(value);
  }
}
