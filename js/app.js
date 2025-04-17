// app.js
import { getKlassen, getLessentabel, getFootnotes } from './loader.js';
import { buildGrid } from './grid-builder.js';
import { mapDomein } from './config-module.js';
import { renderSlidein } from './detail-view.js';

const LessentabellenApp = {
  async init() {
    try {
      const [klassenData, lessentabelData, footnotesData] = await Promise.all([
        getKlassen(),
        getLessentabel(),
        getFootnotes()
      ]);

      this.klassen = klassenData;
      this.lessentabel = lessentabelData;
      this.footnotes = footnotesData;

      this.renderGrid();
      this.setupPrintDate();
    } catch (error) {
      console.error('Fout bij laden data:', error);
      document.getElementById("lessentabellen-container").innerHTML =
        '<p class="error">Er is een probleem opgetreden bij het laden van de lessentabellen.</p>';
    }
  },

  renderGrid() {
    const container = document.getElementById('domains-container');
    container.innerHTML = '';
    buildGrid(this.klassen, container);
    this.bindButtons();
  },

  bindButtons() {
    const buttons = document.querySelectorAll("[data-code]");
    buttons.forEach(btn => {
      btn.addEventListener("click", () => {
        const code = btn.getAttribute("data-code");
        this.openSlidein(code);
      });
    });
  },

  openSlidein(klascode) {
    const klas = this.klassen.find(k => k.klascode === klascode);
    if (!klas) return;

    const bijhorendeLessen = this.lessentabel.filter(l => l.klascode === klascode);
    const bijhorendeVoetnoten = this.footnotes.filter(f => f.klascode === klascode);

    renderSlidein(klas, bijhorendeLessen, bijhorendeVoetnoten);
  },

  closeSlidein() {
    document.getElementById("slidein").classList.remove("open");
    document.getElementById("overlay").classList.remove("active");
  },

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

window.LessentabellenApp = LessentabellenApp;
LessentabellenApp.init();
