// js/print-handler.js
// Centraliseert alle printfunctionaliteit voor de lessentabellen-app

let isPrinting = false;

/**
 * Initialiseert de print handler voor een specifieke klas
 * @param {Object} klas - Klasobject met o.a. `richting`
 */
export function initPrintHandler(klas) {
  const printButton = document.getElementById('print-button');
  if (!printButton) return;

  // Verwijder oude listener en bind nieuwe
  printButton.replaceWith(printButton.cloneNode(true));
  const btn = document.getElementById('print-button');
  btn.addEventListener('click', () => startPrintProcess(klas));
}

/**
 * Start het printproces: guard, dynamische titel, en éénmalige afterprint cleanup
 * @param {Object} klas
 */
export function startPrintProcess(klas) {
  if (isPrinting) return;        // voorkomt een nieuwe print als je annuleert
  isPrinting = true;

  // Zet print‑mode (voor @media print CSS)
  document.body.classList.add('print-mode');

  // Dynamische PDF‑naam
  if (klas.richting) {
    document.title = `${klas.richting}-aanbod`;
  }

  // Eénmalige afterprint-handler
  const onAfter = () => {
    cleanupAfterPrinting();
    window.removeEventListener('afterprint', onAfter);
    isPrinting = false;
  };
  window.addEventListener('afterprint', onAfter, { once: true });

  // Trigger de print‑dialoog
  window.print();
}

/**
 * Herstelt de UI na printing: verwijdert print‑mode en toont knoppen opnieuw
 */
export function cleanupAfterPrinting() {
  document.body.classList.remove('print-mode');

  const slidein = document.getElementById('slidein');
  if (slidein) {
    const closeBtn = slidein.querySelector('.close-btn');
    if (closeBtn) closeBtn.style.display = '';
    const actionButtons = slidein.querySelector('.action-buttons');
    if (actionButtons) actionButtons.style.display = '';
  }
}

export default {
  initPrintHandler,
  startPrintProcess,
  cleanupAfterPrinting
};
