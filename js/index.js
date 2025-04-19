// index.js: Centrale module voor Lessentabellen App

import appController from './app-controller.js';
import { buildGrid } from './grid-builder.js';
import { renderSlidein } from './detail-view.js';
import { initPrintHandler } from './print-handler.js';

class LessentabellenAppClass {
  constructor() {
    this.currentKlasCode = null;
    this.klassen = [];
    this.lessentabel = [];
    this.footnotes = [];
    this.isPrinting = false;
    
    this.initEventListeners();
  }

  initEventListeners() {
    document.addEventListener('DOMContentLoaded', () => this.init());
    document.addEventListener('error', this.handleGlobalError);
    
    // Overlay klik binding toevoegen voor sluiten slidein
    document.addEventListener('DOMContentLoaded', () => {
      document.getElementById('overlay').addEventListener('click', () => this.closeSlidein());
    });
    
    // Verbeterde print event handlers
    window.addEventListener('beforeprint', this.handleBeforePrint.bind(this));
    window.addEventListener('afterprint', this.handleAfterPrint.bind(this));
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
    // Voorkom openen tijdens printen
    if (this.isPrinting) {
      console.log('Kan slidein niet openen tijdens printen');
      return;
    }
    
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
    // Voorkom sluiten tijdens printen
    if (this.isPrinting) {
      console.log('Kan slidein niet sluiten tijdens printen');
      return;
    }
    
    document.getElementById("slidein").classList.remove("open");
    document.getElementById("overlay").classList.remove("active");
  }
  
  // Verbeterde print handlers
  handleBeforePrint(event) {
    console.log('Globale beforeprint event handler');
    
    // Voorkom dubbele initialisatie
    if (this.isPrinting) return;
    this.isPrinting = true;
    
    // Als er een huidige klascode is, zorg dat de print handler wordt geïnitialiseerd
    if (this.currentKlasCode) {
      const klas = this.klassen.find(k => k.klascode === this.currentKlasCode);
      if (klas) {
        this.startPrintProcess(klas);
      }
    }
  }
  
  handleAfterPrint(event) {
    console.log('Globale afterprint event handler');
    this.isPrinting = false;
    this.cleanupAfterPrinting();
  }
  
  // Print process management
  startPrintProcess(klas) {
    console.log('Print proces gestart voor klas', klas.klascode);
    document.body.classList.add('print-mode');
    
    // Zorg dat printhandler correct is geïnitialiseerd
    initPrintHandler(klas);
    
    // Voorkom dat we de print methode dubbel aanroepen als dit direct van de browser komt
    if (!this.isPrinting) {
      this.isPrinting = true;
      window.print();
    }
  }
  
  cleanupAfterPrinting() {
    console.log('Opruimen na afdrukken');
    document.body.classList.remove('print-mode');
    this.isPrinting = false;
    
    // Forceer extra update van de UI om glitches te voorkomen
    setTimeout(() => {
      // Herstel visibility van knoppen en andere elementen
      const slidein = document.getElementById('slidein');
      if (slidein) {
        const closeBtn = slidein.querySelector('.close-btn');
        if (closeBtn) closeBtn.style.display = '';
        
        const actionButtons = slidein.querySelector('.action-buttons');
        if (actionButtons) actionButtons.style.display = '';
      }
    }, 100);
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
