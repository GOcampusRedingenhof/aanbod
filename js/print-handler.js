// print-handler.js
// Module voor alle printfunctionaliteit

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
    // Start het printproces
    window.print();
    
    // Trigger de afterprint handler als die niet automatisch wordt aangeroepen
    // Sommige browsers triggeren geen afterprint event
    setTimeout(() => {
      if (document.body.classList.contains('print-mode')) {
        restoreFromPrint();
      }
    }, 2000);
  }, 100);
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
  // Voeg een klasse toe aan de body voor print-specifieke styling
  document.body.classList.add('print-mode');
  
  // Bereken en pas relatieve hoogtes aan om op één pagina te passen
  adjustTableSizesForPrint();
  
  // Voeg attributen toe voor het genereren van de bestandsnaam
  if (klas) {
    try {
      const graad = klas.graad ? klas.graad.toLowerCase().replace(/\s+/g, '-') : '';
      const richting = klas.richting ? klas.richting.toLowerCase().replace(/\s+/g, '-') : '';
      
      // Voeg data-attributen toe aan het print container element
      const slideinEl = document.getElementById('slidein');
      if (slideinEl) {
        slideinEl.dataset.printGraad = graad;
        slideinEl.dataset.printRichting = richting;
        slideinEl.dataset.printFilename = `#RDNGN - ${graad} - ${richting}`;
      }
    } catch (error) {
      console.error('Fout bij instellen bestandsnaam:', error);
    }
  }
  
  // Luister naar window print events voor opruimen
  window.addEventListener('afterprint', restoreFromPrint, { once: true });
}

/**
 * Herstel de pagina na het afdrukken
 */
function restoreFromPrint() {
  // Verwijder de printmodus klasse
  document.body.classList.remove('print-mode');
  
  // Herstel oorspronkelijke afmetingen
  resetTableSizes();
  
  // Verwijder eventuele print-specifieke attributen
  const slideinEl = document.getElementById('slidein');
  if (slideinEl) {
    delete slideinEl.dataset.printGraad;
    delete slideinEl.dataset.printRichting;
    delete slideinEl.dataset.printFilename;
  }
}

/**
 * Past tabel groottes aan voor optimale printweergave
 */
function adjustTableSizesForPrint() {
  const table = document.querySelector('.lessentabel');
  if (!table) return;
  
  // Detecteer de grootte van de tabel
  const columnCount = table.querySelectorAll('thead th').length;
  const rowCount = table.querySelectorAll('tbody tr').length;
  
  // Pas lettergroottes aan op basis van tabelgrootte
  if (columnCount > 3 || rowCount > 15) {
    // Voor grote tabellen extra verkleinen
    table.style.fontSize = '0.65rem';
    
    // Verkleinde padding
    const cells = table.querySelectorAll('th, td');
    cells.forEach(cell => {
      cell.style.padding = '0.15rem 0.35rem';
    });
  } else {
    // Normale verkleining voor kleinere tabellen
    table.style.fontSize = '0.75rem';
  }
  
  // Compactere cell spacing
  table.style.borderSpacing = '0';
  
  // Maak headers compacter
  const headers = table.querySelectorAll('thead th');
  headers.forEach(header => {
    header.style.padding = '0.25rem 0.4rem';
  });
  
  // Verklein de titelheader
  const titleElement = document.getElementById('opleiding-titel');
  if (titleElement) {
    titleElement.style.fontSize = '1.2rem';
    titleElement.style.marginBottom = '0.5rem';
  }
  
  // Verklein de beschrijving
  const descriptionElement = document.getElementById('opleiding-beschrijving');
  if (descriptionElement) {
    descriptionElement.style.fontSize = '0.85rem';
    descriptionElement.style.marginBottom = '0.5rem';
  }
  
  // Print-optimalisatie voor logo
  const logoElement = document.querySelector('.logo-print');
  if (logoElement) {
    logoElement.style.display = 'block';
    logoElement.style.maxWidth = '100px';
    logoElement.style.margin = '0 auto 0.5rem';
  }
  
  // Zet de tabel in een outer container om pagebreaks te voorkomen
  const tableContainer = document.getElementById('lessentabel-container');
  if (tableContainer) {
    tableContainer.style.pageBreakInside = 'avoid';
    tableContainer.style.breakInside = 'avoid';
  }
  
  // Verbeterde positie van footers
  positionFootersForPrint();
}

/**
 * Positioneert de footers (datum, quote) beter voor afdrukken
 */
function positionFootersForPrint() {
  const datumElement = document.querySelector('.datum');
  const quoteElement = document.querySelector('.quote');
  
  if (datumElement && quoteElement) {
    // Creëer een footer container als die nog niet bestaat
    let footerContainer = document.getElementById('print-footer-container');
    
    if (!footerContainer) {
      footerContainer = document.createElement('div');
      footerContainer.id = 'print-footer-container';
      footerContainer.style.display = 'flex';
      footerContainer.style.justifyContent = 'space-between';
      footerContainer.style.borderTop = '1px solid #ddd';
      footerContainer.style.marginTop = '1rem';
      footerContainer.style.paddingTop = '0.5rem';
      
      // Voeg toe aan slidein na de huidige elementen
      const slidein = document.getElementById('slidein');
      if (slidein) {
        // Plaats de container voor de huidige footer-elementen
        slidein.insertBefore(footerContainer, datumElement);
        
        // Verplaats datum en quote naar de container
        footerContainer.appendChild(quoteElement.cloneNode(true));
        footerContainer.appendChild(datumElement.cloneNode(true));
        
        // Verberg de originele elementen
        datumElement.style.display = 'none';
        quoteElement.style.display = 'none';
      }
    }
  }
}

/**
 * Herstel oorspronkelijke tabel groottes
 */
function resetTableSizes() {
  const table = document.querySelector('.lessentabel');
  if (!table) return;
  
  // Verwijder inline styles
  table.style.fontSize = '';
  table.style.borderSpacing = '';
  
  // Reset cell styles
  const cells = table.querySelectorAll('th, td');
  cells.forEach(cell => {
    cell.style.padding = '';
  });
  
  // Reset header styles
  const titleElement = document.getElementById('opleiding-titel');
  if (titleElement) {
    titleElement.style.fontSize = '';
    titleElement.style.marginBottom = '';
  }
  
  // Reset beschrijving styles
  const descriptionElement = document.getElementById('opleiding-beschrijving');
  if (descriptionElement) {
    descriptionElement.style.fontSize = '';
    descriptionElement.style.marginBottom = '';
  }
  
  // Reset logo styles
  const logoElement = document.querySelector('.logo-print');
  if (logoElement) {
    logoElement.style.display = '';
    logoElement.style.maxWidth = '';
    logoElement.style.margin = '';
  }
  
  // Reset table container styles
  const tableContainer = document.getElementById('lessentabel-container');
  if (tableContainer) {
    tableContainer.style.pageBreakInside = '';
    tableContainer.style.breakInside = '';
  }
  
  // Verwijder de footer container indien aanwezig
  const footerContainer = document.getElementById('print-footer-container');
  if (footerContainer) {
    footerContainer.remove();
    
    // Herstel de originele footer elementen
    const datumElement = document.querySelector('.datum');
    const quoteElement = document.querySelector('.quote');
    
    if (datumElement && quoteElement) {
      datumElement.style.display = '';
      quoteElement.style.display = '';
    }
  }
}

/**
 * Verzorgt bestandsnaamgeneratie voor de download
 */
export function setupFilenameObserver() {
  // Dit is een polyfill functie voor browsers die geen filename ondersteuning hebben
  // Deze observer kan later worden gebruikt als er download-functionaliteit wordt toegevoegd
  
  try {
    // Controleer of we in een printdialoog zitten door een MutationObserver te gebruiken
    const observer = new MutationObserver(mutations => {
      // Zoek het slidein element met printdata
      const slidein = document.getElementById('slidein');
      if (slidein && slidein.dataset.printFilename) {
        // Hier zouden we eventueel de filename kunnen instellen
        console.log('Printing with filename:', slidein.dataset.printFilename);
      }
    });
    
    // Observeer het document.body element voor veranderingen
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    
  } catch (error) {
    console.error('Fout bij setup filename observer:', error);
  }
}
