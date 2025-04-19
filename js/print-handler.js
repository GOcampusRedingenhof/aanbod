// 1Nieuwe print-handler.js module (zonder ES module import)

/**
 * Genereert een PDF bestand van het lessentabel voor een specifieke klas
 * @param {Object} klas - Het klasobject met alle informatie
 */
export function generatePDF(klas) {
  // Controleer of html2pdf beschikbaar is
  if (typeof window.html2pdf === 'undefined') {
    console.error('html2pdf library niet gevonden. Zorg ervoor dat deze in index.html is geladen.');
    alert('PDF genereren is niet beschikbaar. Neem contact op met de beheerder.');
    return;
  }

  // Stap 1: Capture huidige lessentabel en maak een kopie voor PDF generatie
  const slidein = document.getElementById('slidein');
  if (!slidein) {
    alert('Kon de lessentabel niet vinden. Probeer de pagina te vernieuwen.');
    return;
  }
  
  // Stap 2: Stel een unieke bestandsnaam samen op basis van klas.richting
  const fileName = `${klas.richting.replace(/[^\w\s]/gi, '')}_Lessentabel.pdf`;
  
  // Stap 3: Maak een nieuw element voor de PDF dat we kunnen stylen zonder de UI te beïnvloeden
  const pdfContainer = document.createElement('div');
  pdfContainer.style.position = 'absolute';
  pdfContainer.style.left = '-9999px';
  pdfContainer.innerHTML = slidein.innerHTML;
  document.body.appendChild(pdfContainer);
  
  // Stap 4: Pas specifieke print styling toe
  setupPDFStyling(pdfContainer, klas);
  
  // Stap 5: Configureer html2pdf opties
  const options = {
    margin: 10,
    filename: fileName,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { 
      scale: 2,
      useCORS: true,
      letterRendering: true
    },
    jsPDF: { 
      unit: 'mm', 
      format: 'a4', 
      orientation: 'portrait' 
    }
  };
  
  // Stap 6: Genereer de PDF met de globale html2pdf functie
  window.html2pdf()
    .set(options)
    .from(pdfContainer)
    .save()
    .then(() => {
      // Stap 7: Cleanup
      document.body.removeChild(pdfContainer);
    })
    .catch(error => {
      console.error('Fout bij het genereren van de PDF:', error);
      alert('Er ging iets mis bij het maken van de PDF. Probeer het opnieuw.');
      document.body.removeChild(pdfContainer);
    });
}

/**
 * Past de styling toe op de container voor optimale PDF weergave
 */
function setupPDFStyling(container, klas) {
  // Verberg alle niet-essentiële elementen
  const elementsToHide = container.querySelectorAll('.close-btn, .action-buttons');
  elementsToHide.forEach(el => el.style.display = 'none');
  
  // Voeg de datum toe in de juiste positie
  const footer = document.createElement('div');
  const currentDate = new Date().toLocaleDateString('nl-BE', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
  
  footer.innerHTML = `
    <div style="position: absolute; bottom: 10mm; left: 15mm; font-size: 8pt; color: #666;">
      Afgedrukt op: ${currentDate}
    </div>
  `;
  container.appendChild(footer);
  
  // Voeg achtergrondafbeelding toe
  const backgroundDiv = document.createElement('div');
  backgroundDiv.style.position = 'absolute';
  backgroundDiv.style.top = '0';
  backgroundDiv.style.left = '0';
  backgroundDiv.style.width = '100%';
  backgroundDiv.style.height = '100%';
  backgroundDiv.style.opacity = '0.05';
  backgroundDiv.style.backgroundImage = 'url("/assets/background-pattern.png")';
  backgroundDiv.style.backgroundSize = 'cover';
  backgroundDiv.style.zIndex = '-1';
  container.insertBefore(backgroundDiv, container.firstChild);
  
  // Schaal de tabel indien nodig om op één pagina te passen
  const table = container.querySelector('.lessentabel');
  if (table) {
    table.style.width = '100%';
    table.style.maxWidth = '100%';
    table.style.fontSize = '9pt';
    table.style.pageBreakInside = 'avoid';
  }
}

export default { generatePDF };
