// Console API Service
const ConsoleApiService = {
  async fetchLogs() {
    try {
      const response = await fetch('/api/console/logs');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('[ConsoleAPI] Failed to fetch console logs:', error);
      return { logs: [] };
    }
  },

  async clearLogs() {
    try {
      const response = await fetch('/api/console/clear', {
        method: 'POST'
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('[ConsoleAPI] Failed to clear console logs:', error);
      return { status: 'error' };
    }
  }
};
