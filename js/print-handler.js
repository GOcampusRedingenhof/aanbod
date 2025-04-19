// Vervang de huidige print-handler.js met deze eenvoudige versie
document.addEventListener('DOMContentLoaded', function() {
  // Vind de print knop
  const printBtn = document.getElementById('print-button');
  if (printBtn) {
    printBtn.addEventListener('click', function() {
      // Voeg een print klasse toe aan body
      document.body.classList.add('print-mode');
      
      // Wacht kort en print
      setTimeout(function() {
        window.print();
        
        // Verwijder de print klasse na een korte vertraging
        setTimeout(function() {
          document.body.classList.remove('print-mode');
        }, 1000);
      }, 200);
    });
  }
  
  // Zorg dat de close knop altijd werkt
  document.addEventListener('click', function(e) {
    if (e.target.classList.contains('close-btn') || e.target.closest('.close-btn')) {
      const slidein = document.getElementById('slidein');
      const overlay = document.getElementById('overlay');
      
      if (slidein) slidein.classList.remove('open');
      if (overlay) overlay.classList.remove('active');
    }
  });
});
