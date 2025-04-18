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

    // Fallback parsing methode als Papaparse niet beschikbaar is
    this.fallbackParse = this.fallbackParse.bind(this);
  }

  async loadCSV(url) {
    // Check cache eerst
    const cachedData = this.getCachedData(url);
    if (cachedData) return cachedData;

    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Kon CSV niet laden: ${url}`);
      
      const text = await response.text();
      const parsed = this.parseCSV(text);
      
      // Cache resultaat
      this.cacheData(url, parsed);
      
      return parsed;
    } catch (error) {
      console.error(`CSV laden mislukt voor ${url}:`, error);
      throw error;
    }
  }

  parseCSV(text) {
    // Probeer Papaparse eerst
    if (typeof Papa !== 'undefined') {
      return Papa.parse(text, this.config.parseOptions).data;
    }
    
    // Fallback parsing methode
    return this.fallbackParse(text);
  }

  fallbackParse(text) {
    const lines = text.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    
    return lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim());
      return headers.reduce((obj, header, index) => {
        // Basis type conversie
        let value = values[index];
        if (value === 'WAAR') value = true;
        else if (value === 'ONWAAR') value = false;
        else if (!isNaN(parseFloat(value))) value = parseFloat(value);
        
        obj[header] = value;
        return obj;
      }, {});
    });
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
