// print-handler.js

/**
 * Initialiseert de printfunctionaliteit
 * @param {Object} klas - Het klasobject met richting, graad, etc.
 */
export function initPrintHandler(klas) {
  const printBtn = document.querySelector('#print-button');
  if (printBtn) {
    // Verwijder eventuele bestaande event listeners door kloon te maken
    const newBtn = printBtn.cloneNode(true);
    printBtn.parentNode.replaceChild(newBtn, printBtn);
    
    // Voeg nieuwe event listener toe
    newBtn.addEventListener('click', (e) => {
      e.preventDefault();
      
      // Controleer of app controller beschikbaar is
      if (!window.LessentabellenApp) {
        console.error('LessentabellenApp controller niet gevonden');
        return;
      }
      
      // Roep de centrale print functie aan op de controller
      window.LessentabellenApp.startPrintProcess(klas);
    });
  }
  
  // Initialiseer datum
  initializePrintDate(klas);
  
  // Stel documenttitel in voor printen
  setPrintDocumentTitle(klas);
}

/**
 * Initialiseert de datum en titel op de pagina
 * @param {Object} klas - Het klasobject met richting, graad, etc.
 */
function initializePrintDate(klas) {
  const today = new Date();
  const formattedDate = today.toLocaleDateString("nl-BE", {
    day: "2-digit", month: "2-digit", year: "numeric"
  });

  // Zet datum in de datum-print span
  const dateSpan = document.getElementById("datum-print");
  if (dateSpan) {
    dateSpan.textContent = formattedDate;
  }

  // Extra check om zeker te zijn dat de datum op de footer ook wordt ingevuld
  const footerDateElement = document.querySelector('.datum');
  if (footerDateElement) {
    footerDateElement.textContent = `Afgedrukt op: ${formattedDate}`;
  }
}

/**
 * Stelt een betekenisvolle documenttitel in voor het afdrukken
 * @param {Object} klas - Het klasobject waarvoor we printen
 */
function setPrintDocumentTitle(klas) {
  if (!klas) return;
  
  // Bewaar originele titel om later te herstellen
  const originalTitle = document.title;
  
  // Genereer betekenisvolle printtitel
  const printTitle = `Lessentabel ${klas.klascode} - ${klas.richting} - GO Campus Redingenhof`;
  
  // Tijdelijk de documenttitel veranderen voor het printen
  document.title = printTitle;
  
  // Herstel de originele titel na het printen
  window.addEventListener('afterprint', function restoreTitle() {
    document.title = originalTitle;
    // Verwijder deze event listener na één keer uitvoeren
    window.removeEventListener('afterprint', restoreTitle);
  });
}

/**
 * Helper functie om direct een print dialoog te openen
 * @param {Object} klas - Het klasobject waarvoor we printen
 */
export function printLessentabel(klas) {
  // Voeg print class toe aan body voor speciale print styling
  document.body.classList.add('print-mode');
  
  // Zorg dat datum en titel correct zijn
  initializePrintDate(klas);
  setPrintDocumentTitle(klas);
  
  // Creëer print footer als die nog niet bestaat
  createPrintFooter(klas);
  
  // Open printdialoog
  window.print();
  
  // Schedule cleanup voor na het printen
  setTimeout(() => {
    document.body.classList.remove('print-mode');
    const footer = document.getElementById('print-footer-container');
    if (footer) footer.remove();
  }, 1000);
}

/**
 * Creëert een print footer voor de afdruk
 * @param {Object} klas - Het klasobject voor extra context indien nodig
 */
function createPrintFooter(klas) {
  // Controleer of footer al bestaat
  if (document.getElementById('print-footer-container')) return;
  
  // Creëer footer container
  const footer = document.createElement('div');
  footer.id = 'print-footer-container';
  
  // Voeg datum en quote toe
  const datum = new Date().toLocaleDateString("nl-BE", {
    day: "2-digit", month: "2-digit", year: "numeric"
  });
  
  // Vul footer
  footer.innerHTML = `
    <div class="quote">SAMEN VER!</div>
    <div class="page-info">Pagina <span class="pageNumber"></span></div>
    <div class="datum">Afgedrukt op: ${datum}</div>
  `;
  
  // Voeg toe aan document
  document.body.appendChild(footer);
}
// print-handler.js

/**
 * Initialiseert de printfunctionaliteit
 * @param {Object} klas - Het klasobject met richting, graad, etc.
 */
export function initPrintHandler(klas) {
  const printBtn = document.querySelector('#print-button');
  if (printBtn) {
    // Verwijder eventuele bestaande event listeners door kloon te maken
    const newBtn = printBtn.cloneNode(true);
    printBtn.parentNode.replaceChild(newBtn, printBtn);
    
    // Voeg nieuwe event listener toe
    newBtn.addEventListener('click', (e) => {
      e.preventDefault();
      
      // Controleer of app controller beschikbaar is
      if (!window.LessentabellenApp) {
        console.error('LessentabellenApp controller niet gevonden');
        return;
      }
      
      // Roep de centrale print functie aan op de controller
      window.LessentabellenApp.startPrintProcess(klas);
    });
  }
  
  // Initialiseer datum
  initializePrintDate(klas);
  
  // Stel documenttitel in voor printen
  setPrintDocumentTitle(klas);
}

/**
 * Initialiseert de datum en titel op de pagina
 * @param {Object} klas - Het klasobject met richting, graad, etc.
 */
function initializePrintDate(klas) {
  const today = new Date();
  const formattedDate = today.toLocaleDateString("nl-BE", {
    day: "2-digit", month: "2-digit", year: "numeric"
  });

  // Zet datum in de datum-print span
  const dateSpan = document.getElementById("datum-print");
  if (dateSpan) {
    dateSpan.textContent = formattedDate;
  }

  // Extra check om zeker te zijn dat de datum op de footer ook wordt ingevuld
  const footerDateElement = document.querySelector('.datum');
  if (footerDateElement) {
    footerDateElement.textContent = `Afgedrukt op: ${formattedDate}`;
  }
}

/**
 * Stelt een betekenisvolle documenttitel in voor het afdrukken
 * @param {Object} klas - Het klasobject waarvoor we printen
 */
function setPrintDocumentTitle(klas) {
  if (!klas) return;
  
  // Bewaar originele titel om later te herstellen
  const originalTitle = document.title;
  
  // Genereer betekenisvolle printtitel
  const printTitle = `Lessentabel ${klas.klascode} - ${klas.richting} - GO Campus Redingenhof`;
  
  // Tijdelijk de documenttitel veranderen voor het printen
  document.title = printTitle;
  
  // Herstel de originele titel na het printen
  window.addEventListener('afterprint', function restoreTitle() {
    document.title = originalTitle;
    // Verwijder deze event listener na één keer uitvoeren
    window.removeEventListener('afterprint', restoreTitle);
  });
}

/**
 * Helper functie om direct een print dialoog te openen
 * @param {Object} klas - Het klasobject waarvoor we printen
 */
export function printLessentabel(klas) {
  // Voeg print class toe aan body voor speciale print styling
  document.body.classList.add('print-mode');
  
  // Zorg dat datum en titel correct zijn
  initializePrintDate(klas);
  setPrintDocumentTitle(klas);
  
  // Creëer print footer als die nog niet bestaat
  createPrintFooter(klas);
  
  // Open printdialoog
  window.print();
  
  // Schedule cleanup voor na het printen
  setTimeout(() => {
    document.body.classList.remove('print-mode');
    const footer = document.getElementById('print-footer-container');
    if (footer) footer.remove();
  }, 1000);
}

/**
 * Creëert een print footer voor de afdruk
 * @param {Object} klas - Het klasobject voor extra context indien nodig
 */
function createPrintFooter(klas) {
  // Controleer of footer al bestaat
  if (document.getElementById('print-footer-container')) return;
  
  // Creëer footer container
  const footer = document.createElement('div');
  footer.id = 'print-footer-container';
  
  // Voeg datum en quote toe
  const datum = new Date().toLocaleDateString("nl-BE", {
    day: "2-
