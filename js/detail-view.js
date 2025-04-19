// js/detail-view.js – Module voor detailweergave en printbinding

/**
 * Laat de detailweergave zien voor een geselecteerd item.
 * @param {Object} item  Het data-object met alle details.
 */
export function showDetail(item) {
    // Locators van de DOM‑elementen (pas zo nodig aan op jouw HTML-structuur)
    const container = document.getElementById('slidein');
    if (!container) return;

    // 1) Toon titel
    const titelEl = container.querySelector('#opleiding-titel');
    if (titelEl) titelEl.textContent = item.richting || item.title || '';

    // 2) Toon beschrijving
    const beschEl = container.querySelector('#opleiding-beschrijving');
    if (beschEl) beschEl.textContent = item.description || item.omschrijving || '';

    // 3) Bouw lessentabel in de detail-view (gebruik je bestaande functie)
    //    [Hier gaat jouw bestaande grid-builder of table-generator logic in]

    // 4) Sla het huidige item op voor de printfunctie
    window.LessentabellenApp = window.LessentabellenApp || {};
    window.LessentabellenApp.currentItem = item;

    // 5) Bind de printknop éénmalig
    const printBtn = container.querySelector('#download-pdf-button');
    if (printBtn && !printBtn.dataset.printBound) {
        // Kloneer knop om oude event-listeners te verwijderen
        const newBtn = printBtn.cloneNode(true);
        printBtn.parentNode.replaceChild(newBtn, printBtn);

        newBtn.addEventListener('click', e => {
            e.preventDefault();
            // Roep de globale printfunctie aan
            window.LessentabellenApp.generateHTML();
        });

        newBtn.dataset.printBound = 'true';
    }

    // 6) Toon de slide‑in panel
    container.classList.add('open');
    document.getElementById('overlay')?.classList.add('active');
}
