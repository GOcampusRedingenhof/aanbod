/**
 * Lessentabellen Configuratiemodule v1.0
 * Bevat alle configuratie-instellingen voor de lessentabellen app
 * @copyright 2025 GO Campus Redingenhof
 */

 window.ConfigModule = {
-  csvUrl:        "https://raw.githubusercontent.com/.../lessentabellen_tabel.csv",
+  csvUrl:        "data/lessentabel.csv",         // jouw bestaande CSV in data/
   footnotesUrl:  "data/footnotes.csv",         // je nieuwe voetnoten‑CSV
   cacheExpiry:   1000 * 60 * 60,
   domainColors:  { /* … onveranderd … */ }
 };
  
  /**
   * Kleuren per domein
   */
  domainColors: {
    "stem": {
      base: "#0C8464",
      mid: "#48A787",
      light1: "#89CCB2",
      hover: "#d7f5ea"
    },
    "topsport": {
      base: "#A2E4FF",
      mid: "#C6F0FF",
      light1: "#E4F9FF",
      hover: "#6ABCD6"
    },
    "eerste-graad": {
      base: "#ED4E13",
      mid: "#F3764A",
      light1: "#F8A588",
      hover: "#F8B96D"
    },
    "maatschappij-welzijn": {
      base: "#E399BB",
      mid: "#EFBACD",
      light1: "#F7D9E4",
      hover: "#F2C5D1"
    },
    "economie-organisatie": {
      base: "#2B2243",
      mid: "#254a87",
      light1: "#5084C2",
      hover: "#7081a8"
    },
    "schakeljaar": {
      base: "#2B2243",
      mid: "#254a87",
      light1: "#5084C2",
      hover: "#7081a8"
    },
    "okan": {
      base: "#E5A021",
      mid: "#F0B94E",
      light1: "#F9D38A",
      hover: "#F9CA7F"
    }
  },
  
  /**
   * App-versie
   */
  version: '3.4.0',
  
  /**
   * Teksten en vertalingen
   */
  texts: {
    loadingError: "Er is een probleem opgetreden bij het laden van de data",
    retryButton: "Opnieuw proberen",
    noDataFound: "Geen lessentabellen gevonden",
    noTableAvailable: "Geen lessentabel beschikbaar voor deze richting",
    stageWeeks: "Stage weken",
    brochureText: "Brochure",
    printText: "Afdrukken",
    slogan: "SAMEN VER!"
  },
  
  /**
   * Initialiseer de configuratiemodule
   */
  init() {
    console.log(`Configuratiemodule v1.0 geladen. App versie: ${this.version}`);
    return this;
  }
};

// Initialiseer de module
window.ConfigModule = ConfigModule.init();
