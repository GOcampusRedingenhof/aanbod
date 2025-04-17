// loader.js

/**
 * Haalt een CSV op via fetch() en parse met de globale Papa.parse()
 */
async function fetchCsv(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Kan CSV niet laden: ${res.status}`);
  const text = await res.text();
  const { data, errors } = Papa.parse(text, {
    header: true,
    delimiter: ';'
  });
  if (errors.length) console.warn('CSV parse errors:', errors);
  return data;
}

/**
 * Returnt een array van lessendata
 */
export function getLessons() {
  return fetchCsv(window.ConfigModule.csvUrl);
}

/**
 * Returnt een array van voetnoten
 */
export function getFootnotes() {
  return fetchCsv(window.ConfigModule.footnotesUrl);
}
