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
    graadRichtingen: {} // Gegroepeerd per graad
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
      
      // Genereer graden en richtingen structuur
      this.data.graadRichtingen = this.organizeByGraad(klassen);
      
      // Vul de dropdown met graden en richtingen
      window.UIController.populateGraadRichtingenDropdown(this.data.graadRichtingen);
      
      // Log succesvolle data-lading
      console.log(`Data geladen: ${klassen.length} klassen, ${lessentabel.length} vakken, ${Object.keys(this.data.graadRichtingen).length} graden`);
      
      // Kies standaard kleur (STEM)
      setDomainColor('stem');
      
      // Controleer URL parameters om automatisch een graad/richting te laden
      this.checkUrlParameters();
      
    } catch (error) {
      console.error('Fout bij laden data:', error);
      showError('De data kon niet worden geladen. Controleer je internetverbinding.');
    }
  },
  
  /**
   * Organiseert klassen per graad en richting
   * @param {Array} klassen - Array met alle klasobjecten
   * @returns {Object} - Object met graden en bijbehorende richtingen
   */
  organizeByGraad(klassen) {
    const graadMap = {};
    
    // Groepeer richtingen per graad
    klassen.forEach(klas => {
      if (!klas.graad || !klas.richtingcode) return;
      
      const graad = klas.graad.trim().toUpperCase();
      
      if (!graadMap[graad]) {
        graadMap[graad] = { richtingen: {}, naam: graad };
      }
      
      if (!graadMap[graad].richtingen[klas.richtingcode]) {
        graadMap[graad].richtingen[klas.richtingcode] = {
          code: klas.richtingcode,
          naam: klas.richting,
          domein: klas.domein,
          finaliteit: klas.finaliteit,
          klassen: []
        };
      }
      
      graadMap[graad].richtingen[klas.richtingcode].klassen.push(klas.klascode);
    });
    
    // Sorteer de graden in logische volgorde
    const sortedGraadMap = {};
    const graadVolgorde = ['EERSTE GRAAD', 'TWEEDE GRAAD', 'DERDE GRAAD', 'ZEVENDE JAAR'];
    
    // Voeg eerst de bekende graden toe in de juiste volgorde
    graadVolgorde.forEach(graad => {
      if (graadMap[graad]) {
        sortedGraadMap[graad] = graadMap[graad];
      }
    });
    
    // Voeg overige graden toe
    Object.keys(graadMap).forEach(graad => {
      if (!sortedGraadMap[graad]) {
        sortedGraadMap[graad] = graadMap[graad];
      }
    });
    
    return sortedGraadMap;
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
   * Controleert URL parameters om automatisch een graad en richting te laden
   */
  checkUrlParameters() {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const graad = urlParams.get('graad');
      const richting = urlParams.get('richting');
      
      if (graad && richting) {
        window.UIController.loadLessentabelVoorGraadRichting(graad, richting);
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
