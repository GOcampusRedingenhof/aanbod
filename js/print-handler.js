// print-handler.js
// Verbeterde printlogica: open een nieuw venster met inline styling en dynamische inhoud

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
 * Print de pagina door een nieuw venster te openen en de benodigde HTML plus CSS inline te schrijven
 * @param {Object} klas
 */
async function printKlas(klas) {
  // Scroll naar top van de originele pagina
  window.scrollTo(0, 0);

  // Haal CSS voor print op
  let cssText = '';
  try {
    const res = await fetch('css/print-styles.css');
    cssText = await res.text();
  } catch (err) {
    console.warn('Kon print-styles.css niet laden, inline default gebruiken.', err);
    cssText = `@page { size: A4 portrait; margin: 5mm; } body { font-family: Arial, sans-serif; font-size:9pt; }`;
  }

  // Bouw bestandsnaam en zichtbare titel
  const titleText = `Lessentabellen GO Campus Redingenhof - ${klas.richting} ${klas.klascode}`;
  const fileName = titleText.replace(/\s+/g, '_') + '.pdf';

  // Bepaal content: lesentabel en voetnoten
  const tabelEl = document.getElementById('lessentabel-container');
  const voetEl = document.getElementById('footnotes');
  if (!tabelEl) {
    console.error('Container lessentabel niet gevonden');
    return;
  }
  const contentHTML = tabelEl.outerHTML + (voetEl ? voetEl.outerHTML : '');

  // Genereer header en footer
  const dateStr = new Date().toLocaleDateString('nl-BE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const headerHTML = `<div class=\"print-header\">` +
                     `<img class=\"logo-print\" src=\"${document.querySelector('.logo-print')?.src || ''}\" alt=\"Logo\">` +
                     `<div class=\"title\">${titleText}</div>` +
                     `<div class=\"date\">${dateStr}</div>` +
                     `</div>`;
  const footerHTML = `<div class=\"print-footer\"><span class=\"page-number\"></span></div>`;

  // Open nieuw venster en schrijf de volledige HTML
  const win = window.open('', '_blank');
  if (!win) {
    console.error('Kon nieuw venster niet openen voor print');
    return;
  }
  win.document.write(`<!DOCTYPE html><html lang=\"nl\"><head><meta charset=\"UTF-8\">` +
                     `<title>${fileName}</title>` +
                     `<style>${cssText}</style>` +
                     `</head><body>` +
                     `${headerHTML}` +
                     `<div class=\"print-container\">${contentHTML}</div>` +
                     `${footerHTML}` +
                     `</body></html>`);
  win.document.close();

  // Print en sluit het venster
  win.focus();
  win.print();
  win.close();
}
