/**
 * ui-controller.js
 * Beheert UI interacties en events voor de lessentabellen printer app
 */

// Elementen cache
const elements = {
  graadSelect: null,
  richtingSelect: null,
  loadBtn: null,
  printBtn: null,
  tableContainer: null,
  graadTitel: null,
  richtingTitel: null,
  finaliteitTitel: null,
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
  elements.graadSelect = document.getElementById('graad-select');
  elements.richtingSelect = document.getElementById('richting-select');
  elements.loadBtn = document.getElementById('load-btn');
  elements.printBtn = document.getElementById('print-btn');
  elements.tableContainer = document.getElementById('table-container');
  elements.graadTitel = document.getElementById('graad-titel');
  elements.richtingTitel = document.getElementById('richting-titel');
  elements.finaliteitTitel = document.getElementById('finaliteit-titel');
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
  
  // Event listener voor graad dropdown om richtingen te filteren
  if (elements.graadSelect) {
    elements.graadSelect.addEventListener('change', handleGraadSelectChange);
  }
  
  // Event listener voor enter toets in dropdowns
  if (elements.richtingSelect) {
    elements.richtingSelect.addEventListener('keypress', event => {
      if (event.key === 'Enter') {
        handleLoadButtonClick();
      }
    });
  }
}

/**
 * Vult de dropdowns met graden en richtingen
 * @param {Object} graadRichtingen - Object met graden en bijbehorende richtingen
 */
function populateGraadRichtingenDropdown(graadRichtingen) {
  if (!elements.graadSelect) return;
  
  // Graad dropdown vullen
  elements.graadSelect.innerHTML = '<option value="">--Selecteer een graad--</option>';
  
  Object.keys(graadRichtingen).forEach(graad => {
    const option = document.createElement('option');
    option.value = graad;
    option.textContent = graad;
    elements.graadSelect.appendChild(option);
  });
  
  // Richtingen dropdown wordt gevuld bij het selecteren van een graad
  elements.richtingSelect.innerHTML = '<option value="">--Selecteer eerst een graad--</option>';
}

/**
 * Event handler voor verandering in graad dropdown
 */
function handleGraadSelectChange() {
  if (!elements.graadSelect || !elements.richtingSelect) return;
  
  const selectedGraad = elements.graadSelect.value;
  
  // Reset richtingen dropdown
  if (!selectedGraad) {
    elements.richtingSelect.innerHTML = '<option value="">--Selecteer eerst een graad--</option>';
    elements.richtingSelect.disabled = true;
    return;
  }
  
  // Haal beschikbare richtingen op voor geselecteerde graad
  const graadRichtingen = window.LessentabellenPrinterApp.data.graadRichtingen[selectedGraad];
  
  if (!graadRichtingen || !graadRichtingen.richtingen) {
    elements.richtingSelect.innerHTML = '<option value="">--Geen richtingen gevonden--</option>';
    elements.richtingSelect.disabled = true;
    return;
  }
  
  // Richtingen dropdown vullen
  elements.richtingSelect.innerHTML = '<option value="">--Selecteer een richting--</option>';
  elements.richtingSelect.disabled = false;
  
  // Sorteer richtingen alfabetisch
  const sortedRichtingen = Object.values(graadRichtingen.richtingen).sort((a, b) => 
    a.naam.localeCompare(b.naam)
  );
  
  // Voeg richtingen toe aan dropdown
  sortedRichtingen.forEach(richting => {
    const option = document.createElement('option');
    option.value = richting.code;
    option.textContent = richting.naam;
    elements.richtingSelect.appendChild(option);
  });
}

/**
 * Event handler voor de "Toon lessentabel" knop
 */
async function handleLoadButtonClick() {
  if (!elements.graadSelect || !elements.richtingSelect) return;
  
  const selectedGraad = elements.graadSelect.value;
  const selectedRichting = elements.richtingSelect.value;
  
  if (!selectedGraad) {
    alert('Selecteer eerst een graad.');
    return;
  }
  
  if (!selectedRichting) {
    alert('Selecteer een richting.');
    return;
  }
  
  await loadLessentabelVoorGraadRichting(selectedGraad, selectedRichting);
}

/**
 * Laadt en toont de lessentabel voor de opgegeven graad en richting
 * @param {string} graad - De graadcode
 * @param {string} richtingCode - De richtingcode
 */
async function loadLessentabelVoorGraadRichting(graad, richtingCode) {
  try {
    // Controleer of graad en richting bestaan
    const graadData = window.LessentabellenPrinterApp.data.graadRichtingen[graad];
    if (!graadData || !graadData.richtingen[richtingCode]) {
      showError(`Geen data gevonden voor graad ${graad} en richting ${richtingCode}`);
      return;
    }
    
    // Toon laadindicator
    elements.tableContent.innerHTML = '<div class="loading">Lessentabel wordt geladen...</div>';
    
    // Haal richting data op
    const richtingData = graadData.richtingen[richtingCode];
    const klasCodes = richtingData.klassen;
    
    if (!klasCodes || klasCodes.length === 0) {
      showError(`Geen lessentabel gevonden voor ${richtingData.naam} in ${graad}`);
      return;
    }
    
    // Stel domein kleur in
    const domein = richtingData.domein ? richtingData.domein.toLowerCase() : 'stem';
    setDomainColor(domein);
    
    // Laad alle benodigde data voor elke klas
    const klassen = window.LessentabellenPrinterApp.data.klassen;
    const lessentabel = window.LessentabellenPrinterApp.data.lessentabel;
    const voetnoten = window.LessentabellenPrinterApp.data.voetnoten;
    
    // Verzamel alle klasdataobjecten
    const klasDataObjecten = klasCodes.map(klasCode => {
      const klas = window.DataLoader.findKlasByCode(klassen, klasCode);
      const lessen = window.DataLoader.getLessenForKlas(lessentabel, klasCode);
      const klasVoetnoten = window.DataLoader.getVoetnotenForKlas(voetnoten, klasCode);
      
      return {
        klas,
        lessen,
        voetnoten: klasVoetnoten
      };
    });
    
    // Update UI met richting informatie
    updateGraadRichtingInfo(graad, richtingData);
    
    // Genereer de volledige lessentabel voor de graad en richting
    elements.tableContent.innerHTML = window.TableGenerator.generateGraadRichtingLessentabel(klasDataObjecten);
    
    // Maak tabel en container zichtbaar
    elements.tableContainer.style.display = 'block';
    
  } catch (error) {
    console.error('Fout bij laden van lessentabel:', error);
    showError('Er is een fout opgetreden bij het laden van de lessentabel.');
  }
}

/**
 * Update de weergave met informatie over de geselecteerde graad en richting
 * @param {string} graad - De graad
 * @param {Object} richtingData - Het richtingsobject
 */
function updateGraadRichtingInfo(graad, richtingData) {
  if (elements.graadTitel) {
    elements.graadTitel.textContent = graad;
  }
  
  if (elements.richtingTitel) {
    elements.richtingTitel.textContent = richtingData.naam || 'Onbekende richting';
  }
  
  if (elements.finaliteitTitel) {
    // Stel finaliteit in
    const finaliteit = (richtingData.finaliteit || '').toString().trim();
    
    if (finaliteit) {
      // Eerste letter capitaliseren
      const finaliteitDisplay = finaliteit.charAt(0).toUpperCase() + finaliteit.slice(1);
      elements.finaliteitTitel.textContent = `Finaliteit: ${finaliteitDisplay}`;
    } else {
      elements.finaliteitTitel.textContent = '';
    }
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
  populateGraadRichtingenDropdown,
  loadLessentabelVoorGraadRichting
};
