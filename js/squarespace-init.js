// squarespace-init.js
(async function(){
  // 1) CSS
  const head = document.head;
  ['styles.css','grid.css','detail-view.css','print-styles.css'].forEach(file=>{
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `https://cdn.jsdelivr.net/gh/GOcampusRedingenhof/aanbod@main/css/${file}`;
    if(file==='print-styles.css') link.media='print';
    head.appendChild(link);
  });
  // 2) Body-class
  document.body.classList.add('lessentabellen-app');
  // 3) CSV override
  const map = { klassen:'klassen.csv', lessentabel:'lessentabel.csv', voetnoten:'voetnoten.csv' };
  const base = 'https://cdn.jsdelivr.net/gh/GOcampusRedingenhof/aanbod@main/data/';
  const _f = window.fetch;
  window.fetch = (i, opt) => {
    let url = typeof i==='string'?i:i.url;
    Object.values(map).forEach(f=>{ if(url.endsWith(f)) i = base+f; });
    return _f(i,opt);
  };
  // 4) Start app
  await import('https://cdn.jsdelivr.net/gh/GOcampusRedingenhof/aanbod@main/js/index.js');
})();
