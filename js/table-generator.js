// table-generator.js
// Module voor het genereren van lessentabellen uit lesgegevens, geoptimaliseerd voor zowel scherm als afdrukken

/**
 * Genereert een HTML tabel met lesgegevens voor een specifieke richting
 * @param {Array} lessen - Alle lesitems van alle klassen in de richting
 * @param {Object} hoofdKlas - Het klasobject van de geselecteerde klas
 * @returns {string} HTML voor de lessentabel
 */
export function generateLessentabel(lessen, hoofdKlas) {
  // Vind alleen de unieke klascodes die we willen weergeven
  // Dit zijn klassen uit dezelfde richting en graad als de hoofdklas
  const klasCodes = [...new Set(lessen
    .filter(les => {
      const klas = window.LessentabellenApp.klassen.find(k => k.klascode === les.klascode);
      return klas && klas.graad === hoofdKlas.graad && klas.richtingcode === hoofdKlas.richtingcode;
    })
    .map(les => les.klascode))]
    .sort(); // Sorteer klascode op naam
  
  if (klasCodes.length === 0) {
    return '<p>Geen lessentabel beschikbaar voor deze richting.</p>';
  }
  
  // Filter de lessen zodat we alleen de relevante lessen behouden
  const relevanteLessen = lessen.filter(les => klasCodes.includes(les.klascode));
  
  // Groepeer lessen per categorie, zonder duplicaten
  const lessenPerCategorie = groepeerUniekeCategorieen(relevanteLessen, klasCodes, hoofdKlas);
  
  // Bereken de totalen per klas
  const totalen = berekenTotalen(relevanteLessen, klasCodes);
  
  // Genereer de HTML voor de tabel
  return buildTabelHTML(lessenPerCategorie, klasCodes, totalen);
}

/**
 * Groepeert lessen per unieke categorie zonder duplicaten
 * @param {Array} lessen - Alle relevante lessen
 * @param {Array} klasCodes - Array van relevante klascode
 * @param {Object} hoofdKlas - Het klasobject van de geselecteerde klas
 * @returns {Map} Map van categorieën naar hun vakken
 */
function groepeerUniekeCategorieen(lessen, klasCodes, hoofdKlas) {
  // Gebruik een Map om categorieën bij te houden
  const categorieenMap = new Map();
  
  // Bepaal de volgorde van categorieën uit de hoofdklas lessen
  const hoofdKlasLessen = lessen.filter(les => les.klascode === hoofdKlas.klascode);
  const categorieVolgorde = [];
  
  // Verzamel unieke categorieën in de volgorde van de hoofdklas
  hoofdKlasLessen.forEach(les => {
    const cat = les.categorie || 'onbekend';
    if (!categorieVolgorde.includes(cat)) {
      categorieVolgorde.push(cat);
    }
  });
  
  // Verwerk nu alle vakken per categorie (behoudt volgorde uit CSV)
  categorieVolgorde.forEach(categorie => {
    // Verzamel alle vakken voor deze categorie uit alle klasCodes
    const alleVakkenInCategorie = lessen.filter(les => 
      les.categorie === categorie && 
      les.klascode === hoofdKlas.klascode // Gebruik alleen de hoofdklas voor de structuur
    );
    
    // Verzamel unieke vakken op basis van de vak naam
    const uniqueVakken = [];
    const uniqueVakNamen = new Set();
    
    alleVakkenInCategorie.forEach(les => {
      // Als we dit vak nog niet hebben toegevoegd, doe dat nu
      if (!uniqueVakNamen.has(les.vak)) {
        uniqueVakNamen.add(les.vak);
        
        // Voeg vak info toe aan de lijst
        uniqueVakken.push({
          vak: les.vak,
          type: les.type,
          subvak: les.subvak === true || les.subvak === 'WAAR',
          uren: {} // Dit wordt later ingevuld
        });
      }
    });
    
    // Sla deze categorie en zijn unieke vakken op
    categorieenMap.set(categorie, uniqueVakken);
  });
  
  // Vul nu de uren in voor elk vak per klas
  klasCodes.forEach(klasCode => {
    const lessenVoorKlas = lessen.filter(les => les.klascode === klasCode);
    
    // Loop door alle categorieën en vakken
    categorieenMap.forEach((vakken, categorie) => {
      vakken.forEach(vak => {
        // Zoek het overeenkomstige les-item voor deze klas en dit vak
        const lesItem = lessenVoorKlas.find(les => 
          les.categorie === categorie && 
          les.vak === vak.vak
        );
        
        // Als gevonden, sla de uren op
        if (lesItem) {
          vak.uren[klasCode] = lesItem.uren;
        }
      });
    });
  });
  
  return categorieenMap;
}

/**
 * Bouwt de HTML voor de lessentabel
 * @param {Map} categorieenMap - Map van categorieën naar hun vakken
 * @param {Array} klasCodes - Array van relevante klascode
 * @param {Object} totalen - Object met totalen per klascode
 * @returns {string} HTML voor de tabel
 */
function buildTabelHTML(categorieenMap, klasCodes, totalen) {
  // Begin met de basisstructuur van de tabel
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
  
  // Voeg rijen toe voor elke categorie en diens vakken
  categorieenMap.forEach((vakken, categorie) => {
    // Voeg categorie header toe (behalve voor totaal)
    if (categorie.toLowerCase() !== 'totaal') {
      tabelHTML += `
        <tr class="categorie-header">
          <th colspan="${klasCodes.length + 1}" scope="colgroup">${categorie.toUpperCase()}</th>
        </tr>
      `;
    }
    
    // Voeg rijen toe voor elk vak in deze categorie
    vakken.forEach(vak => {
      // Bepaal CSS class voor deze rij
      let rowClass = '';
      if (vak.type === 'header') rowClass = 'vak-header';
      else if (vak.subvak) rowClass = 'subvak';
      else if (categorie.toLowerCase() === 'totaal') rowClass = 'totaal-row';
      
      // Begin rij
      tabelHTML += `<tr class="${rowClass}">`;
      
      // Vaknaam kolom
      tabelHTML += `<td>${vak.vak}</td>`;
      
      // Uren per klas
      klasCodes.forEach(klasCode => {
        const uren = vak.uren[klasCode] || '';
        tabelHTML += `<td>${uren}</td>`;
      });
      
      // Einde rij
      tabelHTML += `</tr>`;
    });
  });
  
  // Voeg totaalrij toe als die nog niet bestaat
  if (!categorieenMap.has('totaal') && !categorieenMap.has('Totaal')) {
    tabelHTML += `
      <tr class="totaal-row" style="font-weight: bold; border-top: 2px solid #000;">
        <td>Lestijden per week</td>
        ${klasCodes.map(code => `<td>${totalen[code]}</td>`).join('')}
      </tr>
    `;
  }
  
  // Voeg stageweken toe indien van toepassing
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
