// app.js
import { getLessons, getFootnotes } from './loader.js';
import { buildGrid } from './grid-builder.js';

const LessentabellenApp = {
  async init() {
    try {
      const [lessenData, footnotes] = await Promise.all([
        getLessons(),
        getFootnotes()
      ]);

      this.lessingen = lessenData;
      this.footnotes = footnotes;

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
    buildGrid(this.lessingen, container);
    this.bindButtons();
  },

  bindButtons() {
    const buttons = document.querySelectorAll(".richting-button");
    buttons.forEach(btn => {
      btn.addEventListener("click", () => {
        const code = btn.getAttribute("data-code");
        this.openSlidein(code);
      });
    });
  },

  openSlidein(code) {
    const detail = this.lessingen.find(d => d.code === code);
    if (!detail) return;

    document.getElementById("opleiding-titel").textContent = detail.naam;
    document.getElementById("opleiding-beschrijving").textContent = detail.beschrijving || '';

    // toon lesuren
    const container = document.getElementById("lessentabel-container");
    container.innerHTML = detail.lessen || '<p>Geen gegevens beschikbaar.</p>';

    // toon voetnoten
    const voetnotenEl = document.getElementById("footnotes");
    const codeFootnotes = this.footnotes.filter(f => f.richtingcode === code);
    voetnotenEl.innerHTML = '';
    if (codeFootnotes.length) {
      const ul = document.createElement("ul");
      ul.className = "footnotes";
      codeFootnotes.forEach(f => {
        const li = document.createElement("li");
        li.textContent = f.tekst;
        ul.appendChild(li);
      });
      voetnotenEl.appendChild(ul);
    }

    document.getElementById("slidein").classList.add("open");
    document.getElementById("overlay").classList.add("active");
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
