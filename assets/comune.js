/* DPG-WEB · comune a tutte le pagine (Rev. 06, 11/10/2026). Nessuna libreria.
   1. DPG_L(): la lingua scelta resta quando si cambia pagina (localStorage, chiave dpg_lingua).
   2. Le tendine del menu desktop (.menu-voce > .menu-apri + .menu-sotto) si aprono al clic, si chiudono
      cliccando altrove o con Escape (come nella Rev. 05).
   3. Il pannello telefono: .menu-tasto nella barra apre e chiude .menu-pannello (classe "aperto") e aggiorna
      aria-expanded; [data-menu-chiudi], Escape e un clic su un link del pannello chiudono; body.menu-aperto
      blocca lo scorrimento della pagina finche' il pannello e' aperto; se la finestra torna larga il pannello si chiude.
   Aggiunte Rev. 07 (12/10/2026): con il pannello aperto il resto della pagina e' inerte (inert), cosi' il tasto Tab
      resta dentro il pannello; la larghezza da cui la barra torna intera si legge da data-bp sul pannello (980 se manca). */
function DPG_L(){try{const l=localStorage.getItem('dpg_lingua');return ['it','de','en'].includes(l)?l:'it';}catch(e){return 'it';}}

/* lingua ricordata e tendine (cattura: chiude le tendine prima di qualunque altro clic) */
document.addEventListener('click',e=>{
  const b=e.target.closest('.lang');
  if(b){try{localStorage.setItem('dpg_lingua',b.dataset.lang);}catch(_){}}
  const v=e.target.closest('.menu-apri');
  document.querySelectorAll('.menu-voce.aperta').forEach(m=>{if(!v||m!==v.parentElement){m.classList.remove('aperta');m.querySelector('.menu-apri').setAttribute('aria-expanded','false');}});
  if(v){const m=v.parentElement,on=!m.classList.contains('aperta');m.classList.toggle('aperta',on);v.setAttribute('aria-expanded',on);}
},true);

/* pannello telefono */
function DPG_menu(on){
  const p=document.querySelector('.menu-pannello'),t=document.querySelector('.topbar .menu-tasto');
  if(!p)return;
  p.classList.toggle('aperto',on);
  document.body.classList.toggle('menu-aperto',on);
  Array.prototype.forEach.call(document.body.children,e=>{if(e!==p&&!e.contains(p)&&e.tagName!=='SCRIPT')e.inert=on;});
  if(t)t.setAttribute('aria-expanded',on?'true':'false');
  if(on){const c=p.querySelector('[data-menu-chiudi]');if(c)c.focus();}
  else if(t&&p.contains(document.activeElement))t.focus();
}
document.addEventListener('click',e=>{
  const p=document.querySelector('.menu-pannello');if(!p)return;
  if(e.target.closest('.topbar .menu-tasto')){DPG_menu(!p.classList.contains('aperto'));return;}
  if(e.target.closest('[data-menu-chiudi]')){DPG_menu(false);return;}
  if(p.classList.contains('aperto')&&e.target.closest('.menu-pannello a'))DPG_menu(false);
});
document.addEventListener('keydown',e=>{
  if(e.key!=='Escape')return;
  document.querySelectorAll('.menu-voce.aperta').forEach(m=>{m.classList.remove('aperta');m.querySelector('.menu-apri').setAttribute('aria-expanded','false');m.querySelector('.menu-apri').focus();});
  const p=document.querySelector('.menu-pannello');
  if(p&&p.classList.contains('aperto'))DPG_menu(false);
});
document.addEventListener('DOMContentLoaded',()=>{
  if(!window.matchMedia)return;
  const p=document.querySelector('.menu-pannello'),bp=(p&&parseInt(p.dataset.bp,10))||980;
  const mq=window.matchMedia('(min-width:'+bp+'px)'),chiudi=e=>{if(e.matches)DPG_menu(false);};
  if(mq.addEventListener)mq.addEventListener('change',chiudi);else if(mq.addListener)mq.addListener(chiudi);
});
