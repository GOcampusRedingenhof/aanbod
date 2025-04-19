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
  const span = document.getElementById("datum-print");
  if (span) {
    const today = new Date();
    span.textContent = today.toLocaleDateString("nl-BE", {
      day: "2-digit", month: "2-digit", year: "numeric"
    });
  }
}

/**
 * Helper functie om direct een print dialoog te openen
 * @param {Object} klas - Het klasobject waarvoor we printen
 */
export function printLessentabel(klas) {
  // Voeg print class toe aan body voor speciale print styling
  document.body.classList.add('print-mode');
  
  // Creëer print footer als die nog niet bestaat
  createPrintFooter();
  
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
 */
function createPrintFooter() {
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
