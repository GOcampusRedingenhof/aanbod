// app.js
import { getKlassen, getLessentabel, getFootnotes } from './loader.js';
import { buildGrid } from './grid-builder.js';
import { mapDomein, getDomeinMeta } from './config-module.js';

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

    const domeinKey = mapDomein(klas.domein);
    const kleuren = getDomeinMeta(domeinKey);
    document.getElementById("slidein").dataset.domain = domeinKey;

    document.getElementById("opleiding-titel").textContent = klas.richting;
    document.getElementById("opleiding-beschrijving").textContent = klas.beschrijving || '';

    const bijhorendeLessen = this.lessentabel.filter(l => l.klascode === klascode);
    const tabelHTML = this.generateLessentabel(bijhorendeLessen);
    document.getElementById("lessentabel-container").innerHTML = tabelHTML;

    const bijhorendeVoetnoten = this.footnotes.filter(f => f.klascode === klascode);
    const voetHTML = bijhorendeVoetnoten.map(f => `<li>${f.tekst}</li>`).join('');
    document.getElementById("footnotes").innerHTML = voetHTML ? `<ul class="footnotes">${voetHTML}</ul>` : '';

    document.getElementById("slidein").classList.add("open");
    document.getElementById("overlay").classList.add("active");
  },

  generateLessentabel(lessen) {
    if (!lessen.length) return '<p>Geen lessentabel beschikbaar.</p>';
    let rows = lessen.map(l => `
      <tr>
        <td>${l.vak}</td>
        <td>${l.uren}</td>
        <td>${l.stage_weken || ''}</td>
      </tr>`).join('');
    return `
      <table class="lessentabel">
        <thead><tr><th>Vak</th><th>Uren</th><th>Stage (weken)</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>`;
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
