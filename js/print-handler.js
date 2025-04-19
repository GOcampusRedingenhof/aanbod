// 1js/print-handler.js - Volledig vernieuwde versie
// Verbeterde printfunctionaliteit voor de lessentabellen applicatie

/**
 * Print controller object voor centrale controle over het printproces
 */
const PrintController = {
  /**
   * Status van het printproces
   */
  state: {
    isPrinting: false,
    originalTitle: document.title,
    originalScrollPos: 0,
    printKlas: null
  },
  
  /**
   * Initialiseert de print handler voor een specifieke klas
   * @param {Object} klas - Het klasobject 
   */
  init(klas) {
    // Zoek de print-knop
    const printBtn = document.getElementById('print-button');
    if (!printBtn) return;
    
    // Verwijder oude listeners om te voorkomen dat er meerdere worden gekoppeld
    const newBtn = printBtn.cloneNode(true);
    printBtn.parentNode.replaceChild(newBtn, printBtn);
    
    // Voeg nieuwe event listener toe
    newBtn.addEventListener('click', (e) => {
      e.preventDefault();
      this.startPrint(klas);
    });
    
    // Zorg ervoor dat we reageren op het 'afterprint' event
    window.removeEventListener('afterprint', this.afterPrint);
    window.addEventListener('afterprint', this.afterPrint.bind(this));
    
    // Luister ook naar de escape toets als backup
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.state.isPrinting) {
        this.afterPrint();
      }
    });
    
    console.log('Print handler geïnitialiseerd voor', klas?.richting || 'onbekende richting');
  },
  
  /**
   * Start het printproces
   * @param {Object} klas - Het klasobject
   */
  startPrint(klas) {
    // Voorkom dubbel printen
    if (this.state.isPrinting) return;
    
    console.log('Print proces gestart voor', klas?.richting || 'onbekende richting');
    
    // Sla huidige status op
    this.state.isPrinting = true;
    this.state.originalTitle = document.title;
    this.state.originalScrollPos = window.scrollY;
    this.state.printKlas = klas;
    
    // Voeg print-specifieke klassen toe
    document.body.classList.add('print-mode');
    
    // Verberg elementen die niet afgedrukt moeten worden
    this.hideElementsForPrint();
    
    // Bereid het slidein element voor op printen
    this.prepareSlideinForPrint();
    
    // Update document titel voor printen
    if (klas && klas.richting) {
      document.title = `${klas.richting} - Lessentabel`;
    }
    
    // Voeg datum toe aan footer als die niet al is ingevuld
    const datumEl = document.getElementById("datum-print");
    if (datumEl && !datumEl.textContent) {
      const nu = new Date();
      try {
        datumEl.textContent = nu.toLocaleDateString('nl-BE', {
          day: '2-digit',
          month: 'long',
          year: 'numeric'
        });
      } catch (error) {
        datumEl.textContent = `${nu.getDate()}-${nu.getMonth() + 1}-${nu.getFullYear()}`;
      }
    }
    
    // Wacht kort zodat de DOM kan updaten voordat we gaan afdrukken
    setTimeout(() => {
      // Start afdrukdialoog
      window.print();
      
      // Begin timeout als fallback voor afterprint event
      this.startPrintTimeout();
    }, 200);
  },
  
  /**
   * Voert opruimtaken uit na het printen
   */
  afterPrint() {
    // Als we niet aan het printen waren, doe niets
    if (!this.state.isPrinting) return;
    
    console.log('Print proces voltooid, bezig met opruimen');
    
    // Reset print status
    this.state.isPrinting = false;
    
    // Herstel document titel
    document.title = this.state.originalTitle;
    
    // Verwijder print-specifieke klassen
    document.body.classList.remove('print-mode');
    
    // Herstel elementen die we verborgen hadden
    this.restoreHiddenElements();
    
    // Herstel slidein element
    this.restoreSlidein();
    
    // Scroll terug naar originele positie
    window.scrollTo(0, this.state.originalScrollPos);
    
    console.log('Print opruimen voltooid');
  },
  
  /**
   * Start een timeout als fallback voor het afterprint event
   * (dat niet door alle browsers wordt ondersteund)
   */
  startPrintTimeout() {
    // Fallback mechanisme voor browsers die het afterprint event niet ondersteunen
    setTimeout(() => {
      if (this.state.isPrinting) {
        console.log('Print timeout bereikt, handmatige cleanup');
        this.afterPrint();
      }
    }, 5000); // 5 seconden timeout
  },
  
  /**
   * Verbergt elementen die niet afgedrukt moeten worden
   */
  hideElementsForPrint() {
    // Verberg de close knop
    const closeBtn = document.querySelector('.close-btn');
    if (closeBtn) {
      closeBtn.setAttribute('data-original-display', closeBtn.style.display || '');
      closeBtn.style.display = 'none';
    }
    
    // Verberg actieknoppen
    const actionBtns = document.querySelector('.action-buttons');
    if (actionBtns) {
      actionBtns.setAttribute('data-original-display', actionBtns.style.display || '');
      actionBtns.style.display = 'none';
    }
    
    // Verberg overlay
    const overlay = document.getElementById('overlay');
    if (overlay) {
      overlay.setAttribute('data-original-display', overlay.style.display || '');
      overlay.style.display = 'none';
    }
    
    // Verberg de grid container
    const domainsContainer = document.getElementById('domains-container');
    if (domainsContainer) {
      domainsContainer.setAttribute('data-original-display', domainsContainer.style.display || '');
      domainsContainer.style.display = 'none';
    }
    
    // Verberg de titel en slogan
    const title = document.querySelector('.lessentabellen-title');
    if (title) {
      title.setAttribute('data-original-display', title.style.display || '');
      title.style.display = 'none';
    }
    
    const slogan = document.querySelector('.slogan');
    if (slogan) {
      slogan.setAttribute('data-original-display', slogan.style.display || '');
      slogan.style.display = 'none';
    }
  },
  
  /**
   * Herstelt verborgen elementen na het printen
   */
  restoreHiddenElements() {
    // Helper functie om originele display terug te zetten
    const restoreDisplay = (selector) => {
      const element = document.querySelector(selector);
      if (element && element.hasAttribute('data-original-display')) {
        element.style.display = element.getAttribute('data-original-display');
        element.removeAttribute('data-original-display');
      }
    };
    
    // Herstel alle verborgen elementen
    restoreDisplay('.close-btn');
    restoreDisplay('.action-buttons');
    restoreDisplay('#overlay');
    restoreDisplay('#domains-container');
    restoreDisplay('.lessentabellen-title');
    restoreDisplay('.slogan');
  },
  
  /**
   * Bereidt het slidein element voor op printen
   */
  prepareSlideinForPrint() {
    const slidein = document.getElementById('slidein');
    if (!slidein) return;
    
    // Zorg ervoor dat het slidein zichtbaar is
    slidein.classList.add('open');
    
    // Bewaar originele stijlen die we aanpassen
    slidein.setAttribute('data-original-position', slidein.style.position || '');
    slidein.setAttribute('data-original-transform', slidein.style.transform || '');
    slidein.setAttribute('data-original-width', slidein.style.width || '');
    slidein.setAttribute('data-original-height', slidein.style.height || '');
    slidein.setAttribute('data-original-top', slidein.style.top || '');
    slidein.setAttribute('data-original-right', slidein.style.right || '');
    slidein.setAttribute('data-original-zIndex', slidein.style.zIndex || '');
    
    // Pas stijlen aan voor printen
    slidein.style.position = 'relative';
    slidein.style.transform = 'none';
    slidein.style.width = '100%';
    slidein.style.height = 'auto';
    slidein.style.top = '0';
    slidein.style.right = '0';
    slidein.style.zIndex = '1';
    
    // Voeg print class toe
    slidein.classList.add('print-ready');
    
    // Schaal lessentabel indien nodig voor printen
    const table = slidein.querySelector('.lessentabel');
    if (table) {
      table.classList.add('print-optimized');
      
      // Reset eventuele schaling die voor het scherm was
      table.style.transform = '';
      table.style.fontSize = '';
      table.style.marginBottom = '';
    }
  },
  
  /**
   * Herstelt het slidein element naar de originele staat
   */
  restoreSlidein() {
    const slidein = document.getElementById('slidein');
    if (!slidein) return;
    
    // Verwijder print class
    slidein.classList.remove('print-ready');
    
    // Herstel originele stijlen
    if (slidein.hasAttribute('data-original-position')) {
      slidein.style.position = slidein.getAttribute('data-original-position');
      slidein.removeAttribute('data-original-position');
    }
    
    if (slidein.hasAttribute('data-original-transform')) {
      slidein.style.transform = slidein.getAttribute('data-original-transform');
      slidein.removeAttribute('data-original-transform');
    }
    
    if (slidein.hasAttribute('data-original-width')) {
      slidein.style.width = slidein.getAttribute('data-original-width');
      slidein.removeAttribute('data-original-width');
    }
    
    if (slidein.hasAttribute('data-original-height')) {
      slidein.style.height = slidein.getAttribute('data-original-height');
      slidein.removeAttribute('data-original-height');
    }
    
    if (slidein.hasAttribute('data-original-top')) {
      slidein.style.top = slidein.getAttribute('data-original-top');
      slidein.removeAttribute('data-original-top');
    }
    
    if (slidein.hasAttribute('data-original-right')) {
      slidein.style.right = slidein.getAttribute('data-original-right');
      slidein.removeAttribute('data-original-right');
    }
    
    if (slidein.hasAttribute('data-original-zIndex')) {
      slidein.style.zIndex = slidein.getAttribute('data-original-zIndex');
      slidein.removeAttribute('data-original-zIndex');
    }
    
    // Herstel tabel indien nodig
    const table = slidein.querySelector('.lessentabel');
    if (table) {
      table.classList.remove('print-optimized');
    }
    
    // Als we toevallig de window.LessentabellenApp kunnen bereiken,
    // laat het deze herstel-logica ook toepassen
    if (window.LessentabellenApp && 
        typeof window.LessentabellenApp.detectAndScaleTable === 'function') {
      window.LessentabellenApp.detectAndScaleTable();
    }
  }
};

/**
 * Exporteerbare functies om de PrintController aan te roepen
 */

/**
 * Initialiseert de print handler voor een specifieke klas
 * @param {Object} klas - Het klasobject 
 */
export function initPrintHandler(klas) {
  PrintController.init(klas);
}

/**
 * Start het printproces voor een specifieke klas
 * @param {Object} klas - Het klasobject
 */
export function startPrintProcess(klas) {
  PrintController.startPrint(klas);
}

/**
 * Voert opruimtaken uit na het printen
 */
export function cleanupAfterPrinting() {
  PrintController.afterPrint();
}

// Exporteer de module
export default {
  initPrintHandler,
  startPrintProcess,
  cleanupAfterPrinting
};
