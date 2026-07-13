// ══════════ MANIFIESTO ══════════
async function guardarManifiesto(){
    camino.proyectoPersonal=document.getElementById('portal-manifiesto').value;
    camino.pv_q1=document.getElementById('pv-q1').value;
    camino.pv_q2=document.getElementById('pv-q2').value;
    camino.pv_q3=document.getElementById('pv-q3').value;
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
    if(el('pv-q1'))el('pv-q1').value=camino.pv_q1||'';
    if(el('pv-q2'))el('pv-q2').value=camino.pv_q2||'';
    if(el('pv-q3'))el('pv-q3').value=camino.pv_q3||'';
    if(el('pv-potenciar'))el('pv-potenciar').value=camino.pv_potenciar||'';
    if(el('pv-reformular'))el('pv-reformular').value=camino.pv_reformular||'';
    const lista=document.getElementById('pv-avances-lista');
    if(lista){lista.innerHTML='';(camino.pv_avances||[]).forEach((a,i)=>{lista.insertAdjacentHTML('beforeend',`<div class="flex items-center gap-2"><span class="text-xs text-gray-400 w-4">${i+1}.</span><input type="text" class="pv-avance-input flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-xs outline-none" value="${esc(a)}"><button onclick="this.parentElement.remove()" class="text-red-400 hover:text-red-600 text-xs"><i class="fas fa-times"></i></button></div>`);})}
    pvMostrarRequisitos();

}
function pvMostrarRequisitos(){
    const etapa=currentJoven?.adelanto||'';
    const nProy=(camino.proyectos_colectivos||[]).filter(p=>p.estado!=='Finalizado').length;
    const reqs={'Bienvenida':[{ok:!!(camino.proyectoPersonal||'').trim(),txt:'Tener tu Proyecto Personal escrito'},{ok:nProy>=1,txt:'Al menos 1 proyecto en un campo prioritario'}],'Fuego':[{ok:!!(camino.proyectoPersonal||'').trim(),txt:'Mantener actualizado tu Proyecto Personal'},{ok:nProy>=1,txt:'Se perciben avances relevantes'},{ok:nProy>=2,txt:`Proyectos en al menos 2 campos prioritarios (tienes ${nProy})`}]};
    const lista=reqs[etapa];
    const cont=document.getElementById('pv-requisitos');
    const rl=document.getElementById('pv-req-lista');
    if(!lista||!cont||!rl)return;
    cont.style.display='block';
    rl.innerHTML=lista.map(r=>`<div class="flex items-center gap-2 text-xs ${r.ok?'text-gray-600':'text-gray-400'}"><i class="fas ${r.ok?'fa-check-circle text-green-500':'fa-circle text-gray-300'}"></i>${r.txt}</div>`).join('');
}
function renderAdjuntos(){const c=document.getElementById('portal-adjuntos');c.innerHTML='';(camino.adjuntos_manifiesto||[]).forEach(a=>{if(a.tipo==='imagen')c.innerHTML+=`<a href="${esc(a.url)}" target="_blank"><img src="${esc(a.url)}" style="width:50px;height:50px;object-fit:cover;border-radius:8px;border:2px solid #fca5a5;"></a>`;else c.innerHTML+=`<a href="${esc(a.url)}" target="_blank" class="bg-purple-50 text-purple-700 px-3 py-1.5 rounded-lg text-xs font-bold border border-purple-200"><i class="fas fa-play mr-1"></i>${esc(a.nombre||'Audio')}</a>`})}
async function subirAdjunto(tipo,input){const files=input.files;if(!files.length)return;toast('Subiendo...','info');try{for(const f of files){if(f.size>10*1024*1024){toast(f.name+' >10MB','err');continue}const ext=f.name.split('.').pop().toLowerCase();const path=`manifiesto/${currentJoven.id}_${Date.now()}.${ext}`;const{error}=await sb.storage.from('fotos').upload(path,f,{upsert:true});if(error)throw error;const{data}=sb.storage.from('fotos').getPublicUrl(path);camino.adjuntos_manifiesto.push({tipo,url:data.publicUrl,nombre:f.name})}await guardarCamino();renderAdjuntos();toast('Adjunto guardado.')}catch(e){toast('Error: '+e.message,'err')}input.value=''}

