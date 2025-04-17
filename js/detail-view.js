// detail-view.js

/**
 * Genereert en toont de slide-in infokader voor een geselecteerde klas.
 * @param {Object} klas - Het klasobject met richting, beschrijving, domein...
 * @param {Array} lessen - Alle lesitems (alle klassen) voor deze richting.
 * @param {Array} voetnoten - Alle voetnoten die bij deze richting horen.
 */
export function renderSlidein(klas, lessen, voetnoten) {
  const domeinKey = window.ConfigModule?.domeinMap?.[klas.domein.toLowerCase()] || 'onbekend';
  document.getElementById("slidein").dataset.domain = domeinKey;

  document.getElementById("opleiding-titel").textContent = klas.richting;
  document.getElementById("opleiding-beschrijving").textContent = klas.beschrijving || '';

  const lesHTML = generateTabelPerRichting(lessen);
  document.getElementById("lessentabel-container").innerHTML = lesHTML;

  const voetHTML = voetnoten.map(f => `<li>${f.tekst}</li>`).join('');
  document.getElementById("footnotes").innerHTML = voetHTML ? `<ul class="footnotes">${voetHTML}</ul>` : '';

  document.getElementById("slidein").classList.add("open");
  document.getElementById("overlay").classList.add("active");
}

/**
 * Groepeert lessen per klas en genereert een dubbele kolomtabel
 */
function generateTabelPerRichting(lessen) {
  const perKlas = {};
  lessen.forEach(l => {
    if (!perKlas[l.klas]) perKlas[l.klas] = [];
    perKlas[l.klas].push(l);
  });

  const klassen = Object.keys(perKlas).sort();
  if (klassen.length === 0) return '<p>Geen lessentabel beschikbaar.</p>';

  const alleVakken = new Set();
  klassen.forEach(klas => {
    perKlas[klas].forEach(l => alleVakken.add(l.vak));
  });

  const vakken = Array.from(alleVakken);
  const header = `<tr><th>Vak</th>${klassen.map(k => `<th>${k}</th>`).join('')}</tr>`;

  const rows = vakken.map(vak => {
    const cols = klassen.map(klas => {
      const entry = perKlas[klas].find(l => l.vak === vak);
      return `<td>${entry?.uren || ''}</td>`;
    }).join('');
    return `<tr><td>${vak}</td>${cols}</tr>`;
  }).join('');

  // Voeg rij toe voor stageweken
  const stageRow = `<tr><td><strong>Stage weken</strong></td>${klassen.map(klas => {
    const l = perKlas[klas].find(l => l.stage_weken);
    return `<td><strong>${l?.stage_weken || ''}</strong></td>`;
  }).join('')}</tr>`;

  return `
    <table class="lessentabel">
      <thead>${header}</thead>
      <tbody>${rows}${stageRow}</tbody>
    </table>`;
}
