// print-handler.js - Verbeterde versie
// Module voor optimale printfunctionaliteit

/**
 * Initialiseert de print handler voor een specifieke klas
 * @param {Object} klas - Het klasobject met alle informatie
 */
export function initPrintHandler(klas) {
  // Sla de klas op voor gebruik in print functies
  window.currentPrintKlas = klas;
  
  // Zorg dat de printknop correct werkt
  const printButton = document.getElementById('print-button');
  if (printButton) {
    // Verwijder oude event listeners door een nieuwe knop te maken
    const newButton = printButton.cloneNode(true);
    printButton.parentNode.replaceChild(newButton, printButton);
    
    // Voeg nieuwe event listener toe
    newButton.addEventListener('click', () => {
      printLessentabel();
    });
  }
}

/**
 * Start het printproces voor de huidige lessentabel
 */
export function printLessentabel() {
  try {
    console.log('Printproces gestart');
    
    // Verkrijg huidige klas
    const klas = window.currentPrintKlas;
    
    // Voeg print-mode class toe aan body
    document.body.classList.add('print-mode');
    
    // Bereid slidein voor voor printen
    const slidein = document.getElementById('slidein');
    if (slidein) {
      // Voeg print-optimalisatie classes toe
      slidein.classList.add('print-optimized');
      
      // Detecteer automatisch of de tabel geschaald moet worden
      optimizeTableForPrint();
      
      // Verberg UI elementen die niet nodig zijn bij printen
      const closeBtn = document.querySelector('.close-btn');
      if (closeBtn) closeBtn.style.display = 'none';
      
      const actionButtons = document.querySelector('.action-buttons');
      if (actionButtons) actionButtons.style.display = 'none';
      
      // Voeg datum toe
      const datumEl = document.getElementById('datum-print');
      if (datumEl) {
        try {
          const nu = new Date();
          const opties = { day: '2-digit', month: 'long', year: 'numeric' };
          datumEl.textContent = nu.toLocaleDateString('nl-BE', opties);
        } catch (error) {
          console.warn('Fout bij formatteren datum:', error);
          datumEl.textContent = new Date().toLocaleDateString();
        }
      }
      
      // Print na een korte vertraging om de DOM updates te verwerken
      setTimeout(() => {
        window.print();
        
        // Wacht even na het printen en ruim dan op
        setTimeout(() => {
          cleanupAfterPrinting();
        }, 500);
      }, 300);
    } else {
      console.error('Slidein element niet gevonden');
      alert('Kan de lessentabel niet afdrukken. Probeer de pagina te verversen.');
    }
  } catch (error) {
    console.error('Fout bij starten print proces:', error);
    alert('Er is een fout opgetreden bij het afdrukken.');
    cleanupAfterPrinting(); // Probeer toch op te ruimen
  }
}

/**
 * Ruimt op na het afdrukken
 */
export function cleanupAfterPrinting() {
  try {
    console.log('Opruimen na afdrukken');
    
    // Verwijder print-mode van body
    document.body.classList.remove('print-mode');
    
    // Haal print-optimalisatie weg
    const slidein = document.getElementById('slidein');
    if (slidein) {
      slidein.classList.remove('print-optimized');
      slidein.classList.remove('scaled-table');
      
      // Reset tabel scaling
      const table = slidein.querySelector('.lessentabel');
      if (table) {
        table.style.fontSize = '';
        table.style.transform = '';
        table.style.marginBottom = '';
      }
    }
    
    // Toon UI elementen weer
    const closeBtn = document.querySelector('.close-btn');
    if (closeBtn) closeBtn.style.removeProperty('display');
    
    const actionButtons = document.querySelector('.action-buttons');
    if (actionButtons) actionButtons.style.removeProperty('display');
  } catch (error) {
    console.error('Fout bij opruimen na printen:', error);
    
    // Probeer toch basisopruiming te doen
    document.body.classList.remove('print-mode');
    document.querySelector('.close-btn')?.style.removeProperty('display');
    document.querySelector('.action-buttons')?.style.removeProperty('display');
  }
}

/**
 * Optimaliseert tabel voor afdrukken
 */
function optimizeTableForPrint() {
  try {
    const slidein = document.getElementById('slidein');
    const table = slidein.querySelector('.lessentabel');
    
    if (!table) return;
    
    // Reset eerst eventuele eerdere aanpassingen
    table.style.fontSize = '';
    table.style.transform = '';
    
    // Kijk naar de grootte van de tabel
    const tableHeight = table.offsetHeight;
    const maxHeight = 900; // ~A4 hoogte in pixels minus marges
    
    // Als tabel te groot is, schaal deze
    if (tableHeight > maxHeight) {
      const scale = Math.max(0.75, maxHeight / tableHeight);
      slidein.classList.add('scaled-table');
      
      if (scale < 0.85) {
        // Extra kleine lettergrootte voor heel grote tabellen
        table.style.fontSize = '9pt';
      }
    }
  } catch (error) {
    console.warn('Fout bij optimaliseren tabel voor print:', error);
  }
}

/**
 * Genereert een PDF bestand van de lessentabel
 */
export function generatePDF() {
  if (typeof window.html2pdf === 'undefined') {
    console.error('html2pdf library niet beschikbaar');
    alert('PDF genereren is momenteel niet beschikbaar. De benodigde library ontbreekt.');
    return;
  }
  
  try {
    // Bereid slidein voor voor PDF export (vergelijkbaar met print)
    const slidein = document.getElementById('slidein');
    if (!slidein) {
      alert('Kan geen PDF genereren. Probeer de pagina te verversen.');
      return;
    }
    
    // Verkrijg huidige klas
    const klas = window.currentPrintKlas;
    if (!klas || !klas.richting) {
      alert('Kan geen PDF genereren. Richting informatie ontbreekt.');
      return;
    }
    
    // Maak een kopie van het slidein element voor PDF generatie
    const container = slidein.cloneNode(true);
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.transform = 'none';
    document.body.appendChild(container);
    
    // Verberg interactieve elementen
    const closeBtn = container.querySelector('.close-btn');
    if (closeBtn) closeBtn.remove();
    
    const actionButtons = container.querySelector('.action-buttons');
    if (actionButtons) actionButtons.remove();
    
    // Stel bestandsnaam in
    const fileName = `${klas.richting.replace(/[^\w\s]/gi, '')}_Lessentabel.pdf`;
    
    // Configureer html2pdf
    const options = {
      margin: 10,
      filename: fileName,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    
    // Genereer PDF
    window.html2pdf().set(options).from(container).save().then(() => {
      // Cleanup
      document.body.removeChild(container);
    });
  } catch (error) {
    console.error('Fout bij genereren PDF:', error);
    alert('Er is een fout opgetreden bij het maken van de PDF.');
  }
}

export default {
  initPrintHandler,
  printLessentabel,
  cleanupAfterPrinting,
  generatePDF
};
