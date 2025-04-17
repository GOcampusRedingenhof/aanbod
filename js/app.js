// app.js
import { getKlassen, getLessentabel, getFootnotes } from './loader.js';
import { buildGrid } from './grid-builder.js';
import { renderSlidein } from './detail-view.js';

const LessentabellenApp = {
  /**
   * Initialiseert de app en laadt alle benodigde data
   */
  async init() {
    try {
      // Toon een loading indicatie
      document.getElementById('domains-container').innerHTML = `
        <div class="loader-spinner"></div>
      `;
      
      // Laad alle data parallel om sneller te starten
      const [klassenData, lessentabelData, footnotesData] = await Promise.all([
        getKlassen(),
        getLessentabel(),
        getFootnotes()
      ]);

      this.klassen = klassenData;
      this.lessentabel = lessentabelData;
      this.footnotes = footnotesData;
      
      console.log(`Data geladen: ${this.klassen.length} klassen, ${this.lessentabel.length} lesvakken`);

      this.renderGrid();
      this.setupPrintDate();
      
      // Overlay klik binding toevoegen voor sluiten slidein
      document.getElementById('overlay').addEventListener('click', () => this.closeSlidein());
      
    } catch (error) {
      console.error('Fout bij laden data:', error);
      document.getElementById("domains-container").innerHTML =
        '<div class="error-message">Er is een probleem opgetreden bij het laden van de lessentabellen.</div>';
    }
  },

  /**
   * Rendert het grid met alle domeinen, richtingen en finaliteiten
   */
  renderGrid() {
    const container = document.getElementById('domains-container');
    container.innerHTML = '';
    buildGrid(this.klassen, container);
    this.bindButtons();
  },

  /**
   * Bindt event handlers aan alle richting buttons
   */
  bindButtons() {
    const buttons = document.querySelectorAll("[data-code]");
    buttons.forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.preventDefault(); // Voorkom navigatie
        const code = btn.getAttribute("data-code");
        this.openSlidein(code);
      });
    });
  },

  /**
   * Opent het detail slidein paneel voor een specifieke richting
   * @param {string} klascode - De klascode van de geselecteerde richting
   */
  openSlidein(klascode) {
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
  },

  /**
   * Sluit het detail slidein paneel
   */
  closeSlidein() {
    document.getElementById("slidein").classList.remove("open");
    document.getElementById("overlay").classList.remove("active");
  },

  /**
   * Stelt de huidige datum in voor de printversie
   */
  setupPrintDate() {
    const span = document.getElementById("datum-print");
    const today = new Date();
    span.textContent = today.toLocaleDateString("nl-BE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });
  }
};

// Maak de app globaal beschikbaar voor HTML access
window.LessentabellenApp = LessentabellenApp;

// Start de applicatie wanneer het document geladen is
document.addEventListener('DOMContentLoaded', () => {
  LessentabellenApp.init();
});
