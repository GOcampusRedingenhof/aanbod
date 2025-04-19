// app-controller.js
import DataLoader from './loader.js';

class AppController {
  constructor() {
    this.state = {
      isInitialized: false,
      data: {
        klassen: [],
        lessentabel: [],
        footnotes: []
      }
    };

    this.dataLoader = new DataLoader();
  }

  async initialize() {
    if (this.state.isInitialized) return this.state.data;

    try {
      const [klassen, lessentabel, footnotes] = await Promise.all([
        this.dataLoader.getKlassen(),
        this.dataLoader.getLessentabel(),
        this.dataLoader.getFootnotes()
      ]);

      this.state = {
        isInitialized: true,
        data: { klassen, lessentabel, footnotes }
      };

      return this.state.data;
    } catch (error) {
      console.error('Initialisatie mislukt:', error);
      throw error;
    }
  }

  getData() {
    if (!this.state.isInitialized) {
      throw new Error('Applicatie niet geïnitialiseerd');
    }
    return this.state.data;
  }

  findKlas(klascode) {
    return this.state.data.klassen.find(k => k.klascode === klascode);
  }

  getLessenVoorKlas(klascode) {
    return this.state.data.lessentabel.filter(les => 
      les.klascode === klascode
    );
  }

  getVoetnotenVoorKlas(klascode) {
    return this.state.data.footnotes.filter(f => 
      f.klascode === klascode
    );
  }
}

export default new AppController();
