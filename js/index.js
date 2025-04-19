// openSlidein functie binnen de LessentabellenAppClass
openSlidein(klascode) {
  this.currentKlasCode = klascode; // Bewaar huidige klascode
  
  // Zoek de klas op basis van klascode
  const klas = this.klassen.find(k => k.klascode === klascode);
  
  if (klas) {
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
  } else {
    console.error(`Geen klas gevonden met code ${klascode}`);
  }
}
