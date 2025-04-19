// print-handler.js
// Geoptimaliseerde printlogica met focus op A4-formaat en bestandsnaamconventie

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
 * Bereidt de afdruk voor met specifieke instellingen voor A4 en bestandsnaam
 * @param {Object} klas - Klasobject met details voor de print
 */
function triggerPrint(klas) {
  // Genereer bestandsnaam met richting
  const fileNameBase = klas.richting
    .replace(/\//g, ' ')     // Vervang schuine streep door spatie
    .replace(/\s+/g, '_')    // Vervang spaties door underscore
    .replace(/[^a-zA-Z0-9_]/g, ''); // Verwijder speciale tekens
  
  const fileName = `Lessentabel_${fileNameBase}_${klas.klascode}.pdf`;
  
  // Tijdelijke print container voorbereiden
  const printContainer = createPrintContainer(klas);
  document.body.appendChild(printContainer);

  // Zet titel voor afdruk
  document.title = fileName;

  // Trigger native print dialoog
  window.print();

  // Schoonmaken na afdrukken
  document.body.removeChild(printContainer);
  
  // Herstel oorspronkelijke titel
  document.title = 'Lessentabellen GO Campus Redingenhof';
}

/**
 * Creëert een tijdelijke print container geoptimaliseerd voor A4
 * @param {Object} klas - Klasobject
 * @returns {HTMLElement} Print container element
 */
function createPrintContainer(klas) {
  // Haal de nodige elementen op
  const tabelEl = document.getElementById('lessentabel-container');
  const voetEl = document.getElementById('footnotes');
  
  // Bepaal domein-specifieke kleuren
  const domeinKey = mapDomein(klas.domein);
  const domeinMeta = getDomeinMeta(domeinKey);

  // Genereer datum
  const dateStr = new Date().toLocaleDateString('nl-BE', { 
    day: '2-digit', 
    month: '2-digit', 
    year: 'numeric' 
  });

  // Logo fallback
  const logoSrc = document.querySelector('.logo-print')?.src || 
                  document.querySelector('.logo')?.src || 
                  'https://images.squarespace-cdn.com/content/v1/670992d66064015802d7e5dc/5425e461-06b0-4530-9969-4068d5a5dfdc/Scherm%C2%ADafbeelding+2024-12-03+om+09.38.12.jpg?format=1500w';

  // Maak print container
  const printContainer = document.createElement('div');
  printContainer.id = 'print-container';
  printContainer.classList.add('print-mode');
  printContainer.innerHTML = `
    <style>
      @media print {
        @page { 
          size: A4 portrait; 
          margin: 10mm; 
        }
        body * { visibility: hidden; }
        #print-container, #print-container * { 
          visibility: visible; 
          position: absolute;
          left: 0;
          top: 0;
        }
        #print-container {
          width: 100%;
          height: 100%;
          display: block;
          page-break-inside: avoid !important;
        }
        .print-content {
          zoom: 0.9; /* Extra kleine zoom om alles te laten passen */
        }
      }
    </style>
    <div class="print-content">
      <div style="
        display: flex; 
        justify-content: space-between; 
        align-items: center; 
        border-bottom: 2px solid ${domeinMeta.base};
        padding-bottom: 5mm;
        margin-bottom: 5mm;
      ">
        <img src="${logoSrc}" alt="Logo" style="max-height: 20mm; max-width: 50mm;">
        <div style="
          color: ${domeinMeta.base}; 
          font-weight: bold; 
          font-size: 14pt;
        ">${klas.richting}</div>
        <div style="font-size: 10pt; color: #666;">
          Afgedrukt op: ${dateStr}
        </div>
      </div>
      
      ${tabelEl.outerHTML}
      
      ${voetEl ? voetEl.outerHTML : ''}
      
      <div style="
        text-align: center; 
        margin-top: 5mm; 
        font-style: italic; 
        color: ${domeinMeta.base};
      ">
        SAMEN VER!
      </div>
    </div>
  `;

  return printContainer;
}
