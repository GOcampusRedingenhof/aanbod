// print-handler.js

export function initPrintHandler(klas) {
  const printBtn = document.querySelector('#print-button');
  if (printBtn) {
    // Remove any existing event listeners by cloning
    const newBtn = printBtn.cloneNode(true);
    printBtn.parentNode.replaceChild(newBtn, printBtn);
    
    // Add new event listener
    newBtn.addEventListener('click', (e) => {
      e.preventDefault();
      
      // Check if app controller is available
      if (!window.LessentabellenApp) {
        console.error('LessentabellenApp controller not found');
        return;
      }
      
      // Call central print function on the controller
      window.LessentabellenApp.startPrintProcess(klas);
    });
  }
  
  // Initialize date and title
  _initializePrintDate(klas);
  _setPrintDocumentTitle(klas);
}

/**
 * Initialize date on the page
 * @param {Object} klas - The class object with direction, grade, etc.
 */
function _initializePrintDate(klas) {
  const today = new Date();
  const formattedDate = today.toLocaleDateString("nl-BE", {
    day: "2-digit", month: "2-digit", year: "numeric"
  });

  // Set date in the date-print span
  const dateSpan = document.getElementById("datum-print");
  if (dateSpan) {
    dateSpan.textContent = formattedDate;
  }

  // Ensure date is also set in the footer
  const footerDateElement = document.querySelector('.datum');
  if (footerDateElement) {
    footerDateElement.textContent = `Afgedrukt op: ${formattedDate}`;
  }
}

/**
 * Set a meaningful document title for printing
 * @param {Object} klas - The class object for which we are printing
 */
function _setPrintDocumentTitle(klas) {
  if (!klas) return;
  
  // Save original title to restore later
  const originalTitle = document.title;
  
  // Generate meaningful print title
  const printTitle = `Lessentabel ${klas.klascode} - ${klas.richting} - GO Campus Redingenhof`;
  
  // Temporarily change document title for printing
  document.title = printTitle;
  
  // Restore original title after printing
  window.addEventListener('afterprint', function restoreTitle() {
    document.title = originalTitle;
    // Remove this event listener after one execution
    window.removeEventListener('afterprint', restoreTitle);
  });
}

/**
 * Open print dialog directly
 * @param {Object} klas - The class object for which we are printing
 */
export function printLessentabel(klas) {
  // Add print class to body for special print styling
  document.body.classList.add('print-mode');
  
  // Ensure date and title are correct
  _initializePrintDate(klas);
  _setPrintDocumentTitle(klas);
  
  // Create print footer if it doesn't exist
  _createPrintFooter(klas);
  
  // Open print dialog
  window.print();
  
  // Schedule cleanup after printing
  setTimeout(() => {
    document.body.classList.remove('print-mode');
    const footer = document.getElementById('print-footer-container');
    if (footer) footer.remove();
  }, 1000);
}

/**
 * Create a print footer for the printout
 * @param {Object} klas - The class object for additional context if needed
 */
function _createPrintFooter(klas) {
  // Check if footer already exists
  if (document.getElementById('print-footer-container')) return;
  
  // Create footer container
  const footer = document.createElement('div');
  footer.id = 'print-footer-container';
  
  // Add date and quote
  const datum = new Date().toLocaleDateString("nl-BE", {
    day: "2-digit", month: "2-digit", year: "numeric"
  });
  
  // Fill footer
  footer.innerHTML = `
    <div class="quote">SAMEN VER!</div>
    <div class="page-info">Pagina <span class="pageNumber"></span></div>
    <div class="datum">Afgedrukt op: ${datum}</div>
  `;
  
  // Add to document
  document.body.appendChild(footer);
}
