// js/print-handler.js — Printhandler met print‑preview via nieuw venster
// Geen html2pdf meer, gewoon window.print() op een aparte window

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
  // Zorg dat slidein openstaat
  const slidein = document.getElementById('slidein');
  if (!slidein) {
    console.error('Slide-in element niet gevonden.');
    return;
  }
  slidein.classList.add('open');

  // Bouw een nieuw venster
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    console.error('Kon printvenster niet openen.');
    return;
  }

  // Kopieer <head> styles en title
  const docHead = document.querySelector('head').innerHTML;
  const title = klas.richting ? `${klas.richting}-aanbod` : document.title;

  // Schrijf HTML
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

  // Wacht even tot content geladen is
  printWindow.onload = () => {
    printWindow.focus();
    printWindow.print();
    // Sluit venster na printdialog
    setTimeout(() => printWindow.close(), 500);
  };
}

export default { initPrintHandler, startPrintProcess };
