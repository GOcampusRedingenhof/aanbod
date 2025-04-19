// print-handler.js
// Geoptimaliseerde printlogica met professionele, geïntegreerde layout

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
    triggerPrint(klas);
  });
}

/**
 * Trigger afdrukken met aangepaste voorbereidingen
 * @param {Object} klas - Klasobject met details voor de print
 */
function triggerPrint(klas) {
  // Bepaal domein-specifieke kleuren
  const domeinKey = mapDomein(klas.domein);
  const domeinMeta = getDomeinMeta(domeinKey);

  // Tijdelijke print container voorbereiden
  const printContainer = createPrintContainer(klas, domeinMeta);
  document.body.appendChild(printContainer);

  // Trigger native print dialoog
  window.print();

  // Schoonmaken na afdrukken
  document.body.removeChild(printContainer);
}

/**
 * Creëert een tijdelijke print container met alle benodigde inhoud
 * @param {Object} klas - Klasobject
 * @param {Object} domeinMeta - Domein-specifieke kleuren
 * @returns {HTMLElement} Print container element
 */
function createPrintContainer(klas, domeinMeta) {
  // Haal benodigde elementen op
  const tabelEl = document.getElementById('lessentabel-container');
  const voetEl = document.getElementById('footnotes');
  
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

  // Maak print container
  const printContainer = document.createElement('div');
  printContainer.id = 'print-container';
  printContainer.classList.add('print-mode');
  printContainer.innerHTML = `
    <style>
      #print-container {
        font-family: 'Montserrat', Arial, sans-serif;
        max-width: 210mm;
        margin: 0 auto;
        padding: 20mm;
        box-sizing: border-box;
        position: relative;
      }
      .print-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 10mm;
        border-bottom: 2px solid ${domeinMeta.base};
        padding-bottom: 5mm;
      }
      .logo {
        max-height: 25mm;
        max-width: 50mm;
      }
      .title {
        font-size: 14pt;
        font-weight: bold;
        color: ${domeinMeta.base};
        text-transform: uppercase;
      }
      .date {
        font-size: 10pt;
        color: #666;
      }
      #lessentabel-container {
        width: 100%;
      }
      .footnotes {
        margin-top: 10mm;
        font-size: 9pt;
        color: #666;
      }
      .quote {
        position: absolute;
        bottom: 10mm;
        left: 20mm;
        font-style: italic;
        color: ${domeinMeta.mid};
      }
    </style>
    <div class="print-header">
      <img src="${logoSrc}" alt="GO Campus Redingenhof Logo" class="logo">
      <div class="title">${klas.richting}</div>
      <div class="date">Afgedrukt op: ${dateStr}</div>
    </div>
    ${tabelEl.outerHTML}
    ${voetEl ? voetEl.outerHTML : ''}
    <div class="quote">SAMEN VER!</div>
  `;

  return printContainer;
}
