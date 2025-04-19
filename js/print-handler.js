// print-handler.js - Vereenvoudigde versie (alleen PDF-generatie)
// Deze module focust op betrouwbare PDF-generatie

/**
 * Initialiseert de handler voor een specifieke klas
 * @param {Object} klas - Het klasobject met alle informatie
 */
export function initPrintHandler(klas) {
  // Sla de klas op voor gebruik in PDF functie
  window.currentPrintKlas = klas;
}

/**
 * Genereert een PDF bestand van de huidige lessentabel
 * Met verbeterde inhoudsopname
 */
export function generatePDF() {
  try {
    // Controleer eerst of html2pdf beschikbaar is
    if (typeof window.html2pdf === 'undefined') {
      console.error('html2pdf library niet beschikbaar');
      alert('PDF genereren is momenteel niet beschikbaar. Probeer de pagina te verversen.');
      return;
    }
    
    // Verkrijg huidige klas
    const klas = window.currentPrintKlas || (window.LessentabellenApp && window.LessentabellenApp.getKlasByCode(window.LessentabellenApp.currentKlasCode));
    
    if (!klas || !klas.richting) {
      console.error('Geen geldige klas gevonden voor PDF generatie');
      alert('Kan geen PDF genereren. Geen richtingsinformatie beschikbaar.');
      return;
    }
    
    console.log('PDF generatie gestart voor:', klas.richting);
    
    // Haal de slidein container op
    const slidein = document.getElementById('slidein');
    if (!slidein) {
      alert('Kan geen PDF genereren. Geen inhoud beschikbaar.');
      return;
    }
    
    // Genereer een bestandsnaam gebaseerd op de richting
    const fileName = `${klas.richting.replace(/[^\w\s-]/gi, '')}_Lessentabel.pdf`;
    
    // Maak een nieuwe container specifiek voor de PDF
    // Dit vermijdt problemen met stijlen en zichtbaarheid
    const pdfContainer = document.createElement('div');
    pdfContainer.style.position = 'absolute';
    pdfContainer.style.left = '-9999px';
    pdfContainer.style.width = '210mm'; // A4 breedte
    pdfContainer.style.fontSize = '10pt';
    pdfContainer.style.fontFamily = 'Montserrat, Arial, sans-serif';
    
    // Kopieer de relevante inhoud
    // We bouwen deze handmatig op om problemen met verborgen elementen te vermijden
    
    // Titel sectie
    const headerSection = document.createElement('div');
    headerSection.style.textAlign = 'center';
    headerSection.style.marginBottom = '20px';
    
    const titel = document.createElement('h1');
    titel.textContent = klas.richting || 'Lessentabel';
    titel.style.fontSize = '18pt';
    titel.style.fontWeight = 'bold';
    titel.style.margin = '0 0 10px 0';
    
    headerSection.appendChild(titel);
    
    // Voeg beschrijving toe als die er is
    const beschrijvingEl = slidein.querySelector('#opleiding-beschrijving');
    if (beschrijvingEl && beschrijvingEl.textContent.trim()) {
      const beschrijving = document.createElement('p');
      beschrijving.textContent = beschrijvingEl.textContent;
      beschrijving.style.fontSize = '10pt';
      beschrijving.style.marginBottom = '20px';
      headerSection.appendChild(beschrijving);
    }
    
    pdfContainer.appendChild(headerSection);
    
    // Lessentabel sectie
    const tabelSection = document.createElement('div');
    
    // Kopieer de tabel, inclusief alle stijlen
    const origineleTabel = slidein.querySelector('.lessentabel');
    if (origineleTabel) {
      const tabel = origineleTabel.cloneNode(true);
      
      // Zorg ervoor dat de tabel zichtbaar is en goed gestructureerd
      tabel.style.width = '100%';
      tabel.style.borderCollapse = 'collapse';
      tabel.style.fontSize = '9pt';
      tabel.style.marginBottom = '20px';
      
      // Stijl de cellen
      const cellen = tabel.querySelectorAll('th, td');
      cellen.forEach(cel => {
        cel.style.border = '1px solid #ddd';
        cel.style.padding = '4px 6px';
        cel.style.textAlign = cel.tagName === 'TH' || cellen.indexOf(cel) === 0 ? 'left' : 'center';
      });
      
      // Stijl de headers
      const headers = tabel.querySelectorAll('th');
      headers.forEach(header => {
        header.style.backgroundColor = '#f0f0f0';
        header.style.fontWeight = 'bold';
      });
      
      // Stijl categorie headers
      const categorieHeaders = tabel.querySelectorAll('.categorie-header th');
      categorieHeaders.forEach(header => {
        header.style.backgroundColor = '#e0e0e0';
        header.style.textAlign = 'left';
      });
      
      // Zorg dat subvakken juist worden weergegeven
      const subvakken = tabel.querySelectorAll('.subvak td:first-child');
      subvakken.forEach(subvak => {
        subvak.style.paddingLeft = '15px';
      });
      
      tabelSection.appendChild(tabel);
    } else {
      // Als er geen tabel is, toon een foutmelding
      const foutmelding = document.createElement('p');
      foutmelding.textContent = 'De lessentabel kon niet worden geladen.';
      foutmelding.style.color = 'red';
      tabelSection.appendChild(foutmelding);
    }
    
    pdfContainer.appendChild(tabelSection);
    
    // Voetnoten sectie
    const voetnotenOrigineel = slidein.querySelector('.footnotes');
    if (voetnotenOrigineel) {
      const voetnoten = voetnotenOrigineel.cloneNode(true);
      voetnoten.style.fontSize = '8pt';
      voetnoten.style.marginTop = '10px';
      voetnoten.style.borderLeft = '3px solid #ddd';
      voetnoten.style.paddingLeft = '10px';
      pdfContainer.appendChild(voetnoten);
    }
    
    // Datum footer
    const footer = document.createElement('div');
    footer.style.marginTop = '20px';
    footer.style.fontSize = '8pt';
    footer.style.color = '#666';
    
    const datum = document.createElement('p');
    const now = new Date();
    // Vermijd dubbele variabele declaratie
    const dateOptions = { day: '2-digit', month: 'long', year: 'numeric' };
    try {
      datum.textContent = `Afgedrukt op: ${now.toLocaleDateString('nl-BE', dateOptions)}`;
    } catch (error) {
      datum.textContent = `Afgedrukt op: ${now.getDate()}-${now.getMonth() + 1}-${now.getFullYear()}`;
    }
    
    footer.appendChild(datum);
    pdfContainer.appendChild(footer);
    
    // Voeg branding toe
    const branding = document.createElement('div');
    branding.style.position = 'absolute';
    branding.style.bottom = '10mm';
    branding.style.right = '10mm';
    branding.style.fontSize = '7pt';
    branding.style.color = '#999';
    branding.textContent = 'GO Campus Redingenhof';
    pdfContainer.appendChild(branding);
    
    // Voeg de container toe aan de pagina voor html2pdf
    document.body.appendChild(pdfContainer);
    
    // Configureer html2pdf
    // Voorkom dubbele variabele declaratie
    const html2pdfOptions = {
      margin: [15, 10, 15, 10], // top, right, bottom, left in mm
      filename: fileName,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2,
        useCORS: true,
        logging: false
      },
      jsPDF: { 
        unit: 'mm', 
        format: 'a4', 
        orientation: 'portrait',
        compress: true
      }
    };
    
    // Genereer de PDF
    window.html2pdf()
      .from(pdfContainer)
      .set(html2pdfOptions)
      .save()
      .then(() => {
        // Cleanup
        document.body.removeChild(pdfContainer);
        console.log('PDF generatie succesvol voltooid');
      })
      .catch(err => {
        console.error('Fout bij PDF generatie:', err);
        
        // Probeer de foutmelding te tonen voor debugging
        if (typeof err === 'object') {
          console.error('Fout details:', Object.keys(err).map(k => `${k}: ${err[k]}`).join(', '));
        }
        
        alert('Er is een fout opgetreden bij het maken van de PDF. Probeer het opnieuw.');
        
        // Cleanup
        if (document.body.contains(pdfContainer)) {
          document.body.removeChild(pdfContainer);
        }
      });
  } catch (error) {
    console.error('Onverwachte fout bij PDF generatie:', error);
    alert('Er is een onverwachte fout opgetreden bij het maken van de PDF.');
  }
}

// Exporteer alleen de benodigde functies
export default {
  initPrintHandler,
  generatePDF
};
