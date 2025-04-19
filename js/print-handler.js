// js/print-handler.js — Verbeterde versie met cross-browser afterprint fallback en dynamische titel

/**
 * Globale print timeout ID om timeouts te kunnen annuleren
 */
let printTimeoutId = null;

/**
 * Initialiseert de print handler voor een specifieke klas
 */
export function initPrintHandler(klas) {
  const printButton = document.getElementById('print-button');
  if (!printButton) return;

  // Clone en vervang om oude handlers te verwijderen
  const newBtn = printButton.cloneNode(true);
  printButton.parentNode.replaceChild(newBtn, printButton);

  newBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      startPrintProcess(klas);
    } catch (error) {
      console.error('Fout bij starten printproces:', error);
      cleanupAfterPrinting();
    }
  });

  updatePrintDate();
}

/**
 * Update de datum die wordt weergegeven in de print footer
 */
function updatePrintDate() {
  const datumEl = document.getElementById('datum-print');
  if (!datumEl) return;
  try {
    const datum = new Date().toLocaleDateString('nl-BE', {
      day: '2-digit', month: 'long', year: 'numeric'
    });
    datumEl.textContent = datum;
  } catch {
    const now = new Date();
    datumEl.textContent = `${now.getDate()}-${now.getMonth() + 1}-${now.getFullYear()}`;
  }
}

/**
 * Start het printproces voor een specifieke klas
 */
export function startPrintProcess(klas) {
  console.log('Printproces gestart voor klas', klas?.klascode);

  saveCurrentState();

  if (document.body.classList.contains('print-mode')) {
    console.warn('Printmodus al actief, opruimen voordat je opnieuw print');
    cleanupAfterPrinting();
  }
  document.body.classList.add('print-mode');
  prepareForPrint();

  // Dynamische document.title voor correcte bestandsnaam
  window._originalTitle = document.title;
  document.title = `${klas.richting} – ${window._originalTitle}`;

  // Fallback voor browsers (Safari/Edge) via matchMedia
  const mql = window.matchMedia('print');
  const mmListener = (evt) => {
    if (!evt.matches) {
      cleanupAfterPrinting();
      mql.removeListener(mmListener);
    }
  };
  mql.addListener(mmListener);

  window.printModeStartTime = Date.now();
  if (printTimeoutId) clearTimeout(printTimeoutId);

  // Wacht even voor DOM-update, voeg before/afterprint handlers toe
  printTimeoutId = setTimeout(() => {
    const beforePrintHandler = () => {
      window.removeEventListener('beforeprint', beforePrintHandler);
    };
    window.addEventListener('beforeprint', beforePrintHandler);

    const afterPrintHandler = () => {
      window.removeEventListener('afterprint', afterPrintHandler);
      setTimeout(cleanupAfterPrinting, 500);
    };
    window.addEventListener('afterprint', afterPrintHandler);

    window.print();

    // Safety timeout voor when afterprint niet vuurt
    const safetyTimeoutId = setTimeout(() => {
      console.warn('Safety timeout: afterprint niet gedetecteerd, handmatig opruimen');
      cleanupAfterPrinting();
    }, 5000);
    window.safetyPrintTimeoutId = safetyTimeoutId;
  }, 200);
}

/**
 * Bewaar de huidige UI-staat voor herstel na print
 */
function saveCurrentState() {
  const slidein = document.getElementById('slidein');
  if (!slidein) return;
  window.printStateBackup = {
    closeButtonDisplay: slidein.querySelector('.close-btn')?.style.display || '',
    actionButtonsDisplay: slidein.querySelector('.action-buttons')?.style.display || '',
    slideinPadding: slidein.style.padding || '',
    slideinClasses: [...slidein.classList],
    tableTransform: slidein.querySelector('.lessentabel')?.style.transform || '',
    tableFontSize: slidein.querySelector('.lessentabel')?.style.fontSize || '',
    tableMarginBottom: slidein.querySelector('.lessentabel')?.style.marginBottom || ''
  };
}

/**
 * Pas UI aan voor een printvriendelijke weergave
 */
function prepareForPrint() {
  const slidein = document.getElementById('slidein');
  if (!slidein) return;
  try {
    // Verberg interactieve elementen
    slidein.querySelectorAll('.close-btn, .action-buttons').forEach(el => el.style.display = 'none');
    slidein.classList.add('print-optimized');

    // Verdere print-specifieke aanpassingen
    const table = slidein.querySelector('.lessentabel');
    if (table && table.querySelectorAll('tbody tr').length > 30) {
      table.style.fontSize = '9pt';
      slidein.classList.add('scaled-table');
    }
    console.log('Print voorbereidingen voltooid');
  } catch (e) {
    console.error('Fout tijdens printvoorbereiding:', e);
  }
}

/**
 * Herstel UI na het printen
 */
export function cleanupAfterPrinting() {
  console.log('Opruimen na printen gestart');
  if (printTimeoutId) { clearTimeout(printTimeoutId); printTimeoutId = null; }
  if (window.safetyPrintTimeoutId) { clearTimeout(window.safetyPrintTimeoutId); window.safetyPrintTimeoutId = null; }

  document.body.classList.remove('print-mode');
  try {
    restoreUIState();
    console.log('Opruimen na printen voltooid');
  } catch (e) {
    console.error('Fout tijdens opruimen:', e);
    forceResetUI();
  }

  // Herstel originele document title
  if (window._originalTitle) {
    document.title = window._originalTitle;
    window._originalTitle = null;
  }
}

/**
 * Herstel UI-elementen naar originele staat
 */
function restoreUIState() {
  const slidein = document.getElementById('slidein');
  if (!slidein || !window.printStateBackup) return;

  const { closeButtonDisplay, actionButtonsDisplay, slideinPadding, slideinClasses,
          tableTransform, tableFontSize, tableMarginBottom } = window.printStateBackup;

  slidein.querySelector('.close-btn').style.display = closeButtonDisplay;
  slidein.querySelector('.action-buttons').style.display = actionButtonsDisplay;
  slidein.style.padding = slideinPadding;
  slidein.className = slideinClasses.join(' ');

  const table = slidein.querySelector('.lessentabel');
  if (table) {
    table.style.transform = tableTransform;
    table.style.fontSize = tableFontSize;
    table.style.marginBottom = tableMarginBottom;
  }

  window.printStateBackup = null;
}

/**
 * Forceer UI-reset bij ernstige fouten
 */
function forceResetUI() {
  console.warn('Forceer UI reset vanwege fouten');
  document.body.classList.remove('print-mode');
  const slidein = document.getElementById('slidein');
  if (slidein) { slidein.classList.remove('print-optimized', 'scaled-table'); }
}
