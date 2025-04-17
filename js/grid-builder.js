// grid-builder.js

/**
 * Bouwt de volledige gridstructuur op volgens het premium grid.css-systeem.
 * Groepeert per domein > graad > finaliteit.
 *
 * Vereist datastructuur:
 * - item.klascode
 * - item.richting
 * - item.domein
 * - item.graad
 * - item.finaliteit
 */
export function buildGrid(data, target) {
  const structuur = {};

  // 1. Structuur opbouwen per domein > graad > finaliteit
  data.forEach(item => {
    const domein = (item.domein ?? 'onbekend').toString().trim().toLowerCase().replace(/\s+/g, '-');
    const graad = (item.graad ?? 'onbekend').toString().trim();
    const finaliteit = (item.finaliteit ?? 'onbekend').toString().trim();

    if (!structuur[domein]) structuur[domein] = {};
    if (!structuur[domein][graad]) structuur[domein][graad] = {};
    if (!structuur[domein][graad][finaliteit]) structuur[domein][graad][finaliteit] = [];

    structuur[domein][graad][finaliteit].push(item);
  });

  // 2. Render per domein
  Object.entries(structuur).forEach(([domein, graden]) => {
    const domainBlock = document.createElement('div');
    domainBlock.className = 'domain-block';
    domainBlock.dataset.domain = domein;

    const title = document.createElement('h2');
    title.textContent = domein.replace(/-/g, ' ').toUpperCase();
    domainBlock.appendChild(title);

    Object.entries(graden).forEach(([graad, finaliteiten]) => {
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
