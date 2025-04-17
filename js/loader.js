// loader.js
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

/**
 * Laadt klassen.csv met info over klascode, richting, domein, beschrijving...
 */
export async function getKlassen() {
  const data = await d3.csv("data/klassen.csv", d => ({
    klascode: d.klascode?.trim(),
    klas: d.klas?.trim(),
    richting: d.richting?.trim(),
    domein: d.domein?.trim().toLowerCase(),
    beschrijving: d.beschrijving?.trim()
  }));
  return data.filter(d => d.klascode); // Filter rijen zonder klascode
}

/**
 * Laadt lessentabel.csv met vakken per klas
 */
export async function getLessentabel() {
  const data = await d3.csv("data/lessentabel.csv", d => ({
    klascode: d.klascode?.trim(),
    klas: d.klas?.trim(),
    vak: d.vak?.trim(),
    uren: +d.uren || 0,
    lestijden: +d.lestijden || null,
    stage_weken: +d.stage_weken || null
  }));
  return data.filter(d => d.klascode && d.vak); // Alleen geldige rijen
}

/**
 * Laadt footnotes.csv met optionele opmerkingen per klas
 */
export async function getFootnotes() {
  const data = await d3.csv("data/voetnoten.csv", d => ({
    klascode: d.klascode?.trim(),
    tekst: d.tekst?.trim()
  }));
  return data.filter(d => d.klascode && d.tekst);
}
