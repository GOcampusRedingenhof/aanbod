// js/print-handler.js

/**
 * Initialiseert de printknop voor een specifieke klas
 * @param {Object} klas - bevat o.a. richting en domein
 */
export function initPrintHandler(klas) {
  const printButton = document.getElementById('print-button');
  if (!printButton) {
    console.warn('Printknop niet gevonden, print-handler wordt niet geïnitialiseerd.');
    return;
  }
  
  printButton.addEventListener('click', () => {
    try {
      startPrintProcess(klas);
    } catch (error) {
      console.error('Fout tijdens initialisatie van printproces:', error);
      showPrintError();
    }
  });
}

/**
 * Start print-workflow: open nieuw venster met alleen slidein, print en sluit
 * @param {Object} klas
 */
export function startPrintProcess(klas) {
  const slidein = document.getElementById('slidein');
  if (!slidein) {
    console.error('Slide-in element niet gevonden, kan niet printen.');
    showPrintError();
    return;
  }
  slidein.classList.add('open');

  try {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      throw new Error('Kon printvenster niet openen.');
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
            header, footer, #print-button, .action-buttons, .close-btn, .logo, .quote { display: none !important; }
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
      
      try {
        printWindow.print();
        setTimeout(() => printWindow.close(), 500);
        cleanupAfterPrinting();
      } catch (error) {
        console.error('Fout tijdens printen:', error);
        showPrintError('Het afdrukken is mislukt. Probeer het opnieuw of neem contact op met ondersteuning.');
      }
    };
    
  } catch (error) {
    console.error('Fout bij printen:', error);
    showPrintError();
  }
}

/**
 * Toont een foutmelding aan de gebruiker
 * @param {string} message - Optioneel, een specifiek foutbericht om te tonen
 */
function showPrintError(message = 'Er is een fout opgetreden tijdens het printen.') {
  alert(message + ' Probeer het opnieuw of neem contact op met ondersteuning als het probleem aanhoudt.');
}

/**
 * Cleanup: zet eventuele classes en stijlen terug
 */
export function cleanupAfterPrinting() {
  // Code blijft hetzelfde
}

export default {
  initPrintHandler,
  startPrintProcess,
  cleanupAfterPrinting
};
