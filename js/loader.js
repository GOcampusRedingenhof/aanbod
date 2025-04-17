// loader.js

/**
 * Laadt CSV-bestanden vanaf GitHub Pages of een andere publieke bron.
 * Verwacht:
 * - klassen.csv
 * - lessentabel.csv
 * - voetnoten.csv
 */

const CSV_BASE_URL = 'https://gocampusredingenhof.github.io/aanbod/data/';

async function fetchCsv(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Kan CSV niet laden: ${response.status}`);

  const text = await response.text();
  return new Promise((resolve, reject) => {
    Papa.parse(text, {
      header: true,
      skipEmptyLines: true,
      complete: results => resolve(results.data),
      error: err => reject(err)
    });
  });
}

export async function getKlassen() {
  return await fetchCsv(CSV_BASE_URL + 'klassen.csv');
}

export async function getLessentabel() {
  return await fetchCsv(CSV_BASE_URL + 'lessentabel.csv');
}

export async function getFootnotes() {
  return await fetchCsv(CSV_BASE_URL + 'voetnoten.csv');
}
