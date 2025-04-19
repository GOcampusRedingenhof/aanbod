// js/print-handler.js
let isPrinting = false;

export function initPrintHandler(klas) {
  const btn = document.getElementById('print-button');
  if (!btn) return;
  // Reset eventuele oude listener
  btn.replaceWith(btn.cloneNode(true));
  document.getElementById('print-button')
          .addEventListener('click', () => startPrintProcess(klas));
}

export function startPrintProcess(klas) {
  if (isPrinting) return;
  isPrinting = true;

  document.body.classList.add('print-mode');
  if (klas.richting) document.title = `${klas.richting}-aanbod`;

  const after = () => {
    cleanupAfterPrinting();
    window.removeEventListener('afterprint', after);
    isPrinting = false;
  };
  window.addEventListener('afterprint', after, { once: true });

  window.print();
}

export function cleanupAfterPrinting() {
  document.body.classList.remove('print-mode');
  const slidein = document.getElementById('slidein');
  if (slidein) {
    const closeBtn = slidein.querySelector('.close-btn');
    if (closeBtn) closeBtn.style.display = '';
    const actions = slidein.querySelector('.action-buttons');
    if (actions) actions.style.display = '';
  }
}

export default { initPrintHandler, startPrintProcess, cleanupAfterPrinting };
