// Utility for copying text to clipboard with fallback support
// Handles both modern Clipboard API and legacy execCommand for HTTP/older browsers
class ClipboardUtils {
  
  static async copy(text) {
    try {
      // Try modern Clipboard API first
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      } else {
        // Fallback for HTTP or older browsers
        return this._fallbackCopy(text);
      }
    } catch (error) {
      console.error('Clipboard copy failed:', error);
      return false;
    }
  }

  static _fallbackCopy(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    textarea.style.left = '-999999px';
    textarea.style.top = '-999999px';
    document.body.appendChild(textarea);
    
    try {
      textarea.select();
      textarea.focus();
      const successful = document.execCommand('copy');
      return successful;
    } catch (err) {
      console.error('Fallback copy failed:', err);
      return false;
    } finally {
      document.body.removeChild(textarea);
    }
  }

  static async copyJSON(obj, indent = 2) {
    try {
      const jsonString = JSON.stringify(obj, null, indent);
      return await this.copy(jsonString);
    } catch (error) {
      console.error('JSON stringify failed:', error);
      return false;
    }
  }
}

// Export for use in other scripts
window.ClipboardUtils = ClipboardUtils;
