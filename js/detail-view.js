// detail-view.js
// Gerefactorde versie met betere scheiding van verantwoordelijkheden
import { mapDomein, getDomeinMeta } from './config-module.js';
import { initPrintHandler } from './print-handler.js';
import { generateLessentabel } from './table-generator.js';

// Bewaar referentie naar de actieve scaling observer en handlers
let activeScalingObserver = null;
let activeResizeHandler = null;

/**
 * Genereert en toont de slide-in infokader voor een geselecteerde klas.
 * @param {Object} klas - Het klasobject met richting, beschrijving, domein...
 * @param {Array} lessen - Alle lesitems van alle klassen in de richting
 * @param {Array} voetnoten - Alle voetnoten die bij deze richting horen
 */
export function renderSlidein(klas, lessen, voetnoten) {
  // Cleanup eventuele bestaande resources
  cleanupActiveResources();
  
  // Stel domein-specifieke styling en kleuren in
  setupDomeinStyling(klas);
  
  // Vul de basisinformatie in
  populateBasicInfo(klas);
  
  // Genereer en vul de lessentabel
  const lesHTML = generateLessentabel(lessen, klas);
  document.getElementById("lessentabel-container").innerHTML = lesHTML;

  // Voeg eventuele voetnoten toe
  addFootnotes(voetnoten);

  // Toon het slidein paneel
  showSlidein();
  
  // Initialiseer de print handler voor dit slidein met klas-informatie
  initPrintHandler(klas);
  
  // Bewaar huidige klascode in global LessentabellenApp
  if (window.LessentabellenApp) {
    window.LessentabellenApp.currentKlasCode = klas.klascode;
  }
  
  // Schakel luisteraars in voor auto-schaling bij resizen
  enableAutoScaling();
}

/**
 * Cleanup resources bij het wisselen of sluiten van slidein
 */
function cleanupActiveResources() {
  // Cleanup van auto-scaling resources
  if (activeScalingObserver) {
    activeScalingObserver.disconnect();
    activeScalingObserver = null;
  }
  
  if (activeResizeHandler) {
    window.removeEventListener('resize', activeResizeHandler);
    activeResizeHandler = null;
  }
  
  // Reset eventuele schaalstijlen
  const slidein = document.getElementById('slidein');
  if (slidein) {
    slidein.classList.remove('scaled-table');
    
    const table = slidein.querySelector('.lessentabel');
    if (table) {
      table.style.transform = '';
      table.style.fontSize = '';
      table.style.marginBottom = '';
      
      // Reset cell padding
      const cells = table.querySelectorAll('td, th');
      cells.forEach(cell => {
        cell.style.padding = '';
      });
    }
  }
}

/**
 * Schakelt automatische schaling in voor lessentabellen
 * die te groot zijn voor de container
 */
function enableAutoScaling() {
  // Eerste schaling meteen toepassen
  detectAndScaleTable();
  
  // Maak een nieuwe resize handler en bewaar deze
  activeResizeHandler = detectAndScaleTable;
  window.addEventListener('resize', activeResizeHandler);
  
  // Observer om veranderingen in het DOM te detecteren
  activeScalingObserver = new MutationObserver(() => {
    detectAndScaleTable();
  });
  
  // Observeer het lessentabel-container element
  const container = document.getElementById("lessentabel-container");
  if (container) {
    activeScalingObserver.observe(container, { 
      childList: true, 
      subtree: true,
      attributes: true
    });
  }
}

/**
 * Detecteert of tabel te groot is en past schaal aan indien nodig
 */
function detectAndScaleTable() {
  // Controleer of we in printmodus zijn
  const isPrintMode = document.body.classList.contains('print-mode');
  if (isPrintMode) {
    // In printmodus laten we print-handler.js de schaling afhandelen
    return;
  }
  
  const container = document.getElementById("slidein");
  const table = document.querySelector(".lessentabel");
  
  if (!container || !table) return;
  
  // Reset eerst eventuele transformaties
  table.style.transform = '';
  table.style.fontSize = '';
  table.style.marginBottom = '';
  
  // Bepaal beschikbare hoogte (minus marges)
  const maxHeight = container.clientHeight - 200;
  
  if (table.offsetHeight > maxHeight) {
    // Bereken schaalfactor
    const scale = Math.max(0.5, maxHeight / table.offsetHeight); // Niet kleiner dan 50%
    
    // Pas transformatie toe voor vloeiende verkleining
    table.style.transform = `scale(${scale})`;
    table.style.transformOrigin = 'top center';
    
    // Compenseer voor schaling door margin toe te voegen
    const newMargin = Math.ceil(table.offsetHeight * (1 - scale));
    table.style.marginBottom = `${newMargin}px`;
  } else {
    // Verwijder schalingsindicator als er geen schaling meer nodig is
    container.classList.remove('scaled-table');
  }
}

/**
 * Stelt de domein-styling en kleuren in voor het slidein
 * @param {Object} klas - Het klasobject 
 */
function setupDomeinStyling(klas) {
  const domeinKey = mapDomein(klas.domein);
  
  // Update het slidein element met de juiste domein data voor styling
  const slideinEl = document.getElementById("slidein");
  slideinEl.dataset.domain = domeinKey;
  
  // Haal de domein kleuren op en pas ze toe als CSS variabelen
  const domeinMeta = getDomeinMeta(domeinKey);
  slideinEl.style.setProperty('--app-domain-base', domeinMeta.base);
  slideinEl.style.setProperty('--app-domain-mid', domeinMeta.mid);
  slideinEl.style.setProperty('--app-domain-light1', domeinMeta.light1);
  slideinEl.style.setProperty('--app-domain-hover', domeinMeta.hover);
}

/**
 * Vult de basis informatie in (titel, beschrijving)
 * @param {Object} klas - Het klasobject
 */
function populateBasicInfo(klas) {
  document.getElementById("opleiding-titel").textContent = klas.richting;
  
  // Voorkom 'undefined' of 'null' bij ontbrekende beschrijving
  const beschrijving = klas.beschrijving || '';
  document.getElementById("opleiding-beschrijving").textContent = beschrijving;
  
  // Optioneel: stel de brochure link in als die beschikbaar is
  const brochureLink = document.getElementById("brochure-link");
  if (brochureLink && klas.brochure_url) {
    brochureLink.href = klas.brochure_url;
    brochureLink.style.display = 'inline-flex';
  } else if (brochureLink) {
    // Verberg de brochure link als er geen URL is
    brochureLink.style.display = 'none';
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
    const nu = new Date();
    datumEl.textContent = nu.toLocaleDateString('nl-BE', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  }
}

/**
 * Voegt de voetnoten toe aan het slidein
 * @param {Array} voetnoten - Array van voetnoot objecten
 */
function addFootnotes(voetnoten) {
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
  document.getElementById("footnotes").innerHTML = voetHTML;
}

/**
 * Toont het slidein paneel en initialiseert de close knop
 */
function showSlidein() {
  // Toon het slidein paneel
  const slideinEl = document.getElementById("slidein");
  slideinEl.classList.add("open");
  document.getElementById("overlay").classList.add("active");
  
  // Zorg ervoor dat de sluitknop werkt
  const closeBtn = document.querySelector('.close-btn');
  if (closeBtn) {
    // Verwijder eerst alle bestaande eventlisteners
    const newBtn = closeBtn.cloneNode(true);
    closeBtn.parentNode.replaceChild(newBtn, closeBtn);
    
    // Voeg nieuwe event listener toe
    newBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      // Controleer of we in printmodus zijn
      if (document.body.classList.contains('print-mode')) {
        console.log('Kan slidein niet sluiten tijdens print modus');
        return; // Voorkom sluiten tijdens printen
      }
      
      if (window.LessentabellenApp && typeof window.LessentabellenApp.closeSlidein === 'function') {
        window.LessentabellenApp.closeSlidein();
      } else {
        // Fallback als de app niet beschikbaar is
        slideinEl.classList.remove("open");
        document.getElementById("overlay").classList.remove("active");
        
        // Voer cleanup uit
        cleanupActiveResources();
      }
    });
  }
}
