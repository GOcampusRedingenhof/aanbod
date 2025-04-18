// config-module.js

// 1. Kleuren per domein
export const domainColors = {
  stem: {
    base: "#0C8464",
    mid: "#48A787",
    light1: "#89CCB2",
    hover: "#d7f5ea"
  },
  "sport-topsport": {
    base: "#A2E4FF",
    mid: "#C6F0FF",
    light1: "#E4F9FF",
    hover: "#6ABCD6"
  },
  "eerste-graad": {
    base: "#ED4E13",
    mid: "#F3764A",
    light1: "#F8A588",
    hover: "#F8B96D"
  },
  "maatschappij-welzijn": {
    base: "#E399BB",
    mid: "#EFBACD",
    light1: "#F7D9E4",
    hover: "#F2C5D1"
  },
  "economie-organisatie": {
    base: "#2B2243",
    mid: "#254a87",
    light1: "#5084C2",
    hover: "#7081a8"
  },
  schakeljaar: {
    base: "#2B2243",
    mid: "#254a87",
    light1: "#5084C2",
    hover: "#7081a8"
  },
  okan: {
    base: "#E5A021",
    mid: "#F0B94E",
    light1: "#F9D38A",
    hover: "#F9CA7F"
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

// 5. CSV-paden (voor loader.js)
export const csvUrls = {
  klassen: 'data/klassen.csv',
  lessentabel: 'data/lessentabel.csv',
  voetnoten: 'data/voetnoten.csv'
};
