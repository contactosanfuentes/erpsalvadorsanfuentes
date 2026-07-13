
// ── Progresión pionera: etapas de la Avanzada con insignias del ERP ──
const ETAPAS_PIONERO=[
  {n:'Cruz del Sur', img:'https://i.imgur.com/IStoscc.png', d:'Me integro a la Avanzada y trazo mi primer Sonar'},
  {n:'Sendero',      img:'https://i.imgur.com/VHZrlFN.png', d:'Asumo responsabilidades en los proyectos de Mi Propia Aventura'},
  {n:'Cumbre',       img:'https://i.imgur.com/3MeclHS.png', d:'Lidero proyectos sociales y acompaño a mi equipo a la cima'}
];
function renderProgresionPionera(){
  const c=document.getElementById('pio-etapas'); if(!c)return;
  const actual=(currentJoven?.etapa_actual||currentJoven?.adelanto||'').toLowerCase();
  const idx=ETAPAS_PIONERO.findIndex(e=>actual.includes(e.n.toLowerCase().split(' ')[0]));
  c.innerHTML=ETAPAS_PIONERO.map((e,i)=>{
    const estado=idx<0?'':(i<idx?'lograda':i===idx?'actual':'');
    return `<div style="display:flex;flex-direction:column;align-items:center;flex:1;opacity:${estado===''&&idx>=0?'0.45':'1'};" title="${e.d}">
      <img src="${e.img}" style="width:44px;height:44px;object-fit:contain;${estado==='actual'?'filter:drop-shadow(0 0 6px #7C3AED);':''}" onerror="this.style.display='none'">
      <span style="font-size:10px;font-weight:800;color:${estado==='actual'?'#3949AB':estado==='lograda'?'#16a34a':'#6b7280'};margin-top:4px;text-align:center;">${e.n}</span>
      ${estado==='actual'?'<span style="font-size:8px;font-weight:800;color:#3949AB;text-transform:uppercase;">● Etapa actual</span>':estado==='lograda'?'<span style="font-size:8px;color:#16a34a;font-weight:800;">✓ Lograda</span>':''}
    </div>`;
  }).join('<i class="fas fa-chevron-right" style="color:#A5B4FC;font-size:10px;"></i>');
}
// ══════════ MANIFIESTO ══════════
async function guardarManifiesto(){
    camino.aventura_notas=document.getElementById('portal-manifiesto').value;
    camino.pv_potenciar=document.getElementById('pv-potenciar').value;
    camino.pv_reformular=document.getElementById('pv-reformular').value;
    camino.pv_avances=Array.from(document.querySelectorAll('.pv-avance-input')).map(i=>i.value).filter(v=>v.trim());

    if(await guardarCamino())toast('Proyecto guardado.');
}
function pvAgregarAvance(){
    const lista=document.getElementById('pv-avances-lista');
    const idx=lista.children.length+1;
    lista.insertAdjacentHTML('beforeend',`<div class="flex items-center gap-2"><span class="text-xs text-gray-400 w-4">${idx}.</span><input type="text" class="pv-avance-input flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-xs outline-none" placeholder="Describe un avance concreto..."><button onclick="this.parentElement.remove()" class="text-red-400 hover:text-red-600 text-xs"><i class="fas fa-times"></i></button></div>`);
}
function pvCargarCampoExtra(){
    const el=id=>document.getElementById(id);
    if(el('pv-potenciar'))el('pv-potenciar').value=camino.pv_potenciar||'';
    if(el('pv-reformular'))el('pv-reformular').value=camino.pv_reformular||'';
    const lista=document.getElementById('pv-avances-lista');
    if(lista){lista.innerHTML='';(camino.pv_avances||[]).forEach((a,i)=>{lista.insertAdjacentHTML('beforeend',`<div class="flex items-center gap-2"><span class="text-xs text-gray-400 w-4">${i+1}.</span><input type="text" class="pv-avance-input flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-xs outline-none" value="${esc(a)}"><button onclick="this.parentElement.remove()" class="text-red-400 hover:text-red-600 text-xs"><i class="fas fa-times"></i></button></div>`);})}
    pvMostrarRequisitos();

}
function pvMostrarRequisitos(){
    const etapa=currentJoven?.adelanto||'';
    const nProy=(camino.proyectos_colectivos||[]).filter(p=>p.estado!=='Finalizado').length;
    const sonarTrazado=!!(typeof sonarData==='object'&&sonarData&&Object.values(sonarData).some(v=>v>1));
    const esResponsable=(camino.proyectos_colectivos||[]).some(p=>p.responsables&&Object.values(p.responsables).some(r=>r&&r.run===currentJoven.run));
    const lidera=(camino.proyectos_colectivos||[]).some(p=>p.creadorRun===currentJoven.run);
    const reqs={'Cruz del Sur':[{ok:sonarTrazado,txt:'Trazar tu primer Sonar personal'},{ok:!!(camino.aventura_notas||'').trim(),txt:'Escribir tus primeras notas de Mi Propia Aventura'}],
    'Sendero':[{ok:sonarTrazado,txt:'Mantener tu Sonar actualizado'},{ok:esResponsable||lidera,txt:'Asumir una coordinación o responsabilidad en un proyecto'},{ok:nProy>=1,txt:'Participar en al menos 1 proyecto de la Avanzada'}],
    'Cumbre':[{ok:lidera,txt:'Formular y liderar tu propio proyecto (Mi Propia Aventura)'},{ok:nProy>=2,txt:`Participar en 2+ proyectos (llevas ${nProy})`},{ok:sonarTrazado,txt:'Evaluar tu equilibrio con el Sonar al cierre de cada proyecto'}]};
    const lista=reqs[etapa];
    const cont=document.getElementById('pv-requisitos');
    const rl=document.getElementById('pv-req-lista');
    if(!lista||!cont||!rl)return;
    cont.style.display='block';
    rl.innerHTML=lista.map(r=>`<div class="flex items-center gap-2 text-xs ${r.ok?'text-gray-600':'text-gray-400'}"><i class="fas ${r.ok?'fa-check-circle text-green-500':'fa-circle text-gray-300'}"></i>${r.txt}</div>`).join('');
}
function renderAdjuntos(){const c=document.getElementById('portal-adjuntos');c.innerHTML='';(camino.adjuntos_aventura||[]).forEach(a=>{if(a.tipo==='imagen')c.innerHTML+=`<a href="${esc(a.url)}" target="_blank"><img src="${esc(a.url)}" style="width:50px;height:50px;object-fit:cover;border-radius:8px;border:2px solid #fca5a5;"></a>`;else c.innerHTML+=`<a href="${esc(a.url)}" target="_blank" class="bg-purple-50 text-purple-700 px-3 py-1.5 rounded-lg text-xs font-bold border border-purple-200"><i class="fas fa-play mr-1"></i>${esc(a.nombre||'Audio')}</a>`})}
async function subirAdjunto(tipo,input){const files=input.files;if(!files.length)return;toast('Subiendo...','info');try{for(const f of files){if(f.size>10*1024*1024){toast(f.name+' >10MB','err');continue}const ext=f.name.split('.').pop().toLowerCase();const path=`aventura/${currentJoven.id}_${Date.now()}.${ext}`;const{error}=await sb.storage.from('fotos').upload(path,f,{upsert:true});if(error)throw error;const{data}=sb.storage.from('fotos').getPublicUrl(path);camino.adjuntos_aventura.push({tipo,url:data.publicUrl,nombre:f.name})}await guardarCamino();renderAdjuntos();toast('Adjunto guardado.')}catch(e){toast('Error: '+e.message,'err')}input.value=''}

