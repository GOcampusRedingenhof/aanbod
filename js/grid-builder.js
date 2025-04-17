// grid-builder.js

/**
 * Bouwt de volledige gridstructuur op volgens het premium grid.css-systeem.
 * Groepeert per domein > graad > finaliteit, en dedupliceert richtingen per klascode.
 */

export function buildGrid(data, target) {
  const structuur = {};

  // Herschrijf domeinnaam naar CSS-conforme notatie
  const normalizeDomein = (value) => {
    return value
      ?.toString()
      .trim()
      .toLowerCase()
      .replace(/\s*&\s*/g, '-')
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      || 'onbekend';
  };

  const graadVolgorde = ['TWEEDE GRAAD', 'DERDE GRAAD'];

  // Structuur opbouwen per domein > graad > finaliteit met deduplicatie op klascode
  data.forEach(item => {
    const domein = normalizeDomein(item.domein);
    const graad = (item.graad ?? 'ONBEKEND').toString().trim().toUpperCase();
    const finaliteit = (item.finaliteit ?? 'ONBEKEND').toString().trim();
    const klascode = item.klascode;

    if (!structuur[domein]) structuur[domein] = {};
    if (!structuur[domein][graad]) structuur[domein][graad] = {};
    if (!structuur[domein][graad][finaliteit]) structuur[domein][graad][finaliteit] = [];

    const bestaatAl = structuur[domein][graad][finaliteit].some(i => i.klascode === klascode);
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
