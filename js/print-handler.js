// 1js/print-handler.js — Printhandler met PDF-export en print‑preview via html2pdf.js
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
 * Start de PDF-export én print‑preview workflow
 * @param {Object} klas
 */
export function startPrintProcess(klas) {
  // Backup maken
  window.printStateBackup = { title: document.title };
  document.body.classList.add('print-mode');

  // Dynamisch document.title voor PDF-bestandsnaam
  if (klas.richting) document.title = `${klas.richting}-aanbod`;

  // Zorg dat slidein zichtbaar is (class 'open')
  const slidein = document.getElementById('slidein');
  if (slidein) {
    slidein.classList.add('open');
    const overlay = document.getElementById('overlay');
    if (overlay) overlay.classList.add('active');
    // UI-elementen verbergen
    slidein.querySelectorAll('.close-btn, .action-buttons').forEach(el => el.style.display = 'none');
    slidein.classList.add('print-optimized');
  }

  const target = (slidein && slidein.classList.contains('open')) ? slidein : document.body;

  if (typeof html2pdf !== 'function') {
    console.error('PDF-export vereist html2pdf.js.');
    cleanupAfterPrinting();
    return;
  }

  const opt = {
    margin:       0.5,
    filename:     `${klas.richting || 'document'}-aanbod.pdf`,
    image:        { type: 'jpeg', quality: 0.98 },
    html2canvas:  { scale: 2 },
    jsPDF:        { unit: 'in', format: 'a4', orientation: 'portrait' }
  };

  // Genereren PDF object (jsPDF) zonder directe download
  html2pdf().set(opt).from(target).toPdf().get('pdf').then((pdf) => {
    // Maak blob van PDF
    const blob = pdf.output('blob');
    const url = URL.createObjectURL(blob);
    // Open in nieuw venster/tab voor print preview
    const win = window.open(url);
    if (win) {
      win.addEventListener('load', () => {
        win.focus();
        win.print();
      });
    }
  }).catch(err => {
    console.error('PDF-fout:', err);
  }).finally(() => {
    cleanupAfterPrinting();
  });
}

/**
 * Ruimt na preview of fout op: herstelt UI en title
 */
export function cleanupAfterPrinting() {
  // Annuleer timeouts
  if (printTimeoutId) { clearTimeout(printTimeoutId); printTimeoutId = null; }
  if (window.safetyPrintTimeoutId) { clearTimeout(window.safetyPrintTimeoutId); window.safetyPrintTimeoutId = null; }

  document.body.classList.remove('print-mode');
  try {
    const slidein = document.getElementById('slidein');
    if (slidein) {
      slidein.classList.remove('open', 'print-optimized');
      slidein.querySelectorAll('.close-btn, .action-buttons').forEach(el => el.style.display = '');
    }
    const overlay = document.getElementById('overlay');
    if (overlay) overlay.classList.remove('active');
  } catch (e) {
    console.error('Fout bij herstel UI na export:', e);
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
    slidein.querySelectorAll('.close-btn, .action-buttons').forEach(el => el.style.display = '');
  }
  const overlay = document.getElementById('overlay');
  if (overlay) overlay.classList.remove('active');
}

export default { initPrintHandler, startPrintProcess, cleanupAfterPrinting };
