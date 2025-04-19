// Eenvoudige PDF generator die alleen essentiële content gebruikt
// Deze oplossing vermijdt complexiteit en werkt betrouwbaarder

/**
 * Initialiseert de handler voor een specifieke klas
 * @param {Object} klas - Het klasobject met alle informatie
 */
export function initPrintHandler(klas) {
  // Sla de klas op voor gebruik in PDF functie
  window.currentPrintKlas = klas;
}

/**
 * Genereert een PDF van de lessentabel op een zeer eenvoudige, betrouwbare manier
 */
export function generatePDF() {
  try {
    // Basisvalidatie
    if (typeof window.html2pdf === 'undefined') {
      alert('PDF genereren is niet beschikbaar. Laad de pagina opnieuw.');
      return;
    }
    
    // Haal huidige klas op
    const klas = window.currentPrintKlas;
    if (!klas || !klas.richting) {
      alert('Kon geen richtingsinformatie vinden.');
      return;
    }
    
    console.log('PDF generatie gestart voor:', klas.richting);
    
    // Haal originele DOM elementen op
    const titelElement = document.getElementById('opleiding-titel');
    const beschrijvingElement = document.getElementById('opleiding-beschrijving');
    const tabelElement = document.querySelector('.lessentabel');
    
    if (!tabelElement) {
      alert('Kon geen lessentabel vinden om te exporteren.');
      return;
    }
    
    // STAP 1: Maak een zeer eenvoudig nieuw document voor de PDF
    const container = document.createElement('div');
    container.style.width = '190mm';
    container.style.padding = '10mm';
    container.style.fontFamily = 'Arial, sans-serif';
    
    // STAP 2: Kopieer alleen de essentiële content
    // Titel
    const titel = document.createElement('h1');
    titel.textContent = titelElement ? titelElement.textContent : klas.richting;
    titel.style.fontSize = '18pt';
    titel.style.textAlign = 'center';
    titel.style.marginBottom = '10mm';
    container.appendChild(titel);
    
    // Beschrijving (indien beschikbaar)
    if (beschrijvingElement && beschrijvingElement.textContent.trim()) {
      const beschrijving = document.createElement('p');
      beschrijving.textContent = beschrijvingElement.textContent;
      beschrijving.style.fontSize = '12pt';
      beschrijving.style.marginBottom = '10mm';
      beschrijving.style.textAlign = 'center';
      container.appendChild(beschrijving);
    }
    
    // STAP 3: Bouw een nieuwe, eenvoudige tabel
    const tableHTML = tabelElement.outerHTML;
    const tabelWrapper = document.createElement('div');
    tabelWrapper.innerHTML = tableHTML;
    
    // Simplificeer tabelstijl
    const newTable = tabelWrapper.querySelector('table');
    if (newTable) {
      newTable.style.width = '100%';
      newTable.style.borderCollapse = 'collapse';
      newTable.style.marginBottom = '10mm';
      
      // Simplificeer celstijlen
      const cells = newTable.querySelectorAll('th, td');
      cells.forEach(cell => {
        cell.style.border = '1px solid black';
        cell.style.padding = '3mm';
        cell.style.fontSize = '10pt';
      });
      
      // Headers donkerder maken
      const headers = newTable.querySelectorAll('th');
      headers.forEach(header => {
        header.style.backgroundColor = '#e0e0e0';
        header.style.fontWeight = 'bold';
      });
      
      container.appendChild(newTable);
    }
    
    // STAP 4: Voeg datum toe
    const footer = document.createElement('div');
    footer.textContent = `Afgedrukt op: ${new Date().toLocaleDateString()}`;
    footer.style.marginTop = '10mm';
    footer.style.fontSize = '8pt';
    footer.style.color = '#666';
    container.appendChild(footer);
    
    // STAP 5: Voeg tijdelijk toe aan document body (maar verborgen)
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    document.body.appendChild(container);
    
    // Log voor debugging
    console.log('PDF container toegevoegd:', container);
    console.log('PDF container heeft tabeldata:', !!container.querySelector('table'));
    
    // STAP 6: Genereer PDF met minimale opties
    const fileName = `${klas.richting.replace(/[^\w\s-]/gi, '')}_Lessentabel.pdf`;
    
    // Zeer eenvoudige configuratie
    const options = {
      margin: 10,
      filename: fileName,
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    
    window.html2pdf()
      .from(container)
      .set(options)
      .save()
      .then(() => {
        console.log('PDF generatie succesvol');
        document.body.removeChild(container);
      })
      .catch(err => {
        console.error('PDF generatie fout:', err);
        document.body.removeChild(container);
        alert('Er is een fout opgetreden bij het maken van de PDF.');
      });
    
  } catch (error) {
    console.error('Onverwachte fout bij PDF generatie:', error);
    alert('Er is een onverwachte fout opgetreden.');
  }
}

export default {
  initPrintHandler,
  generatePDF
};
