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
  const graadVolgorde = ['EERSTE GRAAD', 'TWEEDE GRAAD', 'DERDE GRAAD', 'ZEVENDE JAAR', 'OKAN', 'SCHAKELJAAR'];
  const finaliteitVolgorde = ['doorstroom', 'dubbele finaliteit', 'arbeidsmarkt'];
  const domeinen = new Set();
  
  // Loop door alle items en bouw de structuur op
  data.forEach(item => {
    // Basis metadata extraheren en normaliseren
    const domein = mapDomein(item.domein);
    
    // Speciale behandeling voor bepaalde domeinen
    let graad = (item.graad || '').toString().trim().toUpperCase();
    
    // Zorg dat "zevende jaar" gestandaardiseerd is naar "ZEVENDE JAAR"
    if (graad.toLowerCase() === 'zevende jaar') {
      graad = 'ZEVENDE JAAR';
    }
    
    // Als het domein OKAN of Schakeljaar is, gebruik dat als graad
    if (domein === 'okan') {
      graad = 'OKAN';
    } else if (domein === 'schakeljaar') {
      graad = 'SCHAKELJAAR';
    } else if (!graad || graad === 'ONBEKEND') {
      // Fallback voor andere onbekende graden
      graad = 'ONBEKEND';
    }
    
    const finaliteit = (item.finaliteit || '').toString().trim().toLowerCase();
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
      // Controleer of de graad eigenlijk het domein is (dit betekent dat er geen echte graad is)
      const isGraadHetzelfdeAlsDomein = graad.toLowerCase() === domein.toUpperCase().toLowerCase();
      
      // Maak graad titel met een betere weergavenaam
      const graadTitleContainer = createGraadTitle(graad, domein, isGraadHetzelfdeAlsDomein);
      domainBlock.appendChild(graadTitleContainer);
      
      // Maak graad container
      const graadContainer = document.createElement('div');
      graadContainer.className = 'graad-container';
      
      // Als de graad hetzelfde is als het domein, markeer deze voor CSS
      if (isGraadHetzelfdeAlsDomein) {
        graadContainer.dataset.noGraad = 'true';
      }
      
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
        
        // Bepaal of dit een echte finaliteit is of een lege waarde
        const heeftEchteFinaliteit = finaliteit && finaliteit !== 'onbekend';
        
        // Maak finaliteit block
        const finaliteitBlok = createFinaliteitBlok(finaliteit, domein, heeftEchteFinaliteit);
        
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
 * @param {boolean} isGraadHetzelfdeAlsDomein - Of de graad hetzelfde is als het domein
 * @returns {HTMLElement} De graad titel container
 */
function createGraadTitle(graad, domein, isGraadHetzelfdeAlsDomein) {
  const graadTitleContainer = document.createElement('div');
  
  // Zet CSS class naam op basis van de graad
  graadTitleContainer.className = graad.toLowerCase().replace(/\s+/g, '-') + '-title';
  
  // Voeg graad-type data attribuut toe voor consistente styling
  graadTitleContainer.dataset.graadType = 'true';
  
  // Bepaal de geformatteerde weergavenaam
  let displayGraad;
  
  // Als graad hetzelfde is als domein of leeg, toon geen label
  if (isGraadHetzelfdeAlsDomein || graad === 'ONBEKEND' || graad === '') {
    displayGraad = '';
    graadTitleContainer.dataset.leeg = 'true'; // Markeer voor CSS
  } else {
    // ALLES IN HOOFDLETTERS weergeven (zoals DERDE GRAAD, TWEEDE GRAAD, etc.)
    displayGraad = graad; // Gebruik de graad in kapitalen zoals het is
  }
  
  const graadTitle = document.createElement('h3');
  graadTitle.textContent = displayGraad;
  graadTitleContainer.appendChild(graadTitle);
  
  return graadTitleContainer;
}

/**
 * Maakt een finaliteit block met titel
 * @param {string} finaliteit - De finaliteitnaam (bv. 'doorstroom')
 * @param {string} domein - Het domein van deze finaliteit
 * @param {boolean} heeftEchteFinaliteit - Of dit een echte finaliteit is of een lege waarde
 * @returns {HTMLElement} Het finaliteit block
 */
function createFinaliteitBlok(finaliteit, domein, heeftEchteFinaliteit) {
  const finaliteitBlok = document.createElement('div');
  finaliteitBlok.className = 'finaliteit-blok';
  
  // Als er geen echte finaliteit is, markeer dit voor CSS
  if (!heeftEchteFinaliteit) {
    finaliteitBlok.dataset.leegFinaliteit = 'true';
  }

  const h4 = document.createElement('h4');
  
  // Alleen toon finaliteitslabel als er een echte finaliteit is
  if (heeftEchteFinaliteit) {
    // ALLES IN HOOFDLETTERS weergeven
    h4.textContent = finaliteit.toUpperCase();
  } else {
    // Laat h4 leeg voor structuur, maar markeer voor CSS
    h4.dataset.leeg = 'true';
  }
  
  finaliteitBlok.appendChild(h4);
  
  return finaliteitBlok;
}
