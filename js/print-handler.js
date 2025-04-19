// print-handler.js
// Robuuste printlogica: header, content en footer genereren en direct afdrukken op één pagina

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
 * Print de pagina met gegenereerde header en footer op één A4
 * @param {Object} klas
 */
function printKlas(klas) {
  // Zorg dat we bovenaan beginnen
  window.scrollTo(0, 0);

  const originalHTML = document.body.innerHTML;
  const originalTitle = document.title;

  // Bouw titel en datum
  const dateStr = new Date().toLocaleDateString('nl-BE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const titleText = `Lessentabel ${klas.richting} ${klas.klascode}`;

  // Genereer header HTML
  const logoImg = document.querySelector('.logo')?.outerHTML || '';
  const headerHTML = `
    <div class="print-header">
      ${logoImg}
      <div class="title">${titleText}</div>
      <div class="date">${dateStr}</div>
    </div>`;

  // Zoek container met de tabel of content
  const contentSource = document.querySelector('.print-container')
    || document.getElementById('content')
    || document.querySelector('main')
    || document.querySelector('.grid')
    || document.querySelector('table');
  if (!contentSource) {
    console.error('Content container niet gevonden voor print');
    return;
  }
  const containerHTML = `<div class="print-container">${contentSource.outerHTML}</div>`;

  // Genereer footer HTML
  const footerHTML = `<div class="print-footer"><span class="page-number"></span></div>`;

  // Vervang body met enkel print-structuur
  document.body.innerHTML = headerHTML + containerHTML + footerHTML;
  document.title = titleText;

  // Trigger print
  window.print();

  // Herstel originele site-structuur
  document.body.innerHTML = originalHTML;
  document.title = originalTitle;
}
