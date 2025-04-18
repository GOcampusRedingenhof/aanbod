// table-generator.js
// Module voor het genereren van lessentabellen uit lesgegevens, geoptimaliseerd voor zowel scherm als afdrukken

/**
 * Genereert een HTML tabel met lesgegevens voor een specifieke richting
 * @param {Array} lessen - Alle lesitems van alle klassen in de richting
 * @param {Object} hoofdKlas - Het klasobject van de geselecteerde klas
 * @returns {string} HTML voor de lessentabel
 */
export function generateLessentabel(lessen, hoofdKlas) {
  // Filter alleen op de geselecteerde klascode en graad
  const hoofdKlasLessen = lessen.filter(les => les.klascode === hoofdKlas.klascode);
  
  // Vind de unieke klascodes met dezelfde richtingcode
  const klasCodes = [...new Set(lessen
    .filter(les => {
      // Zoek de klas info voor deze les
      const klas = window.LessentabellenApp.klassen.find(k => k.klascode === les.klascode);
      // Behoud alleen lessen van klassen met dezelfde graad als hoofdklas
      return klas && klas.graad === hoofdKlas.graad;
    })
    .map(les => les.klascode))]
    .sort(); // Sorteer klascode alleen op naam
  
  if (klasCodes.length === 0) {
    return '<p>Geen lessentabel beschikbaar voor deze richting.</p>';
  }
  
  // Maak tabelinhoud
  return buildTabelMetOrigineleVolgorde(hoofdKlasLessen, lessen, klasCodes, hoofdKlas);
}

/**
 * Bouwt een complete lessentabel met behoud van de oorspronkelijke volgorde
 * @param {Array} hoofdKlasLessen - Lessen van de hoofdklas in originele volgorde
 * @param {Array} alleLessen - Alle lessen voor alle relevante klassen
 * @param {Array} klasCodes - Array van relevante klascode
 * @param {Object} hoofdKlas - Het klasobject van de geselecteerde klas
 * @returns {string} HTML voor de lessentabel
 */
function buildTabelMetOrigineleVolgorde(hoofdKlasLessen, alleLessen, klasCodes, hoofdKlas) {
  // Bouw de HTML voor de tabel
  let tabelHTML = `
    <table class="lessentabel" border="1" cellspacing="0" cellpadding="4">
      <thead>
        <tr>
          <th scope="col" style="width:45%;">Vak</th>
          ${klasCodes.map(code => `<th scope="col">${code}</th>`).join('')}
        </tr>
      </thead>
      <tbody>
  `;
  
  // Bereken totalen alvast
  const totalen = berekenTotalen(alleLessen, klasCodes);
  
  // Verzamel alle vakken, gegroepeerd per categorie (zonder duplicaten)
  const vakkenPerCategorie = {};
  
  // Eerste loop: verzamel alle unieke categorie/vak combinaties in originele volgorde
  hoofdKlasLessen.forEach(les => {
    const categorie = les.categorie || 'onbekend';
    
    if (!vakkenPerCategorie[categorie]) {
      vakkenPerCategorie[categorie] = {
        vakken: [],
        vakIndex: {}
      };
    }
    
    // Sla elk vak maar één keer op
    if (vakkenPerCategorie[categorie].vakIndex[les.vak] === undefined) {
      const index = vakkenPerCategorie[categorie].vakken.length;
      vakkenPerCategorie[categorie].vakIndex[les.vak] = index;
      
      vakkenPerCategorie[categorie].vakken.push({
        vak: les.vak,
        type: les.type,
        subvak: les.subvak === true || les.subvak === 'WAAR',
        uren: {}
      });
    }
  });
  
  // Tweede loop: vul uren in per klas per vak
  klasCodes.forEach(code => {
    const lessenVoorKlas = alleLessen.filter(les => les.klascode === code);
    
    lessenVoorKlas.forEach(les => {
      const categorie = les.categorie || 'onbekend';
      
      // Controleer of deze categorie en dit vak bestaan in onze structuur
      if (vakkenPerCategorie[categorie] && 
          vakkenPerCategorie[categorie].vakIndex[les.vak] !== undefined) {
        
        const vakIndex = vakkenPerCategorie[categorie].vakIndex[les.vak];
        vakkenPerCategorie[categorie].vakken[vakIndex].uren[code] = les.uren;
      }
    });
  });
  
  // Nu kunnen we de tabel opbouwen met unieke categorieën
  // Sorteer categorieën in logische volgorde
  const categorieVolgorde = ['basisvorming', 'specifiek gedeelte', 'vrije ruimte', 'totaal'];
  
  const gesorteerdeCategorieen = Object.keys(vakkenPerCategorie).sort((a, b) => {
    const indexA = categorieVolgorde.indexOf(a.toLowerCase());
    const indexB = categorieVolgorde.indexOf(b.toLowerCase());
    return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
  });
  
  // Bouw nu de tabel op per categorie
  gesorteerdeCategorieen.forEach(categorie => {
    // Voeg categorie header toe (behalve voor totaal)
    if (categorie.toLowerCase() !== 'totaal') {
      tabelHTML += `
        <tr class="categorie-header">
          <th colspan="${klasCodes.length + 1}" scope="colgroup">${categorie.toUpperCase()}</th>
        </tr>
      `;
    }
    
    // Voeg alle vakken toe in de oorspronkelijke volgorde
    vakkenPerCategorie[categorie].vakken.forEach(vak => {
      // CSS class voor deze rij
      let rowClass = '';
      if (vak.type === 'header') rowClass = 'vak-header';
      else if (vak.subvak) rowClass = 'subvak';
      else if (categorie.toLowerCase() === 'totaal') rowClass = 'totaal-row';
      
      // Begin rij
      tabelHTML += `<tr class="${rowClass}">`;
      
      // Vaknaam kolom
      tabelHTML += `<td>${vak.vak}</td>`;
      
      // Kolommen voor uren per klas
      klasCodes.forEach(code => {
        const uren = vak.uren[code] || '';
        tabelHTML += `<td>${uren}</td>`;
      });
      
      // Sluit rij
      tabelHTML += '</tr>';
    });
  });
  
  // Voeg totaalrij toe als die niet al bestond
  if (!gesorteerdeCategorieen.find(cat => cat.toLowerCase() === 'totaal')) {
    tabelHTML += `
      <tr class="totaal-row" style="font-weight: bold; border-top: 2px solid #000;">
        <td>Lestijden per week</td>
        ${klasCodes.map(code => `<td>${totalen[code]}</td>`).join('')}
      </tr>
    `;
  }
  
  // Voeg stageweken rij toe indien beschikbaar
  const stageRow = buildStageRow(klasCodes);
  if (stageRow) {
    tabelHTML += stageRow;
  }
  
  // Sluit de tabel
  tabelHTML += `
      </tbody>
    </table>
  `;
  
  return tabelHTML;
}

/**
 * Berekent totale lesuren per klascode
 * @param {Array} lessen - Alle lesitems
 * @param {Array} klasCodes - Array van klascode
 * @returns {Object} Object met totale uren per klascode
 */
function berekenTotalen(lessen, klasCodes) {
  const totalen = {};
  
  klasCodes.forEach(code => {
    totalen[code] = 0;
    
    // Filter lessen voor deze klas, exclusief totaalrijen
    const lessenVoorKlas = lessen.filter(les => 
      les.klascode === code && 
      les.categorie?.toLowerCase() !== 'totaal'
    );
    
    // Tel uren op
    lessenVoorKlas.forEach(les => {
      if (les.uren && !isNaN(parseFloat(les.uren.toString().replace(',', '.')))) {
        totalen[code] += parseFloat(les.uren.toString().replace(',', '.'));
      }
    });
    
    // Rond totalen af tot 1 decimaal voor nette weergave
    totalen[code] = Math.round(totalen[code] * 10) / 10;
  });
  
  return totalen;
}

/**
 * Bouwt een rij voor stageweken als die beschikbaar zijn
 * @param {Array} klasCodes - Array van klascode
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
      <tr class="stage-row" style="font-weight:bold; border-top: 1px solid #000;">
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
