// js/print-handler.js — Printhandler met PDF-export via html2pdf.js
// Vereist: <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script> in index.html

/**
 * Globale variabelen om backupstate en timeouts te beheren
 */
let printTimeoutId = null;

/**
 * Initialiseert de printknop voor een specifieke klas
 * @param {Object} klas - Klasinfo met o.a. richting en domein
 */
export function initPrintHandler(klas) {
  const printButton = document.getElementById('print-button');
  if (!printButton) return;
  printButton.addEventListener('click', () => startPrintProcess(klas));
}

/**
 * Start de print- of PDF-export workflow
 * @param {Object} klas
 */
export function startPrintProcess(klas) {
  // Backup maken (bv. originele title)
  window.printStateBackup = { title: document.title };
  document.body.classList.add('print-mode');

  // Dynamisch title voor PDF-bestandsnaam
  if (klas.richting) document.title = `${klas.richting}-aanbod`;

  // Zorg dat slidein zichtbaar is (class 'open')
  const slidein = document.getElementById('slidein');
  if (slidein) {
    slidein.classList.add('open');
    const overlay = document.getElementById('overlay');
    if (overlay) overlay.classList.add('active');

    // Verberg UI-elementen
    const closeBtn = slidein.querySelector('.close-btn');
    if (closeBtn) closeBtn.style.display = 'none';
    const actionButtons = slidein.querySelector('.action-buttons');
    if (actionButtons) actionButtons.style.display = 'none';
    slidein.classList.add('print-optimized');
  }

  // Kies element voor PDF: als slidein open dan die, anders de hele body
  const target = (slidein && slidein.classList.contains('open'))
    ? slidein
    : document.body;

  if (typeof html2pdf !== 'function') {
    console.error('PDF-export vereist html2pdf.js.');
    cleanupAfterPrinting();
    return;
  }

  const options = {
    margin:       0.5,
    filename:     `${klas.richting || 'document'}-aanbod.pdf`,
    image:        { type: 'jpeg', quality: 0.98 },
    html2canvas:  { scale: 2 },
    jsPDF:        { unit: 'in', format: 'a4', orientation: 'portrait' }
  };

  html2pdf()
    .set(options)
    .from(target)
    .save()
    .then(() => cleanupAfterPrinting())
    .catch(err => {
      console.error('PDF-fout:', err);
      cleanupAfterPrinting();
    });
}

/**
 * Ruimt na export of fout op: herstelt UI en title
 */
export function cleanupAfterPrinting() {
  // Annuleer timeouts
  if (printTimeoutId) {
    clearTimeout(printTimeoutId);
    printTimeoutId = null;
  }
  if (window.safetyPrintTimeoutId) {
    clearTimeout(window.safetyPrintTimeoutId);
    window.safetyPrintTimeoutId = null;
  }

  // Haal print-mode en classes weg
  document.body.classList.remove('print-mode');
  try {
    const slidein = document.getElementById('slidein');
    if (slidein) {
      slidein.classList.remove('open', 'print-optimized');
      const restoredClose = slidein.querySelector('.close-btn');
      if (restoredClose) restoredClose.style.display = '';
      const actionButtons = slidein.querySelector('.action-buttons');
      if (actionButtons) actionButtons.style.display = '';
    }
    const overlay = document.getElementById('overlay');
    if (overlay) overlay.classList.remove('active');
  } catch (error) {
    console.error('Fout bij herstel UI na export:', error);
  }

  // Zet title terug
  if (window.printStateBackup && window.printStateBackup.title) {
    document.title = window.printStateBackup.title;
  }
  window.printStateBackup = null;
}

/**
 * Forcerende reset bij ernstige fouten
 */
function forceResetUI() {
  console.warn('Forceer UI reset wegens fouten');
  document.body.classList.remove('print-mode');
  const slidein = document.getElementById('slidein');
  if (slidein) {
    slidein.classList.remove('print-optimized', 'open');
    const closeBtn = slidein.querySelector('.close-btn');
    if (closeBtn) closeBtn.style.display = '';
    const actionButtons = slidein.querySelector('.action-buttons');
    if (actionButtons) actionButtons.style.display = '';
  }
  const overlay = document.getElementById('overlay');
  if (overlay) overlay.classList.remove('active');
}

export default {
  initPrintHandler,
  startPrintProcess,
  cleanupAfterPrinting
};
