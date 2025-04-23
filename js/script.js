// js/script.js v35 — inline gradient + currentColor fix

import {
  addBasisvormingSection,
  addSpecifiekSection,
  addTotalRow,
  addStageRow
} from './tableSections.js';

function toCssKey(name) {
  return name
    .toLowerCase()
    .replace(/[&\/]/g,' ')
    .replace(/[^a-z0-9 ]/g,'')
    .trim()
    .replace(/\s+/g,'-');
}

class LessentabellenApp {
  constructor() {
    this.klassen = [];
    this.lessentabel = [];
    this.voetnoten = [];
    this.elements = {};
    this.urls = {
      klassen:     'https://raw.githubusercontent.com/GOcampusRedingenhof/aanbod/refactor/data/klassen.csv',
      lessentabel: 'https://raw.githubusercontent.com/GOcampusRedingenhof/aanbod/refactor/data/lessentabel.csv',
      voetnoten:   'https://raw.githubusercontent.com/GOcampusRedingenhof/aanbod/refactor/data/voetnoten.csv'
    };
  }

  async init() {
    const domainSel   = document.getElementById('domain-select');
    const gradeSel    = document.getElementById('grade-select');
    const finalitySel = document.getElementById('finality-select');
    const richtingSel = document.getElementById('richting-select');
    const tableCont   = document.getElementById('table-container');
    const loadingInd  = document.getElementById('loading-indicator');
    const renderBtn   = document.getElementById('render-btn');
    const printBtn    = document.getElementById('print-btn');
    this.elements = { domainSel, gradeSel, finalitySel, richtingSel, tableCont, loadingInd };

    // show loader
    loadingInd.classList.remove('hidden');

    try {
      const [kTxt, ltTxt, vTxt] = await Promise.all([
        fetch(this.urls.klassen).then(r=>r.text()),
        fetch(this.urls.lessentabel).then(r=>r.text()),
        fetch(this.urls.voetnoten).then(r=>r.text())
      ]);
      this.klassen     = Papa.parse(kTxt,  { header:true, skipEmptyLines:true }).data;
      this.lessentabel = Papa.parse(ltTxt, { header:true, skipEmptyLines:true }).data;
      // regex parse voetnoten
      this.voetnoten = [];
      const rx = /([0-9A-Z]+)[;,]"([^"]+)"/g;
      let m;
      while ((m = rx.exec(vTxt)) !== null) {
        this.voetnoten.push({ klascode:m[1], tekst:m[2] });
      }
    } catch(err) {
      tableCont.innerHTML = `<p class="error-message">Fout: ${err.message}</p>`;
    } finally {
      loadingInd.classList.add('hidden');
    }

    domainSel.onchange   = ()=>{ this.populateGradeSelect(); this.populateFinalitySelect(); this.populateDirectionSelect(); };
    gradeSel.onchange    = ()=>{ this.populateFinalitySelect(); this.populateDirectionSelect(); };
    finalitySel.onchange = ()=> this.populateDirectionSelect();
    renderBtn.onclick    = ()=> this.renderTable();
    printBtn.onclick     = ()=> window.print();

    this.populateDomainSelect();
    this.populateGradeSelect();
    this.populateFinalitySelect();
    this.populateDirectionSelect();
  }

  populateDomainSelect() {
    const sel = this.elements.domainSel;
    sel.innerHTML = '<option value="">— Alle domeinen —</option>';
    Array.from(new Set(this.klassen.map(k=>k.domein))).sort()
      .forEach(d=> sel.appendChild(new Option(d.toUpperCase(), d)));
  }

  populateGradeSelect() {
    const { domainSel, gradeSel } = this.elements;
    gradeSel.innerHTML = '<option value="">— Alle graden —</option>';
    Array.from(new Set(
      this.klassen
        .filter(k=>!domainSel.value||k.domein===domainSel.value)
        .map(k=>k.graad)
    )).sort((a,b)=>a-b)
      .forEach(g=> gradeSel.appendChild(new Option(g, g)));
  }

  populateFinalitySelect() {
    const { domainSel, gradeSel, finalitySel } = this.elements;
    finalitySel.innerHTML = '<option value="">— Alle finaliteiten —</option>';
    Array.from(new Set(
      this.klassen
        .filter(k=>(!domainSel.value||k.domein===domainSel.value) &&
                    (!gradeSel.value||k.graad===gradeSel.value))
        .map(k=>k.finaliteit)
    )).sort()
      .forEach(f=> finalitySel.appendChild(new Option(f, f)));
  }

  populateDirectionSelect() {
    const { domainSel, gradeSel, finalitySel, richtingSel } = this.elements;
    richtingSel.innerHTML = '<option value="">— Selecteer richting —</option>';
    Array.from(new Set(
      this.klassen
        .filter(k=>(!domainSel.value||k.domein===domainSel.value) &&
                    (!gradeSel.value||k.graad===gradeSel.value) &&
                    (!finalitySel.value||k.finaliteit===finalitySel.value))
        .map(k=>`${k.richting}|${k.graad}`)
    )).sort()
      .forEach(val=>{
        const [r,g] = val.split('|');
        richtingSel.appendChild(new Option(
          `${r.toUpperCase()} (GRAAD ${g})`,
          val
        ));
      });
  }

  renderTable() {
    const { richtingSel, tableCont } = this.elements;
    const combo = richtingSel.value;
    tableCont.innerHTML = '';
    if (!combo) {
      tableCont.innerHTML = `<p class="message">Selecteer eerst een richting.</p>`;
      return;
    }

    const [richting, graad] = combo.split('|');
    const codes = this.klassen
      .filter(k=>k.richting===richting&&k.graad===graad)
      .map(k=>k.klascode)
      .sort((a,b)=>+a.match(/^\d+/)-+b.match(/^\d+/));

    // determine domain color key
    const domein = this.klassen.find(k=>k.klascode===codes[0]).domein;
    const key    = toCssKey(domein);

    // wrapper
    const wrapper = document.createElement('div');
    wrapper.className = 'table-wrapper';

    // logo
    const logo = document.createElement('img');
    logo.className = 'table-logo';
    logo.src = 'https://images.squarespace-cdn.com/content/670992d66064015802d7e5dc/7ff63cbf-4f32-46f5-b508-8108908919c3/Scherm%C2%ADafbeelding+2025-04-20+om+23.47.21.png?content-type=image%2Fpng';
    wrapper.appendChild(logo);

    // title
    const title = document.createElement('h2');
    title.className = 'table-title';
    title.textContent = richting.toUpperCase();
    wrapper.appendChild(title);

    // build table
    const table = document.createElement('table');
    const colgroup = document.createElement('colgroup');
    const c1 = document.createElement('col');
    c1.style.width='40%';
    colgroup.append(c1);
    codes.forEach(()=> {
      const c = document.createElement('col');
      c.style.width=`calc(60%/${codes.length})`;
      colgroup.append(c);
    });
    table.append(colgroup);

    // header
    const thead = table.createTHead();
    const hrow  = thead.insertRow();
    // inline gradient
    hrow.style.background = `linear-gradient(to right,
      var(--color-${key}-gradient-start),
      var(--color-${key}-gradient-end)
    )`;
    hrow.insertCell().outerHTML = '<th>Vak</th>';
    codes.forEach(code=>{
      const th = document.createElement('th');
      th.textContent = code;
      hrow.appendChild(th);
    });

    // body
    const tbody = table.createTBody();
    const entries = this.lessentabel.filter(e=>codes.includes(e.klascode));
    addBasisvormingSection (tbody, entries, codes);
    addSpecifiekSection    (tbody, entries, codes);
    addTotalRow            (tbody, entries, codes);
    addStageRow            (tbody, this.klassen, codes);

    wrapper.appendChild(table);

    // footnote
    const note=this.voetnoten.find(fn=>codes.includes(fn.klascode));
    if(note){
      const ul=document.createElement('ul');
      ul.className='footnotes';
      const li=document.createElement('li');
      li.textContent = note.tekst;
      ul.append(li);
      wrapper.appendChild(ul);
    }

    // banner
    const banner=document.createElement('img');
    banner.className='table-banner';
    banner.src='https://images.squarespace-cdn.com/content/670992d66064015802d7e5dc/ef0fe42d-578e-41dd-ba80-bcb23fd4b3e7/SAMEN+VER%21+%283%29.png?content-type=image%2Fpng';
    wrapper.appendChild(banner);

    tableCont.appendChild(wrapper);
  }
}

window.addEventListener('DOMContentLoaded', ()=> new LessentabellenApp().init());
