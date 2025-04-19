/**
   * Genereert een afdrukbare HTML-versie van de huidige lessentabel
   */
  generateHTML() {
    try {
      console.log('HTML generatie gestart vanuit app');
      
      // 1. Controleer of er een huidige klascode is
      if (!this.currentKlasCode) {
        alert('Selecteer eerst een richting voordat je een afdrukbare versie maakt.');
        return;
      }
      
      // 2. Zoek de klas op
      const klas = this.getKlasByCode(this.currentKlasCode);
      if (!klas) {
        console.error(`Kan klas met code ${this.currentKlasCode} niet vinden voor printen`);
        alert('Kon de gegevens voor deze richting niet vinden. Probeer opnieuw.');
        return;
      }
      
      // 3. Gebruik de importeerde functie uit print-handler, maar met fallback
      try {
        // Probeer eerst dynamisch de print-handler module te laden
        import('./print-handler.js')
          .then(module => {
            // Update de currentPrintKlas zodat de module deze kan gebruiken
            window.currentPrintKlas = klas;
            
            // Roep de generateHTML functie aan
            if (typeof module.generateHTML === 'function') {
              module.generateHTML();
            } else {
              console.error('generateHTML functie niet gevonden in module');
              this.fallbackGenerateHTML(klas);
            }
          })
          .catch(error => {
            console.error('Fout bij laden print-handler module:', error);
            this.fallbackGenerateHTML(klas);
          });
      } catch (error) {
        console.error('Fout bij dynamisch laden van print-handler:', error);
        this.fallbackGenerateHTML(klas);
      }
    } catch (error) {
      console.error('Fout bij genereren HTML:', error);
      alert('Er is een fout opgetreden bij het maken van de afdrukbare versie.');
    }
  }
  
  /**
   * Fallback HTML generatie functie als de module niet kan worden geladen
   * @param {Object} klas - Het klasobject
   */
  fallbackGenerateHTML(klas) {
    try {
      console.log('Fallback HTML generatie voor:', klas.richting);
      
      // Haal originele DOM elementen op
      const titelElement = document.getElementById('opleiding-titel');
      const beschrijvingElement = document.getElementById('opleiding-beschrijving');
      const tabelElement = document.querySelector('.lessentabel');
      
      if (!tabelElement) {
        alert('Kon geen lessentabel vinden om te exporteren.');
        return;
      }
      
      // Open een nieuw venster
      const printWindow = window.open('', '_blank', 'width=800,height=600');
      if (!printWindow) {
        alert('Kon geen nieuw venster openen. Controleer uw popup-instellingen.');
        return;
      }
      
      // Bereid simpele HTML content voor
      let htmlContent = `
      <!DOCTYPE html>
      <html lang="nl">
      <head>
        <meta charset="UTF-8">
        <title>${klas.richting || 'Lessentabel'}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { text-align: center; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { border: 1px solid #333; padding: 8px; }
          th { background: #f0f0f0; }
          .print-btn { display: block; margin: 20px auto; padding: 10px 20px; }
          @media print { .print-btn { display: none; } }
        </style>
      </head>
      <body>
        <button class="print-btn" onclick="window.print()">Afdrukken</button>
        <h1>${titelElement ? titelElement.textContent : klas.richting}</h1>
        ${beschrijvingElement ? '<p>' + beschrijvingElement.textContent + '</p>' : ''}
        ${tabelElement.outerHTML}
        <div style="text-align: right; font-size: 12px; margin-top: 30px;">
          Afgedrukt op: ${new Date().toLocaleDateString()}
        </div>
      </body>
      </html>
      `;
      
      // Schrijf naar het nieuwe venster
      printWindow.document.open();
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      
    } catch (error) {
      console.error('Fout in fallback HTML generatie:', error);
      alert('Er is een fout opgetreden bij het maken van de afdrukbare versie.');
    }
  }
