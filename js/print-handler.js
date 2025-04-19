// js/print-handler.js — Verbeterde en complete printhandler-module

/**
 * Globale variabelen om timeouts en backupstate te beheren
 */
let printTimeoutId = null;

/**
 * Initialiseert de printknop voor een specifieke klas
 * @param {Object} klas - Klasinfo met o.a. richting en domein
 */
export function initPrintHandler(klas) {
  const printButton = document.getElementById('print-button');
  if (!printButton) return;
  printButton.addEventListener('click', () => {
    startPrintProcess(klas);
  });
}

/**
 * Start de volledige printworkflow: backup, UI-aanpassingen, print-dialog en cleanup
 * @param {Object} klas - Klas met eigenschappen zoals richting
 */
export function startPrintProcess(klas) {
  // Backup maken (optioneel uitbreiden naar scrollpositie, classes …)
  window.printStateBackup = {
    title: document.title
  };
  document.body.classList.add('print-mode');

  // Dynamisch document.title voor betere PDF-bestandsnaam
  if (klas.richting) {
    document.title = `${klas.richting}-aanbod`;
  }

  // beforeprint en afterprint handlers om cleanup te garanderen
  const beforePrintHandler = () => {
    window.removeEventListener('beforeprint', beforePrintHandler);
  };
  window.addEventListener('beforeprint', beforePrintHandler);

  const afterPrintHandler = () => {
    window.removeEventListener('afterprint', afterPrintHandler);
    // Laat de browser eerst printen, daarna cleanup
    setTimeout(cleanupAfterPrinting, 500);
  };
  window.addEventListener('afterprint', afterPrintHandler);

  // UI-elementen verbergen voor een schone print
  const slidein = document.getElementById('slidein');
  if (slidein) {
    const closeBtn = slidein.querySelector('.close-btn');
    if (closeBtn) closeBtn.style.display = 'none';
    const actionButtons = slidein.querySelector('.action-buttons');
    if (actionButtons) actionButtons.style.display = 'none';
    slidein.classList.add('print-optimized');

    // Tabel schalen bij veel regels
    const table = slidein.querySelector('.lessentabel');
    if (table) {
      const rows = table.querySelectorAll('tbody tr').length;
      if (rows > 30) {
        table.style.fontSize = '9pt';
        slidein.classList.add('scaled-table');
      }
    }
  }

  // Open printdialoog
  try {
    window.print();
  } catch (error) {
    console.error('Fout tijdens printen:', error);
    cleanupAfterPrinting();
  }
}

/**
 * Ruimt na het printen alles weer op: timeouts, CSS, knoppen
 */
export function cleanupAfterPrinting() {
  // Timeouts annuleren
  if (printTimeoutId) {
    clearTimeout(printTimeoutId);
    printTimeoutId = null;
  }
  if (window.safetyPrintTimeoutId) {
    clearTimeout(window.safetyPrintTimeoutId);
    window.safetyPrintTimeoutId = null;
  }

  // Verwijder printmode
  document.body.classList.remove('print-mode');

  // Herstel UI-elementen
  try {
    const slidein = document.getElementById('slidein');
    if (slidein) {
      // Sluitknop terugzetten
      const restoredClose = slidein.querySelector('.close-btn');
      if (restoredClose) {
        restoredClose.style.display = '';
        // Eventlistener voor sluiten wordt direct in showSlidein opnieuw gebonden
      }
      // Actieknoppen terugzetten
      const actionButtons = slidein.querySelector('.action-buttons');
      if (actionButtons) actionButtons.style.display = '';
    }
  } catch (error) {
    console.error('Fout bij herstel UI na print:', error);
  }

  // Zet document.title terug (optioneel)
  if (window.printStateBackup && window.printStateBackup.title) {
    document.title = window.printStateBackup.title;
  }
  window.printStateBackup = null;
}

/**
 * Forcerende UI-reset bij ernstige fouten
 */
function forceResetUI() {
  console.warn('Forceer UI reset vanwege fouten');
  document.body.classList.remove('print-mode');
  const slidein = document.getElementById('slidein');
  if (slidein) {
    slidein.classList.remove('print-optimized', 'scaled-table', 'open');
    const closeBtn = slidein.querySelector('.close-btn');
    if (closeBtn) closeBtn.style.display = '';
    const actionButtons = slidein.querySelector('.action-buttons');
    if (actionButtons) actionButtons.style.display = '';
  }
  const overlay = document.getElementById('overlay');
  if (overlay) overlay.classList.remove('active');
}

// Exporteer de publieke API
export default {
  initPrintHandler,
  startPrintProcess,
  cleanupAfterPrinting
};
