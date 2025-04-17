// detail-view.js

/**
 * Genereert en toont de slide-in infokader voor een geselecteerde klas.
 * @param {Object} klas - Het klasobject met richting, beschrijving, domein...
 * @param {Array} lessen - Alle lesitems voor deze richting (alle klassen)
 * @param {Array} voetnoten - Alle voetnoten die bij deze richting horen
 */
export function renderSlidein(klas, lessen, voetnoten) {
  const domeinKey = window.ConfigModule?.domeinMap?.[klas.domein.toLowerCase()] || 'onbekend';
  document.getElementById("slidein").dataset.domain = domeinKey;

  document.getElementById("opleiding-titel").textContent = klas.richting;
  document.getElementById("opleiding-beschrijving").textContent = klas.beschrijving || '';

  const lesHTML = generateTabelPerKlas(lessen);
  document.getElementById("lessentabel-container").innerHTML = lesHTML;

  const voetHTML = voetnoten.map(f => `<li>${f.tekst}</li>`).join('');
  document.getElementById("footnotes").innerHTML = voetHTML ? `<ul class="footnotes">${voetHTML}</ul>` : '';

  document.getElementById("slidein").classList.add("open");
  document.getElementById("overlay").classList.add("active");
}

/**
 * Groepeert lessen per klas en genereert een dubbele kolomtabel (of enkele kolom bij fallback)
 */
function generateTabelPerKlas(lessen) {
  const perKlas = {};
  lessen.forEach(l => {
    if (!perKlas[l.klas]) perKlas[l.klas] = [];
    perKlas[l.klas].push(l);
  });

  const klassen = Object.keys(perKlas).sort();
  if (klassen.length === 0) return '<p>Geen lessentabel beschikbaar.</p>';

  // Verzamel alle unieke vakken uit beide klassen
  const alleVakken = Array.from(new Set(
    klassen.flatMap(k => perKlas[k].map(l => l.vak))
  ));

  let rows = alleVakken.map(vak => {
    const kolommen = klassen.map(klasnaam => {
      const match = perKlas[klasnaam].find(l => l.vak === vak);
      return `<td>${match?.uren || ''}</td>`;
    }).join('');
    return `<tr><td>${vak}</td>${kolommen}</tr>`;
  }).join('');

  // Voeg rij toe voor stageweken
  const stageRow = klassen.map(klasnaam => {
    const entry = perKlas[klasnaam].find(l => l.stage_weken);
    return `<td><strong>${entry?.stage_weken || ''}</strong></td>`;
  }).join('');
  rows += `<tr><td><strong>Stage weken</strong></td>${stageRow}</tr>`;

  const headerCols = klassen.map(k => `<th>${k}</th>`).join('');

  return `
    <table class="lessentabel">
      <thead><tr><th>Vak</th>${headerCols}</tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
}
