// print-handler.js - Vereenvoudigde versie met HTML-export functionaliteit
// Deze module creëert een afdrukbare HTML-pagina in een nieuw venster

/**
 * Initialiseert de handler voor een specifieke klas
 * @param {Object} klas - Het klasobject met alle informatie
 */
export function initPrintHandler(klas) {
  // Sla de klas op voor gebruik in HTML-export functie
  window.currentPrintKlas = klas;
}

/**
 * Genereert een HTML-versie van de lessentabel in een nieuw venster
 * wat gemakkelijk kan worden afgedrukt of opgeslagen
 */
export function generateHTML() {
  try {
    // Haal huidige klas op
    const klas = window.currentPrintKlas;
    if (!klas || !klas.richting) {
      alert('Kon geen richtingsinformatie vinden.');
      return;
    }
    
    console.log('HTML generatie gestart voor:', klas.richting);
    
    // Haal originele DOM elementen op
    const titelElement = document.getElementById('opleiding-titel');
    const beschrijvingElement = document.getElementById('opleiding-beschrijving');
    const tabelElement = document.querySelector('.lessentabel');
    const voetnotenElement = document.querySelector('.footnotes');
    
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
    
    // Bereid HTML content voor
    let htmlContent = `
    <!DOCTYPE html>
    <html lang="nl">
    <head>
      <meta charset="UTF-8">
      <title>${klas.richting} - Lessentabel</title>
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
        
        /* Achtergrond afbeelding (indien gewenst) */
        body:before {
          content: "";
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-image: url('data:image/png;base64,YOUR_BASE64_IMAGE_HERE'); /* Hier later een achtergrond invoegen */
          background-position: center;
          background-repeat: no-repeat;
          background-size: cover;
          opacity: 0.08; /* Subtiele achtergrond */
          z-index: -1;
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
        <h1>${titelElement ? titelElement.textContent : klas.richting}</h1>
    `;
    
    // Voeg beschrijving toe indien beschikbaar
    if (beschrijvingElement && beschrijvingElement.textContent.trim()) {
      htmlContent += `<div class="description">${beschrijvingElement.textContent}</div>`;
    }
    
    // Voeg tabel toe
    htmlContent += tabelElement.outerHTML;
    
    // Voeg voetnoten toe indien beschikbaar
    if (voetnotenElement && voetnotenElement.innerHTML.trim()) {
      htmlContent += `<div class="footnotes">${voetnotenElement.innerHTML}</div>`;
    }
    
    // Voeg footer toe
    htmlContent += `
        <div class="footer">
          <div>GO Campus Redingenhof</div>
          <div>Afgedrukt op: ${new Date().toLocaleDateString('nl-BE')}</div>
        </div>
      </div>
      
      <script>
        // Auto-detect tabel grootte en pas font size aan indien nodig
        window.onload = function() {
          const table = document.querySelector('table');
          if (table) {
            // Als tabel te breed is voor de pagina, verklein font
            if (table.offsetWidth > document.querySelector('.container').offsetWidth - 40) {
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

/**
 * Update deze functie later om een PNG achtergrond toe te voegen
 * @param {string} backgroundImageUrl - URL naar de achtergrondafbeelding
 */
export function setBackgroundImage(backgroundImageUrl) {
  // Deze functie kan later worden gebruikt om een achtergrondafbeelding toe te voegen
  window.lessentabelAchtergrond = backgroundImageUrl;
}

// Exporteer functies - hernoemd van generatePDF naar generateHTML
export default {
  initPrintHandler,
  generateHTML,
  setBackgroundImage
};
