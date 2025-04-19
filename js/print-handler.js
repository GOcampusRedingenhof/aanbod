// print-handler.js - Verbeterde versie zonder inline CSS

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
    if (!klas || !klas.klascode) {
      console.error('Ongeldige klas data ontvangen in initPrintHandler:', klas);
      return;
    }
    
    // Sla de klas lokaal op in deze module
    currentPrintKlas = klas;
    
    console.log(`Print handler geïnitialiseerd voor klas: ${klas.klascode} (${klas.richting || 'onbekend'})`);
    
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
    
    if (!currentPrintKlas || !currentPrintKlas.klascode) {
      // Probeer de klas op een alternatieve manier te vinden
      if (window.currentPrintKlas && window.currentPrintKlas.klascode) {
        currentPrintKlas = window.currentPrintKlas;
        console.log('Klas gevonden via window.currentPrintKlas:', currentPrintKlas.klascode);
      } else if (window.LessentabellenApp && window.LessentabellenApp.currentKlasCode) {
        const klasCode = window.LessentabellenApp.currentKlasCode;
        console.log('Probeert klas te vinden met klascode:', klasCode);
        
        if (typeof window.LessentabellenApp.getKlasByCode === 'function') {
          currentPrintKlas = window.LessentabellenApp.getKlasByCode(klasCode);
          console.log('Klas gevonden via getKlasByCode:', currentPrintKlas?.klascode);
        } else if (window.LessentabellenApp.klassen && Array.isArray(window.LessentabellenApp.klassen)) {
          currentPrintKlas = window.LessentabellenApp.klassen.find(k => k.klascode === klasCode);
          console.log('Klas gevonden via klassen array:', currentPrintKlas?.klascode);
        }
      }
      
      if (!currentPrintKlas || !currentPrintKlas.klascode) {
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
    
    // Bepaal het pad naar het CSS bestand
    const cssPath = 'css/print-export.css';
    
    // Bereid HTML content voor
    let htmlContent = `
    <!DOCTYPE html>
    <html lang="nl">
    <head>
      <meta charset="UTF-8">
      <title>${currentPrintKlas.richting || 'Lessentabel'} - GO Campus Redingenhof</title>
      <link rel="stylesheet" href="${cssPath}">
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
    let datum;
    try {
      datum = new Date().toLocaleDateString('nl-BE', {
        day: '2-digit',
        month: 'long', 
        year: 'numeric'
      });
    } catch (error) {
      datum = new Date().toLocaleDateString();
    }
    
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
              const containerHeight = window.innerHeight - 200;
              if (table.offsetHeight > containerHeight) {
                if (table.offsetHeight > containerHeight * 1.2) {
                  table.style.fontSize = '9px';
                }
              }
            }
          } catch(e) {
            console.error('Fout bij aanpassen tabelgrootte:', e);
          }
        }
        
        // Fallback als het externe CSS bestand niet kan worden geladen
        window.addEventListener('error', function(e) {
          if (e.target && (e.target.nodeName === 'LINK' || e.target.nodeName === 'STYLE')) {
            console.warn('Kon extern CSS bestand niet laden, gebruiken we inline CSS');
            
            // Voeg basis inline CSS toe als fallback
            var style = document.createElement('style');
            style.textContent = 'body{font-family:Arial;line-height:1.5}' +
                               '.container{max-width:210mm;margin:0 auto}' +
                               'table{width:100%;border-collapse:collapse}' +
                               'th,td{border:1px solid #333;padding:8px}' +
                               'th{background:#f0f0f0}' +
                               '.print-button{position:fixed;top:10px;right:10px;padding:8px;background:#007bff;color:white}' +
                               '@media print{.print-button{display:none}}';
            document.head.appendChild(style);
          }
        }, true);
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
    alert('Er is een onverwachte fout opgetreden bij het genereren van de HTML: ' + error.message);
  }
}

// Exporteer functies
export default {
  initPrintHandler,
  generateHTML
};
