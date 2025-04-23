// js/print-handler.js - Verbeterde versie met betere foutafhandeling
// Deze module centraliseert alle printfunctionaliteit

/**
 * Globale print timeout ID om timeouts te kunnen annuleren
 */
let printTimeoutId = null;

/**
 * Initialiseert de print handler voor een specifieke klas
 * @param {Object} klas - Het klasobject met informatie over de richting
 */
export function initPrintHandler(klas) {
  const printButton = document.getElementById('print-button');
  if (!printButton) return;

  // Verwijder eventuele bestaande handlers door nieuwe knop te maken
  const newBtn = printButton.cloneNode(true);
  printButton.parentNode.replaceChild(newBtn, printButton);
  
  // Voeg nieuwe event listener toe met betere foutafhandeling
  newBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation(); // Voorkom event bubbling
    
    // Voer in een try-catch blok uit om crashes te voorkomen
    try {
      startPrintProcess(klas);
    } catch (error) {
      console.error('Fout bij starten printproces:', error);
      cleanupAfterPrinting(); // Zorg ervoor dat we opruimen bij fouten
    }
  });
  
  // Update datum voor printen
  updatePrintDate();
}

/**
 * Update de datum die wordt weergegeven in de print footer
 */
function updatePrintDate() {
  const datumEl = document.getElementById('datum-print');
  if (datumEl) {
    try {
      const datum = new Date().toLocaleDateString('nl-BE', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      });
      datumEl.textContent = datum;
    } catch (error) {
      // Fallback als toLocaleDateString niet werkt
      const now = new Date();
      datumEl.textContent = `${now.getDate()}-${now.getMonth() + 1}-${now.getFullYear()}`;
    }
  }
}

/**
 * Start het printproces voor een specifieke klas
 * @param {Object} klas - Het klasobject
 */
export function startPrintProcess(klas) {
  console.log('Print proces gestart voor klas', klas?.klascode);
  
  // Sla de huidige status op om later te kunnen herstellen
  saveCurrentState();
  
  // Voorkom dat meerdere print processen tegelijk lopen
  if (document.body.classList.contains('print-mode')) {
    console.warn('Print modus is al actief, eerst opruimen');
    cleanupAfterPrinting();
  }
  
  // Bereid voor op printen
  document.body.classList.add('print-mode');
  prepareForPrint();
  
  // Sla de starttijd op voor de safety timeout
  window.printModeStartTime = Date.now();
  
  // Print met een vertraging voor DOM updates
  if (printTimeoutId) {
    clearTimeout(printTimeoutId);
  }
  
  printTimeoutId = setTimeout(() => {
    // Voeg beforeprint event listener toe voor eenmalig gebruik
    const beforePrintHandler = function(e) {
      console.log('beforeprint event in print-handler module');
      window.removeEventListener('beforeprint', beforePrintHandler);
    };
    window.addEventListener('beforeprint', beforePrintHandler);
    
    // Voeg afterprint event listener toe voor eenmalig gebruik
    const afterPrintHandler = function(e) {
      console.log('afterprint event in print-handler module');
      window.removeEventListener('afterprint', afterPrintHandler);
      
      // Wacht even met opruimen om browsers de kans te geven
      setTimeout(cleanupAfterPrinting, 500);
    };
    window.addEventListener('afterprint', afterPrintHandler);
    
    // Start het printdialoogvenster
    window.print();
    
    // Stel een veiligheidstimer in om vast te stellen of afterprint niet is geactiveerd
    // Dit gebeurt soms in sommige browsers
    const safetyTimeoutId = setTimeout(() => {
      console.warn('Safety timeout: afterprint event niet gedetecteerd, handmatig opruimen');
      cleanupAfterPrinting();
    }, 5000); // 5 seconden timeout
    
    // Bewaar de timeout ID om te kunnen annuleren als afterprint wel wordt geactiveerd
    window.safetyPrintTimeoutId = safetyTimeoutId;
  }, 200);
}

/**
 * Sla de huidige staat op om later te kunnen herstellen
 */
function saveCurrentState() {
  const slidein = document.getElementById('slidein');
  if (!slidein) return;
  
  // Bewaar de huidige styling
  window.printStateBackup = {
    closeButtonDisplay: slidein.querySelector('.close-btn')?.style.display || '',
    actionButtonsDisplay: slidein.querySelector('.action-buttons')?.style.display || '',
    slideinPadding: slidein.style.padding || '',
    slideinClasses: [...slidein.classList],
    tableTransform: slidein.querySelector('.lessentabel')?.style.transform || '',
    tableFontSize: slidein.querySelector('.lessentabel')?.style.fontSize || '',
    tableMarginBottom: slidein.querySelector('.lessentabel')?.style.marginBottom || ''
  };
}

/**
 * Bereid de pagina voor op printen
 */
function prepareForPrint() {
  const slidein = document.getElementById('slidein');
  if (!slidein) return;
  
  try {
    // Verberg interactieve elementen
    const closeBtn = slidein.querySelector('.close-btn');
    if (closeBtn) closeBtn.style.display = 'none';
    
    const actionButtons = slidein.querySelector('.action-buttons');
    if (actionButtons) actionButtons.style.display = 'none';
    
    // Voeg print-specifieke klassen toe
    slidein.classList.add('print-optimized');
    
    // Pas tabel aan voor printen indien nodig
    const table = slidein.querySelector('.lessentabel');
    if (table) {
      // Controleer tabelgrootte en pas aan indien nodig
      const tableRows = table.querySelectorAll('tbody tr').length;
      
      if (tableRows > 30) {
        // Voor grote tabellen, verklein de lettergrootte
        table.style.fontSize = '9pt';
        slidein.classList.add('scaled-table');
      }
    }
    
    console.log('Print voorbereidingen voltooid');
  } catch (error) {
    console.error('Fout tijdens print voorbereidingen:', error);
    // Ga toch door met printen bij fouten
  }
}

/**
 * Ruim op na het printen
 */
export function cleanupAfterPrinting() {
  console.log('Opruimen na afdrukken gestart');
  
  // Annuleer eventuele lopende timeouts
  if (printTimeoutId) {
    clearTimeout(printTimeoutId);
    printTimeoutId = null;
  }
  
  if (window.safetyPrintTimeoutId) {
    clearTimeout(window.safetyPrintTimeoutId);
    window.safetyPrintTimeoutId = null;
  }
  
  // Verwijder print-mode klasse
  document.body.classList.remove('print-mode');
  
  try {
    // Herstel UI-elementen
    restoreUIState();
    
    // Reset timer voor vastlopen detectie
    window.printModeStartTime = 0;
    
    console.log('Opruimen na afdrukken voltooid');
  } catch (error) {
    console.error('Fout tijdens opruimen na printen:', error);
    
    // Forceer een reset bij fouten
    forceResetUI();
  }
}

/**
 * Herstel de UI-staat na het printen
 */
function restoreUIState() {
  const slidein = document.getElementById('slidein');
  if (!slidein) return;
  
  // Herstel zichtbaarheid van elementen
  const closeBtn = slidein.querySelector('.close-btn');
  if (closeBtn) {
    closeBtn.style.display = window.printStateBackup?.closeButtonDisplay || '';
  }
  
  const actionButtons = slidein.querySelector('.action-buttons');
  if (actionButtons) {
    actionButtons.style.display = window.printStateBackup?.actionButtonsDisplay || '';
  }
  
  // Herstel slidein styling
  slidein.style.padding = window.printStateBackup?.slideinPadding || '';
  
  // Verwijder print-specifieke klassen
  slidein.classList.remove('print-optimized');
  slidein.classList.remove('scaled-table');
  
  // Herstel tabel styling
  const table = slidein.querySelector('.lessentabel');
  if (table) {
    table.style.transform = window.printStateBackup?.tableTransform || '';
    table.style.fontSize = window.printStateBackup?.tableFontSize || '';
    table.style.marginBottom = window.printStateBackup?.tableMarginBottom || '';
  }
  
  // Wis backup data
  window.printStateBackup = null;
}

/**
 * Forceer een reset van de UI bij ernstige fouten
 */
function forceResetUI() {
  console.warn('Forceer UI reset vanwege fouten');
  
  document.body.classList.remove('print-mode');
  
  const slidein = document.getElementById('slidein');
  if (slidein) {
    // Reset alle print-gerelateerde klassen
    slidein.classList.remove('print-optimized');
    slidein.classList.remove('scaled-table');
    slidein.classList.remove('extreme');
    slidein.style.padding = '';
    
    // Herstel zichtbaarheid van basis UI elementen
    const closeBtn = slidein.querySelector('.close-btn');
    if (closeBtn) closeBtn.style.display = '';
    
    const actionButtons = slidein.querySelector('.action-buttons');
    if (actionButtons) actionButtons.style.display = '';
    
    // Reset tabel styling
    const table = slidein.querySelector('.lessentabel');
    if (table) {
      table.style.fontSize = '';
      table.style.transform = '';
      table.style.marginBottom = '';
      
      // Reset cel padding
      const cells = table.querySelectorAll('td, th');
      cells.forEach(cell => {
        cell.style.padding = '';
      });
    }
  }
  
  window.printStateBackup = null;
  window.printModeStartTime = 0;
}

// Exporteer publieke functies
export default {
  initPrintHandler,
  startPrintProcess,
  cleanupAfterPrinting
};
