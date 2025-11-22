// Console API Service - Backend Communication for Console Logs
class ConsoleApiService extends APIService {
  async fetchLogs() {
    try {
      const data = await this.get('/api/console/logs');
      return data;
    } catch (error) {
      return { logs: [] };
    }
  }

  async clearLogs() {
    try {
      return await this.post('/api/console/clear', {});
    } catch (error) {
      return { status: 'error' };
    }
  }
}
