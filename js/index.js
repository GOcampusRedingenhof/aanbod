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

/**
 * Print fixes voor lege pagina's
 */

// Helper function om de printweergave te verbeteren
function enhancePrintRendering() {
  // Fixes voor lege pagina's bij afdrukken
  let styleTag = document.getElementById('print-fixes-style');
  
  if (!styleTag) {
    styleTag = document.createElement('style');
    styleTag.id = 'print-fixes-style';
    styleTag.textContent = `
      @media print {
        /* Voorkom lege pagina's door verborgen divs */
        body * {
          visibility: hidden;
        }
        
        #slidein, #slidein * {
          visibility: visible !important;
        }
        
        #slidein {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: auto;
          overflow: visible !important;
          padding: 0 !important;
          margin: 0 !important;
        }
        
        /* Page breaks controle */
        table { page-break-inside: auto !important; }
        tr { page-break-inside: avoid !important; page-break-after: auto !important; }
        thead { display: table-header-group; }
        tfoot { display: table-footer-group; }
        
        /* Voorkom dat lege elementen pagina's toevoegen */
        .version-indicator, .loader-spinner, .close-btn, 
        .action-buttons, #overlay, #domains-container {
          display: none !important;
          height: 0 !important;
          max-height: 0 !important;
          overflow: hidden !important;
        }
        
        /* Compactere marges */
        @page {
          size: A4 portrait;
          margin: 1.5cm 1cm 1.8cm 1cm;
        }
      }
    `;
    
    document.head.appendChild(styleTag);
  }
}

// Verbeterde beforeprint handler
window.addEventListener('beforeprint', () => {
  // Controleer of er een open slidein is
  const slidein = document.getElementById('slidein');
  if (slidein && slidein.classList.contains('open')) {
    // Voeg printmodus toe als deze nog niet actief is
    if (!document.body.classList.contains('print-mode')) {
      document.body.classList.add('print-mode');
      
      // Toepassen van extra print-fixes voor lege pagina's
      enhancePrintRendering();
      
      // Zorg dat datum correct wordt weergegeven
      const datumElement = document.querySelector('.datum');
      if (datumElement) {
        const span = document.getElementById("datum-print");
        if (span) {
          const today = new Date();
          span.textContent = today.toLocaleDateString("nl-BE", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
          });
        }
      }
    }
  }
});

// Herstel normale weergave na afdrukken
window.addEventListener('afterprint', () => {
  document.body.classList.remove('print-mode');
  
  // Verwijder de tijdelijke print-fixes
  const styleTag = document.getElementById('print-fixes-style');
  if (styleTag) {
    styleTag.remove();
  }
});

// Exporteer de app controller voor externe toegang
export default appController;
