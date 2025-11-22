// Base API Service
class APIService {
  async get(url) {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`GET ${url} failed`);
      return await response.json();
    } catch (err) {
      console.error(`API GET error [${url}]:`, err);
      throw err;
    }
  }

  async post(url, data) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error(`POST ${url} failed`);
      return await response.json();
    } catch (err) {
      console.error(`API POST error [${url}]:`, err);
      throw err;
    }
  }
}
