// js/detail-view.js
import { mapDomein, getDomeinMeta } from './config-module.js';
import { generateLessentabel } from './table-generator.js';

// Globale variabelen voor event cleanup en autoscaling
let activeResizeHandler = null;
let activeObserver = null;

/**
 * Genereert en toont de slide-in infokader voor een geselecteerde klas.
 * @param {Object} klas    – Het klasobject met richting, beschrijving, domein...
 * @param {Array}  lessen  – Alle lesitems van alle klassen in de richting
 * @param {Array}  voetnoten – Alle voetnoten die bij deze richting horen
 */
export function renderSlidein(klas, lessen, voetnoten) {
  try {
    // 1) Ruim oude handlers en styling op
    cleanupResources();

    // 2) Domeinspecifieke styling toepassen
    const domeinMeta = getDomeinMeta(klas.domein || klas.richting);
    const slideinEl = document.getElementById('slidein');
    if (slideinEl) {
      slideinEl.style.borderColor      = domeinMeta.base;
      slideinEl.style.backgroundColor  = domeinMeta.light1;
    }

    // 3) Basisinfo vullen
    const titelEl = document.getElementById('opleiding-titel');
    if (titelEl) titelEl.textContent = klas.richting;
    const beschEl = document.getElementById('opleiding-beschrijving');
    if (beschEl) beschEl.textContent = klas.beschrijving || '';

    // 4) Lessentabel genereren en in de container plaatsen
    const lesHTML = generateLessentabel(lessen, klas);
    const tabelCtn = document.getElementById('lessentabel-container');
    if (tabelCtn) {
      tabelCtn.innerHTML = lesHTML || '<p>Geen lessentabel beschikbaar voor deze richting.</p>';
    }

    // 5) Voetnoten toevoegen
    const footCtn = document.querySelector('.footnotes');
    if (footCtn) {
      footCtn.innerHTML = voetnoten
        .filter(v => v.klascode === klas.klascode && v.tekst)
        .map(v => `<div class="footnote">${v.tekst}</div>`)
        .join('');
    }

    // 6) Automatische schaling als de tabel te groot is
    enableAutoScaling();

    // 7) Print-knop initialiseren
    setupPrintHandler(klas);

    // 8) Slide-in én overlay tonen
    slideinEl?.classList.add('open');
    document.getElementById('overlay')?.classList.add('active');

  } catch (error) {
    console.error('Fout bij tonen slidein:', error);
  }
}

/** 
 * Reset alle resources (resize listeners, observers, transforms, classes) 
 */
function cleanupResources() {
  if (activeResizeHandler) {
    window.removeEventListener('resize', activeResizeHandler);
    activeResizeHandler = null;
  }
  if (activeObserver) {
    activeObserver.disconnect();
    activeObserver = null;
  }
  const table = document.querySelector('.lessentabel');
  if (table) {
    table.style.transform   = '';
    table.style.fontSize    = '';
    table.style.marginBottom= '';
  }
  const slidein = document.getElementById('slidein');
  slidein?.classList.remove('scaled-table', 'contains-scaled-table', 'print-optimized');
}

/**
 * Detecteert of de tabel te groot is en schalt zo nodig
 */
function detectAndScaleTable() {
  const container = document.getElementById('slidein');
  const table     = document.querySelector('.lessentabel');
  if (!container || !table) return;

  // Reset eerst
  table.style.transform = '';

  // Als we niet in print-mode zitten, pas schaal toe
  if (!document.body.classList.contains('print-mode')) {
    const availableHeight = container.clientHeight - 200;
    if (table.offsetHeight > availableHeight * 1.5) {
      const scale = Math.max(0.75, availableHeight / table.offsetHeight);
      table.style.transform       = `scale(${scale})`;
      table.style.transformOrigin = 'top center';
      container.classList.add('scaled-table');
    }
  }
}

/**
 * Zet de resize-listener voor automatische schaling
 */
function enableAutoScaling() {
  detectAndScaleTable();
  activeResizeHandler = () => {
    try { detectAndScaleTable(); } 
    catch (e) { console.error('Fout in resize handler:', e); }
  };
  window.addEventListener('resize', activeResizeHandler);
}

/**
 * Initialiseer de print-functionaliteit: sla klas op en bind de knop
 */
function setupPrintHandler(klas) {
  try {
    // Houd klas apart voor print
    window.currentPrintKlas = klas;

    const downloadBtn = document.getElementById('download-pdf-button');
    if (downloadBtn) {
      // Voorkom dubbele listeners: vervang knop
      const newBtn = downloadBtn.cloneNode(true);
      downloadBtn.parentNode.replaceChild(newBtn, downloadBtn);

      newBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (window.LessentabellenApp?.generateHTML) {
          window.LessentabellenApp.generateHTML();
        } else {
          // Fallback: laad de module dynamisch
          import('./print-handler.js')
            .then(m => m.generateHTML())
            .catch(err => {
              console.error('Print-handler laden mislukt:', err);
              alert('Print-functionaliteit niet beschikbaar.');
            });
        }
      });
    }
  } catch (err) {
    console.error('Fout bij setupPrintHandler:', err);
  }
}

// Exporteer zowel named als default voor compatibiliteit met app.js
export default renderSlidein;
