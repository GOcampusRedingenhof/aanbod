// js/print-handler.js

// Bewaar globale referenties naar functies voor cleanup
let activePrintHandlers = {
  printButtonHandler: null,
  beforePrintHandler: null,
  afterPrintHandler: null,
  safetyTimeout: null
};

/**
 * Initialiseert de print handler voor een specifieke klas
 * @param {Object} klas - Het klasobject met informatie over de richting
 */
export function initPrintHandler(klas) {
  const printButton = document.querySelector('#print-button');
  if (!printButton) return;

  // Reinig eerst eventuele bestaande handlers
  cleanupPrintHandlers();
  
  // Maak nieuwe handlers
  activePrintHandlers.printButtonHandler = (e) => handlePrintButtonClick(e, klas);
  activePrintHandlers.beforePrintHandler = (e) => handleBeforePrint(e, klas);
  activePrintHandlers.afterPrintHandler = handleAfterPrint;
  
  // Zet klascode als data attribuut op de printknop
  printButton.dataset.klas = klas.klascode;
  printButton.dataset.richting = klas.richting || '';

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

  // Bind event listeners met nieuwe handlers
  printButton.addEventListener('click', activePrintHandlers.printButtonHandler);
  window.addEventListener('beforeprint', activePrintHandlers.beforePrintHandler);
  window.addEventListener('afterprint', activePrintHandlers.afterPrintHandler);
}

/**
 * Verwijdert alle actieve print handlers
 */
function cleanupPrintHandlers() {
  // Verwijder button handler
  if (activePrintHandlers.printButtonHandler) {
    const printButton = document.querySelector('#print-button');
    if (printButton) {
      printButton.removeEventListener('click', activePrintHandlers.printButtonHandler);
    }
  }
  
  // Verwijder window handlers
  if (activePrintHandlers.beforePrintHandler) {
    window.removeEventListener('beforeprint', activePrintHandlers.beforePrintHandler);
  }
  
  if (activePrintHandlers.afterPrintHandler) {
    window.removeEventListener('afterprint', activePrintHandlers.afterPrintHandler);
  }
  
  // Annuleer safety timeout
  if (activePrintHandlers.safetyTimeout) {
    clearTimeout(activePrintHandlers.safetyTimeout);
  }
  
  // Reset alle handlers
  activePrintHandlers = {
    printButtonHandler: null,
    beforePrintHandler: null,
    afterPrintHandler: null,
    safetyTimeout: null
  };
}

// Event handler voor print button
function handlePrintButtonClick(e, klas) {
  e.preventDefault();
  e.stopPropagation();
  
  // Sla UI-state op
  const originalState = saveUIState();
  
  try {
    // Log event om debugging te vergemakkelijken
    console.log('Print knop geklikt voor klas:', klas.klascode);
    
    // Meld browser dat we gaan afdrukken
    document.body.classList.add('print-mode');
    
    // Bereid voor op printen
    prepareForPrint();
    
    // Set a safety timeout to ensure UI is released
    clearTimeout(activePrintHandlers.safetyTimeout);
    activePrintHandlers.safetyTimeout = setTimeout(() => {
      console.log('Safety timeout: resetting UI after print');
      
      // Verwijder print-mode class
      document.body.classList.remove('print-mode');
      
      // Volledige cleanup
      restoreUIState(originalState);
      cleanupPrintHandlers();
      
    }, 5000); // 5 seconden timeout
    
    // Print met een kleine vertraging om de browser tijd te geven om de layout aan te passen
    setTimeout(() => {
      try {
        window.print();
      } catch (printError) {
        console.error('Fout tijdens printen:', printError);
        // Bij fout direct opschonen
        document.body.classList.remove('print-mode');
        restoreUIState(originalState);
      }
    }, 200);
  } catch (error) {
    console.error('Print voorbereiding error:', error);
    // Herstel UI bij fout
    document.body.classList.remove('print-mode');
    restoreUIState(originalState);
  }
}

// Voordat het printdialoogvenster verschijnt
function handleBeforePrint(e, klas) {
  console.log('beforeprint event met klas:', klas?.klascode);
  
  if (!document.body.classList.contains('print-mode')) {
    // Als print werd gestart door browser (bijv. Ctrl+P) in plaats van onze knop
    console.log('Print gestart door browser, niet via onze knop');
    document.body.classList.add('print-mode');
    prepareForPrint();
    
    // Stel safety timeout in
    clearTimeout(activePrintHandlers.safetyTimeout);
    activePrintHandlers.safetyTimeout = setTimeout(() => {
      console.log('Safety timeout: resetting UI after browser-initiated print');
      document.body.classList.remove('print-mode');
      restoreUIState(saveUIState());
    }, 5000);
  }
}

// Nadat het printdialoogvenster is gesloten
function handleAfterPrint(e) {
  console.log('afterprint event gedetecteerd');
  
  // Annuleer veiligheids-timeout
  clearTimeout(activePrintHandlers.safetyTimeout);
  
  // Verwijder printmodus
  document.body.classList.remove('print-mode');
  
  // Herstel UI
  restoreUIState(saveUIState());
  
  // Wacht kort en voer dan volledige cleanup uit
  setTimeout(() => {
    // Extra check om er zeker van te zijn dat printmodus is verwijderd
    document.body.classList.remove('print-mode');
    
    // Werk UI bij
    const slidein = document.getElementById('slidein');
    if (slidein) {
      // Forceer herstel van slidein styles
      slidein.style.padding = '';
      slidein.classList.remove('scaled-for-print');
      slidein.classList.remove('extreme');
      
      // Herstel tabel layout
      const table = slidein.querySelector('.lessentabel');
      if (table) {
        table.style.fontSize = '';
        table.style.transform = '';
        
        // Herstel cell padding
        const cells = table.querySelectorAll('td, th');
        cells.forEach(cell => {
          cell.style.padding = '';
        });
      }
    }
  }, 100);
}

// Slaat de huidige UI-state op
function saveUIState() {
  return {
    title: document.title,
    scrollY: window.scrollY,
    bodyClasses: [...document.body.classList],
    slideinOpen: document.getElementById('slidein')?.classList.contains('open') || false,
    overlayActive: document.getElementById('overlay')?.classList.contains('active') || false
  };
}

// Herstelt UI-state
function restoreUIState(state) {
  if (!state) return;
  
  // Verwijder printmodus
  document.body.classList.remove('print-mode');
  
  // Herstel titel
  if (state.title) {
    document.title = state.title;
  }
  
  // Herstel slidein
  const slidein = document.getElementById('slidein');
  if (slidein) {
    // Herstel padding
    slidein.style.padding = '';
    
    // Zorg dat de close-knop weer werkt
    const closeBtn = slidein.querySelector('.close-btn');
    if (closeBtn) {
      closeBtn.style.display = '';
      closeBtn.style.pointerEvents = 'auto';
    }
    
    // Zorg dat actieknoppen weer zichtbaar zijn
    const actionButtons = slidein.querySelector('.action-buttons');
    if (actionButtons) {
      actionButtons.style.display = '';
    }
    
    // Herstel tabel
    const table = slidein.querySelector('.lessentabel');
    if (table) {
      table.style.fontSize = '';
      table.style.transform = '';
      
      // Herstel cell padding
      const cells = table.querySelectorAll('td, th');
      cells.forEach(cell => {
        cell.style.padding = '';
      });
    }
    
    // Verwijder printgerelateerde klassen
    slidein.classList.remove('scaled-for-print');
    slidein.classList.remove('extreme');
  }
  
  // Zorg dat overlay correct is
  const overlay = document.getElementById('overlay');
  if (overlay) {
    if (state.overlayActive) {
      overlay.classList.add('active');
    } else {
      overlay.classList.remove('active');
    }
  }
  
  // Force een browser repaint om glitches te voorkomen
  document.body.style.display = 'none';
  setTimeout(() => {
    document.body.style.display = '';
    
    // Herstel scroll positie
    if (state.scrollY !== undefined) {
      window.scrollTo(0, state.scrollY);
    }
  }, 5);
}

// Bereid het document voor op printen
function prepareForPrint() {
  const slidein = document.getElementById('slidein');
  if (!slidein) return;
  
  // Verberg interactieve elementen
  const closeBtn = slidein.querySelector('.close-btn');
  if (closeBtn) {
    closeBtn.style.display = 'none';
    closeBtn.style.pointerEvents = 'none';
  }
  
  const actionButtons = slidein.querySelector('.action-buttons');
  if (actionButtons) {
    actionButtons.style.display = 'none';
  }
  
  // Optimaliseer layout
  slidein.style.padding = '0.5cm';
  
  // Optimaliseer tabel voor printen
  const table = slidein.querySelector('.lessentabel');
  if (table) {
    // Reset eerst
    table.style.fontSize = '';
    table.style.transform = '';
    
    // Meet de tabel
    const tableHeight = table.offsetHeight;
    
    // Pas fontsize aan op basis van grootte
    if (tableHeight > 900) {
      slidein.classList.add('scaled-for-print');
      
      // Extreem grote tabellen nog kleiner maken
      if (tableHeight > 1200) {
        slidein.classList.add('extreme');
      }
    }
  }
}
