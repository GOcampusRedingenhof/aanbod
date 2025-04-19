// table-generator.js
// Module voor het genereren van lessentabellen uit lesgegevens, geoptimaliseerd voor zowel scherm als afdrukken

/**
 * Genereert een HTML tabel met lesgegevens voor een specifieke richting
 * @param {Array} lessen - Alle lesitems van alle klassen in de richting
 * @param {Object} hoofdKlas - Het klasobject van de geselecteerde klas
 * @returns {string} HTML voor de lessentabel
 */
export function generateLessentabel(lessen, hoofdKlas) {
  try {
    // Filter alleen op de geselecteerde klascode en graad
    const hoofdKlasLessen = lessen.filter(les => les.klascode === hoofdKlas.klascode);
    
    // Verzamel alle unieke klascodes in de lessentabel
    const alleKlasCodes = [...new Set(lessen.map(les => les.klascode))];
    
    // Filter klascodes die bij dezelfde richtingcode en graad horen
    const klasCodes = alleKlasCodes.filter(klascode => {
      // Zoek de klas in de globale LessentabellenApp
      if (window.LessentabellenApp && window.LessentabellenApp.klassen) {
        const klas = window.LessentabellenApp.klassen.find(k => k.klascode === klascode);
        return klas && 
               klas.richtingcode === hoofdKlas.richtingcode && 
               klas.graad === hoofdKlas.graad;
      }
      
      // Als LessentabellenApp niet beschikbaar is, gebruik een eenvoudige heuristiek
      // Klassen in dezelfde graad hebben vaak dezelfde eerste cijfer
      return klascode.charAt(0) === hoofdKlas.klascode.charAt(0);
    }).sort();
    
    if (klasCodes.length === 0) {
      return '<p>Geen lessentabel beschikbaar voor deze richting.</p>';
    }
    
    // Maak tabelinhoud
    return buildTabelMetGecombineerdeCategorieen(hoofdKlasLessen, lessen, klasCodes, hoofdKlas);
  } catch (error) {
    console.error('Fout bij genereren van lessentabel:', error);
    return `<div class="error-message">Er is een fout opgetreden bij het laden van de lessentabel. ${error.message}</div>`;
  }
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
    <table class="lessentabel print-optimized" cellspacing="0" cellpadding="4">
      <thead>
        <tr>
          <th scope="col" style="width:40%;">Vak</th>
          ${klasCodes.map(code => `<th scope="col" style="width:${60/klasCodes.length}%;">${code}</th>`).join('')}
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
    
    // Groepeer vakken door het 'subvak' attribuut
    const gegroepeerdeVakken = groeperenEnSorterenVakken(vakken);
    
    gegroepeerdeVakken.forEach(vak => {
      // Bepaal CSS class voor deze rij
      let rowClass = '';
      if (vak.type === 'header') rowClass = 'vak-header';
      else if (vak.subvak) rowClass = 'subvak';
      else if (categorieNaam.toLowerCase() === 'totaal') rowClass = 'totaal-row';
      
      // Begin rij
      tabelHTML += `<tr class="${rowClass}">`;
      
      // Vaknaam kolom - voeg prefix toe voor subvakken voor betere visualisatie
      let displayNaam = vak.vak;
      if (vak.subvak) {
        // Gebruik Unicode bullet en indent voor subvakken
        displayNaam = `<span class="subvak-marker">•&nbsp;</span>${displayNaam}`;
      }
      
      tabelHTML += `<td>${displayNaam}</td>`;
      
      // Uren per klas
      klasCodes.forEach(klasCode => {
        const uren = vak.uren[klasCode] || '-';
        tabelHTML += `<td>${uren}</td>`;
      });
      
      // Einde rij
      tabelHTML += `</tr>`;
    });
  });
  
  // Voeg totaalrij toe als die nog niet bestaat
  if (!categorieKeys.find(cat => cat.toLowerCase() === 'totaal')) {
    tabelHTML += `
      <tr class="totaal-row">
        <td>Lestijden per week</td>
        ${klasCodes.map(code => `<td>${totalen[code]}</td>`).join('')}
      </tr>
    `;
  }
  
  // Voeg stageweken toe indien van toepassing
  const stageRow = buildStageRow(klasCodes, hoofdKlas);
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
 * Groepeert en sorteert vakken zodat subvakken onder hoofdvakken komen
 * @param {Array} vakken - Array van vakobjecten
 * @returns {Array} Gesorteerde array van vakken
 */
function groeperenEnSorterenVakken(vakken) {
  // Sorteer eerst alle vakken alfabetisch
  const gesorteerdeVakken = [...vakken].sort((a, b) => {
    // Bij gelijke vaknaam sorteren op subvak (hoofdvak eerst)
    if (a.vak === b.vak) {
      return a.subvak ? 1 : -1;
    }
    return a.vak.localeCompare(b.vak);
  });
  
  // Sorteer nu specifiek zodat subvakken direct na hun hoofdvakken komen
  const resultaat = [];
  const subvakken = new Map(); // Map van hoofdvak naar bijbehorende subvakken
  
  // Verzamel eerst alle subvakken per hoofdvak
  gesorteerdeVakken.forEach(vak => {
    if (vak.subvak) {
      // Zoek bijbehorend hoofdvak (als die bestaat)
      // We nemen aan dat subvakken onder hoofdvakken vallen met dezelfde naam
      // of voordat ze met een punt beginnen (bijv. "Elektriciteit" en ".Basis")
      const hoofdvakNaam = vak.vak.startsWith('.') ? 
        vak.vak.substring(1).split(' ')[0] : vak.vak;
      
      if (!subvakken.has(hoofdvakNaam)) {
        subvakken.set(hoofdvakNaam, []);
      }
      subvakken.get(hoofdvakNaam).push(vak);
    } else {
      resultaat.push(vak);
    }
  });
  
  // Voeg nu subvakken direct na hun hoofdvakken toe
  for (let i = 0; i < resultaat.length; i++) {
    const hoofdvak = resultaat[i];
    const bijbehorendeSubvakken = subvakken.get(hoofdvak.vak) || [];
    
    if (bijbehorendeSubvakken.length > 0) {
      // Voeg subvakken toe direct na het hoofdvak
      resultaat.splice(i + 1, 0, ...bijbehorendeSubvakken);
      // Update index om over de toegevoegde subvakken heen te springen
      i += bijbehorendeSubvakken.length;
    }
  }
  
  // Voeg eventueel overgebleven subvakken (zonder bijbehorend hoofdvak) toe
  subvakken.forEach((subvakkenLijst, hoofdvakNaam) => {
    // Controleer of er al een hoofdvak met deze naam is
    const hoofdvakBestaat = resultaat.some(vak => vak.vak === hoofdvakNaam);
    
    if (!hoofdvakBestaat) {
      resultaat.push(...subvakkenLijst);
    }
  });
  
  return resultaat;
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
 * @param {Object} hoofdKlas - Het hoofdklas object voor deze lessentabel
 * @returns {string|null} HTML voor de stageweken rij of null
 */
function buildStageRow(klasCodes, hoofdKlas) {
  try {
    // Check of er klassen zijn met stage weken
    const heeftStageWeken = klasCodes.some(code => {
      if (window.LessentabellenApp && window.LessentabellenApp.klassen) {
        const klas = window.LessentabellenApp.klassen.find(k => k.klascode === code);
        return klas && klas.stage_weken !== undefined && klas.stage_weken !== null && klas.stage_weken !== '';
      }
      return code === hoofdKlas.klascode && hoofdKlas.stage_weken;
    });

    if (!heeftStageWeken) {
      return null;
    }

    return `
      <tr class="stage-row">
        <td>Stage weken</td>
        ${klasCodes.map(code => {
          // Probeer stage weken te vinden in de juiste klas
          let stageWeken = '-';
          
          if (window.LessentabellenApp && window.LessentabellenApp.klassen) {
            const klas = window.LessentabellenApp.klassen.find(k => k.klascode === code);
            if (klas && klas.stage_weken !== undefined && klas.stage_weken !== null && klas.stage_weken !== '') {
              stageWeken = klas.stage_weken;
            }
          } else if (code === hoofdKlas.klascode && hoofdKlas.stage_weken) {
            stageWeken = hoofdKlas.stage_weken;
          }
          
          return `<td>${stageWeken}</td>`;
        }).join('')}
      </tr>
    `;
  } catch (error) {
    console.warn('Fout bij genereren stage rij:', error);
    return null;
  }
}
