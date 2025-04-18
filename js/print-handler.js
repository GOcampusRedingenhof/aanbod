// print-handler.js
// Verbeterde module voor printfunctionaliteit met bestandsnaamgeneratie

/**
 * Initialiseert de printfunctionaliteit
 * Deze functie moet worden aangeroepen nadat het slidein is geopend
 * @param {Object} klas - Het klasobject met richting, graad, etc.
 */
export function initPrintHandler(klas) {
  // Zoek de printknop en voeg event listener toe
  const printBtn = document.querySelector('#print-button');
  if (printBtn) {
    // Verwijder eventuele bestaande event listeners door kloon te maken
    const newBtn = printBtn.cloneNode(true);
    printBtn.parentNode.replaceChild(newBtn, printBtn);
    
    // Voeg nieuwe event listener toe met bewaren van klas-informatie
    newBtn.addEventListener('click', (e) => handlePrint(e, klas));
  }
  
  // Zet de huidige datum voor printen
  setupPrintDate();
}

/**
 * Verwerkt de printknop klik
 * @param {Event} e - Het click event
 * @param {Object} klas - Het klasobject met richting, graad, etc.
 */
function handlePrint(e, klas) {
  e.preventDefault();
  
  // Optimaliseer de pagina voor afdrukken
  optimizeForPrint(klas);
  
  // Stel een korte timeout in om zeker te zijn dat de DOM is bijgewerkt
  setTimeout(() => {
    // Genereer en stel de bestandsnaam in (werkt in Chrome en sommige andere browsers)
    setFilename(klas);
    
    // Start het printproces
    window.print();
    
    // Luister voor het afterprint event (browser-ondersteund)
    window.addEventListener('afterprint', restoreFromPrint, { once: true });
    
    // Backup voor browsers die geen afterprint event triggeren
    setTimeout(() => {
      if (document.body.classList.contains('print-mode')) {
        restoreFromPrint();
      }
    }, 2000);
  }, 100);
}

/**
 * Genereert en stelt een bestandsnaam in voor de afdruk
 * @param {Object} klas - Het klasobject met richting, graad, etc.
 */
function setFilename(klas) {
  try {
    // Bereid een betekenisvolle bestandsnaam voor
    let filename = 'Lessentabel';
    
    if (klas) {
      // Haal de graad op (indien beschikbaar)
      if (klas.graad) {
        const graad = klas.graad.toLowerCase().replace(/\s+/g, '-');
        filename += `_${graad}`;
      }
      
      // Voeg de richting toe (indien beschikbaar)
      if (klas.richting) {
        // Verwijder speciale tekens en vervang spaties met streepjes
        const richting = klas.richting
          .toLowerCase()
          .replace(/[&\/\\#,+()$~%.'":*?<>{}]/g, '')
          .replace(/\s+/g, '-');
        filename += `_${richting}`;
      }
      
      // Voeg de klascode toe voor unieke identificatie
      if (klas.klascode) {
        filename += `_${klas.klascode}`;
      }
      
      // Voeg de datum toe
      const date = new Date();
      const dateStr = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
      filename += `_${dateStr}`;
    }
    
    // Zorg ervoor dat de bestandsnaam geldig is voor bestandssystemen
    filename = filename.replace(/[^\w\-]/g, '_');
    
    // Stel de bestandsnaam in via HTML
    const titleElement = document.querySelector('title');
    if (titleElement) {
      // Bewaar de originele titel om later te herstellen
      const originalTitle = titleElement.textContent;
      titleElement.dataset.originalTitle = originalTitle;
      
      // Stel de nieuwe titel in (wordt in sommige browsers gebruikt als bestandsnaam)
      titleElement.textContent = `${filename}.pdf`;
    }
    
    // Voeg data-attributes toe voor debug en toekomstige functionaliteit
    const slideinEl = document.getElementById('slidein');
    if (slideinEl) {
      slideinEl.dataset.printFilename = filename;
    }
    
    // Voor Chrome: probeer de bestandsnaam in te stellen via script (alleen in Chrome)
    try {
      if (window.chrome) {
        const style = document.createElement('style');
        style.id = 'print-filename-style';
        style.textContent = `
          @page {
            size: A4;
            margin: 1cm;
            marks: none;
          }
          @page :first {
            margin-top: 1cm;
          }
        `;
        document.head.appendChild(style);
      }
    } catch (err) {
      console.log('Chrome-specifieke aanpassingen niet toegepast:', err);
    }
    
    return filename;
  } catch (error) {
    console.error('Fout bij genereren bestandsnaam:', error);
    return 'Lessentabel';
  }
}

/**
 * Stelt de huidige datum in voor de printversie
 */
function setupPrintDate() {
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

/**
 * Optimaliseer de pagina voor afdrukken
 * @param {Object} klas - Het klasobject met richting, graad, etc.
 */
function optimizeForPrint(klas) {
  // Voeg een klasse toe aan de body voor print-specifieke styling
  document.body.classList.add('print-mode');
  
  // Configureer proefessionele print-layout
  configurePageForPrint();
  
  // Bereken en pas relatieve hoogtes aan om op één pagina te passen
  adjustTableSizesForPrint();
  
  // Maak een profesionele printfooter
  createProfessionalFooter();
}

/**
 * Configureert de pagina voor professionele afdruk
 */
function configurePageForPrint() {
  // Toon het logo
  const logoElement = document.querySelector('.logo-print');
  if (logoElement) {
    logoElement.style.display = 'block';
  }
  
  // Optimaliseer titel en beschrijving
  const titleElement = document.getElementById('opleiding-titel');
  if (titleElement) {
    titleElement.style.fontSize = '16pt';
    titleElement.style.marginBottom = '6pt';
    titleElement.style.textAlign = 'left';
  }
  
  const descriptionElement = document.getElementById('opleiding-beschrijving');
  if (descriptionElement) {
    descriptionElement.style.fontSize = '9pt';
    descriptionElement.style.marginBottom = '10pt';
    descriptionElement.style.textAlign = 'left';
  }
  
  // Verberg UI-elementen
  const actionButtons = document.querySelector('.action-buttons');
  if (actionButtons) {
    actionButtons.style.display = 'none';
  }
  
  // Voorkom pagebreaks
  const contentContainer = document.querySelector('.detail-content');
  if (contentContainer) {
    contentContainer.style.pageBreakInside = 'avoid';
    contentContainer.style.breakInside = 'avoid';
  }
}

/**
 * Maakt een professionele footer voor printen
 */
function createProfessionalFooter() {
  const datumElement = document.querySelector('.datum');
  const quoteElement = document.querySelector('.quote');
  
  if (datumElement && quoteElement) {
    // Controleer of er al een footer container bestaat
    let footerContainer = document.getElementById('print-footer-container');
    
    if (!footerContainer) {
      // Maak een nieuwe footer container
      footerContainer = document.createElement('div');
      footerContainer.id = 'print-footer-container';
      
      // Zet de juiste styling
      footerContainer.style.position = 'fixed';
      footerContainer.style.bottom = '0.5cm';
      footerContainer.style.left = '1cm';
      footerContainer.style.right = '1cm';
      footerContainer.style.display = 'flex';
      footerContainer.style.justifyContent = 'space-between';
      footerContainer.style.alignItems = 'center';
      footerContainer.style.borderTop = '1pt solid #000';
      footerContainer.style.paddingTop = '5pt';
      footerContainer.style.fontSize = '8pt';
      
      // Kloon de elementen om de originelen intact te houden
      const quoteClone = quoteElement.cloneNode(true);
      const datumClone = datumElement.cloneNode(true);
      
      // Voeg de pagina nummer toe als midden element
      const pageInfo = document.createElement('div');
      pageInfo.className = 'page-info';
      pageInfo.style.textAlign = 'center';
      pageInfo.innerHTML = 'Pagina <span class="pageNumber"></span>';
      
      // Voeg elementen toe aan de footer container
      footerContainer.appendChild(quoteClone);
      footerContainer.appendChild(pageInfo);
      footerContainer.appendChild(datumClone);
      
      // Voeg de footer toe aan het document
      const slidein = document.getElementById('slidein');
      if (slidein) {
        slidein.appendChild(footerContainer);
        
        // Verberg de originele elementen
        datumElement.style.display = 'none';
        quoteElement.style.display = 'none';
      }
    }
  }
}

/**
 * Past tabel groottes aan voor optimale printweergave
 */
function adjustTableSizesForPrint() {
  const table = document.querySelector('.lessentabel');
  if (!table) return;
  
  // Zet de basis table styling
  table.style.borderCollapse = 'collapse';
  table.style.width = '100%';
  table.style.pageBreakInside = 'avoid';
  table.style.breakInside = 'avoid';
  
  // Detecteer de grootte van de tabel
  const columnCount = table.querySelectorAll('thead th').length;
  const rowCount = table.querySelectorAll('tbody tr').length;
  
  // Pas lettergroottes aan op basis van tabelgrootte
  let fontSize = '9pt';
  if (columnCount > 3 || rowCount > 30) {
    fontSize = '8pt';
  } else if (columnCount > 4 || rowCount > 40) {
    fontSize = '7pt';
  }
  
  table.style.fontSize = fontSize;
  
  // Geef de vaknamen kolom meer ruimte
  const firstColumnCells = table.querySelectorAll('tr td:first-child, tr th:first-child');
  firstColumnCells.forEach(cell => {
    cell.style.width = '40%';
    cell.style.textAlign = 'left';
  });
  
  // Zet de overige kolommen equal width
  const otherColumnWidth = `${60 / (columnCount - 1)}%`;
  const otherColumns = table.querySelectorAll('tr td:not(:first-child), tr th:not(:first-child)');
  otherColumns.forEach(cell => {
    cell.style.width = otherColumnWidth;
    cell.style.textAlign = 'center';
  });
  
  // Voeg ruimte onderaan toe voor de footer
  const tableContainer = document.getElementById('lessentabel-container');
  if (tableContainer) {
    tableContainer.style.marginBottom = '2cm';
  }
}

/**
 * Herstel de pagina na het afdrukken
 */
function restoreFromPrint() {
  // Verwijder de printmodus klasse
  document.body.classList.remove('print-mode');
  
  // Herstel de originele paginatitel
  const titleElement = document.querySelector('title');
  if (titleElement && titleElement.dataset.originalTitle) {
    titleElement.textContent = titleElement.dataset.originalTitle;
    delete titleElement.dataset.originalTitle;
  }
  
  // Verwijder de print-style tag als die bestaat
  const printStyle = document.getElementById('print-filename-style');
  if (printStyle) {
    printStyle.remove();
  }
  
  // Verwijder de print footer container
  const footerContainer = document.getElementById('print-footer-container');
  if (footerContainer) {
    footerContainer.remove();
  }
  
  // Herstel zichtbaarheid van originele elementen
  const datumElement = document.querySelector('.datum');
  const quoteElement = document.querySelector('.quote');
  if (datumElement) datumElement.style.display = '';
  if (quoteElement) quoteElement.style.display = '';
  
  // Herstel logo zichtbaarheid
  const logoElement = document.querySelector('.logo-print');
  if (logoElement) {
    logoElement.style.display = '';
  }
  
  // Herstel actieknoppen
  const actionButtons = document.querySelector('.action-buttons');
  if (actionButtons) {
    actionButtons.style.display = '';
  }
  
  // Herstel inline styles van tabel
  const table = document.querySelector('.lessentabel');
  if (table) {
    table.style = '';
    
    // Reset alle cell styles
    const cells = table.querySelectorAll('th, td');
    cells.forEach(cell => {
      cell.style = '';
    });
  }
  
  // Herstel container styles
  const contentContainer = document.querySelector('.detail-content');
  if (contentContainer) {
    contentContainer.style = '';
  }
  
  const tableContainer = document.getElementById('lessentabel-container');
  if (tableContainer) {
    tableContainer.style = '';
  }
  
  // Herstel titel en beschrijving
  const titleHeader = document.getElementById('opleiding-titel');
  const descriptionElement = document.getElementById('opleiding-beschrijving');
  if (titleHeader) titleHeader.style = '';
  if (descriptionElement) descriptionElement.style = '';
}
