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
