// detail-view.js
import { mapDomein, getDomeinMeta } from './config-module.js';
import { initPrintHandler } from './print-handler.js';

/**
 * Genereert en toont de slide-in infokader voor een geselecteerde klas.
 * @param {Object} klas - Het klasobject met richting, beschrijving, domein...
 * @param {Array} lessen - Alle lesitems voor deze richting (alle klassen)
 * @param {Array} voetnoten - Alle voetnoten die bij deze richting horen
 */
export function renderSlidein(klas, lessen, voetnoten) {
  const domeinKey = mapDomein(klas.domein);
  
  // Update het slidein element met de juiste domein data voor styling
  const slideinEl = document.getElementById("slidein");
  slideinEl.dataset.domain = domeinKey;
  
  // Haal de domein kleuren op en pas ze toe als CSS variabelen
  const domeinMeta = getDomeinMeta(domeinKey);
  slideinEl.style.setProperty('--app-domain-base', domeinMeta.base);
  slideinEl.style.setProperty('--app-domain-mid', domeinMeta.mid);
  slideinEl.style.setProperty('--app-domain-light1', domeinMeta.light1);
  slideinEl.style.setProperty('--app-domain-hover', domeinMeta.hover);
  
  // Vul de basisinformatie in
  document.getElementById("opleiding-titel").textContent = klas.richting;
  document.getElementById("opleiding-beschrijving").textContent = klas.beschrijving || '';

  // Genereer en vul de lessentabel
  const lesHTML = generateTabelPerKlas(lessen, klas);
  document.getElementById("lessentabel-container").innerHTML = lesHTML;

  // Voeg eventuele voetnoten toe
  const voetHTML = voetnoten
    .filter(f => f.tekst && f.tekst.trim().length > 0)
    .map(f => `<li>${f.tekst}</li>`)
    .join('');
    
  document.getElementById("footnotes").innerHTML = 
    voetHTML ? `<div class="footnotes"><h4>Extra informatie</h4><ul>${voetHTML}</ul></div>` : '';

  // Toon het slidein paneel
  slideinEl.classList.add("open");
  document.getElementById("overlay").classList.add("active");
  
  // Zorg ervoor dat de sluitknop werkt
  document.querySelector('.close-btn').addEventListener('click', () => {
    document.getElementById("slidein").classList.remove("open");
    document.getElementById("overlay").classList.remove("active");
  });
  
  // Initialiseer de print handler voor dit slidein met klas-informatie
  initPrintHandler(klas);
}

/**
 * Groepeert lessen per klas en genereert een tabel
 */
function generateTabelPerKlas(lessen, hoofdKlas) {
  // Groepeer lessen per klascode
  const perKlas = {};
  lessen.forEach(les => {
    if (!perKlas[les.klascode]) perKlas[les.klascode] = [];
    perKlas[les.klascode].push(les);
  });

  // Filter klascodes om alleen die van dezelfde graad als hoofdKlas te behouden
  const klasCodes = Object.keys(perKlas).sort().filter(code => {
    // Zoek de graad van deze klascode op in LessentabellenApp.klassen
    const klas = window.LessentabellenApp.klassen.find(k => k.klascode === code);
    // Alleen behouden als de graad overeenkomt met de hoofdKlas
    return klas && klas.graad === hoofdKlas.graad;
  });
  
  if (klasCodes.length === 0) return '<p>Geen lessentabel beschikbaar.</p>';

  // Haal de klassen informatie op
  const klassenInfo = {};
  klasCodes.forEach(code => {
    // Vind de klasse info uit hoofdKlas of gebruik een default
    const lessenVoorKlas = perKlas[code];
    
    // Dit is per definitie hetzelfde type (richting), dus graad en categorie moeten gelijk zijn
    // We gebruiken het eerste item om de categorie te bepalen
    const eersteVak = lessenVoorKlas[0];
    
    klassenInfo[code] = {
      code: code,
      // Extraheer het leerjaar uit de klascode (vaak begint met een cijfer)
      leerjaar: code.charAt(0)
    };
  });

  // Groepeer per categorie (basisvorming, specifiek gedeelte, etc.)
  const perCategorie = {};
  
  klasCodes.forEach(code => {
    perKlas[code].forEach(les => {
      const categorie = les.categorie || 'onbekend';
      if (!perCategorie[categorie]) {
        perCategorie[categorie] = [];
      }
      
      // Als dit vak nog niet bestaat in deze categorie, voeg het toe
      if (!perCategorie[categorie].find(v => v.vak === les.vak)) {
        perCategorie[categorie].push({
          vak: les.vak,
          type: les.type,
          subvak: les.subvak === 'WAAR',
          uren: {} // Dit wordt gevuld met uren per klascode
        });
      }
      
      // Voeg de uren toe aan het juiste vak
      const vakInCategorie = perCategorie[categorie].find(v => v.vak === les.vak);
      if (vakInCategorie) {
        vakInCategorie.uren[code] = les.uren;
      }
    });
  });

  // Bereken totalen per klascode
  const totalen = {};
  klasCodes.forEach(code => {
    totalen[code] = 0;
    
    // Som alle numerieke uurwaarden op
    Object.keys(perCategorie).forEach(categorie => {
      if (categorie !== 'totaal') {
        perCategorie[categorie].forEach(vak => {
          const uren = vak.uren[code];
          if (uren && !isNaN(parseFloat(uren.toString().replace(',', '.')))) {
            totalen[code] += parseFloat(uren.toString().replace(',', '.'));
          }
        });
      }
    });
  });

  // Bouw de HTML op voor de tabel
  let html = '';
  
  // Sorteer de categorieën zodat 'basisvorming' eerst komt, dan 'specifiek gedeelte', dan 'vrije ruimte', dan 'totaal'
  const categorieVolgorde = ['basisvorming', 'specifiek gedeelte', 'vrije ruimte', 'totaal'];
  const gesorteerdeCategorieen = Object.keys(perCategorie).sort((a, b) => {
    const indexA = categorieVolgorde.indexOf(a);
    const indexB = categorieVolgorde.indexOf(b);
    return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
  });

  gesorteerdeCategorieen.forEach(categorie => {
    // Voeg een rij toe met de categorienaam als header (behalve voor 'totaal')
    const isHeader = categorie !== 'totaal';
    
    if (isHeader) {
      html += `
        <tr class="categorie-header">
          <th colspan="${klasCodes.length + 1}">${categorie.toUpperCase()}</th>
        </tr>
      `;
    }
    
    // Sorteer de vakken binnen elke categorie
    // Headers (type: 'header') komen eerst, dan normale vakken, dan subvakken
    const gesorteerdeVakken = perCategorie[categorie].sort((a, b) => {
      // Headers eerst
      if (a.type === 'header' && b.type !== 'header') return -1;
      if (a.type !== 'header' && b.type === 'header') return 1;
      
      // Dan subvakken
      if (a.subvak !== b.subvak) return a.subvak ? 1 : -1;
      
      // Anders alfabetisch
      return a.vak.localeCompare(b.vak);
    });
    
    gesorteerdeVakken.forEach(vak => {
      // Bepaal opmaak op basis van vaktype
      let vakClass = '';
      if (vak.type === 'header') vakClass = 'vak-header';
      else if (vak.subvak) vakClass = 'subvak';
      else if (categorie === 'totaal') vakClass = 'totaal-row';
      
      html += `<tr class="${vakClass}">`;
      
      // Eerste kolom is de vaknaam
      html += `<td>${vak.vak}</td>`;
      
      // Daarna een kolom per klascode met het aantal uren
      klasCodes.forEach(code => {
        const uren = vak.uren[code] || '';
        html += `<td>${uren}</td>`;
      });
      
      html += '</tr>';
    });
  });

  // Voeg totaalrij toe als die nog niet bestaat uit de categorieën
  if (!perCategorie['totaal']) {
    html += `
      <tr class="totaal-row">
        <td>Lestijden per week</td>
        ${klasCodes.map(code => `<td>${totalen[code]}</td>`).join('')}
      </tr>
    `;
  }

  // Controleer of er überhaupt stage weken zijn in enige klas
  const heeftStageWeken = klasCodes.some(code => {
    // Zoek klas bij de code
    const gevondenKlas = window.LessentabellenApp.klassen.find(k => k.klascode === code);
    // Verbeterde controle: check explicieter op waarde
    return gevondenKlas && gevondenKlas.stage_weken !== undefined && gevondenKlas.stage_weken !== null;
  });

  // Voeg rij toe voor stageweken wanneer die beschikbaar zijn
  if (heeftStageWeken) {
    html += `
      <tr class="stage-row">
        <td>Stage weken</td>
        ${klasCodes.map(code => {
          // Zoek de juiste klas-info voor deze klascode
          const klasMetCode = window.LessentabellenApp.klassen.find(k => k.klascode === code);
          // Verbeterde check: niet afhankelijk van truthy/falsy evaluatie
          const stageWeken = (klasMetCode && klasMetCode.stage_weken !== undefined && klasMetCode.stage_weken !== null) 
            ? klasMetCode.stage_weken 
            : '';
          return `<td>${stageWeken}</td>`;
        }).join('')}
      </tr>
    `;
  }

  // Bouw de volledige tabel inclusief headers
  return `
    <table class="lessentabel">
      <thead>
        <tr>
          <th>Vak</th>
          ${klasCodes.map(code => `<th>${code}</th>`).join('')}
        </tr>
      </thead>
      <tbody>
        ${html}
      </tbody>
    </table>
  `;
}
