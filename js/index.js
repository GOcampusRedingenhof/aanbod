// index.js: Centrale module voor Lessentabellen App

import appController from './app-controller.js';
import { buildGrid } from './grid-builder.js';
import { renderSlidein } from './detail-view.js';

class LessentabellenAppClass {
  constructor() {
    this.currentKlasCode = null;
    this.klassen = [];
    this.lessentabel = [];
    this.footnotes = [];
    
    this.initEventListeners();
  }

  initEventListeners() {
    document.addEventListener('DOMContentLoaded', () => this.init());
    document.addEventListener('error', this.handleGlobalError);
    
    // Overlay klik binding toevoegen voor sluiten slidein
    document.addEventListener('DOMContentLoaded', () => {
      document.getElementById('overlay').addEventListener('click', () => this.closeSlidein());
    });
  }

  async init() {
    try {
      // Toon een loading indicatie
      document.getElementById('domains-container').innerHTML = `
        <div class="loader-spinner"></div>
      `;
      
      await appController.initialize();
      const { klassen, lessentabel, footnotes } = appController.getData();
      
      // Bewaar data in het app object
      this.klassen = klassen;
      this.lessentabel = lessentabel;
      this.footnotes = footnotes;
      
      console.log(`Data geladen: ${this.klassen.length} klassen, ${this.lessentabel.length} lesvakken`);
      
      this.setupUI();
    } catch (error) {
      this.handleInitError(error);
    }
  }

  setupUI() {
    const container = document.getElementById('domains-container');
    container.innerHTML = ''; // Clear container
    buildGrid(this.klassen, container);
    this.bindDomainEvents();
  }

  bindDomainEvents() {
    const buttons = document.querySelectorAll("[data-code]");
    buttons.forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        const code = btn.getAttribute("data-code");
        this.openSlidein(code);
      });
    });
  }

  openSlidein(klascode) {
    this.currentKlasCode = klascode; // Bewaar huidige klascode
    
    const klas = this.klassen.find(k => k.klascode === klascode);
    
    if (klas) {
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
    }
  }

  closeSlidein() {
    document.getElementById("slidein").classList.remove("open");
    document.getElementById("overlay").classList.remove("active");
  }
  
  // Print handlers
  startPrintProcess(klas) {
    console.log('Print proces gestart voor klas', klas.klascode);
    document.body.classList.add('print-mode');
    window.print();
  }
  
  cleanupAfterPrinting() {
    console.log('Opruimen na afdrukken');
    document.body.classList.remove('print-mode');
  }

  handleInitError(error) {
    console.error('App initialisatie mislukt:', error);
    const container = document.getElementById('domains-container');
    container.innerHTML = `
      <div class="error-message">
        Kon lessentabellen niet laden. Probeer de pagina te herladen.
      </div>
    `;
  }

  handleGlobalError(event) {
    console.error('Onverwachte fout:', event.error);
  }
}

// Instantieer de app class
const LessentabellenApp = new LessentabellenAppClass();

// Maak de app globaal beschikbaar voor HTML access
window.LessentabellenApp = LessentabellenApp;

// Export voor module gebruik
export default LessentabellenApp;
