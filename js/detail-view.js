/**
 * Lessentabellen Detail View Module v1.0
 * Bevat functionaliteit voor het detail-paneel (slidein)
 * @copyright 2025 GO Campus Redingenhof
 */

const DetailViewModule = {
  /**
   * Initialiseer de detail view module
   * @param {Object} app - Referentie naar het hoofdapplicatie object (LessentabellenApp)
   */
  init(app) {
    this.app = app;
    console.log("Detail View Module v1.0 initialized");
    
    // Schakel het event listener in voor het sluiten van het detail paneel met ESC-toets
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.app.elements.slidein?.classList.contains('open')) {
        this.closeSlidein();
      }
    });
  },
  
  /**
   * Open het detail-paneel met informatie over een richting
   * @param {string} graad - De graad van de richting
   * @param {string} slug - De slug van de richting
   * @param {string} normDomainKey - De genormaliseerde domeinnaam
   */
  openSlidein(graad, slug, normDomainKey) {
    if (!this.app.elements.slidein || !this.app.elements.overlay) return;
    
    // Reset eventuele eerdere stijlen
    this.app.elements.slidein.removeAttribute('style');
    
    // Stel de correcte layout in op basis van dynamic top
    this.app.setDynamicTop();
    
    // Voeg het domein toe als data-attribuut voor styling
    this.app.elements.slidein.dataset.domain = normDomainKey;
    
    const colors = this.app.config.domainColors[normDomainKey];
    if (colors) {
      // Domein-specifieke kleuren instellen
      this.app.elements.slidein.style.setProperty("--app-domain-base", colors.base);
      this.app.elements.slidein.style.setProperty("--app-domain-mid", colors.mid);
      this.app.elements.slidein.style.setProperty("--app-domain-light1", colors.light1);
      this.app.elements.slidein.style.setProperty("--hover-row", colors.hover);
      
      // RGB-waarden berekenen voor transparante achtergronden
      const rgbValues = this._hexToRgb(colors.base);
      if (rgbValues) {
        this.app.elements.slidein.style.setProperty("--app-domain-base-rgb", rgbValues);
      }
      
      const rgbValuesMid = this._hexToRgb(colors.mid);
      if (rgbValuesMid) {
        this.app.elements.slidein.style.setProperty("--app-domain-mid-rgb", rgbValuesMid);
      }
    }
    
    this.app.elements.slidein.classList.add("open");
    this.app.elements.overlay.classList.add("show");
    
    const datum = new Date().toLocaleDateString("nl-BE", {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    
    // Direct element ophalen zonder selector
    const datumEl = document.getElementById("datum-print");
    if (datumEl) {
      datumEl.innerText = datum;
    }
    
    const filteredData = this.app.filterDataByGraadAndSlug(graad, slug);
    const richtingData = filteredData[0] || {};
    
    // Directe element-referenties gebruiken
    const titelElement = document.getElementById("opleiding-titel");
    const beschrijvingElement = document.getElementById("opleiding-beschrijving");
    
    if (titelElement) {
      titelElement.innerText = richtingData.titel || "Onbekend";
    }
    
    if (beschrijvingElement) {
      beschrijvingElement.innerText = richtingData.beschrijving || "";
    }
    
    const brochureLink = document.getElementById("brochure-link");
    if (brochureLink) {
      if (richtingData.brochure) {
        brochureLink.href = richtingData.brochure;
        brochureLink.style.display = "inline-flex";
      } else {
        brochureLink.style.display = "none";
      }
    }
    
    this.buildLessonTable(filteredData);
    document.body.style.overflow = "hidden";
    
    setTimeout(() => {
      this.app.elements.slidein.focus();
      const urlSlug = `${graad.toLowerCase().replace(/\s+/g, '-')}-${slug}`;
      history.pushState(
        { graad, slug, domain: normDomainKey },
        '', 
        `#${urlSlug}`
      );
    }, 100);
    
    this.app.data.currentRichting = { graad, slug, domain: normDomainKey };
  },
  
  /**
   * Sluit het detail-paneel
   */
  closeSlidein() {
    if (!this.app.elements.slidein || !this.app.elements.overlay) return;
    
    this.app.elements.slidein.classList.remove("open");
    this.app.elements.overlay.classList.remove("show");
    document.body.style.overflow = "";
    history.pushState({}, '', location.pathname);
    this.app.data.currentRichting = null;
  },
  
  /**
   * Bouw de lessentabel op basis van de gegevens
   * @param {Array} filteredData - De gefilterde data voor de gekozen richting
   */
  buildLessonTable(filteredData) {
    if (!this.app.elements.tableContainer) return;
    
    if (!filteredData || filteredData.length === 0) {
      this.app.elements.tableContainer.innerHTML = `
        <div class="error-message">
          <p>Geen lessentabel beschikbaar voor deze richting.</p>
        </div>`;
      
      // Direct element ophalen
      const footnotesEl = document.getElementById("footnotes");
      if (footnotesEl) {
        footnotesEl.innerHTML = "";
      }
      return;
    }
    
    const klassen = [...new Set(filteredData.map(r => r.code))];
    const vakken = [...new Set(filteredData.map(r => r.label))];
    
    let tableHTML = `
      <table role="grid" aria-label="Lessentabel">
        <thead>
          <tr>
            <th scope="col">VAK</th>
            ${klassen.map(k => `<th scope="col">${k}</th>`).join("")}
          </tr>
        </thead>
        <tbody>
    `;
    
    vakken.forEach(vak => {
      tableHTML += `<tr>`;
      tableHTML += `<td>${vak}</td>`;
      
      klassen.forEach(klas => {
        const cel = filteredData.find(r => r.code === klas && r.label === vak);
        tableHTML += `<td>${cel?.uren || ""}</td>`;
      });
      
      tableHTML += `</tr>`;
    });
    
    const showStageRow = klassen.some(klas =>
      filteredData.find(r => (
        r.code === klas && 
        r.stage_weken && 
        r.stage_weken.trim() !== "" && 
        r.stage_weken !== "0"
      ))
    );
    
    if (showStageRow) {
      tableHTML += `
        <tr class="stage-row">
          <td>Stage weken</td>
          ${klassen.map(klas => {
            const stageInfo = filteredData.find(r => r.code === klas)?.stage_weken || "";
            return `<td>${stageInfo}</td>`;
          }).join("")}
        </tr>
      `;
    }
    
    tableHTML += `</tbody></table>`;
    this.app.elements.tableContainer.innerHTML = tableHTML;
    
    // Direct element ophalen
    const footnotesElement = document.getElementById("footnotes");
    if (footnotesElement) {
      const uniqueFootnotes = [...new Set(
        filteredData
          .map(r => (r.voetnoten || "").trim())
          .filter(v => v !== "")
      )];
      
      if (uniqueFootnotes.length > 0) {
        footnotesElement.innerHTML = `
          <p class="footnotes">${uniqueFootnotes.join(" &middot; ")}</p>
        `;
      } else {
        footnotesElement.innerHTML = "";
      }
    }
  },
  
  /**
   * Converteer een hexadecimale kleurwaarde naar RGB
   * @private
   * @param {string} hex - De hexadecimale kleurwaarde
   * @returns {string|null} De RGB-waarden als string "r, g, b" of null bij ongeldige input
   */
  _hexToRgb(hex) {
    if (!hex) return null;
    
    // Verwijder de # indien aanwezig
    hex = hex.replace('#', '');
    
    // Controleer of de hex-waarde geldig is
    if (!/^[0-9A-Fa-f]{6}$/.test(hex)) return null;
    
    // Parse de hexadecimale waarden
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    return `${r}, ${g}, ${b}`;
  }
};

// Export de module
window.DetailViewModule = DetailViewModule;