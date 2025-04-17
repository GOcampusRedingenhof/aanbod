/**
 * Dynamische Lessentabellen - Versie 3.4.0
 * Hoofd applicatie bestand, nu modulair opgezet
 * @copyright 2025 GO Campus Redingenhof
 */

const LessentabellenApp = {
  // Gebruik config module als die beschikbaar is, anders fallback naar default waarden
  version: window.ConfigModule?.version || '3.4.0',
  modules: {},
  
  // Gebruik externe configuratie indien beschikbaar
  config: window.ConfigModule || {
    csvUrl: "https://raw.githubusercontent.com/GOcampusRedingenhof/lessenrooster/refs/heads/main/lessentabellen_tabel.csv",
    cacheExpiry: 1000 * 60 * 60,
    domainColors: {
      // Fallback waardes indien ConfigModule niet beschikbaar is
      "stem": { base: "#0C8464", mid: "#48A787", light1: "#89CCB2", hover: "#d7f5ea" },
      "topsport": { base: "#A2E4FF", mid: "#C6F0FF", light1: "#E4F9FF", hover: "#6ABCD6" },
      "eerste-graad": { base: "#ED4E13", mid: "#F3764A", light1: "#F8A588", hover: "#F8B96D" },
      "maatschappij-welzijn": { base: "#E399BB", mid: "#EFBACD", light1: "#F7D9E4", hover: "#F2C5D1" },
      "economie-organisatie": { base: "#2B2243", mid: "#254a87", light1: "#5084C2", hover: "#7081a8" },
      "schakeljaar": { base: "#2B2243", mid: "#254a87", light1: "#5084C2", hover: "#7081a8" },
      "okan": { base: "#E5A021", mid: "#F0B94E", light1: "#F9D38A", hover: "#F9CA7F" }
    }
  },
  
  
  data: {
    csvData: null,
    lastFetch: null,
    currentRichting: null,
    domainDisplayNames: {},
    isLoading: true,
    hasError: false,
    errorMessage: ''
  },
  
  elements: {
    container: null,
    slidein: null,
    overlay: null,
    tableContainer: null,
    topbar: null
  },
  
  init() {
    console.log(`Lessentabellen v${this.version} initializing...`);
    this.createRequiredElements();
    this.cacheElements();
    this.setupEventListeners();
    this.initModules();
    this.loadData();
    
    // Verbeterde detectie van tophoogte met meerdere pogingen
    this.setDynamicTop();
    setTimeout(() => this.setDynamicTop(), 500);
    setTimeout(() => this.setDynamicTop(), 1500);
    
    // Optioneel: toon versie-indicator
    this.showVersionIndicator();
  },
  
  /**
   * Initialiseer externe modules
   */
  initModules() {
    // Detail view module initialiseren, indien beschikbaar
    if (window.DetailViewModule) {
      this.modules.detailView = window.DetailViewModule;
      this.modules.detailView.init(this);
    }
  },
  
  createRequiredElements() {
    // Zorg dat de container de klasse .lessentabellen-root heeft
    if (!document.getElementById('domains-container')) {
      const container = document.createElement('div');
      container.id = 'domains-container';
      container.className = 'lessentabellen-root';
      // Probeer een bestaande lessentabellen-root als parent te vinden
      const root = document.querySelector('.lessentabellen-root');
      if (root) {
        root.appendChild(container);
      } else {
        document.body.appendChild(container);
      }
    }
    
    if (!document.getElementById('slidein')) {
      const slidein = document.createElement('div');
      slidein.className = 'lessentabellen-wrapper lessentabellen-root';
      slidein.id = 'slidein';
      slidein.tabIndex = -1;
      
      // Nieuwe structuur voor slidein
      slidein.innerHTML = `
        <!-- Header sectie -->
        <div class="detail-header">
          <button class="close-btn" aria-label="Sluiten" onclick="LessentabellenApp.closeSlidein()">×</button>
          <h2 id="opleiding-titel">&nbsp;</h2>
          <p id="opleiding-beschrijving"></p>
        </div>
        
        <!-- Content sectie -->
        <div class="detail-content">
          <!-- Actieknoppen -->
          <div class="action-buttons">
            <a id="brochure-link" href="#" target="_blank">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10 9 9 9 8 9"></polyline>
              </svg>
              Brochure
            </a>
            <button onclick="window.print()">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="6 9 6 2 18 2 18 9"></polyline>
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                <rect x="6" y="14" width="12" height="8"></rect>
              </svg>
              Afdrukken
            </button>
          </div>
          
          <!-- Lessentabel -->
          <div id="lessentabel-container"></div>
          
          <!-- Voetnoten -->
          <div id="footnotes"></div>
        </div>
        
        <!-- Print-specifieke elementen -->
        <img class="logo-print" src="https://images.squarespace-cdn.com/content/v1/670992d66064015802d7e5dc/5425e461-06b0-4530-9969-4068d5a5dfdc/Scherm%C2%ADafbeelding+2024-12-03+om+09.38.12.jpg?format=1500w" alt="Redingenhof logo" />
        <div class="datum">Afgedrukt op: <span id="datum-print"></span></div>
        <div class="quote">SAMEN VER!</div>
      `;
      
      document.body.appendChild(slidein);
    }
    
    if (!document.getElementById('overlay')) {
      const overlay = document.createElement('div');
      overlay.id = 'overlay';
      overlay.className = 'lessentabellen-root';
      overlay.addEventListener('click', () => this.closeSlidein());
      document.body.appendChild(overlay);
    }
  },
  
  showVersionIndicator() {
    const indicator = document.createElement('div');
    indicator.className = 'version-indicator lessentabellen-root';
    indicator.textContent = `Lessentabellen v${this.version}`;
    // Voeg de indicator bij voorkeur toe aan de bestaande app-container
    const root = document.querySelector('.lessentabellen-root');
    if (root) {
      root.appendChild(indicator);
    } else {
      document.body.appendChild(indicator);
    }
    
    // Verberg na 5 seconden
    setTimeout(() => {
      indicator.style.opacity = '0';
      setTimeout(() => indicator.remove(), 1000);
    }, 5000);
  },
  
  cacheElements() {
    this.elements.container = document.getElementById("domains-container");
    this.elements.slidein = document.getElementById("slidein");
    this.elements.overlay = document.getElementById("overlay");
    this.elements.tableContainer = document.getElementById("lessentabel-container");
    this.elements.topbar = document.getElementById("custom-topbar");
    
    const rootElements = [
      this.elements.container, 
      this.elements.slidein, 
      this.elements.overlay
    ];
    
    rootElements.forEach(el => {
      if (el && !el.classList.contains('lessentabellen-root')) {
        el.classList.add('lessentabellen-root');
      }
    });
  },
  
  setupEventListeners() {
    // Window resize en scroll events
    window.addEventListener("resize", () => this.setDynamicTop());
    window.addEventListener("scroll", () => this.setDynamicTop());
    
    // Observeer veranderingen in de DOM die invloed kunnen hebben op layout
    this.setupMutationObserver();
    
    // URL hash changes
    window.addEventListener('hashchange', () => this.checkUrlHash());
  },
  
  setupMutationObserver() {
    // Observeer veranderingen aan de topbar en header om dynamisch aan te passen
    const topbarObserver = new MutationObserver(() => this.setDynamicTop());
    const header = document.querySelector('.Header--top') || document.querySelector("header");
    
    if (this.elements.topbar) {
      topbarObserver.observe(this.elements.topbar, { 
        attributes: true, 
        attributeFilter: ['style', 'class'], 
        childList: true,
        subtree: true
      });
    }
    
    if (header) {
      topbarObserver.observe(header, { 
        attributes: true, 
        attributeFilter: ['style', 'class'], 
        childList: true
      });
    }
  },
  
  async loadData() {
    try {
      this.showLoading();
      const cached = this.getCachedData();
      if (cached) {
        this.data.csvData = cached.data;
        this.data.lastFetch = cached.timestamp;
        this.buildGrid();
        return;
      }
      
      const response = await fetch(this.config.csvUrl);
      if (!response.ok) {
        throw new Error(`CSV kon niet worden geladen (${response.status})`);
      }
      
      const csv = await response.text();
      const parsedData = this.parseCSV(csv);
      this.data.csvData = parsedData;
      this.data.lastFetch = Date.now();
      this.saveToCache(parsedData);
      this.buildGrid();
      
      // Controleer URL hash na data laden
      setTimeout(() => this.checkUrlHash(), 500);
      
    } catch (error) {
      console.error("Data laden mislukt:", error);
      this.handleError(error.message);
    } finally {
      this.hideLoading();
    }
  },
  
  showLoading() {
    this.data.isLoading = true;
    if (this.elements.container) {
      this.elements.container.innerHTML = '<div class="loader-spinner"></div>';
    }
  },
  
  hideLoading() {
    this.data.isLoading = false;
    const spinner = this.elements.container?.querySelector('.loader-spinner');
    if (spinner) spinner.remove();
  },
  
  handleError(message) {
    this.data.hasError = true;
    this.data.errorMessage = message;
    if (this.elements.container) {
      this.elements.container.innerHTML = `
        <div class="error-message">
          <h3>Er is een probleem opgetreden</h3>
          <p>${message}</p>
          <button onclick="LessentabellenApp.loadData()">Opnieuw proberen</button>
        </div>
      `;
    }
  },
  
  getCachedData() {
    try {
      const cached = localStorage.getItem('lessentabellen_cache');
      if (!cached) return null;
      
      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp > this.config.cacheExpiry) {
        localStorage.removeItem('lessentabellen_cache');
        return null;
      }
      
      return { data, timestamp };
    } catch (e) {
      console.warn('Cache lezen mislukt:', e);
      return null;
    }
  },
  
  saveToCache(data) {
    try {
      const cache = {
        data: data,
        timestamp: Date.now()
      };
      localStorage.setItem('lessentabellen_cache', JSON.stringify(cache));
    } catch (e) {
      console.warn('Cache opslaan mislukt:', e);
    }
  },
  
  parseCSV(csvText) {
    const lines = csvText.trim().split("\n");
    const headers = lines[0].split(";").map(h => h.trim());
    
    return lines.slice(1).map(line => {
      const values = line.split(";").map(v => v.trim());
      return headers.reduce((obj, key, i) => {
        obj[key] = values[i] || '';
        return obj;
      }, {});
    });
  },
  
  normalizeDomainName(rawDomain) {
    let d = rawDomain.toLowerCase().trim();
    d = d.replace(/[\s&]+/g, "-");
    
    if (d.includes("sport") && d.includes("topsport")) {
      return "topsport";
    }
    
    if (d === "economie-en-organisatie") {
      return "economie-organisatie";
    }
    
    return d;
  },
  
  slugify(text) {
    return text.toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[\/]/g, '-')
      .replace(/[^a-z0-9-]/g, '');
  },
  
  setDynamicTop() {
    if (!this.elements.slidein) return;
    
    // Detecteren of we op een mobiel apparaat zijn
    const isMobile = window.innerWidth <= 768;
    
    if (!isMobile) {
      // Alleen op desktop: zoek alle mogelijke headers en topbars
      const header = document.querySelector('.Header--top') || 
                    document.querySelector("header") || 
                    document.body;
      
      const topbar = document.getElementById('custom-topbar') || 
                    document.querySelector('.announcement-bar-wrapper');
      
      let totalHeight = 0;
      
      // Bereken header hoogte als deze zichtbaar is
      if (header) {
        const headerRect = header.getBoundingClientRect();
        const headerStyle = window.getComputedStyle(header);
        
        if (headerStyle.position === 'fixed' || headerStyle.position === 'sticky') {
          totalHeight += headerRect.height;
        }
      }
      
      // Voeg topbar hoogte toe als deze zichtbaar is
      if (topbar) {
        const topbarStyle = window.getComputedStyle(topbar);
        if (topbarStyle.display !== 'none' && 
            (topbarStyle.position === 'fixed' || topbarStyle.position === 'sticky')) {
          totalHeight += topbar.getBoundingClientRect().height;
        }
      }
      
      // Voeg veiligheidsmarge toe
      totalHeight = Math.max(totalHeight, 60);
      
      // Pas slidein positie aan voor desktop
      this.elements.slidein.style.top = totalHeight + "px";
      this.elements.slidein.style.height = `calc(100% - ${totalHeight}px)`;
      this.elements.slidein.style.bottom = "auto";
      document.documentElement.style.setProperty('--dynamic-top', `${totalHeight}px`);
    } else {
      // Mobiele instellingen
      this.elements.slidein.style.top = "auto";
      this.elements.slidein.style.bottom = "0";
      this.elements.slidein.style.height = "85%";
      this.elements.slidein.style.maxHeight = "85vh";
      this.elements.slidein.style.transform = "translateY(100%)";
      this.elements.slidein.style.borderRadius = "18px 18px 0 0";
    }
  },
  
  buildGrid() {
    if (!this.elements.container || !this.data.csvData) return;
    
    const structuur = this.organizeData();
    this.elements.container.innerHTML = "";
    
    if (Object.keys(structuur).length === 0) {
      this.elements.container.innerHTML = `
        <div class="not-found-message">
          <p>Geen lessentabellen gevonden.</p>
        </div>
      `;
      return;
    }
    
    for (const [normDomainKey, graden] of Object.entries(structuur)) {
      const block = document.createElement("div");
      block.className = "domain-block";
      block.dataset.domain = normDomainKey;
      
      const colors = this.config.domainColors[normDomainKey];
      if (colors) {
        // BELANGRIJK: Update naar nieuwe CSS variabele namen
        block.style.setProperty("--app-domain-base", colors.base);
        block.style.setProperty("--app-domain-mid", colors.mid);
        block.style.setProperty("--app-domain-light1", colors.light1);
        block.style.setProperty("--app-domain-light2", colors.light1);
        block.style.setProperty("--hover-row", colors.hover);
      }
      
      block.innerHTML = `<h2>${this.data.domainDisplayNames[normDomainKey]}</h2>`;
      
      ["TWEEDE GRAAD", "DERDE GRAAD"].forEach(graadKey => {
        const finaliteiten = graden[graadKey];
        if (!finaliteiten) return;
        
        // Graad titel aangepaste layout
        const graadTitleClass = graadKey === "TWEEDE GRAAD" ? "tweede-graad-title" : "derde-graad-title";
        const graadTitleContainer = document.createElement("div");
        graadTitleContainer.className = graadTitleClass;
        graadTitleContainer.innerHTML = `<h3>${graadKey}</h3>`;
        
        block.appendChild(graadTitleContainer);
        
        for (const [finaliteit, richtingen] of Object.entries(finaliteiten)) {
          const graadContainer = document.createElement("div");
          graadContainer.className = "graad-container";
          
          // Categorielabel toevoegen
          const categoryLabel = document.createElement("div");
          categoryLabel.textContent = finaliteit.toLowerCase();
          graadContainer.appendChild(categoryLabel);
          
          const finBlok = document.createElement("div");
          finBlok.className = "finaliteit-blok";
          
          const ul = document.createElement("ul");
          richtingen.forEach(richting => {
            const linkSlug = this.slugify(richting);
            const li = document.createElement("li");
            li.innerHTML = `<a href="#${graadKey.toLowerCase()}-${linkSlug}" 
              data-graad="${graadKey}" 
              data-slug="${linkSlug}" 
              data-domain="${normDomainKey}">${richting}</a>`;
              
            li.querySelector('a').addEventListener('click', (e) => {
              e.preventDefault();
              this.openSlidein(graadKey, linkSlug, normDomainKey);
            });
            
            ul.appendChild(li);
          });
          
          finBlok.appendChild(ul);
          graadContainer.appendChild(finBlok);
          block.appendChild(graadContainer);
        }
      });
      
      this.elements.container.appendChild(block);
    }
  },
  
  organizeData() {
    if (!this.data.csvData) return {};
    
    const structuur = {};
    const seen = new Set();
    this.data.domainDisplayNames = {};
    
    this.data.csvData.forEach(r => {
      const rawDomain = r.domein?.trim() || "";
      if (!rawDomain) return;
      
      const normDomain = this.normalizeDomainName(rawDomain);
      if (!this.data.domainDisplayNames[normDomain]) {
        this.data.domainDisplayNames[normDomain] = rawDomain.toUpperCase();
      }
      
      const graadLabel = r.graad?.trim() || "";
      let graad = "";
      
      if (graadLabel.toLowerCase().includes("2de")) {
        graad = "TWEEDE GRAAD";
      } else if (graadLabel.toLowerCase().includes("3de")) {
        graad = "DERDE GRAAD";
      }
      
      const finaliteit = r.finaliteit?.trim() || "";
      const richting = r.titel?.trim() || "";
      
      if (!normDomain || !graad || !finaliteit || !richting) return;
      
      const key = `${normDomain}|${graad}|${finaliteit}|${richting}`;
      if (seen.has(key)) return;
      seen.add(key);
      
      if (!structuur[normDomain]) {
        structuur[normDomain] = {};
      }
      
      if (!structuur[normDomain][graad]) {
        structuur[normDomain][graad] = {};
      }
      
      if (!structuur[normDomain][graad][finaliteit]) {
        structuur[normDomain][graad][finaliteit] = [];
      }
      
      structuur[normDomain][graad][finaliteit].push(richting);
    });
    
    return structuur;
  },
  
  /**
   * Open het detail paneel
   * Deze functie delegeert naar de DetailViewModule indien beschikbaar,
   * anders wordt de interne functie gebruikt als fallback
   */
  openSlidein(graad, slug, normDomainKey) {
    if (this.modules.detailView) {
      // Gebruik DetailViewModule indien beschikbaar
      this.modules.detailView.openSlidein(graad, slug, normDomainKey);
    } else {
      // Fallback naar interne functionaliteit
      console.warn("DetailViewModule niet geladen, wordt teruggevallen op interne functie");
      this._openSlideinInternal(graad, slug, normDomainKey);
    }
  },
  
  /**
   * Interne functie voor fallback indien module niet beschikbaar is
   * @private
   */
  _openSlideinInternal(graad, slug, normDomainKey) {
    if (!this.elements.slidein || !this.elements.overlay) return;
    
    // Reset eventuele eerdere stijlen
    this.elements.slidein.removeAttribute('style');
    
    // Stel de correcte layout in op basis van dynamic top
    this.setDynamicTop();
    
    // Voeg het domein toe als data-attribuut voor styling
    this.elements.slidein.dataset.domain = normDomainKey;
    
    const colors = this.config.domainColors[normDomainKey];
    if (colors) {
      // Domein-specifieke kleuren instellen
      this.elements.slidein.style.setProperty("--app-domain-base", colors.base);
      this.elements.slidein.style.setProperty("--app-domain-mid", colors.mid);
      this.elements.slidein.style.setProperty("--app-domain-light1", colors.light1);
      this.elements.slidein.style.setProperty("--hover-row", colors.hover);
    }
    
    this.elements.slidein.classList.add("open");
    this.elements.overlay.classList.add("show");
    
    const datum = new Date().toLocaleDateString("nl-BE", {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    
    const datumEl = document.getElementById("datum-print");
    if (datumEl) {
      datumEl.innerText = datum;
    }
    
    const filteredData = this.filterDataByGraadAndSlug(graad, slug);
    const richtingData = filteredData[0] || {};
    
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
    
    this._buildLessonTableInternal(filteredData);
    document.body.style.overflow = "hidden";
    
    setTimeout(() => {
      this.elements.slidein.focus();
      const urlSlug = `${graad.toLowerCase().replace(/\s+/g, '-')}-${slug}`;
      history.pushState(
        { graad, slug, domain: normDomainKey },
        '', 
        `#${urlSlug}`
      );
    }, 100);
    
    this.data.currentRichting = { graad, slug, domain: normDomainKey };
  },
  
  /**
   * Interne functie voor het bouwen van de tabel indien module niet beschikbaar is
   * @private
   */
  _buildLessonTableInternal(filteredData) {
    if (!this.elements.tableContainer) return;
    
    if (!filteredData || filteredData.length === 0) {
      this.elements.tableContainer.innerHTML = `
        <div class="error-message">
          <p>Geen lessentabel beschikbaar voor deze richting.</p>
        </div>`;
      
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
    this.elements.tableContainer.innerHTML = tableHTML;
    
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
   * Sluit het detail paneel, delegeert naar module indien beschikbaar
   */
  closeSlidein() {
    if (this.modules.detailView) {
      this.modules.detailView.closeSlidein();
    } else {
      // Fallback
      if (!this.elements.slidein || !this.elements.overlay) return;
    
      this.elements.slidein.classList.remove("open");
      this.elements.overlay.classList.remove("show");
      document.body.style.overflow = "";
      history.pushState({}, '', location.pathname);
      this.data.currentRichting = null;
    }
  },
  
  filterDataByGraadAndSlug(graad, slug) {
    if (!this.data.csvData) return [];
    
    return this.data.csvData.filter(r => {
      const rGraad = r.graad?.toLowerCase() || "";
      
      if (graad === "TWEEDE GRAAD" && rGraad.includes("2de")) {
        return this.slugify(r.titel) === slug;
      }
      
if (graad === "DERDE GRAAD" && rGraad.includes("3de")) {
        return this.slugify(r.titel) === slug;
      }
      
      return false;
    });
  },
  
  checkUrlHash() {
    const hash = window.location.hash;
    if (!hash || hash === '#') return;
    
    const match = hash.substring(1).match(/^(tweede-graad|derde-graad)-(.+)$/);
    if (!match) return;
    
    const [, graadSlug, richtingSlug] = match;
    const graad = graadSlug === 'tweede-graad' ? 'TWEEDE GRAAD' : 'DERDE GRAAD';
    
    const richtingData = this.data.csvData?.find(r => {
      const rGraad = r.graad?.toLowerCase() || "";
      const isCorrectGraad = (
        (graad === "TWEEDE GRAAD" && rGraad.includes("2de")) ||
        (graad === "DERDE GRAAD" && rGraad.includes("3de"))
      );
      return isCorrectGraad && this.slugify(r.titel) === richtingSlug;
    });
    
    if (richtingData) {
      const normDomain = this.normalizeDomainName(richtingData.domein);
      this.openSlidein(graad, richtingSlug, normDomain);
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  LessentabellenApp.init();
});

window.LessentabellenApp = LessentabellenApp;


