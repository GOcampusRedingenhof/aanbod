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
      // Controleer of window.LessentabellenApp bestaat
      if (!window.LessentabellenApp || !window.LessentabellenApp.klassen) {
        console.error('LessentabellenApp of klassen niet beschikbaar!');
        return false;
      }
      
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
  return buildTabelMetGecombineerdeCategorieen(hoofdKlasLessen, lessen, klasCodes, hoofdKlas);
}

/**
 * Bouwt een complete lessentabel met alle vakken gegroepeerd per categorie
 * en waarbij iedere categorie slechts één keer voorkomt
 * @param {Array} hoofdKlasLessen - Lessen van de hoofdklas in originele volgorde
 * @param {Array} alleLessen - Alle lessen voor alle relevante klassen
 * @param {Array} klasCodes - Array van relevante klascode
 * @param {Object} hoofdKlas - Het klasobject van de geselecteerde klas 
 * @returns {string} HTML voor de lessentabel
 */
function buildTabelMetGecombineerdeCategorieen(hoofdKlasLessen, alleLessen, klasCodes, hoofdKlas) {
  // Object om gecombineerde vakken per categorie op te slaan
  const categorieMap = new Map();
  
  // Set om bij te houden welke vak-categorie combinaties we al hebben gezien
  const verwerkteCombinaties = new Set();
  
  // Loop door hoofdklaslessen en bouw categorieën op
  hoofdKlasLessen.forEach(les => {
    const categorieNaam = les.categorie || 'onbekend';
    const vakNaam = les.vak;
    
    // Unieke identificatie voor deze vak-categorie combinatie
    const comboKey = `${categorieNaam}:${vakNaam}`;
    
    // Als we deze combinatie al hebben gezien, sla over
    if (verwerkteCombinaties.has(comboKey)) {
      return;
    }
    
    // Markeer deze combinatie als verwerkt
    verwerkteCombinaties.add(comboKey);
    
    // Als deze categorie nog niet bestaat, maak het aan
    if (!categorieMap.has(categorieNaam)) {
      categorieMap.set(categorieNaam, []);
    }
    
    // Voeg het vak toe aan de lijst voor deze categorie
    categorieMap.get(categorieNaam).push({
      vak: vakNaam,
      type: les.type,
      subvak: les.subvak === true || les.subvak === 'WAAR',
      uren: {} // Dit wordt later ingevuld
    });
  });
  
  // Vul de uren in per klascode voor elk vak
  klasCodes.forEach(klasCode => {
    const lessenVoorKlas = alleLessen.filter(les => les.klascode === klasCode);
    
    lessenVoorKlas.forEach(les => {
      const categorieNaam = les.categorie || 'onbekend';
      const vakNaam = les.vak;
      
      // Zoek de categorie en het vak
      if (categorieMap.has(categorieNaam)) {
        const vakken = categorieMap.get(categorieNaam);
        const vak = vakken.find(v => v.vak === vakNaam);
        
        if (vak) {
          vak.uren[klasCode] = les.uren;
        }
      }
    });
  });
  
  // Begin met het bouwen van de HTML
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
  
  // Bereken totalen voor onderaan de tabel
  const totalen = berekenTotalen(alleLessen, klasCodes);
  
  // Sorteer de categorieën in een logische volgorde
  const categorieVolgorde = ['basisvorming', 'specifiek gedeelte', 'vrije ruimte', 'totaal'];
  
  // Bepaal volgorde van categorieën
  const categorieKeys = Array.from(categorieMap.keys()).sort((a, b) => {
    const indexA = categorieVolgorde.indexOf(a.toLowerCase());
    const indexB = categorieVolgorde.indexOf(b.toLowerCase());
    return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
  });
  
  // Genereer tabelrijen voor elke categorie
  categorieKeys.forEach(categorieNaam => {
    // Voeg categorie header toe, behalve voor totaal
    if (categorieNaam.toLowerCase() !== 'totaal') {
      tabelHTML += `
        <tr class="categorie-header">
          <th colspan="${klasCodes.length + 1}" scope="colgroup">${categorieNaam.toUpperCase()}</th>
        </tr>
      `;
    }
    
    // Voeg alle vakken toe voor deze categorie
    const vakken = categorieMap.get(categorieNaam);
    
    vakken.forEach(vak => {
      // Bepaal CSS class voor deze rij
      let rowClass = '';
      if (vak.type === 'header') rowClass = 'vak-header';
      else if (vak.subvak) rowClass = 'subvak';
      else if (categorieNaam.toLowerCase() === 'totaal') rowClass = 'totaal-row';
      
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
  if (!categorieKeys.find(cat => cat.toLowerCase() === 'totaal')) {
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
    // Controleer of window.LessentabellenApp bestaat
    if (!window.LessentabellenApp || !window.LessentabellenApp.klassen) {
      console.error('LessentabellenApp of klassen niet beschikbaar voor stage check!');
      return false;
    }
    
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
          // Controleer of window.LessentabellenApp bestaat
          if (!window.LessentabellenApp || !window.LessentabellenApp.klassen) {
            console.error('LessentabellenApp of klassen niet beschikbaar voor stage data!');
            return '<td></td>';
          }
          
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
