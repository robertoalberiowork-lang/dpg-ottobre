/* DPG-WEB · Rev. 07 · preventivatore: la fascia di prezzo indicativa, calcolata nel browser (12/10/2026).
   Comune a preventivo.html e alle tre pagine di settore. Markup: _lavoro/r07/parti/quota.html (incluso dal build);
   stile: _lavoro/r07/css/20_quota.css. Il file STL non lascia mai il browser.
   Si carica DOPO r07.js (usa $, $$, t, LANG, I18N, DPG_dopo) e prima dello script della pagina. Il primo aggiorna() lo fa
   applica() di r07.js, che il build chiama per ultimo, e lo rifa' a ogni cambio di lingua (DPG_dopo).
   Configurazione della pagina negli attributi del suo tag script (tutti facoltativi; di serie i valori del preventivo):
     data-esempio  "vol x y z" del pezzo d'esempio, cm3 e mm      di serie "214 182 124 58" (il carter)
     data-pezzo    nome dell'esempio nella mail, in italiano      di serie "carter"
     data-riga     riga della mail che dice da dove arriva        di serie "Pagina: preventivo generale"
     data-sls      ordine e presenza dei materiali SLS, con |     di serie l'ordine di M
     data-fdm      ordine e presenza dei materiali FDM, con |     di serie l'ordine di M
   I coefficienti e i flag ok (fascia calcolata o su richiesta) stanno solo qui, in M.
   Le chiavi lette con t() sono elencate in testa a parti/quota.html, dove il build e qa_sito.py le trovano. */
(function(){
if(!document.getElementById('quotazione'))return;
const CFG=(document.currentScript&&document.currentScript.dataset)||{};

/* ---- modello fascia (coefficienti calibrati, ago 2026): identico allo stampo, la calibrazione e' il pezzo F-12.
        Cambia solo l'ordine dei materiali: prima quelli del comparto (Lib 03 par. 8). ---- */
const M={sls:{a:0.50006,b:19.023,fissi:[48,65,83,100,118,135,153,170],quota:0.125,
  camera:{x:700,y:380,z:580},min:90,
  mat:{'PA2200':{ok:true},'TPU 90A':{ok:false},'PA11':{ok:false}}},
 fdm:{fisso:96,camera:{x:914,y:610,z:914},min:120,
  mat:{'Nylon 12CF':{ok:true,cm3:0.601},'Ultem 1010 CG':{ok:true,cm3:0.686},'Ultem 9085':{ok:true,cm3:0.621}}},
 fasce:[[1,1.0],[50,0.88],[100,0.80]],banda:[0.88,1.12]};
const ceil10=x=>Math.ceil((x-1e-9)/10)*10;
const kQ=q=>{let k=1;for(const[s,v]of M.fasce)if(q>=s)k=v;return k;};
function centrale(vol,x,y,z,tec,mat){
  if(tec==='SLS'){
    const d=[x,y,z].sort((p,q)=>q-p);
    const vb=Math.max(60,d[0])*Math.max(60,d[1])*Math.max(30,d[2]);
    const occ=vb/(M.sls.camera.x*M.sls.camera.y*M.sls.camera.z);
    const i=Math.min(M.sls.fissi.length-1,Math.max(0,Math.ceil(occ/M.sls.quota-1e-9)-1));
    return Math.max(M.sls.min,M.sls.fissi[i]+M.sls.a*vol+M.sls.b*vb/1e6);
  }
  return Math.max(M.fdm.min,M.fdm.fisso+M.fdm.mat[mat].cm3*vol);
}
function fascia(vol,x,y,z,tec,mat,q){
  const c=centrale(vol,x,y,z,tec,mat)*kQ(q);
  return{lo:ceil10(c*M.banda[0]),hi:ceil10(c*M.banda[1])};
}
const eurF=x=>x.toLocaleString({it:'it-IT',de:'de-DE',en:'en-IE'}[LANG],{maximumFractionDigits:0});

/* ordine e presenza dei materiali scelti dalla pagina (data-sls, data-fdm); i flag ok restano quelli di M */
function ordina(tab,lista){
  if(!lista)return tab;
  const o={};lista.split('|').forEach(k=>{k=k.trim();if(tab[k])o[k]=tab[k];});
  return Object.keys(o).length?o:tab;
}
M.sls.mat=ordina(M.sls.mat,CFG.sls);M.fdm.mat=ordina(M.fdm.mat,CFG.fdm);

/* ---- parser STL: identico allo stampo ---- */
function parseSTL(buf){
  if(buf.byteLength>100*1024*1024)throw 0;
  const dv=new DataView(buf);let tris;
  const head=new TextDecoder().decode(buf.slice(0,Math.min(400,buf.byteLength)));
  const n=buf.byteLength>=84?dv.getUint32(80,true):0;
  if(buf.byteLength>=84&&84+n*50===buf.byteLength){
    if(n>3e6)throw 0;tris=new Float32Array(n*9);
    for(let i=0;i<n;i++){let o=84+i*50+12;for(let k=0;k<9;k++)tris[i*9+k]=dv.getFloat32(o+k*4,true);}
  }else if(/facet/i.test(head)){
    const m=new TextDecoder().decode(buf).match(/vertex\s+([-\d.eE+]+)\s+([-\d.eE+]+)\s+([-\d.eE+]+)/g)||[];
    if(m.length/3>3e6)throw 0;tris=new Float32Array(m.length*3);
    m.forEach((v,i)=>{const p=v.split(/\s+/);tris[i*3]=+p[1];tris[i*3+1]=+p[2];tris[i*3+2]=+p[3];});
  }else throw 0;
  let vol=0,mn=[1e30,1e30,1e30],mx=[-1e30,-1e30,-1e30];
  for(let i=0;i<tris.length/9;i++){
    const a=tris.subarray(i*9,i*9+3),b=tris.subarray(i*9+3,i*9+6),c=tris.subarray(i*9+6,i*9+9);
    vol+=(a[0]*(b[1]*c[2]-b[2]*c[1])-a[1]*(b[0]*c[2]-b[2]*c[0])+a[2]*(b[0]*c[1]-b[1]*c[0]))/6;
    for(const p of[a,b,c])for(let k=0;k<3;k++){if(p[k]<mn[k])mn[k]=p[k];if(p[k]>mx[k])mx[k]=p[k];}
  }
  vol=Math.abs(vol)/1000;if(vol<0.001)throw 0;
  return{vol:+vol.toFixed(1),x:Math.round(mx[0]-mn[0]),y:Math.round(mx[1]-mn[1]),z:Math.round(mx[2]-mn[2])};
}

/* ---- preventivatore ---- */
/* esempio della pagina: di serie il carter 182 x 124 x 58 mm, 214 cm3 (lo stesso della pagina OEM) */
const ES=(CFG.esempio||'').trim().split(/\s+/).map(Number);
const ESEMPIO=ES.length===4&&ES.every(v=>v>0)?{vol:ES[0],x:ES[1],y:ES[2],z:ES[3]}:{vol:214,x:182,y:124,z:58};
const PEZZO=CFG.pezzo||'carter',RIGA=CFG.riga||'Pagina: preventivo generale';
let TEC='SLS',NOMEFILE='',ESITO=null;
const num=(s,d=0)=>{const v=parseFloat($(s).value);return isFinite(v)?v:d;};
function materiali(){
  const tab=TEC==='SLS'?M.sls.mat:M.fdm.mat;
  $('#q_mat').innerHTML=Object.keys(tab).map(m=>`<option>${m}</option>`).join('');
}
/* la mail resta in italiano, oggetto compreso: la legge l'ufficio DPG */
function mailto(vol,x,y,z,q,mat,f){
  const corpo=[NOMEFILE?`File: ${NOMEFILE}`:null,
    ESITO&&ESITO.tipo==='es'?`Pezzo: esempio della pagina (${PEZZO})`:null,
    RIGA,
    `Volume: ${vol} cm3 · Ingombro: ${x}x${y}x${z} mm`,
    `Tecnologia: ${TEC} · Materiale: ${mat} · Quantità: ${q}`,
    f?`Fascia indicata: ${f.lo}..${f.hi} EUR/pezzo`:`Fascia: su richiesta`,
    '','Generato da DPG-WEB Rev. 07 (demo)'].filter(Boolean).join('\n');
  const ogg=(I18N.it&&I18N.it.mail_sub)||t('mail_sub');
  return `mailto:info@duepigreco3d.it?subject=${encodeURIComponent(ogg)}&body=${encodeURIComponent(corpo)}`;
}
function esito(){
  const e=$('#q_ok');
  e.dataset.tipo=ESITO?ESITO.tipo:'';
  if(!ESITO){e.textContent='';return;}
  e.textContent=ESITO.tipo==='file'?`${ESITO.nome} · ${ESITO.vol} cm³ · ${t('file_ok')}`:ESITO.tipo==='es'?t('es_ok'):t('err_stl');
}
/* tre stati: dati incompleti (bottone spento, lo stile viene da aria-disabled), materiale su richiesta, fascia */
function aggiorna(){
  esito();
  const vol=num('#q_vol'),x=num('#q_x'),y=num('#q_y'),z=num('#q_z'),q=Math.max(1,num('#q_q',1));
  const mat=$('#q_mat').value;const cta=$('#q_cta');
  $('#q_v').classList.add('vuota');   /* la cifra vuota diventa una linea da riempire (20_quota.css) */
  if(!(vol>0&&x>0&&y>0&&z>0)){
    $('#q_v').textContent='·';$('#q_u').textContent=t('compila');
    $('#q_tab').innerHTML='';cta.setAttribute('aria-disabled','true');
    cta.textContent=t('cta');cta.href='#quotazione';return;
  }
  const attivo=(TEC==='SLS'?M.sls.mat:M.fdm.mat)[mat]?.ok;
  cta.removeAttribute('aria-disabled');
  if(!attivo){
    $('#q_v').textContent='·';$('#q_u').textContent=t('surich');
    $('#q_tab').innerHTML='';cta.textContent=t('cta_req');cta.href=mailto(vol,x,y,z,q,mat,null);return;
  }
  const f=fascia(vol,x,y,z,TEC,mat,q);
  $('#q_v').classList.remove('vuota');
  $('#q_v').textContent=`${eurF(f.lo)}–${eurF(f.hi)} €`;
  $('#q_u').textContent=`× ${q}`;
  $('#q_tab').innerHTML=`<tr><th scope="col">${t('f_q')}</th><th scope="col" class="num">${t('f_f')}</th></tr>`+
    M.fasce.map(([s])=>{const ff=fascia(vol,x,y,z,TEC,mat,s);
      return `<tr><td>${s===1?'1':t('da')+' '+s}</td><td class="num">${eurF(ff.lo)}–${eurF(ff.hi)} €</td></tr>`;}).join('');
  cta.textContent=t('cta');cta.href=mailto(vol,x,y,z,q,mat,f);
}
$$('#quotazione .tec').forEach(b=>b.onclick=()=>{
  TEC=b.dataset.t;$$('#quotazione .tec').forEach(x=>{x.classList.toggle('attiva',x===b);x.setAttribute('aria-pressed',x===b);});
  materiali();aggiorna();});
document.body.addEventListener('input',e=>{if(e.target.closest('#quotazione'))aggiorna();});
const dz=$('#q_drop');
['dragover','dragenter'].forEach(ev=>dz.addEventListener(ev,e=>{e.preventDefault();dz.classList.add('sopra');}));
['dragleave','drop'].forEach(ev=>dz.addEventListener(ev,e=>{e.preventDefault();dz.classList.remove('sopra');}));
/* un file lasciato fuori dalla zona non si apre nella finestra (si perderebbero i dati inseriti) */
const conFile=e=>!!(e.dataTransfer&&[...e.dataTransfer.types].includes('Files'));
document.addEventListener('dragover',e=>{if(conFile(e)&&!dz.contains(e.target)){e.preventDefault();e.dataTransfer.dropEffect='none';}});
document.addEventListener('drop',e=>{if(conFile(e)&&!dz.contains(e.target))e.preventDefault();});
async function leggi(file){
  try{const r=parseSTL(await file.arrayBuffer());NOMEFILE=file.name;
    $('#q_vol').value=r.vol;$('#q_x').value=r.x;$('#q_y').value=r.y;$('#q_z').value=r.z;
    ESITO={tipo:'file',nome:file.name,vol:r.vol};aggiorna();
  }catch(_){NOMEFILE='';ESITO={tipo:'err'};esito();}}
function scegli(){const i=document.createElement('input');i.type='file';i.accept='.stl';
  i.onchange=()=>i.files[0]&&leggi(i.files[0]);i.click();}
dz.addEventListener('drop',e=>{if(e.dataTransfer.files[0])leggi(e.dataTransfer.files[0]);});
dz.addEventListener('click',scegli);
dz.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();scegli();}});
$('#q_es').onclick=()=>{NOMEFILE='';
  $('#q_vol').value=ESEMPIO.vol;$('#q_x').value=ESEMPIO.x;$('#q_y').value=ESEMPIO.y;$('#q_z').value=ESEMPIO.z;
  ESITO={tipo:'es'};aggiorna();};

/* ---- avvio: i materiali subito; testi e primo calcolo con applica() (r07.js), poi a ogni cambio di lingua ---- */
materiali();
DPG_dopo.push(aggiorna);
})();
