// Verbeterde openSlidein functie in index.js

/**
 * Open het slidein paneel voor een specifieke klascode
 * @param {string} klascode - De klascode om te openen
 */
openSlidein(klascode) {
  try {
    // Controleer of klascode geldig is
    if (!klascode || typeof klascode !== 'string') {
      console.error(`Ongeldige klascode: ${klascode}`);
      this.showError('Er is een ongeldig verzoek gedaan. Probeer het opnieuw.');
      return;
    }
    
    this.currentKlasCode = klascode; // Bewaar huidige klascode
    
    // Zoek de klas op basis van klascode
    const klas = this.klassen.find(k => k.klascode === klascode);
    
    if (!klas) {
      console.error(`Geen klas gevonden met code ${klascode}`);
      this.showError(`Klas met code ${klascode} kon niet worden gevonden.`);
      return;
    }
    
    // Alle klassen in dezelfde graad en met dezelfde richtingcode als de geselecteerde klas
    const klassenInZelfdeGraad = this.klassen.filter(k => 
      k.graad === klas.graad && 
      k.richtingcode === klas.richtingcode
    );
    
    console.log(`Gevonden: ${klassenInZelfdeGraad.length} klassen in dezelfde graad (${klas.graad})`);
    
    // Haal alle klasnummers op van dezelfde graad
    const klascodesInGraad = klassenInZelfdeGraad.map(k => k.klascode);
    
    // Haal alle lessen op die bij deze klassen horen
    const lessenVoorGraad = this.lessentabel.filter(les => 
      klascodesInGraad.includes(les.klascode)
    );
    
    console.log(`Gevonden: ${lessenVoorGraad.length} lessen voor deze graad`);
    
    // Haal voetnoten op specifiek voor deze klas
    const voetnotenVoorKlas = this.footnotes.filter(f => f.klascode === klascode);

    // Render het slidein met alle gegevens
    renderSlidein(klas, lessenVoorGraad, voetnotenVoorKlas);
  } catch (error) {
    console.error('Fout bij openen slidein:', error);
    this.showError('Er is een fout opgetreden bij het openen van de lessentabel.');
  }
}

// Hulpfunctie om een foutmelding te tonen
showError(message) {
  const container = document.getElementById('lessentabel-container');
  if (container) {
    container.innerHTML = `
      <div class="error-message">
        ${message}
      </div>
    `;
  }
  
  // Zorg dat het slidein paneel zichtbaar is zodat de foutmelding wordt getoond
  const slidein = document.getElementById("slidein");
  const overlay = document.getElementById("overlay");
  if (slidein) slidein.classList.add("open");
  if (overlay) overlay.classList.add("active");
}
