// print-handler.js - Verbeterde versie die printproblemen oplost

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
  
  // Maak een backup van de huidige body content
  const bodyContent = document.body.innerHTML;
  
  try {
    // Optimaliseer de pagina voor afdrukken
    optimizeForPrint(klas);
    
    // Stel een korte timeout in om zeker te zijn dat de DOM is bijgewerkt
    setTimeout(() => {
      // Genereer en stel de bestandsnaam in (werkt in Chrome en sommige andere browsers)
      setFilename(klas);
      
      // Start het printproces
      window.print();
      
      // Stel een timeout in om de pagina te herstellen nadat de printdialoog is gesloten
      setTimeout(() => {
        restoreFromPrint(bodyContent);
      }, 1000);
    }, 200);
  } catch (error) {
    console.error('Fout tijdens printen:', error);
    // Bij error, herstel de pagina
    restoreFromPrint(bodyContent);
  }
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
  } catch (error) {
    console.error('Fout bij genereren bestandsnaam:', error);
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
  // BELANGRIJKE FIX: Kloon het slidein element in plaats van de hele pagina aan te passen
  const slidein = document.getElementById('slidein');
  if (!slidein) {
    throw new Error('Slidein element niet gevonden');
  }
  
  // Maak een wrapper voor het printen
  const printWrapper = document.createElement('div');
  printWrapper.id = 'print-wrapper';
  printWrapper.style.position = 'absolute';
  printWrapper.style.top = '0';
  printWrapper.style.left = '0';
  printWrapper.style.width = '100%';
  printWrapper.style.backgroundColor = 'white';
  printWrapper.style.zIndex = '9999';
  
  // Kloon het slidein voor gebruik in het printen
  const slideinClone = slidein.cloneNode(true);
  slideinClone.style.position = 'static';
  slideinClone.style.transform = 'none';
  slideinClone.style.maxWidth = 'none';
  slideinClone.style.width = '100%';
  slideinClone.style.height = 'auto';
  slideinClone.style.overflow = 'visible';
  
  // Verberg actieknoppen en sluitknop in de kopie
  const actionsToHide = slideinClone.querySelectorAll('.action-buttons, .close-btn');
  actionsToHide.forEach(el => {
    el.style.display = 'none';
  });
  
  // Maak een professionele footer voor de printversie
  const footerContainer = document.createElement('div');
  footerContainer.id = 'print-footer-container';
  footerContainer.style.borderTop = '1px solid #000';
  footerContainer.style.marginTop = '20px';
  footerContainer.style.paddingTop = '10px';
  footerContainer.style.display = 'flex';
  footerContainer.style.justifyContent = 'space-between';
  
  const quote = document.createElement('div');
  quote.textContent = 'SAMEN VER!';
  quote.style.fontStyle = 'italic';
  quote.style.fontWeight = 'bold';
  
  const campusInfo = document.createElement('div');
  campusInfo.textContent = 'GO Campus Redingenhof';
  
  const datumEl = document.createElement('div');
  const today = new Date();
  datumEl.textContent = 'Afgedrukt op: ' + today.toLocaleDateString("nl-BE");
  
  footerContainer.appendChild(quote);
  footerContainer.appendChild(campusInfo);
  footerContainer.appendChild(datumEl);
  
  // Voeg footer toe aan slidein kloon
  slideinClone.appendChild(footerContainer);
  
  // Voeg de slidein kloon toe aan de print wrapper
  printWrapper.appendChild(slideinClone);
  
  // Voeg de print wrapper toe aan de body
  document.body.appendChild(printWrapper);
  
  // BELANGRIJKE FIX: Gebruik een print-specifieke stylesheet
  const printStylesheet = document.createElement('style');
  printStylesheet.id = 'print-specific-style';
  printStylesheet.textContent = `
    @media print {
      body * {
        visibility: hidden !important;
      }
      
      #print-wrapper, #print-wrapper * {
        visibility: visible !important;
      }
      
      #print-wrapper {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
      }
      
      @page {
        size: A4 portrait;
        margin: 1.5cm 1cm 1.8cm 1cm;
      }
      
      .lessentabel {
        width: 100%;
        border-collapse: collapse;
        page-break-inside: auto;
      }
      
      .lessentabel th, .lessentabel td {
        border: 1px solid #000;
        padding: 0.5cm 0.2cm;
      }
      
      .lessentabel thead {
        display: table-header-group;
      }
      
      tr {
        page-break-inside: avoid;
      }
      
      .categorie-header, .totaal-row, .stage-row {
        page-break-inside: avoid;
      }
    }
  `;
  
  document.head.appendChild(printStylesheet);
}

/**
 * Herstel de pagina na het afdrukken
 * @param {string} originalBodyContent - De originele HTML content van de body
 */
function restoreFromPrint(originalBodyContent) {
  // Verwijder de print wrapper als die bestaat
  const printWrapper = document.getElementById('print-wrapper');
  if (printWrapper) {
    printWrapper.remove();
  }
  
  // Verwijder de print-specifieke stylesheet
  const printStylesheet = document.getElementById('print-specific-style');
  if (printStylesheet) {
    printStylesheet.remove();
  }
  
  // Herstel de originele paginatitel
  const titleElement = document.querySelector('title');
  if (titleElement && titleElement.dataset.originalTitle) {
    titleElement.textContent = titleElement.dataset.originalTitle;
    delete titleElement.dataset.originalTitle;
  }
}
