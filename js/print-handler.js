// print-handler.js
// Verbeterde versie die de bestaande CSS-modules respecteert

/**
 * Initialiseert de printfunctionaliteit
 * @param {Object} klas - Het klasobject met richting, graad, etc.
 */
export function initPrintHandler(klas) {
  // Zoek de printknop en voeg event listener toe
  const printBtn = document.querySelector('#print-button');
  if (printBtn) {
    // Verwijder eventuele bestaande event listeners door kloon te maken
    const newBtn = printBtn.cloneNode(true);
    printBtn.parentNode.replaceChild(newBtn, printBtn);
    
    // Voeg nieuwe event listener toe
    newBtn.addEventListener('click', (e) => {
      e.preventDefault();
      handlePrint(klas);
    });
  }
  
  // Zet de huidige datum voor printversie
  setupPrintDate();
}

/**
 * Stelt de huidige datum in voor de printversie
 */
function setupPrintDate() {
  const span = document.getElementById("datum-print");
  if (span) {
    const today = new Date();
    span.textContent = today.toLocaleDateString("nl-BE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });
  }
}

/**
 * Verwerkt het printverzoek
 * @param {Object} klas - Het klasobject
 */
function handlePrint(klas) {
  // Voeg een print-mode klasse toe aan het body element
  document.body.classList.add('print-mode');
  
  // Maak zeker dat de print-footer correct wordt weergegeven
  setupPrintFooter();

  // Wacht een beetje zodat de DOM kan worden bijgewerkt
  setTimeout(() => {
    // Start het printproces
    window.print();
    
    // Luister naar het afterprint event
    window.addEventListener('afterprint', () => {
      cleanupAfterPrint();
    }, { once: true });
    
    // Backup: als afterprint niet wordt getriggerd na 5 seconden, herstellen we
    setTimeout(() => {
      if (document.body.classList.contains('print-mode')) {
        cleanupAfterPrint();
      }
    }, 5000);
  }, 200);
}

/**
 * Maakt de print-footer klaar
 */
function setupPrintFooter() {
  // Verwijder eventuele bestaande print-footer
  const existingFooter = document.getElementById('print-footer-container');
  if (existingFooter) {
    existingFooter.remove();
  }
  
  // Maak een nieuwe footer container
  const footerContainer = document.createElement('div');
  footerContainer.id = 'print-footer-container';
  
  // Voeg de footer inhoud toe
  const quoteElement = document.createElement('div');
  quoteElement.className = 'quote';
  quoteElement.textContent = 'SAMEN VER!';
  
  const infoElement = document.createElement('div');
  infoElement.className = 'page-info';
  infoElement.textContent = 'GO Campus Redingenhof';
  
  const datumElement = document.createElement('div');
  datumElement.className = 'datum';
  datumElement.textContent = 'Afgedrukt op: ' + document.getElementById('datum-print').textContent;
  
  // Voeg elementen toe aan de footer
  footerContainer.appendChild(quoteElement);
  footerContainer.appendChild(infoElement);
  footerContainer.appendChild(datumElement);
  
  // Voeg de footer toe aan het slidein element
  const slidein = document.getElementById('slidein');
  if (slidein) {
    slidein.appendChild(footerContainer);
  }
}

/**
 * Ruimt alles op na het printen
 */
function cleanupAfterPrint() {
  // Verwijder de print-mode klasse
  document.body.classList.remove('print-mode');
  
  // Verwijder de print-footer
  const printFooter = document.getElementById('print-footer-container');
  if (printFooter) {
    printFooter.remove();
  }
}
