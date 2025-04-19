// js/index.js – Entry point van de applicatie

// 1) Laad de hoofd‑applicatie (staat in window.LessentabellenApp)
import './app.js';

// 2) Importeer de printfunctie uit de print‑module
import { generateHTML } from './print-handler.js';

// 3) Zorg dat het globale LessentabellenApp‑object bestaat
window.LessentabellenApp = window.LessentabellenApp || {};

// 4) Koppel de printfunctie aan de globale app zodat andere modules 'm kunnen aanroepen
window.LessentabellenApp.generateHTML = generateHTML;

// (Optioneel) hier kun je later nog andere global bindings plaatsen
