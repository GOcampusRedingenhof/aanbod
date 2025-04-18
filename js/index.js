// index.js: Centrale module voor Lessentabellen App

import appController from './app-controller.js';
import { renderGrid } from './grid-builder.js';
import { renderSlidein } from './detail-view.js';

class LessentabellenApp {
  constructor() {
    this.initEventListeners();
  }

  initEventListeners() {
    document.addEventListener('DOMContentLoaded', () => this.init());
    document.addEventListener('error', this.handleGlobalError);
  }

  async init() {
    try {
      await appController.initialize();
      this.setupUI();
    } catch (error) {
      this.handleInitError(error);
    }
  }

  setupUI() {
    const container = document.getElementById('domains-container');
    renderGrid(appController.getData(), container);
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
    const { klassen, lessentabel, footnotes } = appController.getData();
    const klas = klassen.find(k => k.klascode === klascode);
    
    if (klas) {
      const relatedLessons = lessentabel.filter(les => 
        les.klascode === klascode
      );
      const relatedFootnotes = footnotes.filter(f => 
        f.klascode === klascode
      );

      renderSlidein(klas, relatedLessons, relatedFootnotes);
    }
  }

  handleInitError(error) {
    console.error('App initialisatie mislukt:', error);
    this.showErrorMessage('Kon lessentabellen niet laden');
  }

  handleGlobalError(event) {
    console.error('Onverwachte fout:', event.error);
  }

  showErrorMessage(message) {
    const container = document.getElementById('domains-container');
    container.innerHTML = `
      <div class="error-message">
        ${message}
      </div>
    `;
  }
}

// Singleton instantie
export default new LessentabellenApp();
