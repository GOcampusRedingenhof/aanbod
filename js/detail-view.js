// detail-view.js

/**
 * Genereert en toont de slide-in infokader voor een geselecteerde klas.
 * @param {Object} klas - Het klasobject met richting, beschrijving, domein...
 * @param {Array} alleKlassen - Alle klasobjecten van dezelfde richting (zelfde richtingcode).
 * @param {Array} lessen - Alle lesitems voor deze richting.
 * @param {Array} voetnoten - Alle voetnoten die bij deze klas horen.
 */
export function renderSlidein(klas, alleKlassen, lessen, voetnoten) {
  const domeinKey = window.ConfigModule?.domeinMap?.[klas.domein.toLowerCase()] || 'onbekend';
  document.getElementById("slidein").dataset.domain = domeinKey;

  document.getElementById("opleiding-titel").textContent = klas.richting;
  document.getElementById("opleiding-beschrijving").textContent = klas.beschrijving || '';

  const lesHTML = generateTabelPerGraad(alleKlassen, lessen);
  document.getElementById("lessentabel-container").innerHTML = lesHTML;

  const voetHTML = voetnoten.map(f => `<li>${f.tekst}</li>`).join('');
  document.getElementById("footnotes").innerHTML = voetHTML ? `<ul class="footnotes">${voetHTML}</ul>` : '';

  document.getElementById("slidein").classList.add("open");
  document.getElementById("overlay").classList.add("active");
}

/**
 * Genereert een lesrooster per klas in één tabel, gesorteerd per klas.
 * @param {Array} klassen - Alle klasobjecten (met klascode, richting, graad, enz.).
 * @param {Array} lessen - Alle lessen van de richting (alle bijhorende klascodes).
 * @returns {string} HTML-tabel
 */
function generateTabelPerGraad(klassen, lessen) {
  const perKlas = {};
  klassen.forEach(k => perKlas[k.klascode] = { naam: k.klas, stage: k.stage_weken });

  const perVak = {};
  lessen.forEach(l => {
    if (!perVak[l.vak]) perVak[l.vak] = {};
    perVak[l.vak][l.klascode] = l.uren;
  });

  const kolommen = Object.keys(perKlas);
  if (!kolommen.length) return '<p>Geen lessentabel beschikbaar.</p>';

  let thead = `<tr><th>Vak</th>${kolommen.map(k => `<th>${perKlas[k].naam}</th>`).join('')}</tr>`;

  const vakken = Object.keys(perVak);
  let rows = vakken.map(vak => {
    const cellen = kolommen.map(k => `<td>${perVak[vak]?.[k] ?? ''}</td>`).join('');
    return `<tr><td>${vak}</td>${cellen}</tr>`;
  }).join('');

  // Toevoegen van stageweken onderaan
  const stageRow = kolommen.map(k => `<td><strong>${perKlas[k].stage ?? ''}</strong></td>`).join('');
  rows += `<tr><td><strong>Stage weken</strong></td>${stageRow}</tr>`;

  return `
    <table class="lessentabel">
      <thead>${thead}</thead>
      <tbody>${rows}</tbody>
    </table>`;
}
