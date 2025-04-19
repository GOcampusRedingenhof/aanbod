window.LessentabellenApp = {
  startPrintProcess: function (klas, naam = 'Onbekend') {
    const container = document.querySelector('.print-container');
    const footer = document.querySelector('.print-footer span');
    const datum = new Date().toLocaleDateString('nl-BE', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });

    // Titel voor print-bestandsnaam
    document.title = `lessentabel_${klas}`;

    // Footer invullen
    if (footer) {
      footer.textContent = `Klas: ${klas} · Naam: ${naam} · Geprint op ${datum}`;
    }

    // Schaal bij te grote inhoud (optioneel, afhankelijk van layout)
    if (container && container.scrollHeight > 1000) {
      container.style.transform = 'scale(0.95)';
      container.style.transformOrigin = 'top left';
    }

    // Start print
    window.print();

    // Reset zoom na print
    setTimeout(() => {
      if (container) {
        container.style.transform = '';
      }
    }, 1000);
  }
};
