// js/print-handler.js – Module met professionele printfunctie

export function generateHTML(selectedData) {
    // 1) Filter het Event-object eruit wanneer je deze functie vanuit een click-handler aanroept
    if (selectedData instanceof Event) {
        selectedData.preventDefault?.();
        selectedData = undefined;
    }

    // 2) Bepaal de data die je wilt afdrukken (meegegeven of laatste geselecteerde)
    const data = selectedData || window.LessentabellenApp.currentItem;
    if (!data) {
        console.error("Geen data beschikbaar om af te drukken.");
        return;
    }

    // 3) Pak de hoofdcascade‑CSS (indien geladen) voor identieke styling
    let cssHref = "";
    const mainStyle = document.querySelector('link[rel="stylesheet"]');
    if (mainStyle) cssHref = mainStyle.href;

    // 4) Bouw de HTML-string voor het print‑venster
    let html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(data.title || data.name || "Print")}</title>`;
    if (cssHref) {
        html += `  <link rel="stylesheet" href="${cssHref}">`;
    }
    // Fallback inline‑CSS
    html += `<style>
    body { font-family: Arial, sans-serif; margin: 20px; color: #000; }
    h1 { font-size: 1.6em; margin-bottom: 0.2em; }
    p, li { font-size: 1em; line-height: 1.4; }
    table { width: 100%; border-collapse: collapse; margin-top: 1em; }
    th, td { border: 1px solid #333; padding: 6px; text-align: left; font-size: 0.9em; }
    th { background: #eee; }
    @media print {
      body { margin: 10mm; }
      table { page-break-inside: avoid; }
    }
</style>
</head>
<body>`;

    // Titel, code en beschrijving
    if (data.title || data.name) {
        html += `<h1>${escapeHtml(data.title || data.name)}</h1>`;
    }
    if (data.code) {
        html += `<h2>Code: ${escapeHtml(data.code)}</h2>`;
    }
    if (data.description || data.omschrijving) {
        html += `<p>${escapeHtml(data.description || data.omschrijving)}</p>`;
    }

    // Lessentabel of lijst met sub-items
    let lijst = Array.isArray(data.lessons)  ? data.lessons
               : Array.isArray(data.lessen)  ? data.lessen
               : Array.isArray(data.schedule)? data.schedule
               : null;

    if (lijst && lijst.length) {
        const cols = Object.keys(lijst[0]).filter(k => !k.startsWith('_'));
        html += `<table>
  <thead>
    <tr>${cols.map(k => `<th>${escapeHtml(capitalize(k))}</th>`).join('')}</tr>
  </thead>
  <tbody>`;
        for (const row of lijst) {
            html += `<tr>${cols.map(k => `<td>${escapeHtml(row[k] ?? '')}</td>`).join('')}</tr>`;
        }
        html += `  </tbody>
</table>`;
    }

    // Voettekst met datum
    const today = new Date().toLocaleDateString();
    html += `<p style="margin-top:20px; font-size:0.8em; color:#555;">
  Afgedrukt op ${escapeHtml(today)}
</p>`;

    html += `</body>
</html>`;

    // 5) Open het printvenster binnen de click‑actie om blokkering te vermijden
    const w = window.open('', '_blank');
    if (!w) {
        console.error('Kon printvenster niet openen (popup waarschijnlijk geblokkeerd).');
        return;
    }
    w.document.write(html);
    w.document.close();
    w.focus();
    w.onload = () => w.print();
}

// Helper om strings veilig in HTML te zetten
function escapeHtml(str) {
    return String(str ?? '').replace(/[&<>"']/g, m =>
      ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' })[m]
    );
}

// Helper om 'vaknaam' → 'Vaknaam' te maken
function capitalize(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
}
