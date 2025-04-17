// detail-view.js - finale herwerking (kleur via window.ConfigModule, structuur per klas)

import { mapDomein } from './config-module.js';

export function renderDetailView(klas, lessentabel, footnotes) {
  const container = document.getElementById("slidein");
  const overlay = document.getElementById("overlay");

  const domeinKey = mapDomein(klas.domein);
  const kleuren = (window.ConfigModule?.domainColors || {})[domeinKey] || {};

  // Domeinkleuren injecteren als CSS variabelen op container
  container.className = "open";
  container.dataset.domain = domeinKey;
  container.style.setProperty('--app-domain-base', kleuren.base || '#1f2937');
  container.style.setProperty('--app-domain-mid', kleuren.mid || '#374151');
  overlay.classList.add("active");

  // Header met titel en knoppen
  const header = `
    <div class="detail-header">
      <h2>${klas.richting}</h2>
      <div class="detail-buttons">
        <button onclick="window.print()">Afdrukken</button>
        ${klas.brochure ? `<a href="${klas.brochure}" target="_blank">Bekijk brochure</a>` : ''}
      </div>
    </div>`;

  // Verzamel alle klassen en data met dezelfde richtingcode
  const klassen = window.LessentabellenApp.klassen.filter(k => k.richtingcode === klas.richtingcode);
  const alleLessen = window.LessentabellenApp.lessentabel.filter(l => l.richtingcode === klas.richtingcode);
  const alleVoetnoten = window.LessentabellenApp.footnotes.filter(f => f.richtingcode === klas.richtingcode);

  // Tabellen per klas
  const lessenHTML = klassen.map(k => {
    const lessen = alleLessen.filter(l => l.klascode === k.klascode);
    if (!lessen.length) return '';
    const rows = lessen.map(l => `
      <tr>
        <td>${l.vak}</td>
        <td>${l.uren}</td>
      </tr>`).join('');

    return `
      <div class="graad-detail">
        <h3>${k.klascode}</h3>
        <table class="lessentabel">
          <thead><tr><th>Vak</th><th>Uren</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`;
  }).join('');

  // Stage-info
  const stageHTML = klassen.map(k => {
    const lessen = alleLessen.filter(l => l.klascode === k.klascode);
    const totaal = lessen.reduce((sum, l) => sum + (parseFloat(l.stage_weken) || 0), 0);
    return totaal > 0 ? `<li>${k.klascode}: ${totaal} weken stage</li>` : '';
  }).filter(Boolean).join('');

  const stageInfoHTML = stageHTML ? `<div class="stage-info"><h4>Stageoverzicht</h4><ul>${stageHTML}</ul></div>` : '';

  // Voetnoten
  const voetHTML = alleVoetnoten.length
    ? `<div class="footnotes"><h4>Opmerkingen</h4><ul>${alleVoetnoten.map(f => `<li>${f.tekst}</li>`).join('')}</ul></div>`
    : '';

  container.innerHTML = `
    ${header}
    ${lessenHTML}
    ${stageInfoHTML}
    ${voetHTML}
  `;
}

export function closeDetailView() {
  document.getElementById("slidein").classList.remove("open");
  document.getElementById("overlay").classList.remove("active");
}
