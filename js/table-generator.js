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
  // Verzamel alle categorieën in oorspronkelijke volgorde
  const categorieën = [];
  const categorieIndex = {};
  
  // Loop door hoofdklaslessen om categorieën in originele volgorde te verzamelen
  hoofdKlasLessen.forEach(les => {
    const cat = les.categorie || 'onbekend';
    if (!categorieIndex[cat]) {
      categorieIndex[cat] = categorieën.length;
      categorieën.push(cat);
    }
  });
  
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
  
  // Voor elke categorie in de oorspronkelijke volgorde
  categorieën.forEach(categorie => {
    // Voeg categorie header toe (behalve voor totaal)
    if (categorie.toLowerCase() !== 'totaal') {
      tabelHTML += `
        <tr class="categorie-header">
          <th colspan="${klasCodes.length + 1}" scope="colgroup">${categorie.toUpperCase()}</th>
        </tr>
      `;
    }
    
    // Filter lessen van deze categorie in originele volgorde,
    // zonder aparte groepering voor headers/normale vakken/subvakken
    const lessenInCategorie = hoofdKlasLessen.filter(les => les.categorie === categorie);
    
    // Verzamel unieke vakken in deze categorie
    const vakkenInCategorie = [];
    const vakkenIndex = {};
    
    // Bewaar alle vakken in oorspronkelijke volgorde uit CSV
    lessenInCategorie.forEach(les => {
      if (vakkenIndex[les.vak] === undefined) {
        vakkenIndex[les.vak] = vakkenInCategorie.length;
        vakkenInCategorie.push({
          vak: les.vak,
          type: les.type,
          subvak: les.subvak === true || les.subvak === 'WAAR',
          uren: {}
        });
      }
    });
    
    // Vul uren in voor alle klascodes
    klasCodes.forEach(code => {
      // Vind alle lessen voor deze klascode en categorie
      const lessenVoorKlasEnCategorie = alleLessen.filter(
        les => les.klascode === code && les.categorie === categorie
      );
      
      // Vul uren in voor de juiste vakken
      lessenVoorKlasEnCategorie.forEach(les => {
        const index = vakkenIndex[les.vak];
        if (index !== undefined) {
          vakkenInCategorie[index].uren[code] = les.uren;
        }
      });
    });
    
    // Genereer rijen voor alle vakken
    vakkenInCategorie.forEach(vak => {
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
  if (!categorieën.includes('totaal') && !categorieën.includes('Totaal')) {
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
