// loader.js
import { csvUrls } from './config-module.js';

/**
 * Verbeterde CSV parser die rekening houdt met komma's binnen aanhalingstekens
 * @param {string} url - URL naar het CSV-bestand.
 * @returns {Promise<Array<Object>>} - Geparste data.
 */
async function fetchCSV(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Fout bij laden: ${url}`);

    const text = await response.text();
    
    // Gebruik Papa Parse als het beschikbaar is, anders eigen parser
    if (typeof Papa !== 'undefined') {
      return new Promise((resolve) => {
        Papa.parse(text, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true,
          complete: (results) => {
            resolve(results.data);
          }
        });
      });
    } else {
      // Fallback: eigen simpele parser
      const [headerLine, ...lines] = text.trim().split('\n');
      const headers = headerLine.split(',').map(h => h.trim());

      return lines.map(line => {
        const values = line.split(',');
        const obj = {};
        headers.forEach((h, i) => {
          let value = values[i]?.trim() ?? '';
          
          // Eenvoudige typeverwerking
          if (value === 'WAAR') value = true;
          else if (value === 'ONWAAR') value = false;
          else if (!isNaN(value) && value !== '') value = Number(value);
          
          obj[h] = value;
        });
        return obj;
      });
    }
  } catch (error) {
    console.error(`Error fetching CSV from ${url}:`, error);
    throw error;
  }
}

/**
 * Laadt en verwerkt de klassen data
 */
export async function getKlassen() {
  const data = await fetchCSV(csvUrls.klassen);
  
  // Voer eventuele gegevensverwerking uit
  return data.map(item => ({
    ...item,
    // Zorg ervoor dat stage_weken een getal is voor berekeningen
    stage_weken: item.stage_weken ? Number(item.stage_weken) : null
  }));
}

/**
 * Laadt en verwerkt de lessentabel data
 */
export async function getLessentabel() {
  const data = await fetchCSV(csvUrls.lessentabel);
  
  // Voer eventuele gegevensverwerking uit
  return data.map(item => ({
    ...item,
    // Zorg ervoor dat uren een getal is (of een string als het een breuk is)
    uren: item.uren !== undefined ? item.uren : ''
  }));
}

/**
 * Laadt en verwerkt voetnoten
 */
export async function getFootnotes() {
  try {
    const data = await fetchCSV(csvUrls.voetnoten);
    return data;
  } catch (error) {
    console.warn("Voetnoten konden niet worden geladen, lege lijst wordt gebruikt:", error);
    return [];
  }
}
