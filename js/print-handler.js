// js/print-handler.js - Vereenvoudigde versie

/**
 * Initialiseert de print handler voor een specifieke klas
 * @param {Object} klas - Het klasobject met informatie over de richting
 */
export function initPrintHandler(klas) {
  const printButton = document.getElementById('print-button');
  if (!printButton) return;

  // Verwijder eventuele bestaande handlers door nieuwe knop te maken
  const newBtn = printButton.cloneNode(true);
  printButton.parentNode.replaceChild(newBtn, printButton);
  
  // Voeg nieuwe event listener toe
  newBtn.addEventListener('click', (e) => {
    e.preventDefault();
    handlePrintButtonClick(klas);
  });
  
  // Huidige datum voor in de footer bijwerken
  const datumEl = document.getElementById('datum-print');
  if (datumEl) {
    const datum = new Date().toLocaleDateString('nl-BE', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
    datumEl.textContent = datum;
  }
}

// Eenvoudige event handler voor print button
function handlePrintButtonClick(klas) {
  try {
    console.log('Print knop geklikt voor klas:', klas?.klascode);
    
    // Voeg print-mode toe aan body
    document.body.classList.add('print-mode');
    
    // Verberg interactieve elementen
    prepareForPrint();
    
    // Print met een kleine vertraging
    setTimeout(() => {
      window.print();
      
      // Wacht even en herstel de UI
      setTimeout(restoreAfterPrint, 500);
    }, 200);
  } catch (error) {
    console.error('Fout tijdens printen:', error);
    // Herstel UI bij fout
    document.body.classList.remove('print-mode');
    restoreAfterPrint();
  }
}

// Eenvoudige voorbereiding voor printen
function prepareForPrint() {
  const slidein = document.getElementById('slidein');
  if (!slidein) return;
  
  // Verberg interactieve elementen
  const closeBtn = slidein.querySelector('.close-btn');
  if (closeBtn) closeBtn.style.display = 'none';
  
  const actionButtons = slidein.querySelector('.action-buttons');
  if (actionButtons) actionButtons.style.display = 'none';
}

// Herstel UI na printen
function restoreAfterPrint() {
  // Verwijder print-mode
  document.body.classList.remove('print-mode');
  
  // Herstel zichtbaarheid van elementen
  const slidein = document.getElementById('slidein');
  if (slidein) {
    const closeBtn = slidein.querySelector('.close-btn');
    if (closeBtn) closeBtn.style.display = '';
    
    const actionButtons = slidein.querySelector('.action-buttons');
    if (actionButtons) actionButtons.style.display = '';
    
    // Herstel tabel layout als nodig
    const table = slidein.querySelector('.lessentabel');
    if (table) {
      table.style.fontSize = '';
      table.style.transform = '';
      table.style.marginBottom = '';
    }
  }
}
