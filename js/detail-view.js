// detail-view.js
// Gerefactorde versie met betere scheiding van verantwoordelijkheden
import { mapDomein, getDomeinMeta } from './config-module.js';
import { initPrintHandler } from './print-handler.js';
import { generateLessentabel } from './table-generator.js';

/**
 * Genereert en toont de slide-in infokader voor een geselecteerde klas.
 * @param {Object} klas - Het klasobject met richting, beschrijving, domein...
 * @param {Array} lessen - Alle lesitems van alle klassen in de richting
 * @param {Array} voetnoten - Alle voetnoten die bij deze richting horen
 */
export function renderSlidein(klas, lessen, voetnoten) {
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
    closeBtn.addEventListener('click', () => {
      slideinEl.classList.remove("open");
      document.getElementById("overlay").classList.remove("active");
    });
  }
}
