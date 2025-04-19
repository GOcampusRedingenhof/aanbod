// index.js: Centrale module voor Lessentabellen App

import appController from './app-controller.js';
import { buildGrid } from './grid-builder.js';
import { renderSlidein } from './detail-view.js';
// Importeer alleen de benodigde functies uit print-handler.js
import { initPrintHandler, generateHTML } from './print-handler.js';

class LessentabellenAppClass {
  constructor() {
    this.currentKlasCode = null;
    this.klassen = [];
    this.lessentabel = [];
    this.footnotes = [];
    this.isInitialized = false;
    
    this.initEventListeners();
  }

  /**
   * Initialiseer event listeners
   */
  initEventListeners() {
    document.addEventListener('DOMContentLoaded', () => this.init());
    
    // Overlay klik binding toevoegen voor sluiten slidein
    document.addEventListener('DOMContentLoaded', () => {
      const overlay = document.getElementById('overlay');
      if (overlay) {
        overlay.addEventListener('click', () => this.closeSlidein());
      }
      
      // Initialiseer HTML download knop
      const downloadButton = document.getElementById('download-pdf-button');
      if (downloadButton) {
        // Update de tekstlabel van de knop om HTML te weerspiegelen
        downloadButton.querySelector('svg + span') ? downloadButton.querySelector('svg + span').textContent = 'Afdrukbare versie' : null;
        // Houd de label "Download PDF" als er geen span is
        downloadButton.addEventListener('click', () => this.generateHTML());
      }
    });
  }

  /**
   * Initialiseer de app en laad data
   */
  async init() {
    try {
      // Voorkom dubbele initialisatie
      if (this.isInitialized) return;
      
      // Toon een loading indicatie
      const container = document.getElementById('domains-container');
      if (container) {
        container.innerHTML = `<div class="loader-spinner"></div>`;
      }
      
      // Initialiseer app controller en haal data op
      await appController.initialize();
      const { klassen, lessentabel, footnotes } = appController.getData();
      
      // Bewaar data in het app object
      this.klassen = klassen;
      this.lessentabel = lessentabel;
      this.footnotes = footnotes;
      
      console.log(`Data geladen: ${this.klassen.length} klassen, ${this.lessentabel.length} lesvakken`);
      
      // Markeer als geïnitialiseerd
      this.isInitialized = true;
      
      this.setupUI();
    } catch (error) {
      this.handleInitError(error);
    }
  }

  /**
   * Configureer de gebruikersinterface na initialisatie
   */
  setupUI() {
    const container = document.getElementById('domains-container');
    if (!container) return;
    
    container.innerHTML = ''; // Clear container
    buildGrid(this.klassen, container);
    this.bindDomainEvents();
  }

  /**
   * Voeg event listeners toe aan domein knoppen
   */
  bindDomainEvents() {
    try {
      const buttons = document.querySelectorAll("[data-code]");
      buttons.forEach(btn => {
        btn.addEventListener("click", (e) => {
          e.preventDefault();
          const code = btn.getAttribute("data-code");
          this.openSlidein(code);
        });
      });
    } catch (error) {
      console.error('Fout bij binden van domein events:', error);
    }
  }

  /**
   * Open het slidein paneel voor een specifieke klascode
   * @param {string} klascode - De klascode om te openen
   */
  openSlidein(klascode) {
    try {
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
        
        // Toon een foutmelding aan de gebruiker
        const container = document.getElementById('lessentabel-container');
        if (container) {
          container.innerHTML = `
            <div class="error-message">
              Deze richting kon niet worden geladen. Probeer een andere richting of ververs de pagina.
            </div>
          `;
        }
      }
    } catch (error) {
      console.error('Fout bij openen slidein:', error);
    }
  }

  /**
   * Sluit het slidein paneel
   */
  closeSlidein() {
    try {
      const slidein = document.getElementById("slidein");
      const overlay = document.getElementById("overlay");
      
      if (slidein) slidein.classList.remove("open");
      if (overlay) overlay.classList.remove("active");
      
      // Reset huidige klas
      this.currentKlasCode = null;
    } catch (error) {
      console.error('Fout bij sluiten slidein:', error);
      
      // Forceer sluiten bij fout
      document.getElementById("slidein")?.classList.remove("open");
      document.getElementById("overlay")?.classList.remove("active");
    }
  }
  
  /**
   * Genereert een afdrukbare HTML-versie van de huidige lessentabel
   */
  generateHTML() {
    try {
      console.log('HTML generatie gestart');
      
      // Gebruik de geëxporteerde generateHTML functie
      generateHTML();
    } catch (error) {
      console.error('Fout bij genereren HTML:', error);
      alert('Er is een fout opgetreden bij het maken van de afdrukbare versie.');
    }
  }
  
  /**
   * Handler voor initialisatiefouten
   * @param {Error} error - De opgetreden fout
   */
  handleInitError(error) {
    console.error('App initialisatie mislukt:', error);
    const container = document.getElementById('domains-container');
    if (!container) return;
    
    container.innerHTML = `
      <div class="error-message">
        <h3>De lessentabellen konden niet worden geladen</h3>
        <p>Probeer de pagina te verversen. Als het probleem aanhoudt, neem dan contact op met de beheerder.</p>
        <button onclick="window.location.reload()" class="reload-btn">Pagina verversen</button>
      </div>
    `;
  }
  
  /**
   * Hulpfunctie om een klas op te halen op basis van klascode
   * @param {string} klascode - De klascode om op te zoeken
   * @returns {Object|null} - Het klasobject of null als niet gevonden
   */
  getKlasByCode(klascode) {
    if (!klascode || !this.klassen || this.klassen.length === 0) return null;
    return this.klassen.find(k => k.klascode === klascode) || null;
  }
  
  /**
   * Hulpfunctie om lessen op te halen voor een specifieke klascode
   * @param {string} klascode - De klascode om lessen voor op te halen
   * @returns {Array} - Array van lessen voor deze klascode
   */
  getLessenForKlas(klascode) {
    if (!klascode || !this.lessentabel || this.lessentabel.length === 0) return [];
    return this.lessentabel.filter(les => les.klascode === klascode);
  }
}

// Instantieer de app class
const LessentabellenApp = new LessentabellenAppClass();

// Maak de app globaal beschikbaar voor HTML access
window.LessentabellenApp = LessentabellenApp;

// Export voor module gebruik
export default LessentabellenApp;
