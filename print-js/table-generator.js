/**
 * table-generator.js
 * Module voor het genereren van lessentabellen uit de beschikbare data
 */

/**
 * Genereert een complete HTML-tabel met lesgegevens
 * @param {Object} klas - Het klasobject waarvoor de tabel wordt gegenereerd
 * @param {Array} lessen - Array met lessen voor deze klas
 * @param {Array} voetnoten - Array met voetnoten voor deze klas
 * @returns {string} - HTML-string met de gegenereerde tabel
 */
function generateLessentabel(klas, lessen, voetnoten) {
  // Begin met het genereren van de lessentabel
  let html = `<table class="lessentabel">
    <thead>
      <tr>
        <th>Vak</th>
        <th>Uren</th>
      </tr>
    </thead>
    <tbody>`;
  
  // Groepeer lessen per categorie
  const categorieën = {};
  
  lessen.forEach(les => {
    const categorie = les.categorie || 'Onbekend';
    if (!categorieën[categorie]) {
      categorieën[categorie] = [];
    }
    categorieën[categorie].push(les);
  });
  
  // Sorteer categorieën in logische volgorde (basisvorming eerst)
  const volgorde = ['basisvorming', 'specifiek gedeelte', 'vrije ruimte'];
  const sortedCategories = Object.keys(categorieën).sort((a, b) => {
    const indexA = volgorde.indexOf(a.toLowerCase());
    const indexB = volgorde.indexOf(b.toLowerCase());
    return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
  });
  
  // Bereken totaal lesuren voor onderaan de tabel
  let totaalUren = 0;
  
  // Loop door elke categorie
  sortedCategories.forEach(categorie => {
    html += `
      <tr class="categorie-header">
        <th colspan="2">${categorie.toUpperCase()}</th>
      </tr>
    `;
    
    // Sorteer vakken alfabetisch binnen een categorie
    const vakken = categorieën[categorie].sort((a, b) => 
      a.vak.localeCompare(b.vak)
    );
    
    // Groepeer vakken en subvakken
    const gegroepeerdeVakken = groepeerVakkenEnSubvakken(vakken);
    
    // Voeg vakken en subvakken toe aan de tabel
    gegroepeerdeVakken.forEach(les => {
      // Bepaal of dit een subvak is
      const isSubvak = les.subvak === true || les.subvak === 'WAAR';
      const rowClass = isSubvak ? 'subvak' : '';
      
      // Voeg het vak toe aan de tabel
      html += `
        <tr class="${rowClass}">
          <td>${les.vak}</td>
          <td>${les.uren || '-'}</td>
        </tr>
      `;
      
      // Tel uren op voor het totaal (alleen als het een getal is)
      if (les.uren && !isNaN(parseFloat(String(les.uren).replace(',', '.')))) {
        totaalUren += parseFloat(String(les.uren).replace(',', '.'));
      }
    });
  });
  
  // Rond het totaal af op 1 decimaal
  totaalUren = Math.round(totaalUren * 10) / 10;
  
  // Voeg totaalrij toe
  html += `
    <tr class="totaal-row">
      <td>Lestijden per week</td>
      <td>${totaalUren}</td>
    </tr>
  `;
  
  // Voeg stageweken toe indien aanwezig
  if (klas.stage_weken && klas.stage_weken.trim() !== '') {
    html += `
      <tr class="stage-row">
        <td>Stage weken</td>
        <td>${klas.stage_weken}</td>
      </tr>
    `;
  }
  
  // Sluit de tabel af
  html += `
      </tbody>
    </table>
  `;
  
  // Voeg voetnoten toe indien aanwezig
  if (voetnoten && voetnoten.length > 0) {
    html += generateFootnotes(voetnoten);
  }
  
  return html;
}

/**
 * Groepeert vakken en subvakken zodat subvakken onder hun hoofdvakken verschijnen
 * @param {Array} vakken - Array met lesitems
 * @returns {Array} - Gesorteerde array met vakken
 */
function groepeerVakkenEnSubvakken(vakken) {
  // Maak kopie van de array om de originele niet te wijzigen
  const result = [...vakken];
  
  // Sorteer eerst alfabetisch op vaknaam
  result.sort((a, b) => a.vak.localeCompare(b.vak));
  
  // Sorteer daarna zodat subvakken onder hoofdvakken komen
  result.sort((a, b) => {
    const aIsSubvak = a.subvak === true || a.subvak === 'WAAR';
    const bIsSubvak = b.subvak === true || b.subvak === 'WAAR';
    
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
 * Genereert een dropdown-menu met alle beschikbare richtingen
 * @param {Array} richtingen - Array met alle unieke richtingen
 * @param {string} selectedCode - Optioneel: code van de geselecteerde richting
 * @returns {string} - HTML-string met het dropdown-menu
 */
function generateRichtingenDropdown(richtingen, selectedCode = '') {
  let html = '<option value="">--Selecteer een richting--</option>';
  
  // Sorteer richtingen op graad en binnen elke graad alfabetisch
  const graadVolgorde = ['EERSTE GRAAD', 'TWEEDE GRAAD', 'DERDE GRAAD', 'ZEVENDE JAAR'];
  
  // Groepeer richtingen per graad
  const richtingenPerGraad = {};
  
  richtingen.forEach(richting => {
    const graad = (richting.graad || '').toString().trim().toUpperCase();
    if (!richtingenPerGraad[graad]) {
      richtingenPerGraad[graad] = [];
    }
    richtingenPerGraad[graad].push(richting);
  });
  
  // Voor elke graad in de juiste volgorde:
  graadVolgorde.forEach(graad => {
    if (richtingenPerGraad[graad] && richtingenPerGraad[graad].length > 0) {
      html += `<optgroup label="${graad}">`;
      
      // Sorteer richtingen binnen deze graad alfabetisch
      richtingenPerGraad[graad].sort((a, b) => a.naam.localeCompare(b.naam));
      
      // Voeg elke richting toe aan deze optgroup
      richtingenPerGraad[graad].forEach(richting => {
        const selected = richting.klascode === selectedCode ? 'selected' : '';
        html += `<option value="${richting.klascode}" ${selected}>${richting.naam}</option>`;
      });
      
      html += '</optgroup>';
    }
  });
  
  // Voeg overige richtingen toe (zonder graad of met onbekende graad)
  const overigeGraden = Object.keys(richtingenPerGraad).filter(
    graad => !graadVolgorde.includes(graad)
  );
  
  if (overigeGraden.length > 0) {
    html += `<optgroup label="Overige">`;
    
    overigeGraden.forEach(graad => {
      richtingenPerGraad[graad].sort((a, b) => a.naam.localeCompare(b.naam));
      
      richtingenPerGraad[graad].forEach(richting => {
        const selected = richting.klascode === selectedCode ? 'selected' : '';
        html += `<option value="${richting.klascode}" ${selected}>${richting.naam}</option>`;
      });
    });
    
    html += '</optgroup>';
  }
  
  return html;
}

// Maak de functies globaal beschikbaar 
window.TableGenerator = {
  generateLessentabel,
  generateRichtingenDropdown
};
