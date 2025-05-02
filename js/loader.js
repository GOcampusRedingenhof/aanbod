
async function fetchCSV(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Fout bij laden: ${url}`);
    }
    const data = await response.text();
    return data.split('\n').map(row => row.split(';'));
  } catch (error) {
    console.error(`Error fetching CSV from ${url}:`, error);
    throw error;
  }
}

export async function getKlassen() {
  const url = 'https://cdn.jsdelivr.net/gh/GOcampusRedingenhof/aanbod@main/data/klassen.csv';
  const rows = await fetchCSV(url);
  const headers = rows[0];
  return rows.slice(1).filter(r => r.length === headers.length).map(row =>
    Object.fromEntries(headers.map((h, i) => [h.trim(), row[i].trim()]))
  );
}

export async function getLessentabel() {
  const url = 'https://cdn.jsdelivr.net/gh/GOcampusRedingenhof/aanbod@main/data/lessentabel.csv';
  const rows = await fetchCSV(url);
  const headers = rows[0];
  return rows.slice(1).filter(r => r.length === headers.length).map(row =>
    Object.fromEntries(headers.map((h, i) => [h.trim(), row[i].trim()]))
  );
}

export async function getFootnotes() {
  const url = 'https://cdn.jsdelivr.net/gh/GOcampusRedingenhof/aanbod@main/data/voetnoten.csv';
  try {
    const rows = await fetchCSV(url);
    const headers = rows[0];
    return rows.slice(1).filter(r => r.length === headers.length).map(row =>
      Object.fromEntries(headers.map((h, i) => [h.trim(), row[i].trim()]))
    );
  } catch (e) {
    console.warn('Voetnoten konden niet worden geladen, lege lijst wordt gebruikt:', e);
    return [];
  }
}
