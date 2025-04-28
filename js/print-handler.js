// js/print-handler.js — uitgebreide print-handler met safety timeouts en cleanup

/**
 * Globale timeout IDs
 */
let printTimeoutId = null;
let safetyPrintTimeoutId = null;

/**
 * Initialiseert de print-knop voor een klas
 * @param {Object} klas – het klasobject (met klascode, etc.)
 */
export function initPrintHandler(klas) {
  const btn = document.getElementById('print-button');
  if (!btn) return;

  // Verwijder oude handlers
  const newBtn = btn.cloneNode(true);
  btn.parentNode.replaceChild(newBtn, btn);

  newBtn.addEventListener('click', e => {
    e.preventDefault();
    e.stopPropagation();
    try {
      startPrintProcess(klas);
    } catch (err) {
      console.error('Fout bij starten printproces:', err);
      cleanupAfterPrinting();
    }
  });

  updatePrintDate();
}

/**
 * Vult de datum in de print-footer
 */
function updatePrintDate() {
  const el = document.getElementById('datum-print');
  if (!el) return;
  try {
    el.textContent = new Date().toLocaleDateString('nl-BE', {
      day:   '2-digit',
      month: 'long',
      year:  'numeric'
    });
  } catch {
    const d = new Date();
    el.textContent = `${d.getDate()}-${d.getMonth()+1}-${d.getFullYear()}`;
  }
}

/**
 * Start het printproces: setup, window.print(), safety-timeouts
 */
export function startPrintProcess(klas) {
  console.log('Start print voor', klas?.klascode);
  // voorkom dubbele
  if (document.body.classList.contains('print-mode')) {
    cleanupAfterPrinting();
  }

  document.body.classList.add('print-mode');
  prepareForPrint();

  // korte delay zodat DOM-styling kan ingaan
  if (printTimeoutId) clearTimeout(printTimeoutId);
  printTimeoutId = setTimeout(() => {
    // register one-time before/after listeners
    const onAfter = () => {
      window.removeEventListener('afterprint', onAfter);
      setTimeout(cleanupAfterPrinting, 200);
      if (safetyPrintTimeoutId) clearTimeout(safetyPrintTimeoutId);
    };
    window.addEventListener('afterprint', onAfter);

    // zet print-preview styling aan
    document.body.classList.add('print-preview');
    window.print();
    // verwijder styling ná het printen
    window.onafterprint = () => {
      document.body.classList.remove('print-preview');
      window.onafterprint = null;
    };

    // safety fallback
    safetyPrintTimeoutId = setTimeout(() => {
      console.warn('Safety fallback cleanupAfterPrinting');
      cleanupAfterPrinting();
    }, 5000);
  }, 150);
}

/**
 * Pas de UI aan voor print-modus
 */
function prepareForPrint() {
  const slidein = document.getElementById('slidein');
  if (!slidein) return;
  // verberg knoppen
  slidein.querySelector('.close-btn')?.style.setProperty('display','none');
  slidein.querySelector('.action-buttons')?.style.setProperty('display','none');
  // voeg classes toe
  slidein.classList.add('print-optimized');
  // (optioneel) schaal tabel bij >30 rijen, etc.
}

/**
 * Cleanup na print of annulering
 */
export function cleanupAfterPrinting() {
  console.log('cleanupAfterPrinting');
  if (printTimeoutId) {
    clearTimeout(printTimeoutId);
    printTimeoutId = null;
  }
  if (safetyPrintTimeoutId) {
    clearTimeout(safetyPrintTimeoutId);
    safetyPrintTimeoutId = null;
  }
  document.body.classList.remove('print-mode');

  const slidein = document.getElementById('slidein');
  if (!slidein) return;
  // herstel knoppen
  slidein.querySelector('.close-btn')?.style.removeProperty('display');
  slidein.querySelector('.action-buttons')?.style.removeProperty('display');
  slidein.classList.remove('print-optimized');
}

/**
 * Voor alle browsers: bind native afterprint event
 */
if (typeof window !== 'undefined') {
  if ('onafterprint' in window) {
    window.onafterprint = cleanupAfterPrinting;
  } else {
    window.addEventListener('afterprint', cleanupAfterPrinting);
  }
}

// Exports
export default {
  initPrintHandler,
  startPrintProcess,
  cleanupAfterPrinting
};
