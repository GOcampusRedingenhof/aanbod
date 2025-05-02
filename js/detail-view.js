// detail-view.js
import { mapDomein, getDomeinMeta, setActiveDomainColors } from './config-module.js';
import { generateLessentabel } from './table-generator.js';
// Importeer de nieuwe print handler functionaliteit
import { initPrintHandler } from './print-handler.js';

// Globale variabelen voor event cleanup
let activeResizeHandler = null;
let activeObserver = null;

/**
 * Genereert en toont de slide-in infokader voor een geselecteerde klas.
 * @param {Object} klas - Het klasobject met richting, beschrijving, domein...
 * @param {Array} lessen - Alle lesitems van alle klassen in de richting
 * @param {Array} voetnoten - Alle voetnoten die bij deze richting horen
 */
export function renderSlidein(klas, lessen, voetnoten, klassenInRichting) {
  try {
    // Cleanup eventuele bestaande resources
    cleanupResources();
    
    // Stel domein-specifieke styling en kleuren in
    setupDomeinStyling(klas);
    
    // Vul de basisinformatie in
    populateBasicInfo(klas);
    
    // Genereer en vul de lessentabel
    const lesHTML = generateLessentabel(lessen, klas, klassenInRichting);
    document.getElementById("lessentabel-container").innerHTML = lesHTML;

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
    
    // Initialiseer de nieuwe print handler met de huidige klas
    initPrintHandler(klas);
  } catch (error) {
    console.error('Fout bij renderen slidein:', error);
    // Probeer toch basis content te tonen bij fouten
    const container = document.getElementById("lessentabel-container");
    if (container) {
      container.innerHTML = `
        <div class="error-message">
          Er is een fout opgetreden bij het laden van de lessentabel. 
          Probeer het opnieuw of neem contact op met de beheerder.
        </div>
      `;
    }
    
    // Toon het paneel toch, zodat gebruiker de foutmelding kan zien
    showSlidein();
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
      // Zet centrale domein-variabelen op :root
      setActiveDomainColors(domeinKey);
    }
  } catch (error) {
    console.error('Fout bij instellen domein styling:', error);
    // Als er een fout is, gebruik fallback kleuren
    const slideinEl = document.getElementById("slidein");
    if (slideinEl) {
      // Zet fallback kleuren op :root
      setActiveDomainColors('eerste-graad');
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
      // Zet de textBtn kleur direct op de link
      if (klas.domein) {
        const domeinKey = mapDomein(klas.domein);
        const domeinMeta = getDomeinMeta(domeinKey);
        brochureLink.style.setProperty('--domain-textBtn', domeinMeta.textBtn || '#fff');
      }
    }
    // Update de printknop met klasgegevens voor gebruik tijdens printen
    const printButton = document.getElementById("print-button");
    if (printButton) {
      printButton.dataset.klas = klas.klascode;
      printButton.dataset.richting = klas.richting;
      // Zet de textBtn kleur direct op de button
      if (klas.domein) {
        const domeinKey = mapDomein(klas.domein);
        const domeinMeta = getDomeinMeta(domeinKey);
        printButton.style.setProperty('--domain-textBtn', domeinMeta.textBtn || '#fff');
      }
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
