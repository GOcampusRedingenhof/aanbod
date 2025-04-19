// print-handler.js - Verbeterde versie voor betrouwbare print functionaliteit

/**
 * Houdt de huidige klas vast voor printen
 * @type {Object|null}
 */
let currentPrintKlas = null;

/**
 * Initialiseert de printHandler voor een specifieke klas
 * @param {Object} klas - Het klasobject met alle informatie
 */
export function initPrintHandler(klas) {
  try {
    // Sla de klas lokaal op in deze module (niet meer op window object)
    currentPrintKlas = klas;
    
    console.log(`Print handler geïnitialiseerd voor klas: ${klas?.klascode || 'onbekend'}`);
    
    // Initialiseer de print knop
    const printButton = document.getElementById('download-pdf-button');
    if (printButton) {
      // Vervang de bestaande event listener om memory leaks te voorkomen
      const newButton = printButton.cloneNode(true);
      printButton.parentNode.replaceChild(newButton, printButton);
      
      // Voeg nieuwe event listener toe
      newButton.addEventListener('click', generateHTML);
    }
  } catch (error) {
    console.error('Fout bij initialiseren print handler:', error);
  }
}

/**
 * Genereert een HTML-versie van de lessentabel in een nieuw venster
 */
export function generateHTML() {
  try {
    console.log('HTML generatie gestart...');
    
    if (!currentPrintKlas) {
      // Probeer de klas op een alternatieve manier te vinden
      if (window.LessentabellenApp && window.LessentabellenApp.currentKlasCode) {
        const klasCode = window.LessentabellenApp.currentKlasCode;
        currentPrintKlas = window.LessentabellenApp.getKlasByCode?.(klasCode) || 
                           window.LessentabellenApp.klassen?.find(k => k.klascode === klasCode);
        
        console.log(`Klas hersteld met alternatieve methode: ${currentPrintKlas?.klascode || 'mislukt'}`);
      }
      
      if (!currentPrintKlas) {
        console.error('Geen klas informatie beschikbaar voor printen');
        alert('Er kon geen informatie over de huidige richting worden gevonden. Probeer de pagina te verversen en selecteer de richting opnieuw.');
        return;
      }
    }
    
    console.log('HTML generatie gestart voor:', currentPrintKlas.richting);
    
    // Haal originele DOM elementen op
    const titelElement = document.getElementById('opleiding-titel');
    const beschrijvingElement = document.getElementById('opleiding-beschrijving');
    const tabelElement = document.querySelector('.lessentabel');
    const voetnotenElement = document.querySelector('.footnotes');
    
    if (!tabelElement) {
      console.error('Geen lessentabel gevonden in DOM');
      alert('Kon geen lessentabel vinden om te exporteren.');
      return;
    }
    
    // Open een nieuw venster
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) {
      alert('Kon geen nieuw venster openen. Controleer uw popup-instellingen.');
      return;
    }
    
    // Bereid HTML content voor
    let htmlContent = `
    <!DOCTYPE html>
    <html lang="nl">
    <head>
      <meta charset="UTF-8">
      <title>${currentPrintKlas.richting || 'Lessentabel'} - Lessentabel</title>
      <style>
        @media print {
          @page {
            size: A4 portrait;
            margin: 1.5cm;
          }
        }
        
        body {
          font-family: Arial, Helvetica, sans-serif;
          line-height: 1.5;
          color: #000;
          background-color: #fff;
          margin: 0;
          padding: 20px;
          position: relative;
        }
        
        .container {
          max-width: 210mm;
          margin: 0 auto;
          background: #fff;
          padding: 10mm;
          box-shadow: 0 0 10px rgba(0,0,0,0.1);
        }
        
        h1 {
          text-align: center;
          font-size: 24px;
          margin-bottom: 20px;
          color: #333;
        }
        
        .description {
          text-align: center;
          margin-bottom: 30px;
          font-size: 14px;
        }
        
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 30px;
          page-break-inside: avoid;
          font-size: 12px;
        }
        
        th, td {
          border: 1px solid #333;
          padding: 8px;
          text-align: left;
        }
        
        th {
          background-color: #f0f0f0;
          font-weight: bold;
        }
        
        tr.categorie-header th {
          background-color: #e0e0e0;
          text-align: left;
        }
        
        tr:nth-child(even) {
          background-color: #f9f9f9;
        }
        
        tr.totaal-row td {
          font-weight: bold;
          border-top: 2px solid #333;
        }
        
        tr.stage-row td {
          font-weight: bold;
          background-color: #f5f5f5;
        }
        
        .subvak td:first-child {
          padding-left: 20px;
        }
        
        .footer {
          margin-top: 30px;
          font-size: 10px;
          color: #666;
          display: flex;
          justify-content: space-between;
        }
        
        .footnotes {
          margin-top: 20px;
          padding: 10px;
          border-left: 3px solid #ddd;
          font-size: 11px;
        }
        
        .footnotes h4 {
          margin-top: 0;
          font-size: 13px;
        }
        
        .footnotes ul {
          padding-left: 20px;
          margin: 0;
        }
        
        .print-button {
          position: fixed;
          top: 10px;
          right: 10px;
          padding: 8px 15px;
          background: #007bff;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          z-index: 1000;
          box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        }
        
        @media print {
          .print-button {
            display: none;
          }
          
          body {
            padding: 0;
            background: none;
          }
          
          .container {
            box-shadow: none;
            padding: 0;
          }
        }
      </style>
    </head>
    <body>
      <button class="print-button" onclick="window.print()">Afdrukken</button>
      <div class="container">
        <h1>${titelElement && titelElement.textContent ? titelElement.textContent : (currentPrintKlas.richting || 'Lessentabel')}</h1>
    `;
    
    // Voeg beschrijving toe indien beschikbaar
    const beschrijving = beschrijvingElement && beschrijvingElement.textContent.trim() 
      ? beschrijvingElement.textContent 
      : (currentPrintKlas.beschrijving || '');
      
    if (beschrijving) {
      htmlContent += `<div class="description">${beschrijving}</div>`;
    }
    
    // Voeg tabel toe
    htmlContent += tabelElement.outerHTML;
    
    // Voeg voetnoten toe indien beschikbaar
    if (voetnotenElement && voetnotenElement.innerHTML.trim()) {
      htmlContent += `<div class="footnotes">${voetnotenElement.innerHTML}</div>`;
    }
    
    // Voeg footer toe
    const datum = new Date().toLocaleDateString('nl-BE', {
      day: '2-digit',
      month: 'long', 
      year: 'numeric'
    });
    
    htmlContent += `
        <div class="footer">
          <div>GO Campus Redingenhof</div>
          <div>Afgedrukt op: ${datum}</div>
        </div>
      </div>
      
      <script>
        // Auto-detect tabel grootte en pas font size aan indien nodig
        window.onload = function() {
          try {
            const table = document.querySelector('table');
            if (table) {
              // Als tabel te breed is voor de pagina, verklein font
              const container = document.querySelector('.container');
              if (container && table.offsetWidth > container.offsetWidth - 40) {
                table.style.fontSize = '10px';
              }
              
              // Als tabel te hoog is, probeer pagina-einde te voorkomen
              const containerHeight = window.innerHeight - 200; // Roughly account for margins
              if (table.offsetHeight > containerHeight) {
                // Font size further adjustment if needed
                if (table.offsetHeight > containerHeight * 1.2) {
                  table.style.fontSize = '9px';
                }
              }
            }
          } catch(e) {
            console.error('Fout bij aanpassen tabelgrootte:', e);
          }
        }
      </script>
    </body>
    </html>
    `;
    
    // Schrijf naar het nieuwe venster
    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    console.log('HTML export succesvol gegenereerd');
    
  } catch (error) {
    console.error('Onverwachte fout bij HTML generatie:', error);
    alert('Er is een onverwachte fout opgetreden bij het genereren van de HTML.');
  }
}

// Exporteer functies
export default {
  initPrintHandler,
  generateHTML
};
