import Papa from 'papaparse';

async function fetchCsv(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Kan CSV niet laden: ${res.status}`);
  const text = await res.text();
  const { data, errors } = Papa.parse(text, {
    header: true,
    delimiter: ';'
  });
  if (errors.length) console.warn('CSV‑parse‑fouten:', errors);
  return data;
}

// Wordt aangeroepen in app.js
export function getLessons() {
  return fetchCsv(window.ConfigModule.csvUrl);
}

// Later kun je hier ook je voetnoten-URL uit ConfigModule ophalen
export function getFootnotes() {
  return fetchCsv(window.ConfigModule.footnotesUrl);
}
