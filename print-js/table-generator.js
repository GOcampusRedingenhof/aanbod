/**
 * table-generator.js
 * Module voor het genereren van lessentabellen uit de beschikbare data
 */

/**
 * Genereert een complete HTML-tabel met lesgegevens voor meerdere klassen in dezelfde richting
 * @param {Array} klasDataObjecten - Array met objecten die klas, lessen en voetnoten bevatten
 * @returns {string} - HTML-string met de gegenereerde tabel
 */
function generateGraadRichtingLessentabel(klasDataObjecten) {
  // Controleer of er klassen zijn
  if (!klasDataObjecten || klasDataObjecten.length === 0) {
    return '<div class="error-message">Geen lesgegevens gevonden.</div>';
  }
  
  // Verzamel unieke klascodes voor kolomkoppen
  const klasCodes = klasDataObjecten.map(obj => obj.klas ? obj.klas.klascode : '').filter(Boolean);
  
  // Begin met het genereren van de lessentabel
  let html = `<table class="lessentabel multi-column">
    <thead>
      <tr>
        <th>Vak</th>
        ${klasCodes.map(code => `<th>${code}</th>`).join('')}
      </tr>
    </thead>
    <tbody>`;
  
  // Verzamel alle unieke vakken over alle klassen
  const alleVakken = new Set();
  const vakMap = {};
  
  // Verzamel vakken per klas
  klasDataObjecten.forEach((obj, index) => {
    if (!obj.lessen) return;
    
    obj.lessen.forEach(les => {
      alleVakken.add(les.vak);
      
      // Maak mapping van vak naar categorie
      if (!vakMap[les.vak]) {
        vakMap[les.vak] = {
          categorie: les.categorie || 'Onbekend',
          subvak: les.subvak === true || les.subvak === 'WAAR',
          urenPerKlas: {}
        };
      }
      
      // Sla uren op per klascode
      if (obj.klas && obj.klas.klascode) {
        vakMap[les.vak].urenPerKlas[obj.klas.klascode] = les.uren || '-';
      }
    });
  });
  
  // Groepeer vakken per categorie
  const categorieën = {};
  
  Object.keys(vakMap).forEach(vak => {
    const categorie = vakMap[vak].categorie;
    if (!categorieën[categorie]) {
      categorieën[categorie] = [];
    }
    
    categorieën[categorie].push({
      vak: vak,
      subvak: vakMap[vak].subvak,
      urenPerKlas: vakMap[vak].urenPerKlas
    });
  });
  
  // Sorteer categorieën in logische volgorde (basisvorming eerst)
  const volgorde = ['basisvorming', 'specifiek gedeelte', 'vrije ruimte'];
  const sortedCategories = Object.keys(categorieën).sort((a, b) => {
    const indexA = volgorde.indexOf(a.toLowerCase());
    const indexB = volgorde.indexOf(b.toLowerCase());
    return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
  });
  
  // Bereken totaal lesuren per klas
  const totaalUrenPerKlas = {};
  klasCodes.forEach(code => {
    totaalUrenPerKlas[code] = 0;
  });
  
  // Loop door elke categorie
  sortedCategories.forEach(categorie => {
    html += `
      <tr class="categorie-header">
        <th colspan="${klasCodes.length + 1}">${categorie.toUpperCase()}</th>
      </tr>
    `;
    
    // Sorteer vakken alfabetisch binnen een categorie
    const vakken = categorieën[categorie].sort((a, b) => a.vak.localeCompare(b.vak));
    
    // Groepeer vakken en subvakken
    const gegroepeerdeVakken = groepeerVakkenEnSubvakken(vakken);
    
    // Voeg vakken en subvakken toe aan de tabel
    gegroepeerdeVakken.forEach(vak => {
      const isSubvak = vak.subvak;
      const rowClass = isSubvak ? 'subvak' : '';
      
      // Voeg het vak toe aan de tabel
      html += `<tr class="${rowClass}">
        <td>${vak.vak}</td>`;
      
      // Voeg kolommen toe voor elke klas
      klasCodes.forEach(code => {
        const uren = vak.urenPerKlas[code] || '-';
        html += `<td>${uren}</td>`;
        
        // Tel uren op voor totaal (alleen als het een getal is)
        if (uren && !isNaN(parseFloat(String(uren).replace(',', '.')))) {
          totaalUrenPerKlas[code] += parseFloat(String(uren).replace(',', '.'));
        }
      });
      
      html += `</tr>`;
    });
  });
  
  // Rond totalen af op 1 decimaal
  Object.keys(totaalUrenPerKlas).forEach(code => {
    totaalUrenPerKlas[code] = Math.round(totaalUrenPerKlas[code] * 10) / 10;
  });
  
  // Voeg totaalrij toe
  html += `
    <tr class="totaal-row">
      <td>Lestijden per week</td>
  `;
  
  klasCodes.forEach(code => {
    html += `<td>${totaalUrenPerKlas[code]}</td>`;
  });
  
  html += `</tr>`;
  
  // Voeg stageweken toe indien aanwezig
  const stageInfo = {};
  let heeftStage = false;
  
  klasDataObjecten.forEach(obj => {
    if (obj.klas && obj.klas.klascode && obj.klas.stage_weken && obj.klas.stage_weken.trim() !== '') {
      stageInfo[obj.klas.klascode] = obj.klas.stage_weken;
      heeftStage = true;
    }
  });
  
  if (heeftStage) {
    html += `
      <tr class="stage-row">
        <td>Stage weken</td>
    `;
    
    klasCodes.forEach(code => {
      html += `<td>${stageInfo[code] || '-'}</td>`;
    });
    
    html += `</tr>`;
  }
  
  // Sluit de tabel af
  html += `
      </tbody>
    </table>
  `;
  
  // Voeg voetnoten toe indien aanwezig
  const alleVoetnoten = [];
  klasDataObjecten.forEach(obj => {
    if (obj.voetnoten && obj.voetnoten.length > 0) {
      obj.voetnoten.forEach(voetnoot => {
        if (voetnoot.tekst && voetnoot.tekst.trim() !== '') {
          alleVoetnoten.push(`${obj.klas.klascode}: ${voetnoot.tekst}`);
        }
      });
    }
  });
  
  if (alleVoetnoten.length > 0) {
    html += generateCombinedFootnotes(alleVoetnoten);
  }
  
  return html;
}

/**
 * Groepeert vakken en subvakken zodat subvakken onder hun hoofdvakken verschijnen
 * @param {Array} vakken - Array met vakitems
 * @returns {Array} - Gesorteerde array met vakken
 */
function groepeerVakkenEnSubvakken(vakken) {
  // Maak kopie van de array om de originele niet te wijzigen
  const result = [...vakken];
  
  // Sorteer eerst alfabetisch op vaknaam
  result.sort((a, b) => a.vak.localeCompare(b.vak));
  
  // Sorteer daarna zodat subvakken onder hoofdvakken komen
  result.sort((a, b) => {
    const aIsSubvak = a.subvak;
    const bIsSubvak = b.subvak;
    
    // Als a en b beide subvakken zijn of beide hoofdvakken, behoud alfabetische volgorde
    if (aIsSubvak === bIsSubvak) {
      return 0;
    }
    
    // Als a een subvak is en b niet, plaats a na b
    if (aIsSubvak && !bIsSubvak) {
      return 1;
    }
    
    // Als b een subvak is en a niet, plaats a voor b
    return -1;
  });
  
  return result;
}

/**
 * Genereert HTML voor voetnoten
 * @param {Array} voetnoten - Array met voetnootitems
 * @returns {string} - HTML-string met voetnoten
 */
function generateFootnotes(voetnoten) {
  // Filter lege voetnoten
  const filteredVoetnoten = voetnoten.filter(f => f.tekst && f.tekst.trim().length > 0);
  
  if (filteredVoetnoten.length === 0) {
    return '';
  }
  
  let html = '<div class="footnotes"><h3>Voetnoten</h3><ul>';
  
  filteredVoetnoten.forEach(voetnoot => {
    html += `<li>${voetnoot.tekst}</li>`;
  });
  
  html += '</ul></div>';
  
  return html;
}

/**
 * Genereert HTML voor gecombineerde voetnoten van meerdere klassen
 * @param {Array} voetnoten - Array met voetnoot strings
 * @returns {string} - HTML-string met voetnoten
 */
function generateCombinedFootnotes(voetnoten) {
  if (!voetnoten || voetnoten.length === 0) {
    return '';
  }
  
  // Verwijder duplicaten
  const uniqueVoetnoten = [...new Set(voetnoten)];
  
  let html = '<div class="footnotes"><h3>Voetnoten</h3><ul>';
  
  uniqueVoetnoten.forEach(voetnoot => {
    html += `<li>${voetnoot}</li>`;
  });
  
  html += '</ul></div>';
  
  return html;
}

// Maak de functies globaal beschikbaar 
window.TableGenerator = {
  generateGraadRichtingLessentabel,
  generateFootnotes
};
