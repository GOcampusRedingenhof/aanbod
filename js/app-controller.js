// app-controller.js
// Verbeterde architectuur voor de applicatie met duidelijke verantwoordelijkheden
import { getKlassen, getLessentabel, getFootnotes } from './loader.js';
import { buildGrid } from './grid-builder.js';
import { renderSlidein } from './detail-view.js';

/**
 * De AppController klasse is verantwoordelijk voor het beheren van de applicatie state
 * en het coördineren van de verschillende componenten.
 */
class AppController {
  constructor() {
    // Applicatie data
    this.klassen = [];
    this.lessentabel = [];
    this.footnotes = [];
    
    // State
    this.isInitialized = false;
    this.isLoading = false;
    this.currentKlasCode = null;
    
    // DOM elementen
    this.domainContainer = null;
    this.slidein = null;
    this.overlay = null;
    
    // Versie informatie
    this.version = '3.5.0';
  }
  
  /**
   * Initialiseert de app en laadt alle benodigde data
   */
  async init() {
    if (this.isInitialized || this.isLoading) return;
    
    try {
      this.isLoading = true;
      
      // Verkrijg referenties naar DOM elementen
      this.domainContainer = document.getElementById('domains-container');
      this.slidein = document.getElementById('slidein');
      this.overlay = document.getElementById('overlay');
      
      if (!this.domainContainer) {
        throw new Error('DOM element #domains-container niet gevonden');
      }
      
      // Toon een loading indicatie
      this.showLoadingIndicator();
      
      // Laad alle data parallel om sneller te starten
      const [klassenData, lessentabelData, footnotesData] = await Promise.all([
        getKlassen(),
        getLessentabel(),
        getFootnotes()
      ]);

      // Sla data op in de controller
      this.klassen = klassenData;
      this.lessentabel = lessentabelData;
      this.footnotes = footnotesData;
      
      console.log(`Data geladen: ${this.klassen.length} klassen, ${this.lessentabel.length} lesvakken`);

      // Render het grid met alle richtingen
      this.renderGrid();
      
      // Bind event handlers
      this.bindEvents();
      
      // Toon versie-informatie
      this.showVersionInfo();
      
      this.isInitialized = true;
      
    } catch (error) {
      console.error('Fout bij laden data:', error);
      this.showErrorMessage('Er is een probleem opgetreden bij het laden van de lessentabellen.');
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Toont een laad-indicator
   */
  showLoadingIndicator() {
    this.domainContainer.innerHTML = `
      <div class="loader-spinner"></div>
    `;
  }
  
  /**
   * Toont een foutmelding
   * @param {string} message - De foutmelding
   */
  showErrorMessage(message) {
    this.domainContainer.innerHTML = `
      <div class="error-message">${message}</div>
    `;
  }
  
  /**
   * Toont versie-informatie in de applicatie
   */
  showVersionInfo() {
    // Controleer of er al een versie-indicator bestaat
    let versionEl = document.querySelector('.version-indicator');
    
    if (!versionEl) {
      versionEl = document.createElement('div');
      versionEl.className = 'version-indicator';
      document.body.appendChild(versionEl);
    }
    
    versionEl.textContent = `v${this.version}`;
  }

  /**
   * Rendert het grid met alle domeinen, richtingen en finaliteiten
   */
  renderGrid() {
    this.domainContainer.innerHTML = '';
    buildGrid(this.klassen, this.domainContainer);
  }

  /**
   * Bindt event handlers aan UI elementen
   */
  bindEvents() {
    // Bind event handlers voor alle richtingknoppen
    const buttons = document.querySelectorAll("[data-code]");
    buttons.forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        const code = btn.getAttribute("data-code");
        this.openSlidein(code);
      });
    });
    
    // Bind event handler voor overlay en close knop
    if (this.overlay) {
      this.overlay.addEventListener('click', () => this.closeSlidein());
    }
    
    // Event handler voor ESC toets
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.slidein.classList.contains('open')) {
        this.closeSlidein();
      }
    });
  }

  /**
   * Opent het detail slidein paneel voor een specifieke richting
   * @param {string} klascode - De klascode van de geselecteerde richting
   */
  openSlidein(klascode) {
    // Niet opnieuw openen als dezelfde klas al getoond wordt
    if (this.currentKlasCode === klascode && this.slidein.classList.contains('open')) {
      return;
    }
    
    // Vind de geselecteerde klas op basis van klascode
    const klas = this.klassen.find(k => k.klascode === klascode);
    if (!klas) {
      console.error(`Klas met code ${klascode} niet gevonden!`);
      return;
    }

    // Zoek alle klassen die tot dezelfde richting behoren
    const klassenInZelfdeRichting = this.klassen.filter(k => k.richtingcode === klas.richtingcode);
    
    // Haal alle klasnummers op van dezelfde richting
    const klascodesInRichting = klassenInZelfdeRichting.map(k => k.klascode);
    
    // Haal alle lessen op die bij deze richting horen
    const lessenVoorRichting = this.lessentabel.filter(les => 
      klascodesInRichting.includes(les.klascode)
    );
    
    // Haal voetnoten op specifiek voor deze klas
    const voetnotenVoorKlas = this.footnotes.filter(f => f.klascode === klascode);

    // Render het slidein met alle gegevens
    renderSlidein(klas, lessenVoorRichting, voetnotenVoorKlas);
    
    // Update huidige klascode
    this.currentKlasCode = klascode;
    
    // Zorg dat focus in het slidein panel komt voor toegankelijkheid
    setTimeout(() => {
      this.slidein.focus();
    }, 300);
  }

  /**
   * Sluit het detail slidein paneel
   */
  closeSlidein() {
    if (this.slidein) {
      this.slidein.classList.remove("open");
    }
    
    if (this.overlay) {
      this.overlay.classList.remove("active");
    }
    
    // Reset huidige klascode
    this.currentKlasCode = null;
  }
  
  /**
   * Geeft toegang tot de geladen data voor externe modules
   */
  getData() {
    return {
      klassen: this.klassen,
      lessentabel: this.lessentabel,
      footnotes: this.footnotes
    };
  }
}

// Creëer een singleton instantie van de controller
const appController = new AppController();

// Maak de controller globaal beschikbaar voor HTML en externe componenten
window.LessentabellenApp = appController;

// Start de applicatie wanneer het document geladen is
document.addEventListener('DOMContentLoaded', () => {
  appController.init();
});

// Exporteer de controller voor gebruik in modules
export default appController;

// Aan het einde van de constructor in AppController, voeg toe:
this.isPrinting = false;
this.printCleanupTimeout = null;

// Voeg deze methoden toe aan de AppController class (vóór de laatste sluitingsaccolade):

/**
 * Start het printproces vanuit de centrale controller
 * @param {Object} klas - Het klasobject dat geprint moet worden
 */
startPrintProcess(klas) {
  if (this.isPrinting) {
    console.warn('Print proces al bezig');
    return;
  }
  
  // Markeer dat we bezig zijn met printen
  this.isPrinting = true;
  
  try {
    // Fase 1: Preparatie - DOM klaarmaken voor printen
    this.prepareDOMForPrinting(klas);
    
    // Fase 2: Print event triggeren met een betrouwbare timeout
    this.triggerPrint();
  } catch (error) {
    console.error('Fout tijdens printvoorbereiding:', error);
    this.cleanupAfterPrinting();
  }
},

/**
 * Bereid de DOM voor op het printen
 */
prepareDOMForPrinting(klas) {
  // 1. Voeg printmode class toe aan body
  document.body.classList.add('print-mode');
  
  // 2. Verberg elementen die niet nodig zijn voor printen
  document.querySelectorAll('.action-buttons, .close-btn, #overlay')
    .forEach(el => el.dataset.printHidden = true);
  
  // 3. Maak footer voor printversie
  this.createPrintFooter();
  
  // 4. Optimaliseer tabel voor printen
  this.optimizeTableForPrinting();
  
  // 5. Zet gerelateerde metadata
  if (klas) {
    document.querySelector('title').dataset.originalTitle = document.title;
    document.title = `Lessentabel ${klas.richting} (${klas.klascode})`;
  }
  
  // Log dat we klaar zijn met voorbereiden
  console.log('DOM voorbereid voor printen');
},

/**
 * Trigger het printdialoogvenster met een betrouwbare aanpak
 */
triggerPrint() {
  // Gebruik requestAnimationFrame voor betrouwbare timing
  // Dit wacht tot de browser klaar is met renderen
  requestAnimationFrame(() => {
    // Nog een RAF voor extra zekerheid dat de DOM is bijgewerkt
    requestAnimationFrame(() => {
      // Start het printproces
      window.print();
      
      // Luister naar het afterprint event
      window.addEventListener('afterprint', () => {
        this.cleanupAfterPrinting();
      }, { once: true });
      
      // Backup: als afterprint niet wordt getriggerd na 3 seconden
      this.printCleanupTimeout = setTimeout(() => {
        if (this.isPrinting) {
          console.warn('Print cleanup timeout getriggerd');
          this.cleanupAfterPrinting();
        }
      }, 3000);
    });
  });
},

/**
 * Maak de printfooter
 */
createPrintFooter() {
  // Verwijder bestaande footer indien aanwezig
  const existingFooter = document.getElementById('print-footer-container');
  if (existingFooter) existingFooter.remove();
  
  // Nieuwe footer maken
  const footer = document.createElement('div');
  footer.id = 'print-footer-container';
  
  // Footer inhoud
  footer.innerHTML = `
    <div class="quote">SAMEN VER!</div>
    <div class="page-info">GO Campus Redingenhof</div>
    <div class="datum">Afgedrukt op: ${document.getElementById('datum-print')?.textContent || new Date().toLocaleDateString("nl-BE")}</div>
  `;
  
  // Voeg toe aan slidein
  const slidein = document.getElementById('slidein');
  if (slidein) slidein.appendChild(footer);
},

/**
 * Optimaliseer tabel voor printen
 */
optimizeTableForPrinting() {
  const table = document.querySelector('.lessentabel');
  if (!table) return;
  
  // Zorg dat de tabel fixed layout gebruikt
  table.style.tableLayout = 'fixed';
  
  // Stel page-break-inside: avoid in voor belangrijke rijen
  table.querySelectorAll('thead, .categorie-header, .totaal-row, .stage-row')
    .forEach(row => {
      row.style.pageBreakInside = 'avoid';
    });
  
  // Zorg dat thead correct wordt herhaald op elke pagina
  const thead = table.querySelector('thead');
  if (thead) {
    thead.style.display = 'table-header-group';
  }
},

/**
 * Opruimen na het printen
 */
cleanupAfterPrinting() {
  // Reset alleen als we in printmodus zijn
  if (!this.isPrinting) return;
  
  // Clear timeout
  if (this.printCleanupTimeout) {
    clearTimeout(this.printCleanupTimeout);
    this.printCleanupTimeout = null;
  }
  
  // Verwijder printmode class
  document.body.classList.remove('print-mode');
  
  // Herstel verborgen elementen
  document.querySelectorAll('[data-print-hidden]').forEach(el => {
    delete el.dataset.printHidden;
  });
  
  // Verwijder printfooter
  const printFooter = document.getElementById('print-footer-container');
  if (printFooter) printFooter.remove();
  
  // Herstel tabelstyling
  const table = document.querySelector('.lessentabel');
  if (table) {
    table.style.tableLayout = '';
    
    table.querySelectorAll('thead, .categorie-header, .totaal-row, .stage-row')
      .forEach(row => {
        row.style.pageBreakInside = '';
      });
    
    const thead = table.querySelector('thead');
    if (thead) {
      thead.style.display = '';
    }
  }
  
  // Herstel titel
  const title = document.querySelector('title');
  if (title && title.dataset.originalTitle) {
    document.title = title.dataset.originalTitle;
    delete title.dataset.originalTitle;
  }
  
  // Reset printingstatus
  this.isPrinting = false;
  
  console.log('Print cleanup voltooid');
},
