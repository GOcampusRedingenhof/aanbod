/**
 * utils.js - Hulpfuncties voor de lessentabellen app
 */

// Domein mapping
const domeinMap = {
  'stem': {
    cssVar: '--stem-color',
    hoverVar: '--stem-hover'
  },
  'maatschappij & welzijn': {
    cssVar: '--maatschappij-welzijn-color',
    hoverVar: '--maatschappij-welzijn-hover'
  },
  'economie & organisatie': {
    cssVar: '--economie-organisatie-color',
    hoverVar: '--economie-organisatie-hover'
  },
  'sport & topsport': {
    cssVar: '--sport-topsport-color',
    hoverVar: '--sport-topsport-hover'
  },
  'eerste graad': {
    cssVar: '--eerste-graad-color',
    hoverVar: '--eerste-graad-hover'
  },
  'okan': {
    cssVar: '--okan-color',
    hoverVar: '--okan-hover'
  },
  'schakeljaar': {
    cssVar: '--schakeljaar-color',
    hoverVar: '--schakeljaar-hover'
  }
};

/**
 * Functie om domein CSS kleur in te stellen
 * @param {string} domein - Naam van het domein
 */
function setDomainColor(domein) {
  // Normaliseer domein naam
  const normalizedDomein = (domein || '').toLowerCase().trim();
  const domainColors = domeinMap[normalizedDomein];
  
  if (domainColors) {
    document.documentElement.style.setProperty('--domain-color', 
      `var(${domainColors.cssVar})`);
    document.documentElement.style.setProperty('--domain-hover', 
      `var(${domainColors.hoverVar})`);
  } else {
    // Fallback naar STEM kleuren
    document.documentElement.style.setProperty('--domain-color', 
      'var(--stem-color)');
    document.documentElement.style.setProperty('--domain-hover', 
      'var(--stem-hover)');
  }
}

/**
 * Eenvoudige CSV parser
 * @param {string} text - CSV inhoud als tekst
 * @returns {Array} Array met objecten, één per rij, met kolomnamen als sleutels
 */
function parseCSV(text) {
  const lines = text.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  
  return lines.slice(1).map(line => {
    // Zorg dat we komma's binnen aanhalingstekens goed verwerken
    let values = [];
    let currentValue = '';
    let insideQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"' && (i === 0 || line[i-1] !== '\\')) {
        insideQuotes = !insideQuotes;
      } else if (char === ',' && !insideQuotes) {
        values.push(currentValue);
        currentValue = '';
      } else {
        currentValue += char;
      }
    }
    
    // Voeg laatste waarde toe
    values.push(currentValue);
    
    // Als we te weinig waarden hebben, vul aan met lege strings
    while (values.length < headers.length) {
      values.push('');
    }
    
    return headers.reduce((obj, header, index) => {
      // Basis type conversie
      let value = values[index] ? values[index].trim() : '';
      if (value === 'WAAR') value = true;
      else if (value === 'ONWAAR') value = false;
      
      obj[header] = value;
      return obj;
    }, {});
  });
}

/**
 * Functie om de huidige datum te formatteren
 * @returns {string} Geformatteerde datum
 */
function getFormattedDate() {
  try {
    return new Date().toLocaleDateString('nl-BE', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  } catch (error) {
    const date = new Date();
    return `${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}`;
  }
}

/**
 * Berekent totale lesuren per klas
 * @param {Array} lessen - Array met alle lessen
 * @param {Array} klasCodes - Array met klasCodes
 * @returns {Object} Object met totalen per klasCode
 */
function berekenTotalen(lessen, klasCodes) {
  const totalen = {};
  
  klasCodes.forEach(code => {
    const lessenVoorKlas = lessen.filter(les => les.klascode === code);
    let totaal = 0;
    
    lessenVoorKlas.forEach(les => {
      if (les.uren && !isNaN(parseFloat(String(les.uren).replace(',', '.')))) {
        totaal += parseFloat(String(les.uren).replace(',', '.'));
      }
    });
    
    totalen[code] = Math.round(totaal * 10) / 10;
  });
  
  return totalen;
}

/**
 * Toont een foutmelding in de table-content container
 * @param {string} message - De foutmelding
 */
function showError(message) {
  document.getElementById('table-content').innerHTML = 
    `<div class="error-message">
      <p>Er is een fout opgetreden: ${message}</p>
      <p>Controleer of de CSV-bestanden correct zijn en of ze vanuit de juiste locatie worden geladen.</p>
    </div>`;
}
