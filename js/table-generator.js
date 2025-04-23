import { addBasisvormingSection, addSpecifiekSection, addTotalRow, addStageRow } from './tableSections.js';

export function generateLessentabel(lessen, klasData) {
  const klascode = klasData.klascode;
  const basisHTML = addBasisvormingSection(lessen, klascode);
  const specifiekHTML = addSpecifiekSection(lessen, klascode);
  const totaalHTML = addTotalRow(lessen, klascode);
  const stageHTML = addStageRow(klasData);

  return `
    <table class="lessentabel">
      ${basisHTML}
      ${specifiekHTML}
      ${totaalHTML}
      ${stageHTML}
    </table>
  `;
}
