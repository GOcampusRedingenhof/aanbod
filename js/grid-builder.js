// grid-builder.js
import { mapDomein } from './config-module.js';

/**
 * Bouwt de volledige gridstructuur op volgens het premium grid.css-systeem.
 * Groepeert per domein > graad > finaliteit, en dedupliceert richtingen per graad.
 */
export function buildGrid(data, target) {
  const structuur = {};

  const graadVolgorde = ['EERSTE GRAAD', 'TWEEDE GRAAD', 'DERDE GRAAD'];
  const finaliteitVolgorde = ['doorstroom', 'dubbele finaliteit', 'arbeidsmarkt'];

  // Unieke richtingen per graad groeperen
  data.forEach(item => {
    // Gebruik de gedeelde mapDomein functie voor consistente domeinnamen
    const domein = mapDomein(item.domein);
    const graad = (item.graad ?? 'ONBEKEND').toString().trim().toUpperCase();
    const finaliteit = (item.finaliteit ?? 'ONBEKEND').toString().trim().toLowerCase();
    const richtcode = item.richtingcode;

    if (!structuur[domein]) structuur[domein] = {};
    if (!structuur[domein][graad]) structuur[domein][graad] = {};
    if (!structuur[domein][graad][finaliteit]) structuur[domein][graad][finaliteit] = new Map();

    // Als de richting nog niet in deze finaliteit zit, voeg toe
    if (!structuur[domein][graad][finaliteit].has(richtcode)) {
      structuur[domein][graad][finaliteit].set(richtcode, item);
    }
  });

  // Renderen per domein
  Object.entries(structuur).forEach(([domein, graden]) => {
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

    // Sorteer graden volgens voorgedefinieerde volgorde
    Object.entries(graden)
      .sort((a, b) => {
        const indexA = graadVolgorde.indexOf(a[0]);
        const indexB = graadVolgorde.indexOf(b[0]);
        return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
      })
      .forEach(([graad, finaliteiten]) => {
        // Maak graad container met juiste CSS klassen
        const graadTitleContainer = document.createElement('div');
        graadTitleContainer.className = graad.toLowerCase().replace(/\s+/g, '-') + '-title';
        
        const graadTitle = document.createElement('h3');
        graadTitle.textContent = graad.charAt(0) + graad.slice(1).toLowerCase();
        graadTitleContainer.appendChild(graadTitle);
        domainBlock.appendChild(graadTitleContainer);
        
        const graadContainer = document.createElement('div');
        graadContainer.className = 'graad-container';
        
        // Sorteer finaliteiten volgens voorgedefinieerde volgorde
        Object.entries(finaliteiten)
          .sort((a, b) => {
            const indexA = finaliteitVolgorde.indexOf(a[0]);
            const indexB = finaliteitVolgorde.indexOf(b[0]);
            return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
          })
          .forEach(([finaliteit, richtingMap]) => {
            const finaliteitBlok = document.createElement('div');
            finaliteitBlok.className = 'finaliteit-blok';

            const h4 = document.createElement('h4');
            // Eerste letter hoofdletter voor de finaliteit
            h4.textContent = finaliteit.charAt(0).toUpperCase() + finaliteit.slice(1);
            finaliteitBlok.appendChild(h4);

            const ul = document.createElement('ul');
            
            // Sorteer richtingen alfabetisch
            const sortedRichtingen = [...richtingMap.values()]
              .sort((a, b) => a.richting.localeCompare(b.richting));
              
            sortedRichtingen.forEach(richting => {
              const li = document.createElement('li');
              const a = document.createElement('a');
              a.href = '#';
              a.dataset.code = richting.klascode;
              a.textContent = richting.richting;
              li.appendChild(a);
              ul.appendChild(li);
            });

            finaliteitBlok.appendChild(ul);
            graadContainer.appendChild(finaliteitBlok);
          });

        domainBlock.appendChild(graadContainer);
      });

    target.appendChild(domainBlock);
  });
}
