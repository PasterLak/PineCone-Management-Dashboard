/**
 * Input validation utilities for numeric fields
 */

/**
 * Setup numeric input validation for specified input elements
 * @param {HTMLElement[]} inputs - Array of input elements to validate
 */
function setupNumericInputValidation(inputs) {
  inputs.forEach(input => {
    // Prevent non-numeric input
    input.addEventListener('keypress', (e) => {
      const allowedKeys = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'];
      if (!allowedKeys.includes(e.key) && e.key !== 'Enter') {
        e.preventDefault();
      }
    });

    // Handle paste - strip non-numeric characters
    input.addEventListener('paste', (e) => {
      e.preventDefault();
      const pastedText = (e.clipboardData || window.clipboardData).getData('text');
      const numericOnly = pastedText.replace(/\D/g, '');
      if (numericOnly) {
        input.value = numericOnly;
        // Trigger input event to notify listeners
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });
  });
}

/**
 * Setup numeric input validation using event delegation
 * Useful when inputs are dynamically created
 * @param {string} fieldSelector - data-field attribute value to match (e.g., "interval")
 */
function setupNumericInputValidationByField(fieldSelector) {
  // Prevent non-numeric input
  document.addEventListener('keypress', (e) => {
    const target = e.target;
    if (target.dataset.field === fieldSelector) {
      const allowedKeys = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'];
      if (!allowedKeys.includes(e.key) && e.key !== 'Enter') {
        e.preventDefault();
      }
    }
  });

  // Handle paste - strip non-numeric characters
  document.addEventListener('paste', (e) => {
    const target = e.target;
    if (target.dataset.field === fieldSelector) {
      e.preventDefault();
      const pastedText = (e.clipboardData || window.clipboardData).getData('text');
      const numericOnly = pastedText.replace(/\D/g, '');
      if (numericOnly) {
        target.value = numericOnly;
        // Trigger input event to save
        target.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }
  });
}
