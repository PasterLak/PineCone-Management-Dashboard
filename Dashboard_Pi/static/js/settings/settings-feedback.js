/**
 * Settings Feedback
 * shows feedback messages in the Button UI on settings page
 */
class SettingsFeedback {
  static DURATION = 2000;
  static SUCCESS_COLOR = 'var(--btn-ok)';

  // Shows feedback on a button
  showFeedback(button, text, options = {}) {
    if (!button) return;

    const {
      bgColor = SettingsFeedback.SUCCESS_COLOR,
      isSecondary = false,
      duration = SettingsFeedback.DURATION
    } = options;

    const span = button.querySelector('span');
    if (!span) return;

    // Save original values
    const originalText = span.textContent;
    const originalBg = button.style.background;
    const originalBorder = button.style.borderColor;
    const originalColor = button.style.color;

    // Show feedback
    span.textContent = text;
    button.style.background = bgColor;

    if (isSecondary) {
      button.style.borderColor = bgColor;
      button.style.color = 'white';
    }

    // Reset after timeout
    setTimeout(() => {
      span.textContent = originalText;
      button.style.background = originalBg;
      
      if (isSecondary) {
        button.style.borderColor = originalBorder;
        button.style.color = originalColor;
      }
    }, duration);
  }
}
