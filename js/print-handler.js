// 2js/print-handler.js — Printhandler met print‑preview via nieuw venster
// Zorgt ook voor cleanupAfterPrinting export zodat importers niet falen

/**
 * Initialiseert de printknop voor een specifieke klas
 * @param {Object} klas - bevat o.a. richting en domein
 */
export function initPrintHandler(klas) {
  const printButton = document.getElementById('print-button');
  if (!printButton) return;
  printButton.addEventListener('click', () => startPrintProcess(klas));
}

/**
 * Start print‑workflow: open nieuw venster met alleen slidein, print en sluit
 * @param {Object} klas
 */
export function startPrintProcess(klas) {
  const slidein = document.getElementById('slidein');
  if (!slidein) {
    console.error('Slide-in element niet gevonden.');
    return;
  }
  slidein.classList.add('open');

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    console.error('Kon printvenster niet openen.');
    return;
  }

  const docHead = document.querySelector('head').innerHTML;
  const title = klas.richting ? `${klas.richting}-aanbod` : document.title;

  printWindow.document.write(`
    <html>
      <head>
        <title>${title}</title>
        ${docHead}
        <style>
          /* Verberg overbodige elementen */
          header, footer, #print-button, .action-buttons, .close-btn { display: none !important; }
          /* Slidein volledig tonen */
          #slidein { position: static !important; transform: none !important; }
        </style>
      </head>
      <body>
        ${slidein.outerHTML}
      </body>
    </html>
  `);
  printWindow.document.close();

  printWindow.onload = () => {
    printWindow.focus();
    printWindow.print();
    setTimeout(() => printWindow.close(), 500);
    cleanupAfterPrinting();
  };
}

/**
 * Cleanup: zet eventuele classes en stijlen terug
 */
export function cleanupAfterPrinting() {
  try {
    const slidein = document.getElementById('slidein');
    if (slidein) {
      slidein.classList.remove('open');
      // Herstel knop en acties indien nodig
      slidein.querySelectorAll('.close-btn, .action-buttons').forEach(el => el.style.display = '');
    }
    const overlay = document.getElementById('overlay');
    if (overlay) overlay.classList.remove('active');
    document.body.classList.remove('print-mode');
  } catch (e) {
    console.error('Fout bij cleanup:', e);
  }
}

export default {
  initPrintHandler,
  startPrintProcess,
  cleanupAfterPrinting
};
