// js/print-handler.js - volledig herziene versie

/**
 * Initialiseert de print handler voor een specifieke klas
 * @param {Object} klas - Het klasobject met informatie over de richting
 */
export function initPrintHandler(klas) {
  // Cleanup eventuele vorige event listeners om memory leaks te voorkomen
  cleanupPrintHandlers();
  
  const printButton = document.querySelector('#print-button');
  if (!printButton) return;

  // Bewaar klascode als data-attribuut
  printButton.dataset.klas = klas.klascode;
  printButton.dataset.richting = klas.richting || '';
  
  // Huidige datum voor in de footer
  updatePrintDate();
  
  // Gebruik een schone event listener met named function om later te kunnen verwijderen
  printButton.addEventListener('click', handlePrintButtonClick);
  
  // Luister naar printgerelateerde browserevents
  window.addEventListener('beforeprint', handleBeforePrint);
  window.addEventListener('afterprint', handleAfterPrint);
}

/**
 * Verwijdert alle printgerelateerde event listeners om memory leaks te voorkomen
 */
function cleanupPrintHandlers() {
  const printButton = document.querySelector('#print-button');
  if (printButton) {
    printButton.removeEventListener('click', handlePrintButtonClick);
  }
  
  window.removeEventListener('beforeprint', handleBeforePrint);
  window.removeEventListener('afterprint', handleAfterPrint);
}

/**
 * Updates de printdatum in de footer
 */
function updatePrintDate() {
  const datumEl = document.getElementById('datum-print');
  if (datumEl) {
    const datum = new Date().toLocaleDateString('nl-BE', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
    datumEl.textContent = datum;
  }
}

/**
 * Handelt klik op print knop af
 * @param {Event} event - Het klikevent
 */
function handlePrintButtonClick(event) {
  // Voorkom standaard event gedrag
  event.preventDefault();
  event.stopPropagation();
  
  // Sla huidige scrolpositie op
  const scrollPosition = window.scrollY;
  
  try {
    // Vind de klascode via data-attribuut
    const printButton = event.currentTarget;
    const klascode = printButton.dataset.klas;
    
    if (!klascode) {
      console.error('Geen klascode gevonden voor print');
      return;
    }
    
    // Pas documenttitel aan voor correcte PDF-bestandsnaam
    const oorspronkelijkeTitel = document.title;
    document.title = `Lessentabel ${printButton.dataset.richting || klascode}`;
    
    // Voeg printmodus class toe aan body
    document.body.classList.add('print-mode');
    
    // Bereid voor op printen
    prepareForPrint();
    
    // Start browser print dialoog
    window.print();
    
    // Reset zal gebeuren in afterprint handler, maar voor browsers die dat niet ondersteunen
    // zetten we een backup timer
    window.setTimeout(() => {
      // Controleer of print-mode nog steeds actief is (anders is afterprint al uitgevoerd)
      if (document.body.classList.contains('print-mode')) {
        cleanupAfterPrinting(oorspronkelijkeTitel, scrollPosition);
      }
    }, 1000);
  } catch (error) {
    console.error('Fout bij starten printproces:', error);
    // Zorg ervoor dat de UI niet blokkeert bij een fout
    document.body.classList.remove('print-mode');
  }
}

/**
 * Bereidt het document voor op printen
 */
function prepareForPrint() {
  const slidein = document.getElementById('slidein');
  if (!slidein) return;
  
  // Bewaar huidige status om later te kunnen herstellen
  slidein.dataset.originalPadding = slidein.style.padding || '';
  
  // Verberg UI elementen die niet geprint moeten worden
  const actionButtons = slidein.querySelector('.action-buttons');
  if (actionButtons) {
    actionButtons.dataset.originalDisplay = actionButtons.style.display || '';
    actionButtons.style.display = 'none';
  }
  
  const closeButton = slidein.querySelector('.close-btn');
  if (closeButton) {
    closeButton.dataset.originalDisplay = closeButton.style.display || '';
    closeButton.style.display = 'none';
  }
  
  // Reset padding voor meer printruimte
  slidein.style.padding = '0.5cm';
  
  // Optimaliseer tabel
  const table = slidein.querySelector('.lessentabel');
  if (table) {
    // Bewaar originele styles
    table.dataset.originalFontSize = window.getComputedStyle(table).fontSize;
    table.dataset.originalTransform = table.style.transform || '';
    
    // Reset eventuele eerdere transformaties
    table.style.transform = '';
    
    // Meet tabel en pas schaal aan indien nodig
    const totalHeight = table.offsetHeight;
    const availableHeight = 900; // ~A4 hoogte in pixels minus marges
    
    if (totalHeight > availableHeight) {
      const scale = Math.min(0.9, availableHeight / totalHeight);
      
      // Pas font size aan in plaats van transform voor betere print kwaliteit
      const originalSize = parseFloat(table.dataset.originalFontSize);
      const newSize = Math.max(7, Math.floor(originalSize * scale)); // Minimum 7px
      
      table.style.fontSize = `${newSize}px`;
      
      // Verklein padding van cellen
      const cells = table.querySelectorAll('td, th');
      cells.forEach(cell => {
        cell.dataset.originalPadding = cell.style.padding || '';
        cell.style.padding = '2px 4px';
      });
      
      // Markeer dit als een geschaalde tabel
      slidein.classList.add('scaled-for-print');
    }
  }
}

/**
 * Event handler voor beforeprint browser event
 */
function handleBeforePrint() {
  // Als printmodus nog niet actief is (bv. door Ctrl+P), activeer het alsnog
  if (!document.body.classList.contains('print-mode')) {
    document.body.classList.add('print-mode');
    prepareForPrint();
  }
}

/**
 * Event handler voor afterprint browser event
 */
function handleAfterPrint() {
  const oorspronkelijkeTitel = document.title;
  const scrollPosition = window.scrollY;
  cleanupAfterPrinting(oorspronkelijkeTitel, scrollPosition);
}

/**
 * Ruimt op na het printen en herstelt de originele UI staat
 * @param {string} oorspronkelijkeTitel - De originele document titel
 * @param {number} scrollPosition - De originele scroll positie
 */
function cleanupAfterPrinting(oorspronkelijkeTitel, scrollPosition) {
  // Reset body class
  document.body.classList.remove('print-mode');
  
  // Herstel document titel als die is meegegeven
  if (oorspronkelijkeTitel) {
    document.title = oorspronkelijkeTitel;
  }
  
  const slidein = document.getElementById('slidein');
  if (!slidein) return;
  
  // Herstel padding
  if (slidein.dataset.originalPadding !== undefined) {
    slidein.style.padding = slidein.dataset.originalPadding;
    delete slidein.dataset.originalPadding;
  }
  
  // Herstel actie knoppen
  const actionButtons = slidein.querySelector('.action-buttons');
  if (actionButtons && actionButtons.dataset.originalDisplay !== undefined) {
    actionButtons.style.display = actionButtons.dataset.originalDisplay;
    delete actionButtons.dataset.originalDisplay;
  }
  
  // Herstel sluit knop
  const closeButton = slidein.querySelector('.close-btn');
  if (closeButton && closeButton.dataset.originalDisplay !== undefined) {
    closeButton.style.display = closeButton.dataset.originalDisplay;
    delete closeButton.dataset.originalDisplay;
  }
  
  // Herstel tabel stijlen
  const table = slidein.querySelector('.lessentabel');
  if (table) {
    if (table.dataset.originalFontSize) {
      table.style.fontSize = table.dataset.originalFontSize;
      delete table.dataset.originalFontSize;
    }
    
    if (table.dataset.originalTransform !== undefined) {
      table.style.transform = table.dataset.originalTransform;
      delete table.dataset.originalTransform;
    }
    
    // Herstel cellen
    const cells = table.querySelectorAll('td, th');
    cells.forEach(cell => {
      if (cell.dataset.originalPadding !== undefined) {
        cell.style.padding = cell.dataset.originalPadding;
        delete cell.dataset.originalPadding;
      }
    });
  }
  
  // Verwijder speciale klassen
  slidein.classList.remove('scaled-for-print');
  
  // Herstel scroll positie
  if (scrollPosition !== undefined) {
    window.scrollTo(0, scrollPosition);
  }
  
  // Forceer een repaint om eventuele grafische glitches op te lossen
  slidein.style.opacity = '0.99';
  setTimeout(() => {
    slidein.style.opacity = '1';
  }, 10);
  
  // Maak zeker dat UI interactief blijft
  slidein.setAttribute('aria-hidden', 'false');
  
  // Zorg dat de close knop weer werkt
  const newCloseBtn = slidein.querySelector('.close-btn');
  if (newCloseBtn) {
    newCloseBtn.style.pointerEvents = 'auto';
    newCloseBtn.style.cursor = 'pointer';
  }
}
