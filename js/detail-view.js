// detail-view.js

/**
 * Genereert en toont de slide-in infokader voor een geselecteerde klas.
 * @param {Object} klas - Het klasobject met richting, beschrijving, domein...
 * @param {Array} lessen - Alle lesitems voor deze richting (meerdere klassen mogelijk).
 * @param {Array} voetnoten - Alle voetnoten die bij deze richting horen.
 */
export function renderSlidein(klas, lessen, voetnoten) {
  const domeinKey = window.ConfigModule?.domeinMap?.[klas.domein.toLowerCase()] || 'onbekend';
  document.getElementById("slidein").dataset.domain = domeinKey;

  document.getElementById("opleiding-titel").textContent = klas.richting;
  document.getElementById("opleiding-beschrijving").textContent = klas.beschrijving || '';

  const lesHTML = generateTabelPerGraad(lessen);
  document.getElementById("lessentabel-container").innerHTML = lesHTML;

  const voetHTML = voetnoten.map(f => `<li>${f.tekst}</li>`).join('');
  document.getElementById("footnotes").innerHTML = voetHTML ? `<ul class="footnotes">${voetHTML}</ul>` : '';

  document.getElementById("slidein").classList.add("open");
  document.getElementById("overlay").classList.add("active");
}

/**
 * Groepeert lessen per klas en genereert een dynamische kolomtabel per klas
 */
function generateTabelPerGraad(lessen) {
  const perKlas = {};
  lessen.forEach(l => {
    if (!perKlas[l.klas]) perKlas[l.klas] = [];
    perKlas[l.klas].push(l);
  });

  const klassen = Object.keys(perKlas).sort();
  if (!klassen.length) return '<p>Geen lessentabel beschikbaar.</p>';

  const alleVakken = Array.from(new Set(lessen.map(l => l.vak)));

  let rows = alleVakken.map(vak => {
    const cols = klassen.map(k => {
      const les = perKlas[k].find(l => l.vak === vak);
      return `<td>${les?.uren || ''}</td>`;
    }).join('');
    return `<tr><td>${vak}</td>${cols}</tr>`;
  }).join('');

  // Extra rijen: lestijden + stage
  const rijen = ['lestijden', 'stage_weken'];
  rijen.forEach(label => {
    const labelTekst = label === 'lestijden' ? 'Lestijden per week' : 'Stage weken';
    const cells = klassen.map(k => {
      const match = perKlas[k].find(l => l[label]);
      return `<td><strong>${match?.[label] || ''}</strong></td>`;
    }).join('');
    rows += `<tr><td><strong>${labelTekst}</strong></td>${cells}</tr>`;
  });

  const thead = `<thead><tr><th>Vak</th>${klassen.map(k => `<th>${k}</th>`).join('')}</tr></thead>`;
  return `<table class="lessentabel">${thead}<tbody>${rows}</tbody></table>`;
}
