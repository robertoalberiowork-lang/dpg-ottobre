/* DPG-WEB · Rev. 07 · comportamenti comuni a tutte le pagine (12/10/2026).
   Si carica DOPO il dizionario della pagina (const I18N={...}) e PRIMA dello script della pagina.
   - t(chiave), $, $$, LANG; applica() scrive i testi: data-i, data-i-html, data-i-alt, data-i-aria, data-i-ph,
     data-i-title, data-i-href, data-mb (peso dei PDF, virgola in it/de, punto in en)
   - DPG_dopo: elenco di funzioni che la pagina registra per rifare le sue parti dinamiche quando cambia la lingua
   - barra piena dopo 80 px, comparsa dei blocchi .rivela (solo sotto html.js), richiami della tavola */
const $=s=>document.querySelector(s),$$=s=>document.querySelectorAll(s);
let LANG=DPG_L();
const t=k=>(I18N[LANG]&&I18N[LANG][k]!=null?I18N[LANG][k]:(I18N.it[k]!=null?I18N.it[k]:k));
const DPG_dopo=[];
function applica(){
  document.documentElement.lang=LANG;
  if(I18N.it.titolo)document.title=t('titolo');
  const md=$('meta[name="description"]');if(md&&I18N.it.meta_d)md.setAttribute('content',t('meta_d'));
  $$('[data-i]').forEach(e=>e.textContent=t(e.dataset.i));
  $$('[data-i-html]').forEach(e=>e.innerHTML=t(e.dataset.iHtml));
  $$('[data-i-alt]').forEach(e=>e.alt=t(e.dataset.iAlt));
  $$('[data-i-aria]').forEach(e=>e.setAttribute('aria-label',t(e.dataset.iAria)));
  $$('[data-i-ph]').forEach(e=>e.setAttribute('placeholder',t(e.dataset.iPh)));
  $$('[data-i-title]').forEach(e=>e.setAttribute('title',t(e.dataset.iTitle)));
  $$('[data-i-href]').forEach(e=>{e.href=t(e.dataset.iHref);e.hreflang=LANG;});
  $$('[data-mb]').forEach(e=>{const v=e.dataset['mb'+LANG[0].toUpperCase()+LANG.slice(1)]||e.dataset.mb;e.textContent=LANG==='en'?v:v.replace('.',',');});
  $$('.lang').forEach(b=>{const on=b.dataset.lang===LANG;b.classList.toggle('attiva',on);b.setAttribute('aria-pressed',on);});
  DPG_dopo.forEach(f=>f(LANG));
}
$$('.lang').forEach(b=>b.addEventListener('click',()=>{LANG=b.dataset.lang;applica();}));

/* barra: piena dopo 80 px di scorrimento */
(function(){const b=$('.barra');if(!b)return;const f=()=>b.classList.toggle('piena',window.scrollY>80);window.addEventListener('scroll',f,{passive:true});f();})();

/* richiami di una tavola: uno attivo alla volta; su telefono si accende anche la voce della lista */
(function(){
  const rr=[...$$('.richiamo')],voci=[...$$('.richiami-lista li')];
  rr.forEach(r=>r.addEventListener('click',()=>{
    const accendi=!r.classList.contains('attivo');
    rr.forEach((x,j)=>{const on=x===r&&accendi;x.classList.toggle('attivo',on);x.setAttribute('aria-pressed',on);if(voci[j])voci[j].classList.toggle('attivo',on);});
  }));
})();

/* indice della pagina (.indice): si accende la voce della sezione che occupa la fascia alta dello schermo;
   la voce attiva resta visibile nella striscia che scorre su telefono */
(function(){
  const voci=[...$$('.indice a[href^="#"]')];if(!voci.length)return;
  const mappa=new Map(voci.map(a=>[document.getElementById(a.getAttribute('href').slice(1)),a]).filter(([s])=>s));
  const accendi=a=>{voci.forEach(x=>{const on=x===a;x.classList.toggle('attiva',on);if(on)x.setAttribute('aria-current','true');else x.removeAttribute('aria-current');});
    if(a){const s=a.parentElement;if(s.scrollWidth>s.clientWidth)s.scrollTo({left:a.offsetLeft-24,behavior:'smooth'});}};
  const os=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting)accendi(mappa.get(e.target));}),{rootMargin:'-30% 0px -60% 0px'});
  mappa.forEach((a,s)=>os.observe(s));
})();

/* righello delle card su telefono (.carte seguita da .righello): la tacca della card visibile diventa un quadrato rosso */
$$('.righello').forEach(r=>{
  const fila=r.previousElementSibling;if(!fila||!fila.classList.contains('carte'))return;
  const tacche=[...r.querySelectorAll('.tacche i')],conta=r.querySelector('.conta-carte');
  const carte=()=>[...fila.children].filter(c=>!c.hidden);
  const segna=i=>{const n=carte().length;tacche.forEach((x,j)=>{x.classList.toggle('attiva',j===i);x.hidden=j>=n;});if(conta)conta.textContent=(i+1)+' / '+n;};
  const os=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting)segna(carte().indexOf(e.target));}),{root:fila,threshold:.6});
  [...fila.children].forEach(c=>os.observe(c));segna(0);
});

/* percorso (.passo + .indicatore): il quadrato rosso sul filo segue il passo a meta' schermo; al ridimensionamento resta sull'ultimo */
$$('.indicatore').forEach(ind=>{
  const passi=[...ind.parentElement.querySelectorAll('.passo')];if(!passi.length)return;
  let ultimo=passi[0];
  const vai=p=>{ultimo=p;ind.style.top=(p.offsetTop+Math.min(48,p.offsetHeight/2)-5)+'px';};
  const os=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting)vai(e.target);}),{rootMargin:'-45% 0px -45% 0px'});
  passi.forEach(p=>os.observe(p));vai(passi[0]);
  window.addEventListener('resize',()=>vai(ultimo),{passive:true});
});

/* schede a linguette ([role=tablist] con [role=tab] e aria-controls): frecce, Home, Fine; se la sezione ha una
   .fantasma, il data-fantasma della linguetta attiva va in filigrana */
$$('[role="tablist"]').forEach(lista=>{
  const tabs=[...lista.querySelectorAll('[role="tab"]')];if(!tabs.length)return;
  const sez=lista.closest('section'),fant=sez&&sez.querySelector('.fantasma');
  function scegli(tb,focus){
    tabs.forEach(x=>{const on=x===tb;x.setAttribute('aria-selected',on);x.tabIndex=on?0:-1;
      const p=document.getElementById(x.getAttribute('aria-controls'));if(p)p.hidden=!on;});
    if(fant){fant.style.opacity=0;setTimeout(()=>{fant.textContent=tb.dataset.fantasma||tb.textContent.trim();fant.style.opacity=1;},180);}
    if(focus)tb.focus();
  }
  tabs.forEach((tb,i)=>{
    tb.addEventListener('click',()=>scegli(tb));
    tb.addEventListener('keydown',e=>{
      const n={ArrowRight:i+1,ArrowLeft:i-1,Home:0,End:tabs.length-1}[e.key];
      if(n===undefined)return;e.preventDefault();scegli(tabs[(n+tabs.length)%tabs.length],true);
    });
  });
});

/* filtri: DPG_filtri('.selettore-delle-voci', {bottoni, vuoto, dopo}) una sola versione per tutte le pagine.
   Ogni voce dichiara in data-set le sue chiavi separate da spazio; ogni bottone ha data-f (tutti = nessun filtro)
   e un .conta dove va il numero. Il filtro scelto va nell'indirizzo (#oem) e all'apertura si rilegge da li'. */
function DPG_filtri(sel,opz){
  opz=opz||{};
  const voci=[...$$(sel)],bott=[...$$(opz.bottoni||'.filtri [data-f]')];
  const ha=(v,f)=>f==='tutti'||(v.dataset.set||'').split(' ').includes(f);
  bott.forEach(b=>{const n=voci.filter(v=>ha(v,b.dataset.f)).length;b.querySelectorAll('.conta').forEach(c=>c.textContent=n);});
  const scegli=(f,storia)=>{
    bott.forEach(x=>{if(x.tagName==='BUTTON')x.setAttribute('aria-pressed',x.dataset.f===f);else x.classList.toggle('attiva',x.dataset.f===f);});
    let vis=0;voci.forEach(v=>{const on=ha(v,f);v.hidden=!on;vis+=on;});
    const vu=$(opz.vuoto||'.nessuna');if(vu)vu.hidden=vis>0;
    if(opz.dopo)opz.dopo(f,vis);
    if(storia&&history.replaceState)history.replaceState(null,'',f==='tutti'?location.pathname:'#'+f);
  };
  bott.forEach(b=>b.addEventListener('click',()=>scegli(b.dataset.f,true)));
  const h=location.hash.slice(1);if(bott.some(x=>x.dataset.f===h))scegli(h,false);
  return scegli;
}

/* un <details> citato nell'indirizzo (faq.html#faq-7) si apre, anche quando l'ancora cambia dopo */
(function(){
  const apri=()=>{const h=location.hash.slice(1);if(!h)return;const d=document.getElementById(h);if(d&&d.tagName==='DETAILS')d.open=true;};
  apri();window.addEventListener('hashchange',apri);
})();

/* comparsa dei blocchi allo scorrimento */
const DPG_rivela=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');DPG_rivela.unobserve(e.target);}}),{threshold:.12,rootMargin:'0px 0px -6% 0px'});
$$('.rivela').forEach(el=>DPG_rivela.observe(el));
