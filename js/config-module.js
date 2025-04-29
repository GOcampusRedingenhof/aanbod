// config-module.js

/*
 * Gebruik altijd de centrale domainColors structuur en CSS-variabelen voor domeinspecifieke kleuren.
 * Nooit hardcoded kleuren gebruiken in componenten, knoppen of titels!
 * Zie ook utility-functies zoals setActiveDomainColors voor dynamische styling.
 */

// 1. Kleuren per domein
export const domainColors = {
  stem: {
    base: "#0C8464",
    mid: "#48A787",
    light1: "#89CCB2",
    hover: "#d7f5ea",
    textBtn: "#fff"
  },
  "sport-topsport": {
    base: "#A2E4FF",
    mid: "#C6F0FF",
    light1: "#E4F9FF",
    hover: "#6ABCD6",
    textBtn: "#2B2243"
  },
  "eerste-graad": {
    base: "#ED4E13",
    mid: "#F3764A",
    light1: "#F8A588",
    hover: "#F8B96D",
    textBtn: "#fff"
  },
  "maatschappij-welzijn": {
    base: "#E399BB",
    mid: "#EFBACD",
    light1: "#F7D9E4",
    hover: "#F2C5D1",
    textBtn: "#2B2243"
  },
  "economie-organisatie": {
    base: "#2B2243",
    mid: "#254a87",
    light1: "#5084C2",
    hover: "#7081a8",
    textBtn: "#fff"
  },
  schakeljaar: {
    base: "#2B2243",
    mid: "#254a87",
    light1: "#5084C2",
    hover: "#7081a8",
    textBtn: "#fff"
  },
  okan: {
    base: "#E5A021",
    mid: "#F0B94E",
    light1: "#F9D38A",
    hover: "#F9CA7F",
    textBtn: "#2B2243"
  }
};

// 2. Mapping van ruwe domeinnamen naar CSS-conforme identifiers
export const domeinMap = {
  'stem': 'stem',
  'eerste graad': 'eerste-graad',
  'maatschappij & welzijn': 'maatschappij-welzijn',
  'economie & organisatie': 'economie-organisatie',
  'sport & topsport': 'sport-topsport',
  'topsport': 'sport-topsport',
  'okan': 'okan',
  'schakeljaar': 'schakeljaar'
};

// 3. Normaliseer domeinnaam uit CSV naar CSS-selector
export function mapDomein(raw) {
  const key = raw?.toString().trim().toLowerCase();
  return domeinMap[key] || 'onbekend';
}

// 4. Metadata ophalen per domein
export function getDomeinMeta(domeinKey) {
  return domainColors[domeinKey] || domainColors['eerste-graad'];
}

// Dynamisch base pad bepalen voor data-bestanden
const GITHUB_CDN_BASE = 'https://cdn.jsdelivr.net/gh/GOcampusRedingenhof/aanbod@main/';

export const csvUrls = {
  klassen: GITHUB_CDN_BASE + 'data/klassen.csv',
  lessentabel: GITHUB_CDN_BASE + 'data/lessentabel.csv',
  voetnoten: GITHUB_CDN_BASE + 'data/voetnoten.csv'
};

/**
 * Zet de centrale domein-variabelen op :root voor het actieve domein
 * @param {string} domeinKey - CSS key van het domein, bv. 'stem', 'economie-organisatie'
 */
export function setActiveDomainColors(domeinKey) {
  const meta = getDomeinMeta(domeinKey);
  const root = document.documentElement;
  root.style.setProperty('--domain-base', meta.base);
  root.style.setProperty('--domain-mid', meta.mid);
  root.style.setProperty('--domain-hover', meta.hover);
  // Tekstkleur: bepaal automatisch of wit of donker nodig is
  const textColor = getContrastYIQ(meta.base);
  root.style.setProperty('--domain-text', textColor);
  // Dynamisch textBtn kleur instellen
  root.style.setProperty('--domain-textBtn', meta.textBtn);
}

/**
 * Bepaal automatisch wit of zwart als tekstkleur op basis van achtergrondkleur
 * @param {string} hexcolor
 * @returns {string} '#fff' of '#222'
 */
function getContrastYIQ(hexcolor) {
  let hex = hexcolor.replace('#', '');
  if (hex.length === 3) hex = hex.split('').map(x => x + x).join('');
  const r = parseInt(hex.substr(0,2),16);
  const g = parseInt(hex.substr(2,2),16);
  const b = parseInt(hex.substr(4,2),16);
  const yiq = ((r*299)+(g*587)+(b*114))/1000;
  return (yiq >= 180) ? '#222' : '#fff';
}
