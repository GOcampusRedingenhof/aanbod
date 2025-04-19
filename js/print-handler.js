// js/print-handler.js

/**
 * Initialiseert de print handler voor een specifieke klas
 * @param {Object} klas - Het klasobject met informatie over de richting
 */
export function initPrintHandler(klas) {
  const printButton = document.querySelector('#print-button');
  if (!printButton) return;

  // Zet klascode als data attribuut op de printknop
  printButton.dataset.klas = klas.klascode;

  // Huidige datum voor in de footer
  const datumEl = document.getElementById('datum-print');
  if (datumEl) {
    const datum = new Date().toLocaleDateString('nl-BE', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
    datumEl.textContent = datum;
  }

  // Bind click event
  printButton.addEventListener('click', () => {
    startPrintProcess(klas);
  });
}

/**
 * Start het printproces voor een klas
 * @param {Object} klas - Het klasobject met informatie over de richting
 */
export function startPrintProcess(klas) {
  try {
    // Pas documenttitel aan voor correcte PDF-bestandsnaam
    document.title = `Lessentabel ${klas.richting} - Campus Redingenhof`;
    
    // Zet body in printmodus
    document.body.classList.add('print-mode');
    
    // Prepare for print
    prepareForPrint(klas);
    
    // Timer om de browser genoeg tijd te geven om de layout aan te passen
    setTimeout(() => {
      window.print();
      
      // Reset na printen
      setTimeout(() => {
        cleanupAfterPrinting();
      }, 1000);
    }, 300);
  } catch (error) {
    console.error('Fout bij printen:', error);
    window.print(); // Fallback: gewoon printen
  }
}

/**
 * Bereidt het document voor op printen met automatische schaling
 * @param {Object} klas - Het klasobject
 */
function prepareForPrint(klas) {
  try {
    // Haal het slide-in element op dat afgedrukt moet worden
    const slidein = document.getElementById('slidein');
    if (!slidein) return;
    
    // Verberg de actieknoppen tijdens printen
    const actionButtons = slidein.querySelector('.action-buttons');
    if (actionButtons) {
      actionButtons.setAttribute('data-original-display', actionButtons.style.display);
      actionButtons.style.display = 'none';
    }
    
    // Verwijder onnodige marges en padding voor maximale printruimte
    slidein.style.padding = '0.5cm';
    
    // Zoek de tabel
    const table = slidein.querySelector('.lessentabel');
    if (table) {
      // Reset eerst eventuele eerdere transformaties
      table.style.transform = '';
      
      // Sla originele stijlen op
      const originalFontSize = window.getComputedStyle(table).fontSize;
      table.setAttribute('data-original-font-size', originalFontSize);
      
      // Meet de tabel en het beschikbare gebied
      const totalHeight = slidein.scrollHeight;
      const availableHeight = 1050; // ~A4 hoogte in pixels @ 96DPI
      
      if (totalHeight > availableHeight) {
        // Bereken schaalfactor om op een pagina te passen
        const scale = availableHeight / totalHeight;
        const scaledFontSize = parseFloat(originalFontSize) * scale;
        
        // Pas de tabel aan
        table.style.fontSize = Math.max(8, Math.floor(scaledFontSize)) + 'px';
        
        // Maak tabelcellen compacter
        const cells = table.querySelectorAll('td, th');
        cells.forEach(cell => {
          cell.style.padding = '3px';
        });
      }
    }
  } catch (error) {
    console.error('Fout bij voorbereiden print:', error);
  }
}

/**
 * Ruimt op na het printen
 */
function cleanupAfterPrinting() {
  document.body.classList.remove('print-mode');
  
  const slidein = document.getElementById('slidein');
  if (!slidein) return;
  
  // Herstel de actieknoppen
  const actionButtons = slidein.querySelector('.action-buttons');
  if (actionButtons && actionButtons.hasAttribute('data-original-display')) {
    actionButtons.style.display = actionButtons.getAttribute('data-original-display');
    actionButtons.removeAttribute('data-original-display');
  }
  
  // Herstel padding
  slidein.style.padding = '';
  
  // Herstel tabel
  const table = slidein.querySelector('.lessentabel');
  if (table) {
    if (table.hasAttribute('data-original-font-size')) {
      table.style.fontSize = table.getAttribute('data-original-font-size');
      table.removeAttribute('data-original-font-size');
    }
    
    // Herstel padding van cellen
    const cells = table.querySelectorAll('td, th');
    cells.forEach(cell => {
      cell.style.padding = '';
    });
  }
}
