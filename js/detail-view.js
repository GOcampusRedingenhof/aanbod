// detail-view.js

/**
 * Genereert en toont de slide-in infokader voor een geselecteerde klas.
 * @param {Object} klas - Het klasobject met richting, beschrijving, domein...
 * @param {Array} lessen - Alle lesitems voor deze klas.
 * @param {Array} voetnoten - Alle voetnoten die bij deze klas horen.
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
 * Groepeert lessen per klas en genereert een dubbele kolomtabel (of enkele kolom bij fallback)
 */
function generateTabelPerGraad(lessen) {
  const perKlas = {};
  lessen.forEach(l => {
    if (!perKlas[l.klas]) perKlas[l.klas] = [];
    perKlas[l.klas].push(l);
  });

  const klassen = Object.keys(perKlas).sort();
  if (klassen.length < 1) return '<p>Geen lessentabel beschikbaar.</p>';

  if (klassen.length === 1) {
    const entries = perKlas[klassen[0]];
    let rows = entries.map(l => `<tr><td>${l.vak}</td><td>${l.uren || ''}</td></tr>`).join('');
    rows += `<tr><td><strong>Stage weken</strong></td><td><strong>${entries.find(l => l.stage_weken)?.stage_weken || ''}</strong></td></tr>`;
    return `
      <table class="lessentabel">
        <thead><tr><th>Vak</th><th>${klassen[0]}</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>`;
  }

  const left = perKlas[klassen[0]];
  const right = perKlas[klassen[1]];
  const alleVakken = Array.from(new Set([...left.map(l => l.vak), ...right.map(l => l.vak)]));

  let rows = alleVakken.map(vak => {
    const l = left.find(l => l.vak === vak);
    const r = right.find(r => r.vak === vak);
    return `<tr><td>${vak}</td><td>${l?.uren || ''}</td><td>${r?.uren || ''}</td></tr>`;
  }).join('');

  const stageLeft = left.find(l => l.stage_weken)?.stage_weken;
  const stageRight = right.find(l => l.stage_weken)?.stage_weken;
  rows += `<tr><td><strong>Stage weken</strong></td><td><strong>${stageLeft || ''}</strong></td><td><strong>${stageRight || ''}</strong></td></tr>`;

  return `
    <table class="lessentabel">
      <thead><tr><th>Vak</th><th>${klassen[0]}</th><th>${klassen[1]}</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
}
