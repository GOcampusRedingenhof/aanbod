// loader.js

import { csvUrls } from './config-module.js';

/**
 * Laadt een CSV-bestand en zet het om naar een array van objecten.
 * @param {string} url - URL naar het CSV-bestand.
 * @returns {Promise<Array<Object>>} - Geparste data.
 */
async function fetchCSV(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Fout bij laden: ${url}`);

  const text = await response.text();
  const [headerLine, ...lines] = text.trim().split('\n');
  const headers = headerLine.split(',').map(h => h.trim());

  return lines.map(line => {
    const values = line.split(',');
    const obj = {};
    headers.forEach((h, i) => {
      obj[h] = values[i]?.trim();
    });
    return obj;
  });
}

export async function getKlassen() {
  return fetchCSV(csvUrls.klassen);
}

export async function getLessentabel() {
  return fetchCSV(csvUrls.lessentabel);
}

export async function getFootnotes() {
  return fetchCSV(csvUrls.voetnoten);
}
