// detail-view.js
import { mapDomein, getDomeinMeta } from './config-module.js';
import { generateLessentabel } from './table-generator.js';

// Globale variabelen voor event cleanup
let activeResizeHandler = null;
let activeObserver = null;

/**
 * Genereert en toont de slide-in infokader voor een geselecteerde klas.
 * @param {Object} klas - Het klasobject met richting, beschrijving, domein...
 * @param {Array} lessen - Alle lesitems van alle klassen in de richting
 * @param {Array} voetnoten - Alle voetnoten die bij deze richting horen
 */
export function renderSlidein(klas, lessen, voetnoten) {
  try {
    // Controleer of klas geldig is
    if (!klas || !klas.klascode) {
      console.error('Ongeldige klas object ontvangen:', klas);
      throw new Error('Ongeldige klas data');
    }
    
    console.log(`Render slidein voor klas: ${klas.klascode} (${klas.richting || 'onbekend'})`);
    
    // Cleanup eventuele bestaande resources
    cleanupResources();
    
    // Stel domein-specifieke styling en kleuren in
    setupDomeinStyling(klas);
    
    // Vul de basisinformatie in
    populateBasicInfo(klas);
    
    // Genereer en vul de lessentabel
    const lesHTML = generateLessentabel(lessen, klas);
    const container = document.getElementById("lessentabel-container");
    
    if (container) {
      container.innerHTML = lesHTML;
    } else {
      console.error('Lessentabel container niet gevonden in DOM');
    }

    // Voeg eventuele voetnoten toe
    addFootnotes(voetnoten);

    // Toon het slidein paneel
    showSlidein();
    
    // Bewaar huidige klascode in global LessentabellenApp
    if (window.LessentabellenApp) {
      window.LessentabellenApp.currentKlasCode = klas.klascode;
    }
    
    // Schakel luisteraars in voor auto-schaling bij resizen
    enableAutoScaling();
    
    // Initialiseer de print handler met de huidige klas
    setupPrintHandler(klas);
    
    console.log('Slidein succesvol gerenderd');
  } catch (error) {
    console.error('Fout bij renderen slidein:', error);
    // Probeer toch basis content te tonen bij fouten
    const container = document.getElementById("lessentabel-container");
    if (container) {
      container.innerHTML = `
        <div class="error-message">
          Er is een fout opgetreden bij het laden van de lessentabel. 
          Probeer het opnieuw of neem contact op met de beheerder.
          <br><br>
          Foutinformatie: ${error.message || 'Onbekende fout'}
        </div>
      `;
    }
    
    // Toon het paneel toch, zodat gebruiker de foutmelding kan zien
    showSlidein();
  }
}

/**
 * Verbeterde functie voor het initialiseren van de print handler
 * @param {Object} klas - Het klasobject
 */
function setupPrintHandler(klas) {
  try {
    console.log('Setting up print handler voor klas:', klas?.klascode);
    
    // Bewaar de klas in een global variabele voor print-handler.js
    window.currentPrintKlas = klas;
    
    // Probeer de print-handler module te laden
    import('./print-handler.js')
      .then(module => {
        if (typeof module.initPrintHandler === 'function') {
          module.initPrintHandler(klas);
        } else {
          console.error('Print handler module geladen maar initPrintHandler functie ontbreekt');
        }
      })
      .catch(error => {
        console.error('Fout bij laden print handler module:', error);
      });
    
    // Zorg dat de downloadknop werkt, ook zonder modules
    const downloadBtn = document.getElementById('download-pdf-button');
    if (downloadBtn) {
      // Vervang de bestaande button om memory leaks te voorkomen
      const newBtn = downloadBtn.cloneNode(true);
      downloadBtn.parentNode.replaceChild(newBtn, downloadBtn);
      
      // Voeg nieuwe event listener toe
      newBtn.addEventListener('click', () => {
        if (window.LessentabellenApp && typeof window.LessentabellenApp.generateHTML === 'function') {
          window.LessentabellenApp.generateHTML();
        } else {
          // Fallback: probeer print handler direct aan te roepen
          import('./print-handler.js')
            .then(module => {
              if (typeof module.generateHTML === 'function') {
                module.generateHTML();
              } else {
                alert('Print functionaliteit niet beschikbaar. Ververs de pagina en probeer opnieuw.');
              }
            })
            .catch(error => {
              console.error('Fout bij laden print handler voor download:', error);
              alert('Kon print functionaliteit niet laden: ' + error.message);
            });
        }
      });
    }
  } catch (error) {
    console.error('Fout bij setup print handler:', error);
  }
}

/**
 * Cleanup resources bij het wisselen of sluiten van slidein
 */
function cleanupResources() {
  // Verwijder eventuele bestaande resize handler
  if (activeResizeHandler) {
    window.removeEventListener('resize', activeResizeHandler);
    activeResizeHandler = null;
  }
  
  // Verwijder eventuele observer
  if (activeObserver) {
    activeObserver.disconnect();
    activeObserver = null;
  }
  
  // Reset table scaling
  const table = document.querySelector('.lessentabel');
  if (table) {
    table.style.transform = '';
    table.style.fontSize = '';
    table.style.marginBottom = '';
  }
  
  // Reset schaal classes
  const slidein = document.getElementById('slidein');
  if (slidein) {
    slidein.classList.remove('scaled-table');
    slidein.classList.remove('contains-scaled-table');
    slidein.classList.remove('print-optimized');
  }
}

/**
 * Schakelt automatische schaling in voor lessentabellen
 * die te groot zijn voor de container
 */
function enableAutoScaling() {
  // Eerste schaling meteen toepassen
  detectAndScaleTable();
  
  // Maak handler voor window resize
  activeResizeHandler = () => {
    try {
      detectAndScaleTable();
    } catch (error) {
      console.error('Fout in resize handler:', error);
    }
  };
  window.addEventListener('resize', activeResizeHandler);
  
  // Observe dom changes
  try {
    const container = document.getElementById("lessentabel-container");
    if (container) {
      activeObserver = new MutationObserver(() => {
        try {
          detectAndScaleTable();
        } catch (error) {
          console.error('Fout in mutation observer:', error);
        }
      });
      activeObserver.observe(container, { 
        childList: true, 
        subtree: true,
        attributes: true
      });
    }
  } catch (err) {
    console.error('Fout bij maken observer:', err);
  }
}

/**
 * Detecteert of tabel te groot is en past schaal aan indien nodig
 */
function detectAndScaleTable() {
  const container = document.getElementById("slidein");
  const table = document.querySelector(".lessentabel");
  
  if (!container || !table) return;
  
  // Reset eerst eventuele transformaties
  table.style.transform = '';
  table.style.fontSize = '';
  table.style.marginBottom = '';
  
  // Controleer of we in printmodus zijn
  const isPrintMode = document.body.classList.contains('print-mode');
  
  // In normale weergave alleen schalen als de tabel echt te groot is
  if (!isPrintMode) {
    try {
      // Bepaal beschikbare hoogte
      const availableHeight = container.clientHeight - 200;
      
      // Als tabel meer dan 50% te groot is, schalen
      if (table.offsetHeight > availableHeight * 1.5) {
        // Bereken schaalfactor (niet kleiner dan 75%)
        const scale = Math.max(0.75, availableHeight / table.offsetHeight);
        
        // Pas transformatie toe
        table.style.transform = `scale(${scale})`;
        table.style.transformOrigin = 'top center';
        
        // Compenseer voor schaling
        const newMargin = Math.ceil(table.offsetHeight * (1 - scale));
        table.style.marginBottom = `${newMargin}px`;
      }
    } catch (error) {
      console.error('Fout bij schalen van tabel:', error);
      // Bij een fout, reset alle transformaties
      table.style.transform = '';
      table.style.fontSize = '';
      table.style.marginBottom = '';
    }
  }
}

/**
 * Stelt de domein-styling en kleuren in voor het slidein
 * @param {Object} klas - Het klasobject 
 */
function setupDomeinStyling(klas) {
  try {
    const domeinKey = mapDomein(klas.domein);
    
    // Update het slidein element met de juiste domein data voor styling
    const slideinEl = document.getElementById("slidein");
    if (slideinEl) {
      slideinEl.dataset.domain = domeinKey;
      
      // Haal de domein kleuren op en pas ze toe als CSS variabelen
      const domeinMeta = getDomeinMeta(domeinKey);
      slideinEl.style.setProperty('--app-domain-base', domeinMeta.base);
      slideinEl.style.setProperty('--app-domain-mid', domeinMeta.mid);
      slideinEl.style.setProperty('--app-domain-light1', domeinMeta.light1);
      slideinEl.style.setProperty('--app-domain-hover', domeinMeta.hover);
    }
  } catch (error) {
    console.error('Fout bij instellen domein styling:', error);
    // Als er een fout is, gebruik fallback kleuren
    const slideinEl = document.getElementById("slidein");
    if (slideinEl) {
      slideinEl.style.setProperty('--app-domain-base', '#333333');
      slideinEl.style.setProperty('--app-domain-mid', '#666666');
      slideinEl.style.setProperty('--app-domain-light1', '#999999');
      slideinEl.style.setProperty('--app-domain-hover', '#cccccc');
    }
  }
}

/**
 * Vult de basis informatie in (titel, beschrijving)
 * @param {Object} klas - Het klasobject
 */
function populateBasicInfo(klas) {
  try {
    const titelEl = document.getElementById("opleiding-titel");
    if (titelEl) titelEl.textContent = klas.richting || 'Onbekende richting';
    
    // Voorkom 'undefined' of 'null' bij ontbrekende beschrijving
    const beschrijving = klas.beschrijving || '';
    const beschrijvingEl = document.getElementById("opleiding-beschrijving");
    if (beschrijvingEl) beschrijvingEl.textContent = beschrijving;
    
    // Optioneel: stel de brochure link in als die beschikbaar is
    const brochureLink = document.getElementById("brochure-link");
    if (brochureLink) {
      if (klas.brochure_url) {
        brochureLink.href = klas.brochure_url;
        brochureLink.style.display = 'inline-flex';
      } else {
        // Verberg de brochure link als er geen URL is
        brochureLink.style.display = 'none';
      }
    }
    
    // Update de printknop met klasgegevens voor gebruik tijdens printen
    const printButton = document.getElementById("print-button");
    if (printButton) {
      printButton.dataset.klas = klas.klascode;
      printButton.dataset.richting = klas.richting;
    }
    
    // Update het datum element in de footer met huidige datum
    const datumEl = document.getElementById("datum-print");
    if (datumEl) {
      try {
        const nu = new Date();
        datumEl.textContent = nu.toLocaleDateString('nl-BE', {
          day: '2-digit',
          month: 'long',
          year: 'numeric'
        });
      } catch (error) {
        // Fallback bij fout in datum
        const nu = new Date();
        datumEl.textContent = `${nu.getDate()}-${nu.getMonth() + 1}-${nu.getFullYear()}`;
      }
    }
  } catch (error) {
    console.error('Fout bij invullen basisinformatie:', error);
  }
}

/**
 * Voegt de voetnoten toe aan het slidein
 * @param {Array} voetnoten - Array van voetnoot objecten
 */
function addFootnotes(voetnoten) {
  try {
    // Filter lege voetnoten
    const filteredVoetnoten = voetnoten.filter(f => f.tekst && f.tekst.trim().length > 0);
    
    // Genereer HTML als er voetnoten zijn
    let voetHTML = '';
    
    if (filteredVoetnoten.length > 0) {
      voetHTML = filteredVoetnoten
        .map(f => `<li>${f.tekst}</li>`)
        .join('');
        
      voetHTML = `<div class="footnotes">
        <h4>Extra informatie</h4>
        <ul>${voetHTML}</ul>
      </div>`;
    }
    
    // Voeg voetnoten toe aan het document
    const footnotesEl = document.getElementById("footnotes");
    if (footnotesEl) footnotesEl.innerHTML = voetHTML;
  } catch (error) {
    console.error('Fout bij toevoegen voetnoten:', error);
    // Bij fout, leeg de voetnoten div om fouten te voorkomen
    const footnotesEl = document.getElementById("footnotes");
    if (footnotesEl) footnotesEl.innerHTML = '';
  }
}

/**
 * Toont het slidein paneel en initialiseert de close knop
 */
function showSlidein() {
  try {
    // Toon het slidein paneel
    const slideinEl = document.getElementById("slidein");
    if (slideinEl) slideinEl.classList.add("open");
    
    const overlayEl = document.getElementById("overlay");
    if (overlayEl) overlayEl.classList.add("active");
    
    // Zorg ervoor dat de sluitknop werkt
    const closeBtn = document.querySelector('.close-btn');
    if (closeBtn) {
      // Maak een nieuwe knop aan om eventuele oude event listeners te verwijderen
      const newBtn = closeBtn.cloneNode(true);
      closeBtn.parentNode.replaceChild(newBtn, closeBtn);
      
      // Voeg nieuwe event listener toe
      newBtn.addEventListener('click', () => {
        if (window.LessentabellenApp && typeof window.LessentabellenApp.closeSlidein === 'function') {
          window.LessentabellenApp.closeSlidein();
        } else {
          // Fallback als de app niet beschikbaar is
          if (slideinEl) slideinEl.classList.remove("open");
          if (overlayEl) overlayEl.classList.remove("active");
        }
      });
    }
  } catch (error) {
    console.error('Fout bij tonen slidein:', error);
  }
}

// Exporteer alleen de belangrijkste functie
export default renderSlidein;
