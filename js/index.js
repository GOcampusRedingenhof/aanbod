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
    
    // Overlay klik binding toevoegen voor sluiten slidein
    document.addEventListener('DOMContentLoaded', () => {
      const overlay = document.getElementById('overlay');
      if (overlay) {
        overlay.addEventListener('click', () => this.closeSlidein());
      }
    });
  }

  async init() {
    try {
      // Toon een loading indicatie
      const container = document.getElementById('domains-container');
      if (container) {
        container.innerHTML = `<div class="loader-spinner"></div>`;
      }
      
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
    if (!container) return;
    
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
    
    // Zoek de klas op basis van klascode
    const klas = this.klassen.find(k => k.klascode === klascode);
    
    if (klas) {
      // Alle klassen in dezelfde graad en met dezelfde richtingcode als de geselecteerde klas
      const klassenInZelfdeGraad = this.klassen.filter(k => 
        k.graad === klas.graad && 
        k.richtingcode === klas.richtingcode
      );
      
      console.log(`Gevonden: ${klassenInZelfdeGraad.length} klassen in dezelfde graad (${klas.graad})`);
      
      // Haal alle klasnummers op van dezelfde graad
      const klascodesInGraad = klassenInZelfdeGraad.map(k => k.klascode);
      
      // Haal alle lessen op die bij deze klassen horen
      const lessenVoorGraad = this.lessentabel.filter(les => 
        klascodesInGraad.includes(les.klascode)
      );
      
      console.log(`Gevonden: ${lessenVoorGraad.length} lessen voor deze graad`);
      
      // Haal voetnoten op specifiek voor deze klas
      const voetnotenVoorKlas = this.footnotes.filter(f => f.klascode === klascode);

      // Render het slidein met alle gegevens
      renderSlidein(klas, lessenVoorGraad, voetnotenVoorKlas);
    } else {
      console.error(`Geen klas gevonden met code ${klascode}`);
    }
  }

  closeSlidein() {
    const slidein = document.getElementById("slidein");
    const overlay = document.getElementById("overlay");
    
    if (slidein) slidein.classList.remove("open");
    if (overlay) overlay.classList.remove("active");
  }
  
  // Print process management
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
    if (!container) return;
    
    container.innerHTML = `
      <div class="error-message">
        Kon lessentabellen niet laden. Probeer de pagina te herladen.
      </div>
    `;
  }
}

// Instantieer de app class
const LessentabellenApp = new LessentabellenAppClass();

// Maak de app globaal beschikbaar voor HTML access
window.LessentabellenApp = LessentabellenApp;

// Export voor module gebruik
export default LessentabellenApp;
