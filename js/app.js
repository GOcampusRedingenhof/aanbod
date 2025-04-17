import { getLessons, getFootnotes } from './loader.js';

/**
 * Dynamische Lessentabellen - Versie 3.4.0
 * Hoofd applicatie bestand, nu modulair opgezet
 * @copyright 2025 GO Campus Redingenhof
 */
const LessentabellenApp = {
  // Versie en modules
  version: window.ConfigModule?.version || '3.4.0',
  modules: {},

  // Configuratie (fallback indien ConfigModule niet beschikbaar)
  config: window.ConfigModule || {
    csvUrl: "https://raw.githubusercontent.com/GOcampusRedingenhof/lessenrooster/refs/heads/main/lessentabellen_tabel.csv",
    footnotesUrl: "https://raw.githubusercontent.com/GOcampusRedingenhof/lessenrooster/main/footnotes.csv",
    cacheExpiry: 1000 * 60 * 60,
    domainColors: {
      "stem": { base: "#0C8464", mid: "#48A787", light1: "#89CCB2", hover: "#d7f5ea" },
      "topsport": { base: "#A2E4FF", mid: "#C6F0FF", light1: "#E4F9FF", hover: "#6ABCD6" },
      "eerste-graad": { base: "#ED4E13", mid: "#F3764A", light1: "#F8A588", hover: "#F8B96D" },
      "maatschappij-welzijn": { base: "#E399BB", mid: "#EFBACD", light1: "#F7D9E4", hover: "#F2C5D1" },
      "economie-organisatie": { base: "#2B2243", mid: "#254a87", light1: "#5084C2", hover: "#7081a8" },
      "schakeljaar": { base: "#2B2243", mid: "#254a87", light1: "#5084C2", hover: "#7081a8" },
      "okan": { base: "#E5A021", mid: "#F0B94E", light1: "#F9D38A", hover: "#F9CA7F" }
    }
  },

  // Standaard data container
  data: {
    csvData: null,
    footnotes: null,
    lastFetch: null,
    currentRichting: null,
    domainDisplayNames: {},
    isLoading: true,
    hasError: false,
    errorMessage: ''
  },

  // DOM-elementen
  elements: {
    container: null,
    slidein: null,
    overlay: null,
    tableContainer: null,
    topbar: null,
    footnotesContainer: null
  },

  init() {
    console.log(`Lessentabellen v${this.version} initializing...`);
    this.createRequiredElements();
    this.cacheElements();
    this.setupEventListeners();
    this.initModules();
    this.loadData();
    // Verbeterde detectie van tophoogte
    this.setDynamicTop();
    setTimeout(() => this.setDynamicTop(), 500);
    setTimeout(() => this.setDynamicTop(), 1500);
    this.showVersionIndicator();
  },

  initModules() {
    if (window.DetailViewModule) {
      this.modules.detailView = window.DetailViewModule;
      this.modules.detailView.init(this);
    }
  },

  createRequiredElements() {
    // Zorg dat er een container voor voetnoten is
    if (!this.elements.footnotesContainer && this.elements.container) {
      this.elements.footnotesContainer = document.createElement('div');
      this.elements.footnotesContainer.id = 'footnotes';
      this.elements.container.appendChild(this.elements.footnotesContainer);
    }
  },

  cacheElements() {
    this.elements.container = document.getElementById('lessentabellen-container');
    this.elements.slidein   = document.getElementById('les-detail-slidein');
    this.elements.overlay   = document.getElementById('overlay');
    this.elements.tableContainer = document.getElementById('tabel-container');
    this.elements.topbar    = document.getElementById('topbar');
  },

  setupEventListeners() {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.closeSlidein();
    });
  },

  async loadData() {
    this.showLoading();
    try {
      // 1) Caching-logic voor lessen
      let lessons;
      const cached = this.getCachedData();
      if (cached) {
        lessons = cached.data;
        this.data.lastFetch = cached.timestamp;
      } else {
        lessons = await getLessons();
        this.data.lastFetch = Date.now();
        this.saveToCache(lessons);
      }
      // 2) Voetnoten ophalen
      const footnotes = await getFootnotes();
      // 3) Data toewijzen en UI opbouwen
      this.data.csvData   = lessons;
      this.data.footnotes = footnotes;
      this.buildGrid();
      this.renderFootnotes();
      setTimeout(() => this.checkUrlHash(), 500);
    } catch (error) {
      console.error('Data laden mislukt:', error);
      this.handleError(error.message);
    } finally {
      this.hideLoading();
    }
  },

  renderFootnotes() {
    if (!this.elements.footnotesContainer || !this.data.footnotes) return;
    this.elements.footnotesContainer.innerHTML =
      '<h4>Voetnoten</h4>' +
      '<ol>' +
      this.data.footnotes
        .map(fn => `<li id="fn-${fn.footnote_id}">${fn.tekst}</li>`)
        .join('') +
      '</ol>';
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
      const cache = { data, timestamp: Date.now() };
      localStorage.setItem('lessentabellen_cache', JSON.stringify(cache));
    } catch (e) {
      console.warn('Cache opslaan mislukt:', e);
    }
  },

  normalizeDomainName(rawDomain) {
    let d = rawDomain.toLowerCase().trim();
    d = d.replace(/[\s&]+/g, "-");
    if (d.includes("sport") && d.includes("topsport")) return "topsport";
    if (d === "economie-en-organisatie") return "economie-organisatie";
    return d;
  },

  slugify(text) {
    return text
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[\/]/g, '-')
      .replace(/[^a-z0-9-]/g, '');
  },

  setDynamicTop() {
    if (!this.elements.slidein) return;
    const isMobile = window.innerWidth <= 768;
    if (!isMobile) {
      // Desktop header & topbar berekenen
      let totalHeight = 0;
      const header = document.querySelector('.Header--top') ||
                     document.querySelector("header") ||
                     document.body;
      const topbar = document.getElementById('custom-topbar') ||
                     document.querySelector('.announcement-bar-wrapper');

      if (header) {
        const style = window.getComputedStyle(header);
        if (style.position === 'fixed' || style.position === 'sticky') {
          totalHeight += header.getBoundingClientRect().height;
        }
      }
      if (topbar) {
        const style = window.getComputedStyle(topbar);
        if (style.display !== 'none' &&
           (style.position === 'fixed' || style.position === 'sticky')) {
          totalHeight += topbar.getBoundingClientRect().height;
        }
      }
      totalHeight = Math.max(totalHeight, 60);
      this.elements.slidein.style.top = `${totalHeight}px`;
      this.elements.slidein.style.height = `calc(100% - ${totalHeight}px)`;
      document.documentElement.style.setProperty('--dynamic-top', `${totalHeight}px`);
    } else {
      // Mobiel
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
    this.elements.container.innerHTML = '';
    if (Object.keys(structuur).length === 0) {
      this.elements.container.innerHTML = '<div class="not-found-message"><p>Geen lessentabellen gevonden.</p></div>';
      return;
    }
    for (const [normDomainKey, graden] of Object.entries(structuur)) {
      const block = document.createElement("div");
      block.className = "domain-block";
      block.dataset.domain = normDomainKey;
      const colors = this.config.domainColors[normDomainKey];
      if (colors) {
        block.style.setProperty("--app-domain-base", colors.base);
        block.style.setProperty("--app-domain-mid", colors.mid);
        block.style.setProperty("--app-domain-light1", colors.light1);
        block.style.setProperty("--hover-row", colors.hover);
      }
      block.innerHTML = `<h2>${this.data.domainDisplayNames[normDomainKey]}</h2>`;
      ["TWEEDE GRAAD", "DERDE GRAAD"].forEach(graadKey => {
        const finaliteiten = graden[graadKey];
        if (!finaliteiten) return;
        const graadTitleClass = graadKey === "TWEEDE GRAAD"
          ? "tweede-graad-title" : "derde-graad-title";
        const graadTitleContainer = document.createElement("div");
        graadTitleContainer.className = graadTitleClass;
        graadTitleContainer.innerHTML = `<h3>${graadKey}</h3>`;
        block.appendChild(graadTitleContainer);

        for (const [finaliteit, richtingen] of Object.entries(finaliteiten)) {
          const graadContainer = document.createElement("div");
          graadContainer.className = "graad-container";
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
            li.querySelector('a').addEventListener('click', e => {
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
      const rawDomain = (r.domein || '').trim();
      const normDomain = this.normalizeDomainName(rawDomain);
      if (!normDomain) return;
      if (!this.data.domainDisplayNames[normDomain]) {
        this.data.domainDisplayNames[normDomain] = rawDomain.toUpperCase();
      }
      const graadLabel = (r.graad || '').trim().toLowerCase();
      let graad = '';
      if (graadLabel.includes('2de')) graad = "TWEEDE GRAAD";
      else if (graadLabel.includes('3de')) graad = "DERDE GRAAD";
      const finaliteit = (r.finaliteit || '').trim();
      const richting    = (r.titel || '').trim();
      const key = `${normDomain}|${graad}|${finaliteit}|${richting}`;
      if (!graad || !finaliteit || !richting || seen.has(key)) return;
      seen.add(key);
      structuur[normDomain] ||= {};
      structuur[normDomain][graad] ||= {};
      structuur[normDomain][graad][finaliteit] ||= [];
      structuur[normDomain][graad][finaliteit].push(richting);
    });

    return structuur;
  },

  openSlidein(graad, slug, normDomainKey) {
    if (this.modules.detailView) {
      this.modules.detailView.openSlidein(graad, slug, normDomainKey);
    } else {
      this._openSlideinInternal(graad, slug, normDomainKey);
    }
  },

  _openSlideinInternal(graad, slug, normDomainKey) {
    if (!this.elements.slidein || !this.elements.overlay) return;
    this.setDynamicTop();
    this.elements.slidein.dataset.domain = normDomainKey;
    const colors = this.config.domainColors[normDomainKey];
    if (colors) {
      this.elements.slidein.style.setProperty("--app-domain-base", colors.base);
      this.elements.slidein.style.setProperty("--app-domain-mid", colors.mid);
      this.elements.slidein.style.setProperty("--app-domain-light1", colors.light1);
      this.elements.slidein.style.setProperty("--hover-row", colors.hover);
    }
    this.elements.slidein.classList.add("open");
    this.elements.overlay.classList.add("show");

    // Datum tonen
    const datumEl = document.getElementById("datum-print");
    if (datumEl) {
      datumEl.innerText = new Date().toLocaleDateString("nl-BE", {
        day: '2-digit', month: '2-digit', year: 'numeric'
      });
    }

    const filteredData = this.filterDataByGraadAndSlug(graad, slug);
    const richtingData = filteredData[0] || {};
    const titelEl = document.getElementById("opleiding-titel");
    const beschEl = document.getElementById("opleiding-beschrijving");
    if (titelEl) titelEl.innerText = richtingData.titel || '';
    if (beschEl) beschEl.innerText = richtingData.beschrijving || '';
    const brochureLink = document.getElementById("brochure-link");
    if (brochureLink) {
      if (richtingData.brochure) {
        brochureLink.href = richtingData.brochure;
        brochureLink.style.display = 'inline-flex';
      } else {
        brochureLink.style.display = 'none';
      }
    }

    this._buildLessonTableInternal(filteredData);
    document.body.style.overflow = 'hidden';
    setTimeout(() => {
      this.elements.slidein.focus();
      history.pushState({ graad, slug, domain: normDomainKey },
                        '', `#${graad.toLowerCase().replace(/\s+/g,'-')}-${slug}`);
    }, 100);
    this.data.currentRichting = { graad, slug, domain: normDomainKey };
  },

  _buildLessonTableInternal(filteredData) {
    if (!this.elements.tableContainer) return;
    if (!filteredData.length) {
      this.elements.tableContainer.innerHTML = `
        <div class="error-message"><p>Geen lessentabel beschikbaar voor deze richting.</p></div>
      `;
      this.elements.footnotesContainer.innerHTML = '';
      return;
    }

    const klassen = [...new Set(filteredData.map(r => r.code))];
    const vakken  = [...new Set(filteredData.map(r => r.label))];
    let html = '<table role="grid" aria-label="Lessentabel"><thead><tr><th>VAK</th>' +
               klassen.map(k => `<th>${k}</th>`).join('') +
               '</tr></thead><tbody>';
    vakken.forEach(vak => {
      html += '<tr><td>' + vak + '</td>' +
              klassen.map(k => {
                const cel = filteredData.find(r => r.code===k && r.label===vak);
                return `<td>${cel?.uren||''}</td>`;
              }).join('') +
              '</tr>';
    });
    const showStage = klassen.some(k =>
      filteredData.find(r => r.code===k && r.stage_weken?.trim() && r.stage_weken!=='0')
    );
    if (showStage) {
      html += '<tr class="stage-row"><td>Stage weken</td>' +
              klassen.map(k => `<td>${filteredData.find(r=>r.code===k)?.stage_weken||''}</td>`).join('') +
              '</tr>';
    }
    html += '</tbody></table>';
    this.elements.tableContainer.innerHTML = html;

    // Voetnoten inline per tabel
    const uniqueFns = [...new Set(filteredData.map(r=>r.voetnoten?.trim()).filter(v=>v))];
    this.elements.footnotesContainer.innerHTML = uniqueFns.length
      ? `<p class="footnotes">${uniqueFns.join(' · ')}</p>`
      : '';
  },

  closeSlidein() {
    if (this.modules.detailView) {
      this.modules.detailView.closeSlidein();
    } else {
      if (!this.elements.slidein || !this.elements.overlay) return;
      this.elements.slidein.classList.remove("open");
      this.elements.overlay.classList.remove("show");
      document.body.style.overflow = "";
      history.pushState({}, '', location.pathname);
      this.data.currentRichting = null;
    }
  },

  filterDataByGraadAndSlug(graad, slug) {
    return this.data.csvData?.filter(r => {
      const g = (r.graad||'').toLowerCase();
      const matchGraad = graad==="TWEEDE GRAAD" ? g.includes("2de") : g.includes("3de");
      return matchGraad && this.slugify(r.titel)===slug;
    }) || [];
  },

  checkUrlHash() {
    const hash = window.location.hash;
    if (!hash || hash==='#') return;
    const m = hash.substring(1).match(/^(tweede-graad|derde-graad)-(.+)$/);
    if (!m) return;
    const graad = m[1]==='tweede-graad' ? 'TWEEDE GRAAD' : 'DERDE GRAAD';
    const slug  = m[2];
    const dataItem = this.data.csvData.find(r =>
      ((graad==="TWEEDE GRAAD" && (r.graad||'').toLowerCase().includes("2de")) ||
       (graad==="DERDE GRAAD" && (r.graad||'').toLowerCase().includes("3de"))) &&
      this.slugify(r.titel)===slug
    );
    if (dataItem) {
      const normDomain = this.normalizeDomainName(dataItem.domein);
      this.openSlidein(graad, slug, normDomain);
    }
  },

  showVersionIndicator() {
    if (!this.elements.topbar) return;
    const el = document.createElement('span');
    el.className = 'version-indicator';
    el.innerText = `v${this.version}`;
    this.elements.topbar.appendChild(el);
  }
};

document.addEventListener('DOMContentLoaded', () => {
  LessentabellenApp.init();
});
window.LessentabellenApp = LessentabellenApp;
