export function addBasisvormingSection(lessen, klascode) {
    const basis = lessen.filter(l => l.categorie === 'basisvorming' && l.klascode === klascode);
    if (basis.length === 0) return '';
    let rows = basis.map(l => `<tr><td>${l.vak}</td><td>${l.uren}</td></tr>`).join('');
    return `<tbody><tr><th colspan="2">Basisvorming</th></tr>${rows}</tbody>`;
  }
  
  export function addSpecifiekSection(lessen, klascode) {
    const specifiek = lessen.filter(l => l.categorie === 'specifiek' && l.klascode === klascode);
    if (specifiek.length === 0) return '';
    let rows = specifiek.map(l => `<tr><td>${l.vak}</td><td>${l.uren}</td></tr>`).join('');
    return `<tbody><tr><th colspan="2">Specifieke vorming</th></tr>${rows}</tbody>`;
  }
  
  export function addTotalRow(lessen, klascode) {
    const totaal = lessen.filter(l => l.klascode === klascode).reduce((sum, l) => sum + l.uren, 0);
    return `<tfoot><tr><th>Totaal</th><th>${totaal} uren</th></tr></tfoot>`;
  }
  
  export function addStageRow(klas) {
    if (!klas.stage_weken) return '';
    return `<tfoot><tr><td colspan="2">Stage: ${klas.stage_weken} weken</td></tr></tfoot>`;
  }
  