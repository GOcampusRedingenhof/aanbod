// grid-builder.js

/**
 * Genereert de klassieke grid-HTML op basis van de domeinen en richtingen.
 * @param {Array} data - Lijst van richtingen met domein- en graadinformatie
 * @param {HTMLElement} target - DOM-element waarin de grid moet verschijnen
 */
export function buildGrid(data, target) {
  const domeinen = {};

  // groepeer per domein
  for (const item of data) {
    const domein = item.domein.trim().toLowerCase().replace(/\s+/g, "-");
    if (!domeinen[domein]) domeinen[domein] = [];
    domeinen[domein].push(item);
  }

  for (const [domeinKey, richtingen] of Object.entries(domeinen)) {
    const ul = document.createElement("ul");
    ul.className = "domains-grid " + domeinKey;

    for (const richting of richtingen) {
      const li = document.createElement("li");
      li.className = "richting";
      li.innerHTML = `
        <button data-code="${richting.code}" class="richting-button">
          <h3>${richting.naam}</h3>
          <span class="graad">${richting.graad}</span>
        </button>
      `;
      ul.appendChild(li);
    }

    target.appendChild(ul);
  }
}
