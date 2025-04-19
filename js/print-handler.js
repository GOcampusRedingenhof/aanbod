// print-handler.js
// Verbeterde printlogica om alles op één A4 te krijgen en te starten op de eerste pagina

/**
 * Initialiseert de printfunctionaliteit
 * @param {Object} klas - Het klasobject met richting, graad, etc.
 */
export function initPrintHandler(klas) {
  const printBtn = document.querySelector('#print-button');
  if (!printBtn) return;
  // Vervang de knop om dubbele listeners te vermijden
  const newBtn = printBtn.cloneNode(true);
  printBtn.parentNode.replaceChild(newBtn, printBtn);
  newBtn.addEventListener('click', (e) => {
    e.preventDefault();
    printKlas(klas);
  });

  // Initialiseer datum-print placeholder
  const span = document.getElementById('datum-print');
  if (span) {
    const today = new Date();
    span.textContent = today.toLocaleDateString('nl-BE', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    });
  }
}

/**
 * Print het geselecteerde klasblok op één pagina.
 * @param {Object} klas - Het klasobject met metadata voor titel
 */
function printKlas(klas) {
  // Bewaar originele body en title
  const originalHTML = document.body.innerHTML;
  const originalTitle = document.title;

  // Verkrijg HTML van header, container en footer
  const headerEl = document.querySelector('.print-header');
  const containerEl = document.querySelector('.print-container');
  const footerEl = document.querySelector('.print-footer');
  if (!containerEl || !headerEl) {
    console.error('Print header of container niet gevonden');
    return;
  }
  const headerHTML = headerEl.outerHTML;
  const containerHTML = containerEl.outerHTML;
  const footerHTML = footerEl ? footerEl.outerHTML : '';

  // Zet enkel de print-kern in de body
  document.body.innerHTML = headerHTML + containerHTML + footerHTML;
  document.title = `Lessentabel ${klas.richting} (${klas.klascode})`;

  // Start print en restore na afdrukken
  window.print();
  // Restore originele content
  document.body.innerHTML = originalHTML;
  document.title = originalTitle;
}
