// loader.js

import { csvUrl, footnotesUrl } from './config-module.js';

const KLASSEN_URL = 'data/klassen.csv';
const LESSEN_URL = 'data/lessentabel.csv';
const FOOTNOTES_URL = 'data/voetnoten.csv'; // aangepast van 'footnotes.csv'

/**
 * Haalt een CSV-bestand op en zet het om naar een array van objecten
 */
async function fetchCSV(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Fout bij ophalen van ${url}: ${response.status}`);
  }
  const text = await response.text();
  return parseCSV(text);
}

/**
 * Parser voor CSV-bestanden, verwacht komma-gescheiden en header op eerste lijn
 */
function parseCSV(text) {
  const [headerLine, ...lines] = text.trim().split('\n');
  const headers = headerLine.split(',').map(h => h.trim());
  return lines.map(line => {
    const values = line.split(',').map(v => v.trim());
    return Object.fromEntries(headers.map((h, i) => [h, values[i] ?? '']));
  });
}

/**
 * Haalt alle klasitems op
 */
export async function getKlassen() {
  return await fetchCSV(KLASSEN_URL);
}

/**
 * Haalt de lessentabel op
 */
export async function getLessentabel() {
  return await fetchCSV(LESSEN_URL);
}

/**
 * Haalt de voetnoten op
 */
export async function getFootnotes() {
  return await fetchCSV(FOOTNOTES_URL);
}
