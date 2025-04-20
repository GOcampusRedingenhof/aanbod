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
      
      // BELANGRIJK: Print knop event handler
      const printButton = document.getElementById('print-button');
      if (printButton) {
        printButton.addEventListener('click', () => this.handlePrint());
      }
    });
    
    // Afhandeling voor het print event
    window.addEventListener('afterprint', () => {
      this.cleanupAfterPrint();
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
      
      // Laad alle data parallel om sneller te starten
      const klassenData = await fetch('data/klassen.csv').then(r => r.text());
      const lessentabelData = await fetch('data/lessentabel.csv').then(r => r.text());
      const footnotesData = await fetch('data/voetnoten.csv').then(r => r.text());
      
      // Parse de CSV data
      this.klassen = this.parseCSV(klassenData);
      this.lessentabel = this.parseCSV(lessentabelData);
      this.footnotes = this.parseCSV(footnotesData);
      
      console.log(`Data geladen: ${this.klassen.length} klassen, ${this.lessentabel.length} lesvakken`);
      
      // Markeer als geïnitialiseerd
      this.isInitialized = true;
      
      this.setupUI();
    } catch (error) {
      this.handleInitError(error);
    }
  }
  
  /**
   * Eenvoudige CSV parser als fallback
   */
  parseCSV(text) {
    const lines = text.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    
    return lines.slice(1).map(line => {
      const values = line.split(',');
      return headers.reduce((obj, header, index) => {
        // Basis type conversie
        let value = values[index]?.trim() || '';
        if (value === 'WAAR') value = true;
        else if (value === 'ONWAAR') value = false;
        
        obj[header] = value;
        return obj;
      }, {});
    });
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
        // Alle klassen in dezelfde richting als de geselecteerde klas
        const klassenInZelfdeRichting = this.klassen.filter(k => 
          k.richtingcode === klas.richtingcode
        );
        
        // Haal alle klasnummers op van dezelfde richting
        const klascodesInRichting = klassenInZelfdeRichting.map(k => k.klascode);
        
        // Haal alle lessen op die bij deze richting horen
        const lessenVoorRichting = this.lessentabel.filter(les => 
          klascodesInRichting.includes(les.klascode)
        );
        
        // Filter lessen voor deze specifieke klas
        const lessenVoorKlas = this.lessentabel.filter(les => 
          les.klascode === klascode
        );
        
        // Haal voetnoten op specifiek voor deze klas
        const voetnotenVoorKlas = this.footnotes.filter(f => f.klascode === klascode);

        // Render het slidein met alle gegevens
        renderSlidein(klas, lessenVoorKlas, voetnotenVoorKlas);
      } else {
        console.error(`Geen klas gevonden met code ${klascode}`);
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
    }
  }
  
  /**
   * Afdrukken van de huidige lessentabel
   */
  handlePrint() {
    try {
      // Voeg print class toe
      document.body.classList.add('print-mode');
      
      // Verberg knoppen en overlay
      const closeBtn = document.querySelector('.close-btn');
      const actionButtons = document.querySelector('.action-buttons');
      const overlay = document.getElementById('overlay');
      
      if (closeBtn) closeBtn.style.display = 'none';
      if (actionButtons) actionButtons.style.display = 'none';
      if (overlay) overlay.classList.remove('active');
      
      // Update datum
      const datumEl = document.getElementById('datum-print');
      if (datumEl) {
        const now = new Date();
        datumEl.textContent = now.toLocaleDateString('nl-BE', {
          day: '2-digit',
          month: 'long',
          year: 'numeric'
        });
      }
      
      // Start afdrukken
      setTimeout(() => window.print(), 200);
    } catch (error) {
      console.error('Fout bij printen:', error);
      // Probeer toch te printen
      window.print();
    }
  }
  
  /**
   * Opruimen na afdrukken
   */
  cleanupAfterPrint() {
    document.body.classList.remove('print-mode');
    
    // Herstel UI elementen
    const closeBtn = document.querySelector('.close-btn');
    const actionButtons = document.querySelector('.action-buttons');
    
    if (closeBtn) closeBtn.style.removeProperty('display');
    if (actionButtons) actionButtons.style.removeProperty('display');
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
}

// Instantieer de app class
const LessentabellenApp = new LessentabellenAppClass();

// Maak de app globaal beschikbaar voor HTML access
window.LessentabellenApp = LessentabellenApp;

// Export voor module gebruik
export default LessentabellenApp;
