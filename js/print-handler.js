// print-handler.js
// Volledig verbeterde versie die lege pagina's voorkomt en professionele afdrukken levert

/**
 * Initialiseert de printfunctionaliteit
 * Deze functie moet worden aangeroepen nadat het slidein is geopend
 * @param {Object} klas - Het klasobject met richting, graad, etc.
 */
export function initPrintHandler(klas) {
  // Zoek de printknop en voeg event listener toe
  const printBtn = document.querySelector('#print-button');
  if (printBtn) {
    // Verwijder eventuele bestaande event listeners door kloon te maken
    const newBtn = printBtn.cloneNode(true);
    printBtn.parentNode.replaceChild(newBtn, printBtn);
    
    // Voeg nieuwe event listener toe met bewaren van klas-informatie
    newBtn.addEventListener('click', (e) => handlePrint(e, klas));
  }
  
  // Zet de huidige datum voor printen
  setupPrintDate();
}

/**
 * Verwerkt de printknop klik
 * @param {Event} e - Het click event
 * @param {Object} klas - Het klasobject met richting, graad, etc.
 */
function handlePrint(e, klas) {
  e.preventDefault();
  
  // Optimaliseer de pagina voor afdrukken
  optimizeForPrint(klas);
  
  // Stel een korte timeout in om zeker te zijn dat de DOM is bijgewerkt
  setTimeout(() => {
    // Genereer en stel de bestandsnaam in (werkt in Chrome en sommige andere browsers)
    setFilename(klas);
    
    // Start het printproces
    window.print();
    
    // Luister voor het afterprint event (browser-ondersteund)
    window.addEventListener('afterprint', restoreFromPrint, { once: true });
    
    // Backup voor browsers die geen afterprint event triggeren
    setTimeout(() => {
      if (document.body.classList.contains('print-mode')) {
        restoreFromPrint();
      }
    }, 2000);
  }, 200); // Iets langere timeout voor betere DOM-verwerking
}

/**
 * Genereert en stelt een bestandsnaam in voor de afdruk
 * @param {Object} klas - Het klasobject met richting, graad, etc.
 */
function setFilename(klas) {
  try {
    // Bereid een betekenisvolle bestandsnaam voor
    let filename = 'Lessentabel';
    
    if (klas) {
      // Haal de graad op (indien beschikbaar)
      if (klas.graad) {
        const graad = klas.graad.toLowerCase().replace(/\s+/g, '-');
        filename += `_${graad}`;
      }
      
      // Voeg de richting toe (indien beschikbaar)
      if (klas.richting) {
        // Verwijder speciale tekens en vervang spaties met streepjes
        const richting = klas.richting
          .toLowerCase()
          .replace(/[&\/\\#,+()$~%.'":*?<>{}]/g, '')
          .replace(/\s+/g, '-');
        filename += `_${richting}`;
      }
      
      // Voeg de klascode toe voor unieke identificatie
      if (klas.klascode) {
        filename += `_${klas.klascode}`;
      }
      
      // Voeg de datum toe
      const date = new Date();
      const dateStr = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
      filename += `_${dateStr}`;
    }
    
    // Zorg ervoor dat de bestandsnaam geldig is voor bestandssystemen
    filename = filename.replace(/[^\w\-]/g, '_');
    
    // Stel de bestandsnaam in via HTML
    const titleElement = document.querySelector('title');
    if (titleElement) {
      // Bewaar de originele titel om later te herstellen
      const originalTitle = titleElement.textContent;
      titleElement.dataset.originalTitle = originalTitle;
      
      // Stel de nieuwe titel in (wordt in sommige browsers gebruikt als bestandsnaam)
      titleElement.textContent = `${filename}.pdf`;
    }
  } catch (error) {
    console.error('Fout bij genereren bestandsnaam:', error);
  }
}

/**
 * Stelt de huidige datum in voor de printversie
 */
function setupPrintDate() {
  const span = document.getElementById("datum-print");
  if (span) {
    const today = new Date();
    span.textContent = today.toLocaleDateString("nl-BE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });
  }
}

/**
 * Optimaliseer de pagina voor afdrukken
 * @param {Object} klas - Het klasobject met richting, graad, etc.
 */
function optimizeForPrint(klas) {
  // Verwijder evt. oude footer-container om duplicatie te voorkomen
  removeExistingFooter();
  
  // Voeg een klasse toe aan de body voor print-specifieke styling
  document.body.classList.add('print-mode');
  
  // Maak een profesionele printfooter
  createProfessionalFooter();
  
  // Zorg dat de tabel goed wordt weergegeven
  optimizeTable();
  
  // Fix overige elementen in de DOM die kunnen leiden tot lege pagina's
  cleanupDomForPrinting();
}

/**
 * Verwijdert bestaande footer (om duplicatie te voorkomen)
 */
function removeExistingFooter() {
  const existingFooter = document.getElementById('print-footer-container');
  if (existingFooter) {
    existingFooter.remove();
  }
}

/**
 * Maakt een professionele footer voor printen
 */
function createProfessionalFooter() {
  const datumElement = document.querySelector('.datum');
  const quoteElement = document.querySelector('.quote');
  
  if (datumElement && quoteElement) {
    // Maak een nieuwe footer container
    const footerContainer = document.createElement('div');
    footerContainer.id = 'print-footer-container';
    
    // Kloon de elementen om de originelen intact te houden
    const quoteClone = quoteElement.cloneNode(true);
    const datumClone = datumElement.cloneNode(true);
    
    // Voeg de pagina nummer toe als midden element
    const pageInfo = document.createElement('div');
    pageInfo.className = 'page-info';
    pageInfo.innerHTML = 'GO Campus Redingenhof';
    
    // Voeg elementen toe aan de footer container
    footerContainer.appendChild(quoteClone);
    footerContainer.appendChild(pageInfo);
    footerContainer.appendChild(datumClone);
    
    // Voeg de footer toe aan het document
    const slidein = document.getElementById('slidein');
    if (slidein) {
      slidein.appendChild(footerContainer);
    }
  }
}

/**
 * Optimaliseert tabel groottes en opmaak voor printing
 */
function optimizeTable() {
  const table = document.querySelector('.lessentabel');
  if (!table) return;
  
  // Bereken de optimale cell-breedte relatief aan de tabel
  const columnCount = table.querySelectorAll('thead th').length;
  
  // Bereken de optimale font-grootte gebaseerd op aantal kolommen
  let fontSize = '9pt';
  if (columnCount > 4) {
    fontSize = '8pt';
  } else if (columnCount > 6) {
    fontSize = '7pt';
  }
  
  // Pas de tabel aan
  table.style.fontSize = fontSize;
  table.style.tableLayout = 'fixed';
  table.style.width = '100%';
  
  // Zorg dat categorie headers duidelijk zijn
  const categorieHeaders = table.querySelectorAll('.categorie-header th');
  categorieHeaders.forEach(header => {
    header.style.backgroundColor = '#eee';
    header.style.textAlign = 'left';
  });
  
  // Voorkom page-breaks binnen belangrijke rijen
  const importantRows = table.querySelectorAll('thead tr, .categorie-header, .totaal-row, .stage-row');
  importantRows.forEach(row => {
    row.style.pageBreakInside = 'avoid';
    row.style.breakInside = 'avoid';
  });
}

/**
 * Schoont de DOM op om problemen met lege pagina's te voorkomen
 */
function cleanupDomForPrinting() {
  // Verberg tijdelijk alle andere elementen buiten het slidein
  document.querySelectorAll('body > *:not(#slidein):not(script)').forEach(el => {
    if (!el.dataset.printHidden) {
      el.dataset.printHidden = 'true';
      el.style.display = 'none';
    }
  });
  
  // Fix voor overflowing content die lege pagina's kan veroorzaken
  const detailContent = document.querySelector('.detail-content');
  if (detailContent) {
    detailContent.style.overflow = 'visible';
  }
  
  // Zorg dat de slidein correct wordt gepositioneerd
  const slidein = document.getElementById('slidein');
  if (slidein) {
    slidein.style.position = 'absolute';
    slidein.style.top = '0';
    slidein.style.left = '0';
    slidein.style.transform = 'none';
  }
  
  // Verwijder evt. lege of onnodige elementen
  document.querySelectorAll('div:empty, p:empty').forEach(emptyEl => {
    if (!emptyEl.hasAttribute('id') && emptyEl.children.length === 0) {
      emptyEl.style.display = 'none';
    }
  });
}

/**
 * Herstel de pagina na het afdrukken
 */
function restoreFromPrint() {
  // Verwijder de printmodus klasse
  document.body.classList.remove('print-mode');
  
  // Herstel de originele paginatitel
  const titleElement = document.querySelector('title');
  if (titleElement && titleElement.dataset.originalTitle) {
    titleElement.textContent = titleElement.dataset.originalTitle;
    delete titleElement.dataset.originalTitle;
  }
  
  // Verwijder de print footer container
  const footerContainer = document.getElementById('print-footer-container');
  if (footerContainer) {
    footerContainer.remove();
  }
  
  // Herstel eerder verborgen elementen
  document.querySelectorAll('[data-print-hidden="true"]').forEach(el => {
    el.style.display = '';
    delete el.dataset.printHidden;
  });
  
  // Herstel de instellingen voor sliding paneel
  const slidein = document.getElementById('slidein');
  if (slidein) {
    slidein.style.position = '';
    slidein.style.top = '';
    slidein.style.left = '';
    slidein.style.transform = '';
  }
  
  // Herstel flow van content
  const detailContent = document.querySelector('.detail-content');
  if (detailContent) {
    detailContent.style.overflow = '';
  }
  
  // Herstel tabelstijlen
  resetTableStyles();
}

/**
 * Reset tabelstijlen na printen
 */
function resetTableStyles() {
  const table = document.querySelector('.lessentabel');
  if (!table) return;
  
  // Reset tabel stijlen
  table.style = '';
  
  // Reset alle rijen en cellen
  table.querySelectorAll('tr, th, td').forEach(el => {
    el.style = '';
  });
}
