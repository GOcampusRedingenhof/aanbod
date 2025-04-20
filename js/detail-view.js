// detail-view.js - Verbeterde versie
import { mapDomein, getDomeinMeta } from './config-module.js';
import { generateLessentabel } from './table-generator.js';

/**
 * Genereert en toont de slide-in infokader voor een geselecteerde klas.
 * @param {Object} klas - Het klasobject met richting, beschrijving, domein...
 * @param {Array} lessen - Alle lesitems voor deze klas
 * @param {Array} voetnoten - Alle voetnoten die bij deze klas horen
 */
export function renderSlidein(klas, lessen, voetnoten) {
  try {
    // Stel domein-specifieke styling en kleuren in
    setupDomeinStyling(klas);
    
    // Vul de basisinformatie in
    populateBasicInfo(klas);
    
    // Genereer en vul de lessentabel
    const tableContainer = document.getElementById("lessentabel-container");
    if (tableContainer) {
      // Configureer voor deze specifieke klas
      const lesHTML = generateTabel(lessen);
      tableContainer.innerHTML = lesHTML;
    }

    // Voeg eventuele voetnoten toe
    addFootnotes(voetnoten);

    // Toon het slidein paneel
    showSlidein();
    
    // Update datum voor printen
    const datumEl = document.getElementById('datum-print');
    if (datumEl) {
      try {
        const nu = new Date();
        datumEl.textContent = nu.toLocaleDateString('nl-BE', {
          day: '2-digit',
          month: 'long',
          year: 'numeric'
        });
      } catch (error) {
        const nu = new Date();
        datumEl.textContent = `${nu.getDate()}-${nu.getMonth() + 1}-${nu.getFullYear()}`;
      }
    }
  } catch (error) {
    console.error('Fout bij renderen slidein:', error);
    // Toon foutmelding in slidein
    showErrorInSlidein();
  }
}

/**
 * Genereert een eenvoudige lessentabel
 * @param {Array} lessen - Alle lessen voor deze klas
 * @returns {string} HTML voor de lessentabel
 */
function generateTabel(lessen) {
  // Groepeer lessen per categorie
  const categorieën = {};
  
  lessen.forEach(les => {
    const categorie = les.categorie || 'Onbekend';
    if (!categorieën[categorie]) {
      categorieën[categorie] = [];
    }
    categorieën[categorie].push(les);
  });
  
  // Begin met het bouwen van de HTML
  let html = `
    <table class="lessentabel" cellspacing="0" cellpadding="4">
      <thead>
        <tr>
          <th>Vak</th>
          <th>Uren</th>
        </tr>
      </thead>
      <tbody>
  `;
  
  // Sorteer categorieën: basisvorming eerst, specifiek daarna
  const volgorde = ['basisvorming', 'specifiek gedeelte', 'vrije ruimte'];
  const sortedCategories = Object.keys(categorieën).sort((a, b) => {
    const indexA = volgorde.indexOf(a.toLowerCase());
    const indexB = volgorde.indexOf(b.toLowerCase());
    return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
  });
  
  // Loop door elke categorie
  sortedCategories.forEach(categorie => {
    html += `
      <tr class="categorie-header">
        <th colspan="2">${categorie.toUpperCase()}</th>
      </tr>
    `;
    
    // Sorteer lessen alfabetisch op vaknaam binnen elke categorie
    const sortedLessen = categorieën[categorie].sort((a, b) => 
      a.vak.localeCompare(b.vak)
    );
    
    // Voeg rijen toe voor normale vakken
    sortedLessen.filter(les => !les.subvak).forEach(les => {
      html += `
        <tr>
          <td>${les.vak}</td>
          <td>${les.uren || '-'}</td>
        </tr>
      `;
    });
    
    // Voeg rijen toe voor subvakken met inspringing
    sortedLessen.filter(les => les.subvak).forEach(les => {
      html += `
        <tr class="subvak">
          <td><span class="subvak-marker">•&nbsp;</span>${les.vak}</td>
          <td>${les.uren || '-'}</td>
        </tr>
      `;
    });
  });
  
  // Bereken totaal aantal uren
  let totaal = 0;
  lessen.forEach(les => {
    if (les.uren && !isNaN(parseFloat(String(les.uren).replace(',', '.')))) {
      totaal += parseFloat(String(les.uren).replace(',', '.'));
    }
  });
  
  // Voeg totaalrij toe
  html += `
    <tr class="totaal-row">
      <td>Lestijden per week</td>
      <td>${Math.round(totaal * 10) / 10}</td>
    </tr>
  `;
  
  // Sluit de tabel
  html += `
      </tbody>
    </table>
  `;
  
  return html;
}

/**
 * Toont een foutmelding in het slidein paneel
 */
function showErrorInSlidein() {
  const container = document.getElementById("lessentabel-container");
  if (container) {
    container.innerHTML = `
      <div class="error-message">
        <p>Er is een fout opgetreden bij het laden van de lessentabel.</p>
        <p>Probeer het later opnieuw of neem contact op met de beheerder.</p>
      </div>
    `;
  }
  
  // Toon het slidein ondanks de fout
  showSlidein();
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
      
      // Stel domein kleuren in
      document.documentElement.style.setProperty('--app-domain-base', domeinMeta.base);
      document.documentElement.style.setProperty('--app-domain-mid', domeinMeta.mid);
      document.documentElement.style.setProperty('--app-domain-light1', domeinMeta.light1);
      document.documentElement.style.setProperty('--app-domain-hover', domeinMeta.hover);
      
      // Zet ook op slidein element voor fallback
      slideinEl.style.setProperty('--app-domain-base', domeinMeta.base);
      slideinEl.style.setProperty('--app-domain-mid', domeinMeta.mid);
      slideinEl.style.setProperty('--app-domain-light1', domeinMeta.light1);
      slideinEl.style.setProperty('--app-domain-hover', domeinMeta.hover);
    }
  } catch (error) {
    console.error('Fout bij instellen domein styling:', error);
    // Fallback kleuren
    document.documentElement.style.setProperty('--app-domain-base', '#333');
    document.documentElement.style.setProperty('--app-domain-mid', '#666');
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
    const footnotesEl = document.getElementById("footnotes");
    if (!footnotesEl) return;
    
    // Filter lege voetnoten
    const filteredVoetnoten = voetnoten.filter(f => f.tekst && f.tekst.trim().length > 0);
    
    if (filteredVoetnoten.length > 0) {
      let html = '<div class="footnotes"><ul>';
      
      filteredVoetnoten.forEach(voetnoot => {
        html += `<li>${voetnoot.tekst}</li>`;
      });
      
      html += '</ul></div>';
      footnotesEl.innerHTML = html;
    } else {
      footnotesEl.innerHTML = '';
    }
  } catch (error) {
    console.error('Fout bij toevoegen voetnoten:', error);
    // Leeg bij fout
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
      closeBtn.addEventListener('click', () => {
        if (slideinEl) slideinEl.classList.remove("open");
        if (overlayEl) overlayEl.classList.remove("active");
      });
    }
  } catch (error) {
    console.error('Fout bij tonen slidein:', error);
  }
}

// Exporteer functies die nodig zijn voor externe modules
export default renderSlidein;
