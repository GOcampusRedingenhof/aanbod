// grid-builder.js
import { mapDomein } from './config-module.js';

/**
 * Bouwt de volledige gridstructuur op volgens het premium grid.css-systeem.
 * Toont alle unieke richtingen, ook als ze dezelfde richtingcode hebben.
 */
export function buildGrid(data, target) {
  // Eerst alle data opschonen en voorbereiden
  // In deze fase maken we unieke identifiers voor elke richting
  
  // Groepeer data per domein/graad/finaliteit/richting
  const dataMap = {};
  
  // Maak helper arrays voor sorteren
  const graadVolgorde = ['EERSTE GRAAD', 'TWEEDE GRAAD', 'DERDE GRAAD', 'OKAN', 'SCHAKELJAAR'];
  const finaliteitVolgorde = ['doorstroom', 'dubbele finaliteit', 'arbeidsmarkt'];
  const domeinen = new Set();
  
  // Loop door alle items en bouw de structuur op
  data.forEach(item => {
    // Basis metadata extraheren en normaliseren
    const domein = mapDomein(item.domein);
    
    // Speciale behandeling voor bepaalde domeinen
    let graad = (item.graad || '').toString().trim().toUpperCase();
    
    // Als het domein OKAN of Schakeljaar is, gebruik dat als graad
    if (domein === 'okan') {
      graad = 'OKAN';
    } else if (domein === 'schakeljaar') {
      graad = 'SCHAKELJAAR';
    } else if (!graad || graad === 'ONBEKEND') {
      // Fallback voor andere onbekende graden
      graad = 'ONBEKEND';
    }
    
    const finaliteit = (item.finaliteit || 'ONBEKEND').toString().trim().toLowerCase();
    const richting = item.richting;
    const richtingcode = item.richtingcode;
    const klascode = item.klascode;
    
    // Unieke identifier voor deze specifieke richting
    const richtingId = `${richtingcode}-${richting}`;
    
    // Voeg domein toe aan de set van unieke domeinen
    domeinen.add(domein);
    
    // Creëer pad in de datastructuur als die nog niet bestaat
    if (!dataMap[domein]) dataMap[domein] = {};
    if (!dataMap[domein][graad]) dataMap[domein][graad] = {};
    if (!dataMap[domein][graad][finaliteit]) dataMap[domein][graad][finaliteit] = {};
    
    // Sla de richting op met zijn volledige data
    // Als er al een item bestaat voor deze richting, sla alleen het nieuwste item op
    dataMap[domein][graad][finaliteit][richtingId] = item;
  });
  
  // Begin met het bouwen van de DOM voor het grid
  domeinen.forEach(domein => {
    // Maak domein block
    const domainBlock = createDomainBlock(domein);
    
    // Haal de graden voor dit domein op en sorteer ze
    const graden = Object.keys(dataMap[domein] || {}).sort((a, b) => {
      const indexA = graadVolgorde.indexOf(a);
      const indexB = graadVolgorde.indexOf(b);
      return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
    });
    
    // Bouw elke graad
    graden.forEach(graad => {
      // Maak graad titel met een betere weergavenaam
      const graadTitleContainer = createGraadTitle(graad, domein);
      domainBlock.appendChild(graadTitleContainer);
      
      // Maak graad container
      const graadContainer = document.createElement('div');
      graadContainer.className = 'graad-container';
      
      // Haal finaliteiten op en sorteer ze
      const finaliteiten = Object.keys(dataMap[domein][graad] || {}).sort((a, b) => {
        const indexA = finaliteitVolgorde.indexOf(a);
        const indexB = finaliteitVolgorde.indexOf(b);
        return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
      });
      
      // Bouw elke finaliteit
      finaliteiten.forEach(finaliteit => {
        // Overslaan als er geen richtingen zijn
        const richtingen = dataMap[domein][graad][finaliteit] || {};
        if (Object.keys(richtingen).length === 0) return;
        
        // Maak finaliteit block
        const finaliteitBlok = createFinaliteitBlok(finaliteit);
        
        // Bouw lijst met richtingen
        const ul = document.createElement('ul');
        
        // Sorteer richtingen alfabetisch
        const sortedRichtingen = Object.values(richtingen).sort((a, b) => 
          (a.richting || '').localeCompare(b.richting || '')
        );
        
        // Voeg elke richting toe aan de lijst
        sortedRichtingen.forEach(richting => {
          const li = document.createElement('li');
          const a = document.createElement('a');
          a.href = '#';
          a.dataset.code = richting.klascode;
          a.textContent = richting.richting;
          li.appendChild(a);
          ul.appendChild(li);
        });
        
        // Voeg lijst toe aan finaliteit block
        finaliteitBlok.appendChild(ul);
        
        // Voeg finaliteit block toe aan graad container
        graadContainer.appendChild(finaliteitBlok);
      });
      
      // Voeg graad container toe aan domein block
      domainBlock.appendChild(graadContainer);
    });
    
    // Voeg domein block toe aan target
    target.appendChild(domainBlock);
  });
  
  // Binden van event handlers gebeurt nu in app-controller.js
}

/**
 * Maakt een domein block met titel
 * @param {string} domein - De gestandaardiseerde domeinnaam
 * @returns {HTMLElement} Het domein block
 */
function createDomainBlock(domein) {
  const domainBlock = document.createElement('div');
  domainBlock.className = 'domain-block';
  domainBlock.dataset.domain = domein;
  
  // Domein titel (met eerste letters van elk woord in hoofdletters)
  const domeinTitel = domein
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' & ');
    
  const title = document.createElement('h2');
  title.textContent = domeinTitel;
  domainBlock.appendChild(title);
  
  return domainBlock;
}

/**
 * Maakt een graad titel container
 * @param {string} graad - De graadnaam (bv. 'EERSTE GRAAD', 'OKAN')
 * @param {string} domein - Het domein waartoe deze graad behoort
 * @returns {HTMLElement} De graad titel container
 */
function createGraadTitle(graad, domein) {
  const graadTitleContainer = document.createElement('div');
  
  // Zet CSS class naam op basis van de graad
  graadTitleContainer.className = graad.toLowerCase().replace(/\s+/g, '-') + '-title';
  
  // Bepaal de geformatteerde weergavenaam
  let displayGraad;
  
  // Als de graad ONBEKEND is, en het domein is okan of schakeljaar,
  // gebruik het domein als graadnaam
  if ((graad === 'ONBEKEND' || graad === '') && (domein === 'okan' || domein === 'schakeljaar')) {
    displayGraad = domein.charAt(0).toUpperCase() + domein.slice(1);
  } else if (graad === 'OKAN' || graad === 'SCHAKELJAAR') {
    // Voor OKAN en SCHAKELJAAR, alleen eerste letter hoofdletter
    displayGraad = graad.charAt(0) + graad.slice(1).toLowerCase();
  } else {
    // Normale graad formatting (Eerste Graad, Tweede Graad, etc.)
    displayGraad = graad.charAt(0) + graad.slice(1).toLowerCase();
  }
  
  const graadTitle = document.createElement('h3');
  graadTitle.textContent = displayGraad;
  graadTitleContainer.appendChild(graadTitle);
  
  return graadTitleContainer;
}

/**
 * Maakt een finaliteit block met titel
 * @param {string} finaliteit - De finaliteitnaam (bv. 'doorstroom')
 * @returns {HTMLElement} Het finaliteit block
 */
function createFinaliteitBlok(finaliteit) {
  const finaliteitBlok = document.createElement('div');
  finaliteitBlok.className = 'finaliteit-blok';

  const h4 = document.createElement('h4');
  // Eerste letter hoofdletter voor de finaliteit
  h4.textContent = finaliteit.charAt(0).toUpperCase() + finaliteit.slice(1);
  finaliteitBlok.appendChild(h4);
  
  return finaliteitBlok;
}
