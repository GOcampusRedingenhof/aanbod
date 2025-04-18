// print-handler.js
// Afzonderlijke module voor printfunctionaliteit

/**
 * Initialiseert printfunctionaliteit en event handlers
 */
export function initPrintHandler() {
  // Voeg printknop handler toe
  document.querySelector('.action-buttons button').addEventListener('click', setupPrintView);
  
  // Luister naar window print events
  window.addEventListener('beforeprint', optimizeForPrint);
  window.addEventListener('afterprint', restoreFromPrint);
  
  // Stel de huidige datum in voor de printversie
  setupPrintDate();
}

/**
 * Stelt de huidige datum in voor de printversie
 */
function setupPrintDate() {
  const span = document.getElementById("datum-print");
  const today = new Date();
  span.textContent = today.toLocaleDateString("nl-BE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
}

/**
 * Voorbereiding voor printen
 */
function setupPrintView(e) {
  e.preventDefault();
  
  // Optimaliseer de view voor printen
  optimizeForPrint();
  
  // Start het printproces
  window.print();
}

/**
 * Optimaliseer de pagina voor afdrukken
 */
function optimizeForPrint() {
  // Voeg een klasse toe aan de body voor print-specifieke styling
  document.body.classList.add('print-mode');
  
  // Bereken en pas relatieve hoogtes aan om op één pagina te passen
  adjustTableSizesForPrint();
}

/**
 * Herstel de pagina na het afdrukken
 */
function restoreFromPrint() {
  // Verwijder de printmodus klasse
  document.body.classList.remove('print-mode');
  
  // Herstel oorspronkelijke afmetingen
  resetTableSizes();
}

/**
 * Past tabel groottes aan voor optimale printweergave
 */
function adjustTableSizesForPrint() {
  const table = document.querySelector('.lessentabel');
  if (!table) return;
  
  // Pas de lettergrootte aan op basis van aantal kolommen
  const columnCount = table.querySelectorAll('thead th').length;
  
  if (columnCount > 3) {
    // Kleinere lettergrootte voor tabellen met veel kolommen
    table.style.fontSize = '0.7rem';
  }
  
  // Pas rij-hoogtes aan voor compacte weergave
  const rows = table.querySelectorAll('tbody tr');
  rows.forEach(row => {
    row.style.lineHeight = '1.2';
  });
}

/**
 * Herstel oorspronkelijke tabel groottes
 */
function resetTableSizes() {
  const table = document.querySelector('.lessentabel');
  if (!table) return;
  
  // Verwijder inline styles
  table.style.fontSize = '';
  
  // Herstel rij-hoogtes
  const rows = table.querySelectorAll('tbody tr');
  rows.forEach(row => {
    row.style.lineHeight = '';
  });
}
