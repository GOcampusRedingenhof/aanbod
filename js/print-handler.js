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
