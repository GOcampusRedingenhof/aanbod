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

  // Zet print‑mode (voor @media print regels)
  document.body.classList.add('print-mode');

  // Dynamische document.title voor juiste PDF‑naam
  if (klas.richting) {
    document.title = `${klas.richting}-aanbod`;
  }

  // Eénmalige afterprint-handler
  window.onafterprint = () => {
    cleanupAfterPrinting();
    window.onafterprint = null;   // handler weer verwijderen
    isPrinting = false;           // opnieuw printen weer toestaan
  };

  // Trigger de print‑dialoog
  window.print();
}

/**
 * Herstelt de UI na printing: close‑knop, actieknoppen en CSS‑state
 */
export function cleanupAfterPrinting() {
  // Verwijder print‑mode
  document.body.classList.remove('print-mode');

  // Herstel de close‑knop en actieknoppen
  const slidein = document.getElementById('slidein');
  if (slidein) {
    const closeBtn = slidein.querySelector('.close-btn');
    if (closeBtn) closeBtn.style.display = '';

    const actionButtons = slidein.querySelector('.action-buttons');
    if (actionButtons) actionButtons.style.display = '';
  }
}

// Default export
export default {
  initPrintHandler,
  startPrintProcess,
  cleanupAfterPrinting
};
