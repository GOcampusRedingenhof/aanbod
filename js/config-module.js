// config-module.js

export const csvUrl = 'data/lessentabel.csv';
export const footnotesUrl = 'data/voetnoten.csv';
export const klassenUrl = 'data/klassen.csv';

export const cacheExpiry = 1000 * 60 * 60;

export const domainColors = {
  stem: {
    base: "#0C8464",
    mid: "#48A787",
    light1: "#89CCB2",
    hover: "#d7f5ea"
  },
  topsport: {
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

export function mapDomein(raw) {
  const key = raw?.toString().trim().toLowerCase();
  return domeinMap[key] || 'onbekend';
}

export function getDomeinMeta(key) {
  return domainColors[key] || {
    base: '#ccc',
    mid: '#ddd',
    light1: '#eee',
    hover: '#bbb'
  };
}
