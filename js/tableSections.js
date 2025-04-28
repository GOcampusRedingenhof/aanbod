/**
 * Formatteer een uren-waarde volgens jouw eisen:
 * - exact "-"       → "-"
 * - null/undefined, "", "Null", "NAD" → ""
 * - anders parseFloat en >0 → oorspronkelijke string
 * - anders (bijv. 0 of negatief) → ""
 */
function formatUren(val) {
  if (val == null) return '';
  const s = String(val).trim();
  if (s === '-') return '-';
  if (/^(NAD|null)$/i.test(s)) return '';
  const num = parseFloat(s.replace(',', '.'));
  return (!isNaN(num) && num > 0) ? s : '';
}

/**
 * 1) Basisvorming: sectie-header + per vak precies één rij
 */
export function addBasisvormingSection(lessen, klasCodes) {
  const codes   = Array.isArray(klasCodes) ? klasCodes : [klasCodes];
  const lessons = lessen.filter(
    l => l.categorie === 'basisvorming' && codes.includes(l.klascode)
  );
  if (!lessons.length) return '';

  // Unieke vakken in CSV-volgorde
  const vakken = [];
  lessons.forEach(l => {
    if (!vakken.includes(l.vak)) vakken.push(l.vak);
  });

  // Sectiekop
  let html = `<tr class="section-row section-basisvorming">
                <th colspan="${1 + codes.length}">Basisvorming</th>
              </tr>`;

  // Per vak/subvak één rij
  vakken.forEach(vak => {
    const isSub = lessons.some(
      l => l.vak === vak &&
           (l.subvak === true || String(l.subvak).toLowerCase() === 'waar')
    );
    const cells = codes
      .map(code => {
        const les = lessons.find(l => l.klascode === code && l.vak === vak);
        return `<td>${les ? formatUren(les.uren) : ''}</td>`;
      })
      .join('');

    html += `
      <tr class="vak-row${isSub ? ' subvak-row subvak' : ''}">
        <td>${vak}</td>
        ${cells}
      </tr>`;
  });

  return html;
}

export function addSpecifiekSection(lessen, klasCodes) {
  const codes   = Array.isArray(klasCodes) ? klasCodes : [klasCodes];
  const lessons = lessen.filter(
    l =>
      typeof l.categorie === 'string' &&
      l.categorie.toLowerCase().includes('specifiek') &&
      codes.includes(l.klascode)
  );
  if (!lessons.length) return '';

  // Unieke vakken in CSV-volgorde
  const vakken = [];
  lessons.forEach(l => {
    if (!vakken.includes(l.vak)) vakken.push(l.vak);
  });

  // Sectiekop
  let html = `<tr class="section-row section-specifiek">
                <th colspan="${1 + codes.length}">Specifiek gedeelte</th>
              </tr>`;

  // Per vak/subvak één rij
  vakken.forEach(vak => {
    const isSub = lessons.some(
      l => l.vak === vak &&
           (l.subvak === true || String(l.subvak).toLowerCase() === 'waar')
    );
    const cells = codes
      .map(code => {
        const les = lessons.find(l => l.klascode === code && l.vak === vak);
        return `<td>${les ? formatUren(les.uren) : ''}</td>`;
      })
      .join('');

    html += `
      <tr class="vak-row${isSub ? ' subvak-row subvak' : ''}">
        <td>${vak}</td>
        ${cells}
      </tr>`;
  });

  return html;
}

/**
 * 3) Totaalrij: één <tr> met totaaluren per klas.
 */
export function addTotalRow(lessen, klasCodes) {
  const codes = Array.isArray(klasCodes) ? klasCodes : [klasCodes];
  const totals = codes.map(code =>
    lessen
      .filter(l => l.klascode === code)
      .map(l => parseFloat(String(l.uren).replace(',', '.')))
      .filter(n => !isNaN(n) && n > 0)
      .reduce((a, b) => a + b, 0)
  );
  const cells = totals
    .map(t => {
      const f = formatUren(t);
      return f === '' ? `<td></td>` : `<td>${f} uren</td>`;
    })
    .join('');
  return `<tr class="total-row totaal-row"><th>Totaal aantal uren</th>${cells}</tr>`;
}

/**
 * 4) Stage-rij: label + per klas het aantal weken of leeg.
 */
export function addStageRow(klasData, klasCodes) {
  if (!klasData || klasData.stage_weken == null) return '';
  const codes = Array.isArray(klasCodes) ? klasCodes : [klasCodes];
  const cells = codes
    .map(code =>
      code === klasData.klascode
        ? `<td>${formatUren(klasData.stage_weken)} weken</td>`
        : `<td></td>`
    )
    .join('');
  return `<tr class="stage-row"><th>Aantal stageweken</th>${cells}</tr>`;
}
