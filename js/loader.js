// loader.js
export default class DataLoader {
  constructor(config = {}) {
    this.cache = new Map();
    this.config = {
      cacheTimeout: 1000 * 60 * 60, // 1 uur cache
      parseOptions: {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true
      },
      ...config
    };
  }

  async loadCSV(url) {
    // Check cache eerst
    const cachedData = this.getCachedData(url);
    if (cachedData) return cachedData;

    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Kon CSV niet laden: ${url}`);
      
      const text = await response.text();
      const parsed = Papa.parse(text, this.config.parseOptions);
      
      // Cache resultaat
      this.cacheData(url, parsed.data);
      
      return parsed.data;
    } catch (error) {
      console.error(`CSV laden mislukt voor ${url}:`, error);
      throw error;
    }
  }

  getCachedData(url) {
    const cached = this.cache.get(url);
    if (!cached) return null;
    
    // Check of cache verlopen is
    if (Date.now() - cached.timestamp > this.config.cacheTimeout) {
      this.cache.delete(url);
      return null;
    }
    
    return cached.data;
  }

  cacheData(url, data) {
    this.cache.set(url, {
      data,
      timestamp: Date.now()
    });
  }

  async getKlassen() {
    return this.loadCSV('data/klassen.csv');
  }

  async getLessentabel() {
    return this.loadCSV('data/lessentabel.csv');
  }

  async getFootnotes() {
    return this.loadCSV('data/voetnoten.csv');
  }
}
