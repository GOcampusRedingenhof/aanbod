// print-handler.js
// Verbeterde printlogica via een verborgen iframe, behoudt originele pagina en event handlers

/**
 * Initialiseert de printfunctionaliteit op de print-knop
 * @param {Object} klas - Metadata voor titel en klascode
 */
export function initPrintHandler(klas) {
  const printBtn = document.querySelector('#print-button');
  if (!printBtn) return;
  const newBtn = printBtn.cloneNode(true);
  printBtn.parentNode.replaceChild(newBtn, printBtn);
  newBtn.addEventListener('click', e => {
    e.preventDefault();
    printKlas(klas);
  });
}

/**
 * Print de pagina in een verborgen iframe, behoudt originele pagina-intact
 * @param {Object} klas
 */
function printKlas(klas) {
  // Bouw titel en datum
  const dateStr = new Date().toLocaleDateString('nl-BE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const titleText = `Lessentabel ${klas.richting} ${klas.klascode}`;

  // Genereer header, content en footer HTML
  const logoImg = document.querySelector('.logo')?.outerHTML || '';
  const headerHTML = `<div class="print-header">${logoImg}<div class="title">${titleText}</div><div class="date">${dateStr}</div></div>`;
  const contentSource = document.querySelector('.print-container')
    || document.getElementById('content')
    || document.querySelector('main')
    || document.querySelector('.grid')
    || document.querySelector('table');
  if (!contentSource) {
    console.error('Print content container niet gevonden');
    return;
  }
  const containerHTML = `<div class="print-container">${contentSource.outerHTML}</div>`;
  const footerHTML = `<div class="print-footer"><span class="page-number"></span></div>`;

  // Maak verborgen iframe
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow.document;
  doc.open();
  doc.write(
    `<!DOCTYPE html><html><head><title>${titleText}</title>` +
    // Link naar print stylesheet
    `<link rel="stylesheet" href="css/print.css" media="all">` +
    `</head><body>` +
    headerHTML + containerHTML + footerHTML +
    `</body></html>`
  );
  doc.close();

  // Print en verwijder iframe
  iframe.contentWindow.focus();
  iframe.contentWindow.print();
  setTimeout(() => {
    document.body.removeChild(iframe);
  }, 1000);
}
