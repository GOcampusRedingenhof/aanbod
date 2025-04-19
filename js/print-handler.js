// print-handler.js

/**
 * Start het printproces voor een klas en leerling
 * @param {string} klas - De klas (bv. '4STW')
 * @param {string} naam - De naam van de leerling (optioneel)
 */
export function startPrintProcess(klas, naam = 'Onbekend') {
  const container = document.querySelector('.print-container');
  const footer = document.querySelector('.print-footer span');
  const datum = new Date().toLocaleDateString('nl-BE', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  document.title = `lessentabel_${klas}`;

  if (footer) {
    footer.textContent = `Klas: ${klas} · Naam: ${naam} · Geprint op ${datum}`;
  }

  if (container && container.scrollHeight > 1000) {
    container.style.transform = 'scale(0.95)';
    container.style.transformOrigin = 'top left';
  }

  window.print();

  setTimeout(() => {
    if (container) {
      container.style.transform = '';
    }
  }, 1000);
}

/**
 * Activeer de printknop
 */
export function initPrintHandler() {
  const printButton = document.querySelector('#print-button');
  if (!printButton) return;

  printButton.addEventListener('click', () => {
    const klas = printButton.dataset.klas || 'onbekend';
    const naam = printButton.dataset.naam || 'onbekend';
    startPrintProcess(klas, naam);
  });
}
