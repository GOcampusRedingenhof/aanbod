// index.js
// Hoofdmodule die alle modules samenbrengt en de applicatie start

// Importeer de controller die alles aanstuurt
import appController from './app-controller.js';

// Importeer ondersteunende modules voor reference
import './detail-view.js';
import './table-generator.js';
import './print-handler.js';
import './grid-builder.js';
import './loader.js';
import './config-module.js';

// Voeg event listeners toe voor applicatie levenscyclus
document.addEventListener('DOMContentLoaded', () => {
  console.log('Lessentabellen App wordt gestart...');
  
  // Start de applicatie via de controller
  appController.init().then(() => {
    console.log('Lessentabellen App succesvol geïnitialiseerd!');
  }).catch(error => {
    console.error('Fout bij initialiseren van de app:', error);
  });
});

// Definieer een globale error handler om onverwachte fouten netjes af te handelen
window.addEventListener('error', (event) => {
  console.error('Onverwachte fout in applicatie:', event.error);
  
  // Toon een gebruikersvriendelijke foutmelding als de app al geïnitialiseerd is
  if (appController.isInitialized) {
    const errorContainer = document.createElement('div');
    errorContainer.className = 'error-message';
    errorContainer.textContent = 'Er is een onverwachte fout opgetreden. Probeer de pagina te verversen.';
    
    // Voeg de foutmelding toe aan de pagina
    const container = document.querySelector('.lessentabellen-container');
    if (container) {
      container.prepend(errorContainer);
    }
  }
});

// Voeg een handler toe voor browser print events
window.addEventListener('beforeprint', () => {
  // Controleer of er een open slidein is
  const slidein = document.getElementById('slidein');
  if (slidein && slidein.classList.contains('open')) {
    // Voeg printmodus toe als deze nog niet actief is
    if (!document.body.classList.contains('print-mode')) {
      document.body.classList.add('print-mode');
    }
  }
});

// Exporteer de app controller voor externe toegang
export default appController;
