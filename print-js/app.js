/**
 * app.js 
 * Hoofdapplicatie voor de lessentabellen printer
 * Initialiseert de app en coördineert modules
 */

// Applicatie object
const LessentabellenPrinterApp = {
  /**
   * Lessentabellen data
   */
  data: {
    klassen: [],
    lessentabel: [],
    voetnoten: [],
    richtingen: []
  },
  
  /**
   * Initialiseer de applicatie
   */
  async init() {
    try {
      console.log('Lessentabellen Printer app wordt geïnitialiseerd...');
      
      // Initialiseer de UI controller
      window.UIController.init();
      
      // Laad alle data
      await this.loadAllData();
      
      // Toon datum in footer
      this.updateDatum();
      
      console.log('Applicatie initialisatie voltooid.');
      
    } catch (error) {
      console.error('Fout bij initialiseren van de applicatie:', error);
      showError('De applicatie kon niet correct worden geladen. Ververs de pagina en probeer het opnieuw.');
    }
  },
  
  /**
   * Laad alle benodigde data voor de applicatie
   */
  async loadAllData() {
    try {
      // Laad de data parallel voor betere prestaties
      const [klassen, lessentabel, voetnoten] = await Promise.all([
        window.DataLoader.getKlassen(),
        window.DataLoader.getLessentabel(),
        window.DataLoader.getVoetnoten()
      ]);
      
      // Sla data op
      this.data.klassen = klassen;
      this.data.lessentabel = lessentabel;
      this.data.voetnoten = voetnoten;
      
      // Genereer lijst met unieke richtingen
      this.data.richtingen = window.DataLoader.getAlleRichtingen(klassen);
      
      // Vul de dropdown met richtingen
      window.UIController.populateRichtingenDropdown(this.data.richtingen);
      
      // Log succesvolle data-lading
      console.log(`Data geladen: ${klassen.length} klassen, ${lessentabel.length} vakken, ${this.data.richtingen.length} richtingen`);
      
      // Kies standaard kleur (STEM)
      setDomainColor('stem');
      
      // Controleer URL parameters om automatisch een richting te laden
      this.checkUrlParameters();
      
    } catch (error) {
      console.error('Fout bij laden data:', error);
      showError('De data kon niet worden geladen. Controleer je internetverbinding.');
    }
  },
  
  /**
   * Update datum in footer
   */
  updateDatum() {
    const datumEl = document.getElementById('datum');
    if (datumEl) {
      datumEl.textContent = getFormattedDate();
    }
  },
  
  /**
   * Controleert URL parameters om automatisch een richting te laden
   */
  checkUrlParameters() {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const klascode = urlParams.get('klas');
      
      if (klascode) {
        // Stel de dropdown in op de juiste waarde
        const richtingSelect = document.getElementById('richting-select');
        if (richtingSelect) {
          richtingSelect.value = klascode;
          
          // Als de waarde geldig is, laad de lessentabel
          if (richtingSelect.value === klascode) {
            window.UIController.loadLessentabel(klascode);
          }
        }
      }
    } catch (error) {
      console.warn('URL parameters konden niet worden verwerkt:', error);
    }
  }
};

// Start de applicatie wanneer het document is geladen
document.addEventListener('DOMContentLoaded', () => {
  LessentabellenPrinterApp.init();
});

// Maak de app globaal beschikbaar
window.LessentabellenPrinterApp = LessentabellenPrinterApp;
