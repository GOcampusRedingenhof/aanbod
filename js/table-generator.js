// table-generator.js
// Module voor het genereren van lessentabellen uit lesgegevens

/**
 * Genereert een HTML tabel met lesgegevens voor een specifieke richting
 * @param {Array} lessen - Alle lesitems van alle klassen in de richting
 * @param {Object} hoofdKlas - Het klasobject van de geselecteerde klas
 * @returns {string} HTML voor de lessentabel
 */
export function generateLessentabel(lessen, hoofdKlas) {
  // Groepeer lessen per klas
  const lessenPerKlas = groepeerLessenPerKlas(lessen);
  
  // Filter klascodes op dezelfde graad als de hoofdklas
  const klasCodes = filterKlascodesOpGraad(lessenPerKlas, hoofdKlas);
  
  if (klasCodes.length === 0) {
    return '<p>Geen lessentabel beschikbaar voor deze richting.</p>';
  }
  
  // Groepeer lessen per categorie (basisvorming, specifiek gedeelte, etc.)
  const lessenPerCategorie = groepeerLessenPerCategorie(lessenPerKlas, klasCodes);
  
  // Bereken totale lesuren per klas
  const totalen = berekenTotalen(lessenPerCategorie, klasCodes);
  
  // Bouw de HTML voor de tabel
  return buildTabelHTML(lessenPerCategorie, klasCodes, totalen, hoofdKlas);
}

/**
 * Groepeert lessen per klascode
 * @param {Array} lessen - Alle lesitems
 * @returns {Object} Object met lessen gegroepeerd per klascode
 */
function groepeerLessenPerKlas(lessen) {
  const perKlas = {};
  
  lessen.forEach(les => {
    if (!perKlas[les.klascode]) {
      perKlas[les.klascode] = [];
    }
    perKlas[les.klascode].push(les);
  });
  
  return perKlas;
}

/**
 * Filtert klascodes om alleen die van dezelfde graad als hoofdKlas te behouden
 * @param {Object} lessenPerKlas - Object met lessen gegroepeerd per klascode
 * @param {Object} hoofdKlas - Het klasobject van de geselecteerde klas
 * @returns {Array} Gefilterde en gesorteerde klascodes
 */
function filterKlascodesOpGraad(lessenPerKlas, hoofdKlas) {
  return Object.keys(lessenPerKlas).sort().filter(code => {
    // Zoek de graad van deze klascode in de hoofdapplicatie
    const klas = window.LessentabellenApp.klassen.find(k => k.klascode === code);
    // Alleen behouden als de graad overeenkomt met de hoofdKlas
    return klas && klas.graad === hoofdKlas.graad;
  });
}

/**
 * Groepeert lessen per categorie (basisvorming, specifiek gedeelte, etc.)
 * @param {Object} lessenPerKlas - Object met lessen gegroepeerd per klascode
 * @param {Array} klasCodes - Gefilterde klascodes
 * @returns {Object} Object met vakken gegroepeerd per categorie
 */
function groepeerLessenPerCategorie(lessenPerKlas, klasCodes) {
  const perCategorie = {};
  
  klasCodes.forEach(code => {
    lessenPerKlas[code].forEach(les => {
      const categorie = les.categorie || 'onbekend';
      
      if (!perCategorie[categorie]) {
        perCategorie[categorie] = [];
      }
      
      // Als dit vak nog niet bestaat in deze categorie, voeg het toe
      if (!perCategorie[categorie].find(v => v.vak === les.vak)) {
        perCategorie[categorie].push({
          vak: les.vak,
          type: les.type,
          subvak: les.subvak === 'WAAR' || les.subvak === true,
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
  
  return perCategorie;
}

/**
 * Berekent totale lesuren per klascode
 * @param {Object} perCategorie - Object met vakken gegroepeerd per categorie
 * @param {Array} klasCodes - Gefilterde klascodes
 * @returns {Object} Object met totale uren per klascode
 */
function berekenTotalen(perCategorie, klasCodes) {
  const totalen = {};
  
  klasCodes.forEach(code => {
    totalen[code] = 0;
    
    // Som alle numerieke uurwaarden op (zonder totaal categorie)
    Object.keys(perCategorie).forEach(categorie => {
      if (categorie.toLowerCase() !== 'totaal') {
        perCategorie[categorie].forEach(vak => {
          const uren = vak.uren[code];
          if (uren && !isNaN(parseFloat(uren.toString().replace(',', '.')))) {
            totalen[code] += parseFloat(uren.toString().replace(',', '.'));
          }
        });
      }
    });
    
    // Rond totalen af tot 1 decimaal voor nette weergave
    totalen[code] = Math.round(totalen[code] * 10) / 10;
  });
  
  return totalen;
}

/**
 * Bouwt de HTML voor de lessentabel
 * @param {Object} perCategorie - Object met vakken gegroepeerd per categorie
 * @param {Array} klasCodes - Gefilterde klascodes
 * @param {Object} totalen - Object met totale uren per klascode
 * @param {Object} hoofdKlas - Het klasobject van de geselecteerde klas
 * @returns {string} HTML voor de lessentabel
 */
function buildTabelHTML(perCategorie, klasCodes, totalen, hoofdKlas) {
  let tableContent = '';
  
  // Sorteer categorieën in logische volgorde
  const categorieVolgorde = ['basisvorming', 'specifiek gedeelte', 'vrije ruimte', 'totaal'];
  const gesorteerdeCategorieen = Object.keys(perCategorie).sort((a, b) => {
    const indexA = categorieVolgorde.indexOf(a.toLowerCase());
    const indexB = categorieVolgorde.indexOf(b.toLowerCase());
    return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
  });

  // Bouw tabelinhoud per categorie
  gesorteerdeCategorieen.forEach(categorie => {
    tableContent += buildCategorieRijen(categorie, perCategorie[categorie], klasCodes);
  });

  // Voeg totaalrij toe als die nog niet bestaat uit de categorieën
  if (!perCategorie['totaal'] && !perCategorie['Totaal']) {
    tableContent += buildTotaalRij(klasCodes, totalen);
  }

  // Voeg stageweken rij toe indien beschikbaar
  const stageRow = buildStageRow(klasCodes);
  if (stageRow) {
    tableContent += stageRow;
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
        ${tableContent}
      </tbody>
    </table>
  `;
}

/**
 * Bouwt tabelrijen voor een specifieke categorie
 * @param {string} categorie - Naam van de categorie
 * @param {Array} vakken - Array van vakken in deze categorie
 * @param {Array} klasCodes - Gefilterde klascodes
 * @returns {string} HTML voor de tabelrijen van deze categorie
 */
function buildCategorieRijen(categorie, vakken, klasCodes) {
  let html = '';
  
  // Voeg een rij toe met de categorienaam als header (behalve voor 'totaal')
  const isHeader = categorie.toLowerCase() !== 'totaal';
  
  if (isHeader) {
    html += `
      <tr class="categorie-header">
        <th colspan="${klasCodes.length + 1}">${categorie.toUpperCase()}</th>
      </tr>
    `;
  }
  
  // Sorteer de vakken binnen elke categorie
  // Headers (type: 'header') komen eerst, dan normale vakken, dan subvakken
  const gesorteerdeVakken = vakken.sort((a, b) => {
    // Headers eerst
    if (a.type === 'header' && b.type !== 'header') return -1;
    if (a.type !== 'header' && b.type === 'header') return 1;
    
    // Dan subvakken
    if (a.subvak !== b.subvak) return a.subvak ? 1 : -1;
    
    // Anders alfabetisch
    return a.vak.localeCompare(b.vak);
  });
  
  // Bouw rijen voor alle vakken
  gesorteerdeVakken.forEach(vak => {
    // Bepaal opmaak op basis van vaktype
    let vakClass = '';
    if (vak.type === 'header') vakClass = 'vak-header';
    else if (vak.subvak) vakClass = 'subvak';
    else if (categorie.toLowerCase() === 'totaal') vakClass = 'totaal-row';
    
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
  
  return html;
}

/**
 * Bouwt een totaalrij voor de tabel
 * @param {Array} klasCodes - Gefilterde klascodes
 * @param {Object} totalen - Object met totale uren per klascode
 * @returns {string} HTML voor de totaalrij
 */
function buildTotaalRij(klasCodes, totalen) {
  return `
    <tr class="totaal-row">
      <td>Lestijden per week</td>
      ${klasCodes.map(code => `<td>${totalen[code]}</td>`).join('')}
    </tr>
  `;
}

/**
 * Bouwt een rij voor stageweken als die beschikbaar zijn
 * @param {Array} klasCodes - Gefilterde klascodes
 * @returns {string|null} HTML voor de stageweken rij of null
 */
function buildStageRow(klasCodes) {
  // Controleer of er überhaupt stage weken zijn in enige klas
  const heeftStageWeken = klasCodes.some(code => {
    // Zoek klas bij de code
    const klas = window.LessentabellenApp.klassen.find(k => k.klascode === code);
    // Controleer of er stage_weken zijn gedefinieerd
    return klas && klas.stage_weken !== undefined && klas.stage_weken !== null;
  });

  if (heeftStageWeken) {
    return `
      <tr class="stage-row">
        <td>Stage weken</td>
        ${klasCodes.map(code => {
          // Zoek de juiste klas-info voor deze klascode
          const klas = window.LessentabellenApp.klassen.find(k => k.klascode === code);
          // Haal stageweken op indien beschikbaar
          const stageWeken = (klas && klas.stage_weken !== undefined && klas.stage_weken !== null) 
            ? klas.stage_weken 
            : '';
          return `<td>${stageWeken}</td>`;
        }).join('')}
      </tr>
    `;
  }
  
  return null;
}
