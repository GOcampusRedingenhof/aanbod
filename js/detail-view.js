// Verbeterde detail-view.js met betrouwbare print integratie

/**
 * Verbeterde functie voor het initialiseren van de print handler
 * @param {Object} klas - Het klasobject
 */
function setupPrintHandler(klas) {
  try {
    console.log('Setting up print handler voor klas:', klas?.klascode);
    
    // Importeer de printHandler dynamisch
    import('./print-handler.js')
      .then(module => {
        if (typeof module.initPrintHandler === 'function') {
          module.initPrintHandler(klas);
        } else {
          console.error('Print handler module geladen maar initPrintHandler functie ontbreekt');
        }
      })
      .catch(error => {
        console.error('Fout bij laden print handler module:', error);
      });
      
    // Als alternatief, zorg dat de klas ook in het window object beschikbaar is
    // als fallback voor print handler die deze verwacht
    window.currentPrintKlas = klas;
    
    // Zorg dat de downloadknop werkt, ook zonder modules
    const downloadBtn = document.getElementById('download-pdf-button');
    if (downloadBtn) {
      downloadBtn.addEventListener('click', () => {
        if (window.LessentabellenApp && typeof window.LessentabellenApp.generateHTML === 'function') {
          window.LessentabellenApp.generateHTML();
        } else {
          // Fallback: probeer print handler direct aan te roepen
          import('./print-handler.js')
            .then(module => {
              if (typeof module.generateHTML === 'function') {
                module.generateHTML();
              } else {
                alert('Print functionaliteit niet beschikbaar. Ververs de pagina en probeer opnieuw.');
              }
            })
            .catch(error => {
              console.error('Fout bij laden print handler voor download:', error);
              alert('Kon print functionaliteit niet laden: ' + error.message);
            });
        }
      });
    }
  } catch (error) {
    console.error('Fout bij setup print handler:', error);
  }
}
