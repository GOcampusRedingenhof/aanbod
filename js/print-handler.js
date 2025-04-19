// print-handler.js
// Geoptimaliseerde printlogica met domeinspecifieke kleuren

import { mapDomein, getDomeinMeta } from './config-module.js';

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
 * Print de pagina met domeinspecifieke layout
 * @param {Object} klas - Klasobject met details voor de print
 */
function printKlas(klas) {
  // Voorkom scrollen tijdens print voorbereiding
  window.scrollTo(0, 0);

  // Bepaal domein-specifieke kleuren
  const domeinKey = mapDomein(klas.domein);
  const domeinMeta = getDomeinMeta(domeinKey);

  // Genereer een herkenbare bestandsnaam en titel
  const titleText = `Lessentabel ${klas.richting} - ${klas.klascode}`;
  const fileName = `GO_Campus_Redingenhof_Lessentabel_${klas.richting}_${klas.klascode}.pdf`;

  // Haal de tabel en voetnoten op
  const tabelEl = document.getElementById('lessentabel-container');
  const voetEl = document.getElementById('footnotes');
  
  if (!tabelEl) {
    console.error('Container lessentabel niet gevonden');
    return;
  }

  // Haal logo op (met fallback)
  const logoSrc = document.querySelector('.logo-print')?.src || 
                  document.querySelector('.logo')?.src || 
                  'https://images.squarespace-cdn.com/content/v1/670992d66064015802d7e5dc/5425e461-06b0-4530-9969-4068d5a5dfdc/Scherm%C2%ADafbeelding+2024-12-03+om+09.38.12.jpg?format=1500w';

  // Genereer datum in lokaal formaat
  const dateStr = new Date().toLocaleDateString('nl-BE', { 
    day: '2-digit', 
    month: '2-digit', 
    year: 'numeric' 
  });

  // Genereer volledige HTML voor print
  const printHTML = `
<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="UTF-8">
  <title>${titleText}</title>
  <link rel="stylesheet" href="css/styles.css">
  <link rel="stylesheet" href="css/print-styles.css" media="print">
  <style>
    :root {
      --app-domain-base: ${domeinMeta.base};
      --app-domain-mid: ${domeinMeta.mid};
      --app-domain-light1: ${domeinMeta.light1};
    }
  </style>
</head>
<body>
  <div class="lessentabellen-wrapper">
    <img class="logo-print" src="${logoSrc}" alt="Logo">
    <h1 id="opleiding-titel">${klas.richting}</h1>
    <div class="datum">${dateStr}</div>
    <div class="quote">SAMEN VER!</div>
    
    ${tabelEl.outerHTML}
    ${voetEl ? voetEl.outerHTML : ''}
  </div>
</body>
</html>
  `;

  // Open een nieuw venster met de print HTML
  const printWindow = window.open('', '_blank');
  printWindow.document.write(printHTML);
  printWindow.document.close();
  
  // Direct afdrukken en sluiten na laden
  printWindow.onload = function() {
    printWindow.print();
    printWindow.onafterprint = function() {
      printWindow.close();
    };
  };
}
