// detail-view.js
import { mapDomein, getDomeinMeta } from './config-module.js';

export function renderSlidein(klas, lessen, voetnoten) {
  if (!klas) return;

  const domeinKey = mapDomein(klas.domein);
  const kleuren = getDomeinMeta(domeinKey);
  const slidein = document.getElementById("slidein");
  slidein.dataset.domain = domeinKey;

  document.getElementById("opleiding-titel").textContent = klas.richting;
  document.getElementById("opleiding-beschrijving").textContent = klas.beschrijving || '';

  const tabelHTML = generateLessentabel(lessen);
  document.getElementById("lessentabel-container").innerHTML = tabelHTML;

  const voetHTML = voetnoten.map(f => `<li>${f.tekst}</li>`).join('');
  document.getElementById("footnotes").innerHTML = voetHTML ? `<ul class="footnotes">${voetHTML}</ul>` : '';

  slidein.classList.add("open");
  document.getElementById("overlay").classList.add("active");
}

function generateLessentabel(lessen) {
  if (!lessen.length) return '<p>Geen lessentabel beschikbaar.</p>';

  // Groepeer lessen per klas
  const perKlas = {};
  lessen.forEach(l => {
    if (!perKlas[l.klas]) perKlas[l.klas] = [];
    perKlas[l.klas].push(l);
  });

  // Unieke lijst van vakken
  const alleVakken = [...new Set(lessen.map(l => l.vak))];
  const klassen = Object.keys(perKlas);

  let header = `<thead><tr><th>Vak</th>` +
    klassen.map(k => `<th>${k}</th>`).join('') +
    `</tr></thead>`;

  let body = alleVakken.map(vak => {
    const row = [`<td>${vak}</td>`];
    klassen.forEach(k => {
      const item = perKlas[k].find(l => l.vak === vak);
      row.push(`<td>${item?.uren || ''}</td>`);
    });
    return `<tr>${row.join('')}</tr>`;
  }).join('');

  // Voeg rijen toe voor lestijden per week en stage weken
  const extraRijen = ['Lestijden per week', 'Stage weken'].map(label => {
    const row = [`<td><strong>${label}</strong></td>`];
    klassen.forEach(k => {
      const item = perKlas[k].find(l => l.vak.toLowerCase().includes(label.toLowerCase()));
      row.push(`<td>${item?.uren || ''}</td>`);
    });
    return `<tr>${row.join('')}</tr>`;
  }).join('');

  return `<table class="lessentabel">${header}<tbody>${body}${extraRijen}</tbody></table>`;
}

export function closeSlidein() {
  document.getElementById("slidein").classList.remove("open");
  document.getElementById("overlay").classList.remove("active");
}
