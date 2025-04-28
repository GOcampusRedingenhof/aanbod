import {
  addBasisvormingSection,
  addSpecifiekSection,
  addTotalRow,
  addStageRow
} from './tableSections.js';

/**
 * Genereert de volledige lessentabel als HTML.
 *
 * @param {Array} lessen    Alle lesobjecten (met velden zoals klascode, vak, uren, categorie, subvak…)
 * @param {Object} klasData Metadata van de geselecteerde klas (o.a. klascode, stage_weken)
 * @returns {string}        De complete HTML-string van de tabel
 */
export function generateLessentabel(lessen, klasData) {
  // 1) bepaal de richtingcode (tekst na de cijfers in klascode)
  const direction = klasData.klascode.replace(/^\d+/, '');

  // 2) vind alle klassen-codes die bij deze richting horen
  const klasCodes = Array.from(new Set(
    lessen
      .map(l => l.klascode)
      .filter(c => c.replace(/^\d+/, '') === direction)
  ));

  // 3) sorteer numeriek op graad
  klasCodes.sort((a, b) => {
    const na = parseInt(a, 10), nb = parseInt(b, 10);
    if (na !== nb) return na - nb;
    return a.localeCompare(b);
  });

  // 4) bouw de header
  const header = `
    <tr>
      <th>Vak</th>
      ${klasCodes.map(c => `<th>${c}</th>`).join('')}
    </tr>
  `;

  // 5) body-secties
  const basisHTML     = addBasisvormingSection(lessen, klasCodes);
  const specifiekHTML = addSpecifiekSection(lessen, klasCodes);

  // 6) footer-rows
  const totalRow = addTotalRow(lessen, klasCodes);
  const stageRow = addStageRow(klasData, klasCodes);

  // 7) return de complete tabel
  return `
    <table class="lessentabel">
      <thead>${header}</thead>
      <tbody>
        ${basisHTML}
        ${specifiekHTML}
      </tbody>
      <tfoot>
        ${totalRow}
        ${stageRow}
      </tfoot>
    </table>
  `;
}
