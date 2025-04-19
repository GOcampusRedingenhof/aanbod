// print-handler.js - Vereenvoudigde versie met betrouwbare PDF-generatie

/**
 * Initialiseert de handler voor een specifieke klas
 * @param {Object} klas - Het klasobject met alle informatie
 */
export function initPrintHandler(klas) {
  // Sla de klas op voor gebruik in PDF functie
  window.currentPrintKlas = klas;
}

/**
 * Genereert een PDF bestand van de huidige lessentabel
 * Deze versie is vereenvoudigd en meer robuust
 */
export function generatePDF() {
  try {
    // Controleer eerst of html2pdf beschikbaar is
    if (typeof window.html2pdf === 'undefined') {
      console.error('html2pdf library niet beschikbaar');
      alert('PDF genereren is momenteel niet beschikbaar. Probeer de pagina te verversen.');
      return;
    }
    
    // Verkrijg huidige klas
    const klas = window.currentPrintKlas || (window.LessentabellenApp && window.LessentabellenApp.getKlasByCode(window.LessentabellenApp.currentKlasCode));
    
    if (!klas || !klas.richting) {
      console.error('Geen geldige klas gevonden voor PDF generatie');
      alert('Kan geen PDF genereren. Geen richtingsinformatie beschikbaar.');
      return;
    }
    
    console.log('PDF generatie gestart voor:', klas.richting);
    
    // Genereer een bestandsnaam gebaseerd op de richting
    const fileName = `${klas.richting.replace(/[^\w\s-]/gi, '')}_Lessentabel.pdf`;
    
    // Eenvoudigere aanpak: gebruik direct de bestaande slidein DOM
    // Dit is betrouwbaarder dan het handmatig opbouwen van een nieuwe DOM
    const slidein = document.getElementById('slidein');
    if (!slidein) {
      alert('Kan geen PDF genereren. Geen inhoud beschikbaar.');
      return;
    }
    
    // Maak een diepe kopie van het slidein element voor de PDF
    const pdfContainer = slidein.cloneNode(true);
    
    // Bereid de container voor op PDF export
    preparePDFContainer(pdfContainer);
    
    // Voeg het tijdelijk toe aan de DOM, maar verborgen
    document.body.appendChild(pdfContainer);
    
    // Configureer html2pdf met eenvoudigere opties
    const html2pdfOptions = {
      margin: 10,
      filename: fileName,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2,
        useCORS: true,
        logging: true // Enable logging voor debug
      },
      jsPDF: { 
        unit: 'mm', 
        format: 'a4', 
        orientation: 'portrait'
      }
    };
    
    // Toon debug informatie
    console.log('PDF container is toegevoegd aan DOM:', document.body.contains(pdfContainer));
    console.log('PDF container inhoud lengte:', pdfContainer.innerHTML.length);
    console.log('Eerste 100 tekens van PDF container:', pdfContainer.innerHTML.substring(0, 100));
    
    // Genereer de PDF met eenvoudigere methode
    window.html2pdf()
      .from(pdfContainer)
      .set(html2pdfOptions)
      .save()
      .then(() => {
        // Cleanup
        if (document.body.contains(pdfContainer)) {
          document.body.removeChild(pdfContainer);
        }
        console.log('PDF generatie succesvol voltooid');
      })
      .catch(err => {
        console.error('Fout bij PDF generatie:', err);
        alert('Er is een fout opgetreden bij het maken van de PDF. Probeer het opnieuw.');
        
        // Cleanup
        if (document.body.contains(pdfContainer)) {
          document.body.removeChild(pdfContainer);
        }
      });
  } catch (error) {
    console.error('Onverwachte fout bij PDF generatie:', error);
    alert('Er is een onverwachte fout opgetreden bij het maken van de PDF.');
  }
}

/**
 * Bereidt de container voor op PDF export door onnodige elementen te verwijderen
 * en styling aan te passen
 * @param {HTMLElement} container - De container om voor te bereiden
 */
function preparePDFContainer(container) {
  // Verwijder onnodige elementen
  const elementsToRemove = container.querySelectorAll('.close-btn, .action-buttons');
  elementsToRemove.forEach(element => {
    if (element && element.parentNode) {
      element.parentNode.removeChild(element);
    }
  });
  
  // Reset positioning en styling zodat alles zichtbaar is
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.width = '210mm'; // A4 width
  container.style.height = 'auto';
  container.style.transform = 'none';
  container.style.transition = 'none';
  container.style.opacity = '1';
  container.style.visibility = 'visible';
  container.style.overflow = 'visible';
  container.style.zIndex = '-1000';
  container.style.margin = '0';
  container.style.padding = '20px';
  
  // Zorg dat alle tekst zwart is
  const textElements = container.querySelectorAll('p, h1, h2, h3, td, th, li, span');
  textElements.forEach(element => {
    element.style.color = '#000';
  });
  
  // Zorg dat tabel zichtbaar en goed geformatteerd is
  const table = container.querySelector('.lessentabel');
  if (table) {
    table.style.borderCollapse = 'collapse';
    table.style.width = '100%';
    table.style.margin = '20px 0';
    
    // Voeg border toe aan alle cellen
    const cells = table.querySelectorAll('th, td');
    cells.forEach(cell => {
      cell.style.border = '1px solid #000';
      cell.style.padding = '4px';
    });
    
    // Zorg dat de header cellen een achtergrondkleur hebben
    const headerCells = table.querySelectorAll('th');
    headerCells.forEach(cell => {
      cell.style.backgroundColor = '#e0e0e0';
      cell.style.fontWeight = 'bold';
    });
  }
  
  // Voeg datum toe onderaan als die nog niet bestaat
  const dateEl = container.querySelector('#datum-print');
  if (!dateEl || !dateEl.textContent) {
    const footer = document.createElement('div');
    footer.style.marginTop = '20px';
    footer.style.fontSize = '8pt';
    footer.style.color = '#666';
    footer.style.textAlign = 'left';
    
    const now = new Date();
    footer.textContent = `Afgedrukt op: ${now.getDate()}-${now.getMonth() + 1}-${now.getFullYear()}`;
    
    container.appendChild(footer);
  }
}

// Exporteer alleen de benodigde functies
export default {
  initPrintHandler,
  generatePDF
};
