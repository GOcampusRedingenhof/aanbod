// js/print-handler.js
// Centraliseert alle printfunctionaliteit voor de lessentabellen-app

/**
 * Guard om te voorkomen dat de print‑dialog tweemaal opent
 */
let isPrinting = false;

/**
 * Initialiseert de print handler voor een specifieke klas
 * @param {Object} klas - Klasobject met o.a. `richting`
 */
export function initPrintHandler(klas) {
  const printButton = document.getElementById('print-button');
  if (!printButton) return;

  printButton.addEventListener('click', () => {
    startPrintProcess(klas);
  });
}

/**
 * Start het printproces, stelt de titel in en bindt éénmalige afterprint cleanup
 * @param {Object} klas
 */
export function startPrintProcess(klas) {
  if (isPrinting) return;
  isPrinting = true;

  // Zet print‑mode op de body (voor print‑CSS)
  document.body.classList.add('print-mode');
  window.printModeStartTime = Date.now();

  // Dynamische document.title voor PDF‑bestandsnaam
  if (klas.richting) {
    document.title = `${klas.richting}-aanbod`;
  }

  // Eénmalige afterprint-handler
  window.onafterprint = () => {
    cleanupAfterPrinting();
    window.onafterprint = null;  // handler weer verwijderen
    isPrinting = false;          // opnieuw printen weer toestaan
  };

  // Trigger de print‑dialog
  window.print();
}

/**
 * Herstelt de UI na printing: sluitknop, actieknoppen en CSS‑state
 */
export function cleanupAfterPrinting() {
  // Verwijder print‑mode (werkt samen met je @media print rules)
  document.body.classList.remove('print-mode');

  // Herstel de sluitknop en actieknoppen
  const slidein = document.getElementById('slidein');
  if (slidein) {
    const closeBtn = slidein.querySelector('.close-btn');
    if (closeBtn) closeBtn.style.display = '';

    const actionButtons = slidein.querySelector('.action-buttons');
    if (actionButtons) actionButtons.style.display = '';
  }

  // Reset eventuele timers of state
  window.printModeStartTime = 0;
}

// Exporteer als default voor gemakkelijke import
export default {
  initPrintHandler,
  startPrintProcess,
  cleanupAfterPrinting
};
