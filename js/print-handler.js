// js/print-handler.js
// Centraliseert alle printfunctionaliteit voor de lessentabellen-app

/**
 * Guard om te voorkomen dat de print‑dialoog tweemaal opent
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
 * Start het printproces: guard, dynamische titel, print‑mode en éénmalige afterprint cleanup
 * @param {Object} klas
 */
export function startPrintProcess(klas) {
  if (isPrinting) return;        // bij annuleren niet opnieuw triggeren
  isPrinting = true;

  // Zet print‑mode (voor CSS)
  document.body.classList.add('print-mode');
  window.printModeStartTime = Date.now();

  // Dynamische document.title voor juiste PDF‑naam
  if (klas.richting) {
    document.title = `${klas.richting}-aanbod`;
  }

  // Eénmalige afterprint-handler
  window.onafterprint = () => {
    cleanupAfterPrinting();
    window.onafterprint = null;   // handler verwijderen
    isPrinting = false;           // opnieuw printen weer toestaan
  };

  // Trigger de print‑dialoog
  window.print();
}

/**
 * Herstelt de UI na het printen: close‑knop, actieknoppen en CSS‑state
 */
export function cleanupAfterPrinting() {
  // Verwijder print‑mode (werkt met je @media print rules)
  document.body.classList.remove('print-mode');

  // Herstel de close‑knop en actieknoppen in de slide‑in
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

// Default export voor eenvoudige import
export default {
  initPrintHandler,
  startPrintProcess,
  cleanupAfterPrinting
};
