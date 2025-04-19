// print-handler.js
// Geoptimaliseerde printlogica: styling via CSS, alle layout in CSS-bestanden

/**
 * Initialiseert de printfunctionaliteit op de print-knop
 * @param {Object} klas - Metadata voor richting en klascode
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
 * Print de pagina door een nieuw venster te openen en de benodigde HTML met CSS-links
 * Alle styling (huisstijl + print) hoort in CSS-bestanden
 * @param {Object} klas
 */
function printKlas(klas) {
  window.scrollTo(0, 0);

  // Bepaal bestandsnaam en titel zonder 'Lessentabellen'
  const titleText = `${klas.richting} ${klas.klascode}`;
  const fileName = `GO_Campus_Redingenhof-${klas.richting}_${klas.klascode}.pdf`;

  // Content selecteren
  const tabelEl = document.getElementById('lessentabel-container');
  const voetEl = document.getElementById('footnotes');
  if (!tabelEl) {
    console.error('Container lessentabel niet gevonden');
    return;
  }
  const contentHTML = tabelEl.outerHTML + (voetEl ? voetEl.outerHTML : '');

  // Header en footer HTML (geen inline-styling)
  const logoSrc = document.querySelector('.logo-print')?.src || document.querySelector('.logo')?.src || '';
  const dateStr = new Date().toLocaleDateString('nl-BE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const headerHTML = `
    <div class="print-header">
      ${logoSrc ? `<img class="logo-print" src="${logoSrc}" alt="Logo">` : ''}
      <div class="title">${titleText}</div>
      <div class="date">${dateStr}</div>
    </div>`;
  const footerHTML = `<div class="print-footer"><span class="page-number"></span></div>`;

  // Nieuw venster openen
  const win = window.open('', '_blank');
  if (!win) {
    console.error('Kon nieuw venster niet openen voor print');
    return;
  }

  // Schrijf HTML met CSS-links
  win.document.write(`<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="UTF-8">
  <title>${fileName}</title>
  <!-- Main app stylesheet voor huisstijl -->
  <link rel="stylesheet" href="css/styles.css">
  <!-- Print-specifieke stylesheet -->
  <link rel="stylesheet" href="css/print-styles.css" media="print">
</head>
<body>
  ${headerHTML}
  <div class="print-container">
    ${contentHTML}
  </div>
  ${footerHTML}
</body>
</html>`);
  win.document.close();

  win.focus();
  win.print();
  win.close();
}
