// detail-view.js (refactor versie aangepast aan nieuwe structuur)

import { mapDomein, getDomeinMeta } from './config-module.js';

export function renderDetailView(klas, lessentabel, footnotes) {
  const container = document.getElementById("slidein");
  const overlay = document.getElementById("overlay");

  const domeinKey = mapDomein(klas.domein);
  const kleuren = getDomeinMeta(domeinKey);

  container.className = "open";
  container.dataset.domain = domeinKey;
  overlay.classList.add("active");

  // Titel + knoppen
  const header = `
    <div class="detail-header">
      <h2>${klas.richting}</h2>
      <div class="detail-buttons">
        <button onclick="window.print()">Afdrukken</button>
        ${klas.brochure ? `<a href="${klas.brochure}" target="_blank">Bekijk brochure</a>` : ''}
      </div>
    </div>`;

  // Lessentabel per graad
  const lessenPerGraad = {};
  lessentabel.filter(l => l.klascode === klas.klascode).forEach(item => {
    const graad = (item.graad || 'ONBEKEND').toUpperCase();
    if (!lessenPerGraad[graad]) lessenPerGraad[graad] = [];
    lessenPerGraad[graad].push(item);
  });

  let lessenHTML = '';
  Object.entries(lessenPerGraad).forEach(([graad, vakken]) => {
    const rows = vakken.map(v => `
      <tr>
        <td>${v.vak}</td>
        <td>${v.uren}</td>
        <td>${v.stage_weken || ''}</td>
      </tr>`).join('');

    lessenHTML += `
      <div class="graad-detail">
        <h3>${graad}</h3>
        <table class="lessentabel">
          <thead><tr><th>Vak</th><th>Uren</th><th>Stage (weken)</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`;
  });

  // Stage-informatie samenvatten
  const stageSamenvatting = Object.entries(lessenPerGraad).map(([graad, vakken]) => {
    const totaal = vakken.reduce((som, l) => som + (parseFloat(l.stage_weken) || 0), 0);
    return totaal > 0 ? `<li>${graad}: ${totaal} weken stage</li>` : '';
  }).filter(Boolean).join('');

  const stageHTML = stageSamenvatting ? `<div class="stage-info"><h4>Stageoverzicht</h4><ul>${stageSamenvatting}</ul></div>` : '';

  // Voetnoten
  const voetnoten = footnotes.filter(f => f.klascode === klas.klascode);
  const voetHTML = voetnoten.length
    ? `<div class="footnotes"><h4>Opmerkingen</h4><ul>${voetnoten.map(f => `<li>${f.tekst}</li>`).join('')}</ul></div>`
    : '';

  container.innerHTML = `
    ${header}
    ${lessenHTML}
    ${stageHTML}
    ${voetHTML}
  `;
}

export function closeDetailView() {
  document.getElementById("slidein").classList.remove("open");
  document.getElementById("overlay").classList.remove("active");
}
