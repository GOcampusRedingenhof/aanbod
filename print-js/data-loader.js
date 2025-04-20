/**
 * data-loader.js
 * Module voor het laden en verwerken van CSV-data voor de lessentabellen app
 */

// Cache voor het opslaan van geladen gegevens om herhaaldelijke verzoeken te voorkomen
const dataCache = {
  klassen: null,
  lessentabel: null,
  voetnoten: null
};

/**
 * Laad CSV-gegevens van de server
 * @param {string} csvUrl - URL van het CSV-bestand
 * @returns {Promise<Array>} - Een promise die resulteert in een array van objecten
 */
async function loadCSV(csvUrl) {
  try {
    const response = await fetch(csvUrl);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.text();
    
    // Gebruik de parseCSV-functie uit utils.js
    return parseCSV(data);
  } catch (error) {
    console.error(`Fout bij laden van ${csvUrl}:`, error);
    throw error;
  }
}

/**
 * Laad alle klasgegevens
 * @returns {Promise<Array>} - Een promise die resulteert in een array van klasobjecten
 */
async function getKlassen() {
  if (dataCache.klassen) {
    return dataCache.klassen;
  }
  
  try {
    const data = await loadCSV('data/klassen.csv');
    dataCache.klassen = data;
    return data;
  } catch (error) {
    console.error('Fout bij laden klassen:', error);
    showError('De klasgegevens konden niet worden geladen.');
    return [];
  }
}

/**
 * Laad alle lessentabelgegevens
 * @returns {Promise<Array>} - Een promise die resulteert in een array van lesitems
 */
async function getLessentabel() {
  if (dataCache.lessentabel) {
    return dataCache.lessentabel;
  }
  
  try {
    const data = await loadCSV('data/lessentabel.csv');
    dataCache.lessentabel = data;
    return data;
  } catch (error) {
    console.error('Fout bij laden lessentabel:', error);
    showError('De lessentabelgegevens konden niet worden geladen.');
    return [];
  }
}

/**
 * Laad alle voetnotengegevens
 * @returns {Promise<Array>} - Een promise die resulteert in een array van voetnootitems
 */
async function getVoetnoten() {
  if (dataCache.voetnoten) {
    return dataCache.voetnoten;
  }
  
  try {
    const data = await loadCSV('data/voetnoten.csv');
    dataCache.voetnoten = data;
    return data;
  } catch (error) {
    console.error('Fout bij laden voetnoten:', error);
    // Voetnoten zijn niet essentieel, dus geen foutmelding tonen
    return [];
  }
}

/**
 * Zoek een klas op basis van klascode
 * @param {Array} klassen - Array met alle klassen
 * @param {string} klascode - De klascode om te zoeken
 * @returns {Object|null} - Het klasobject of null als niet gevonden
 */
function findKlasByCode(klassen, klascode) {
  return klassen.find(klas => klas.klascode === klascode) || null;
}

/**
 * Haal alle lessen op voor een specifieke klascode
 * @param {Array} lessentabel - Array met alle lessen
 * @param {string} klascode - De klascode om te filteren
 * @returns {Array} - Array met lessen voor de opgegeven klascode
 */
function getLessenForKlas(lessentabel, klascode) {
  return lessentabel.filter(les => les.klascode === klascode);
}

/**
 * Haal alle voetnoten op voor een specifieke klascode
 * @param {Array} voetnoten - Array met alle voetnoten
 * @param {string} klascode - De klascode om te filteren
 * @returns {Array} - Array met voetnoten voor de opgegeven klascode
 */
function getVoetnotenForKlas(voetnoten, klascode) {
  return voetnoten.filter(voetnoot => voetnoot.klascode === klascode);
}

/**
 * Haal alle unieke richtingen op uit de klassendata
 * @param {Array} klassen - Array met alle klassen
 * @returns {Array} - Array met unieke richting-objecten
 */
function getAlleRichtingen(klassen) {
  // Map om unieke richtingen bij te houden (richtingcode -> object)
  const richtingMap = new Map();
  
  // Loop door alle klassen
  klassen.forEach(klas => {
    if (klas.richtingcode && klas.richting) {
      const key = klas.richtingcode;
      // Voeg alleen toe als deze richtingcode nog niet bestaat
      if (!richtingMap.has(key)) {
        richtingMap.set(key, {
          code: klas.richtingcode,
          naam: klas.richting,
          domein: klas.domein,
          graad: klas.graad,
          finaliteit: klas.finaliteit,
          klascode: klas.klascode // We gebruiken de eerste klascode die we tegenkomen
        });
      }
    }
  });
  
  // Converteer Map naar Array en sorteer alfabetisch op richting naam
  return Array.from(richtingMap.values()).sort((a, b) => 
    a.naam.localeCompare(b.naam)
  );
}

// Exporteer alle functies zodat ze beschikbaar zijn in andere modules
window.DataLoader = {
  getKlassen,
  getLessentabel,
  getVoetnoten,
  findKlasByCode,
  getLessenForKlas,
  getVoetnotenForKlas,
  getAlleRichtingen
};
