window.ConfigModule = {
  csvUrl: 'data/lessentabel.csv',
  footnotesUrl: 'data/footnotes.csv',
  cacheExpiry: 1000 * 60 * 60,

  domainColors: {
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
  }
};

// config-module.js

export const domeinMap = {
  'stem': 'stem',
  'eerste graad': 'eerste-graad',
  'maatschappij & welzijn': 'maatschappij-welzijn',
  'maatschappij en welzijn': 'maatschappij-welzijn',
  'economie & organisatie': 'economie-organisatie',
  'economie en organisatie': 'economie-organisatie',
  'sport & topsport': 'sport-topsport',
  'sport en topsport': 'sport-topsport',
  'topsport': 'sport-topsport',
  'okan': 'okan',
  'schakeljaar': 'schakeljaar'
};

export function mapDomein(raw) {
  const key = raw?.toString().trim().toLowerCase();
  return domeinMap[key] || 'onbekend';
}

export function getDomeinMeta(domeinKey) {
  return window.ConfigModule.domainColors[domeinKey] || {
    base: '#cccccc',
    mid: '#cccccc',
    light1: '#e0e0e0',
    hover: '#dddddd'
  };
}
