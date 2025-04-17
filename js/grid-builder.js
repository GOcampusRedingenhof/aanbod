// grid-builder.js

import { mapDomein } from './config-module.js';

/**
 * Bouwt de volledige gridstructuur op volgens het premium grid.css-systeem.
 * Groepeert per domein > graad > finaliteit, en dedupliceert richtingen per graad op richtingcode.
 */
export function buildGrid(data, target) {
  const structuur = {};
  const graadVolgorde = ['TWEEDE GRAAD', 'DERDE GRAAD'];

  // Structuur opbouwen per domein > graad > finaliteit met deduplicatie op richtingcode
  data.forEach(item => {
    const domein = mapDomein(item.domein);
    const graad = (item.graad ?? 'ONBEKEND').toString().trim().toUpperCase();
    const finaliteit = (item.finaliteit ?? 'ONBEKEND').toString().trim().toUpperCase();
    const richtcode = item.richtingcode;

    if (!structuur[domein]) structuur[domein] = {};
    if (!structuur[domein][graad]) structuur[domein][graad] = {};
    if (!structuur[domein][graad][finaliteit]) structuur[domein][graad][finaliteit] = [];

    const bestaatAl = structuur[domein][graad][finaliteit].some(i => i.richtingcode === richtcode);
    if (!bestaatAl) structuur[domein][graad][finaliteit].push(item);
  });

  // Render per domein
  Object.entries(structuur).forEach(([domein, graden]) => {
    const domainBlock = document.createElement('div');
    domainBlock.className = 'domain-block';
    domainBlock.dataset.domain = domein;

    const title = document.createElement('h2');
    title.textContent = domein.replace(/-/g, ' ').toUpperCase();
    domainBlock.appendChild(title);

    Object.entries(graden)
      .sort((a, b) => graadVolgorde.indexOf(a[0]) - graadVolgorde.indexOf(b[0]))
      .forEach(([graad, finaliteiten]) => {
        const graadContainer = document.createElement('div');
        graadContainer.className = 'graad-container';

        const graadLabel = document.createElement('div');
        graadLabel.className = 'graad-label';
        graadLabel.textContent = graad;
        graadContainer.appendChild(graadLabel);

        Object.entries(finaliteiten).forEach(([finaliteit, richtingen]) => {
          const finaliteitBlok = document.createElement('div');
          finaliteitBlok.className = 'finaliteit-blok';

          const h4 = document.createElement('h4');
          h4.textContent = finaliteit;
          finaliteitBlok.appendChild(h4);

          const ul = document.createElement('ul');
          richtingen.forEach(richting => {
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
