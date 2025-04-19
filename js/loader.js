// js/loader.js

// DataLoader laadt CSV’s in via PapaParse (of fallback) en biedt methods om data te vragen.
export default class DataLoader {
  constructor(config = {}) {
    this.cache = new Map();
    this.config = {
      cacheTimeout: 1000 * 60 * 60, // 1 uur cache
      parseOptions: {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true
      },
      ...config
    };
    this.fallbackParse = this.fallbackParse.bind(this);
  }

  // Laadt een CSV-bestand en cachet het
  async loadCSV(path) {
    const now = Date.now();
    if (this.cache.has(path)) {
      const { timestamp, data } = this.cache.get(path);
      if (now - timestamp < this.config.cacheTimeout) {
        return data;
      }
    }
    // Probeer PapaParse (globaal beschikbaar) anders fallback
    const csvText = await fetch(path).then(r => r.text());
    let parsed;
    if (window.Papa && typeof Papa.parse === 'function') {
      parsed = Papa.parse(csvText, this.config.parseOptions).data;
    } else {
      parsed = this.fallbackParse(csvText);
    }
    this.cache.set(path, { timestamp: now, data: parsed });
    return parsed;
  }

  // Fallback parser (eenvoudige split op regels en komma’s)
  fallbackParse(csvText) {
    const lines = csvText.trim().split(/\r?\n/);
    const headers = lines.shift().split(',');
    return lines.map(line => {
      const cols = line.split(',');
      const obj = {};
      headers.forEach((h, i) => obj[h.trim()] = cols[i]?.trim() ?? '');
      return obj;
    });
  }

  // Named methods voor je app.js
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

// **Nieuw**: instanties en named exports zodat app.js kan doen:
// import { getKlassen, getLessentabel, getFootnotes } from './loader.js';
const _sharedLoader = new DataLoader();

export function getKlassen() {
  return _sharedLoader.getKlassen();
}
export function getLessentabel() {
  return _sharedLoader.getLessentabel();
}
export function getFootnotes() {
  return _sharedLoader.getFootnotes();
}
