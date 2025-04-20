/**
 * ui-controller.js
 * Beheert UI interacties en events voor de lessentabellen printer app
 */

// Elementen cache
const elements = {
  richtingSelect: null,
  loadBtn: null,
  printBtn: null,
  tableContainer: null,
  richtingTitel: null,
  richtingGraad: null,
  tableContent: null,
  footnotes: null,
  datum: null,
  domainButtons: null
};

/**
 * Initialiseert de UI controller
 */
function initUI() {
  // Elementen ophalen
  elements.richtingSelect = document.getElementById('richting-select');
  elements.loadBtn = document.getElementById('load-btn');
  elements.printBtn = document.getElementById('print-btn');
  elements.tableContainer = document.getElementById('table-container');
  elements.richtingTitel = document.getElementById('richting-titel');
  elements.richtingGraad = document.getElementById('richting-graad');
  elements.tableContent = document.getElementById('table-content');
  elements.footnotes = document.getElementById('footnotes');
  elements.datum = document.getElementById('datum');
  elements.domainButtons = document.querySelectorAll('.domain-selector button');
  
  // Toon huidige datum
  if (elements.datum) {
    elements.datum.textContent = getFormattedDate();
  }
  
  // Event listeners voor knoppen
  if (elements.loadBtn) {
    elements.loadBtn.addEventListener('click', handleLoadButtonClick);
  }
  
  if (elements.printBtn) {
    elements.printBtn.addEventListener('click', handlePrintButtonClick);
  }
  
  // Event listener voor domein kleur knoppen
  if (elements.domainButtons) {
    elements.domainButtons.forEach(button => {
      button.addEventListener('click', handleDomainButtonClick);
    });
  }
  
  // Event listener voor enter toets in dropdown
  if (elements.richtingSelect) {
    elements.richtingSelect.addEventListener('keypress', event => {
      if (event.key === 'Enter') {
        handleLoadButtonClick();
      }
    });
  }
}

/**
 * Vult de dropdown met alle beschikbare richtingen
 * @param {Array} richtingen - Array met richtingen objecten
 */
function populateRichtingenDropdown(richtingen) {
  if (!elements.richtingSelect) return;
  
  elements.richtingSelect.innerHTML = window.TableGenerator.generateRichtingenDropdown(richtingen);
}

/**
 * Event handler voor de "Toon lessentabel" knop
 */
async function handleLoadButtonClick() {
  if (!elements.richtingSelect) return;
  
  const selectedKlasCode = elements.richtingSelect.value;
  
  if (!selectedKlasCode) {
    alert('Selecteer eerst een richting.');
    return;
  }
  
  await loadLessentabel(selectedKlasCode);
}

/**
 * Laadt en toont de lessentabel voor de opgegeven klascode
 * @param {string} klascode - De klascode waarvoor de tabel moet worden getoond
 */
async function loadLessentabel(klascode) {
  try {
    // Toon laadindicator
    elements.tableContent.innerHTML = '<div class="loading">Lessentabel wordt geladen...</div>';
    
    // Laad alle benodigde data
    const klassen = await window.DataLoader.getKlassen();
    const lessentabel = await window.DataLoader.getLessentabel();
    const voetnoten = await window.DataLoader.getVoetnoten();
    
    // Zoek de geselecteerde klas
    const klas = window.DataLoader.findKlasByCode(klassen, klascode);
    
    if (!klas) {
      showError(`Geen klas gevonden met code ${klascode}`);
      return;
    }
    
    // Stel domein kleur in
    const domein = klas.domein ? klas.domein.toLowerCase() : 'stem';
    setDomainColor(domein);
    
    // Haal lessen en voetnoten op voor deze klas
    const lessen = window.DataLoader.getLessenForKlas(lessentabel, klascode);
    const klasVoetnoten = window.DataLoader.getVoetnotenForKlas(voetnoten, klascode);
    
    // Update UI met klas informatie
    updateKlasInfo(klas);
    
    // Genereer de lessentabel
    elements.tableContent.innerHTML = window.TableGenerator.generateLessentabel(klas, lessen, klasVoetnoten);
    
    // Maak tabel en container zichtbaar
    elements.tableContainer.style.display = 'block';
    
  } catch (error) {
    console.error('Fout bij laden van lessentabel:', error);
    showError('Er is een fout opgetreden bij het laden van de lessentabel.');
  }
}

/**
 * Update de weergave met informatie over de geselecteerde klas
 * @param {Object} klas - Het klas object
 */
function updateKlasInfo(klas) {
  if (elements.richtingTitel) {
    elements.richtingTitel.textContent = klas.richting || 'Onbekende richting';
  }
  
  if (elements.richtingGraad) {
    // Stel graad en finaliteit in
    let graadDisplay = (klas.graad || '').toString().trim();
    const finaliteit = (klas.finaliteit || '').toString().trim();
    
    if (finaliteit) {
      // Eerste letter capitaliseren
      const finaliteitDisplay = finaliteit.charAt(0).toUpperCase() + finaliteit.slice(1);
      graadDisplay += ` - ${finaliteitDisplay}`;
    }
    
    elements.richtingGraad.textContent = graadDisplay;
  }
}

/**
 * Event handler voor de "Afdrukken" knop
 */
function handlePrintButtonClick() {
  window.print();
}

/**
 * Event handler voor domein kleur knoppen
 * @param {Event} event - Het click event
 */
function handleDomainButtonClick(event) {
  const domain = event.target.dataset.domain;
  
  if (domain) {
    // Normaliseer domein naam als in utils.js
    switch(domain) {
      case 'stem':
        setDomainColor('stem');
        break;
      case 'maatschappij-welzijn':
        setDomainColor('maatschappij & welzijn');
        break;
      case 'economie-organisatie':
        setDomainColor('economie & organisatie');
        break;
      case 'sport-topsport':
        setDomainColor('sport & topsport');
        break;
      case 'eerste-graad':
        setDomainColor('eerste graad');
        break;
      case 'okan':
        setDomainColor('okan');
        break;
      case 'schakeljaar':
        setDomainColor('schakeljaar');
        break;
      default:
        setDomainColor('stem');
    }
  }
}

// Maak de UI controller globaal beschikbaar
window.UIController = {
  init: initUI,
  populateRichtingenDropdown,
  loadLessentabel
};
