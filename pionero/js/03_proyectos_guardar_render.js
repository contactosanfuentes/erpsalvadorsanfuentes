// ══════════ GUARDAR PROYECTO ══════════
async function mpGuardarProyecto(){
    const btn=document.getElementById('mp-btn-guardar');
    if(btn){if(btn.disabled)return;btn.disabled=true;btn.innerHTML='<i class="fas fa-spinner fa-spin"></i> Guardando...';}
const nombre=document.getElementById('mp-nombre').value.trim(),objetivo=document.getElementById('mp-objetivo').value.trim();
const campoSel=document.getElementById('mp-campo').value;const campo=campoSel==='Otros'?(document.getElementById('mp-campo-otro').value.trim()||'Otros'):campoSel;
const inicio=document.getElementById('mp-inicio').value;
if(!nombre||!objetivo||!campo||!inicio){toast('Completa nombre, objetivo, campo e inicio.','err');return}
const editId=document.getElementById('mp-edit-id').value;
const fichaExt=document.getElementById('mp-toggle-ficha')?.checked||false;
const proy={id:editId?Number(editId):Date.now(),nombre,objetivo,campoAccion:campo,inicio,fase:(document.getElementById('mp-fase')?.value)||'Idear',termino:document.getElementById('mp-termino').value,
creadorRun:currentJoven.run,participantes:[...mpParticipantes],responsables:{...mpResponsables},fichaExtendida:fichaExt,evidencias:[...mpEvidencias],solicitudes_pendientes:[]};

// Ficha extendida
if(document.getElementById('mp-toggle-ficha').checked){
proy.justificacion=document.getElementById('mp-justificacion').value.trim();
proy.beneficiarios=document.getElementById('mp-beneficiarios').value.trim();
proy.lugar=document.getElementById('mp-lugar').value.trim();
proy.camposAccionPrioritarios=[...document.querySelectorAll('#mp-campos-list input')].map(i=>i.value.trim()).filter(Boolean);
proy.objetivosEspecificos=[...document.querySelectorAll('#mp-objetivos-list input')].map(i=>i.value.trim()).filter(Boolean);
proy.planAccion=[...document.querySelectorAll('#mp-acciones-list > div')].map(r=>{const ins=r.querySelectorAll('input');return{accion:ins[0]?.value?.trim()||'',recurso:ins[1]?.value?.trim()||'',responsable:ins[2]?.value?.trim()||'',cronograma:ins[3]?.value?.trim()||''}}).filter(a=>a.accion);
proy.presupuestoEstimado=[...document.querySelectorAll('#mp-ppto-list > div')].map(r=>{const ins=r.querySelectorAll('input');return{concepto:ins[0]?.value?.trim()||'',cantidad:parseFloat(ins[1]?.value)||0,costoUnitario:parseFloat(ins[2]?.value)||0}}).filter(p=>p.concepto);
proy.indicadores=[...document.querySelectorAll('#mp-indicadores-list > div')].map(r=>{const ins=r.querySelectorAll('input');return{descripcion:ins[0]?.value?.trim()||'',meta:ins[1]?.value?.trim()||''}}).filter(i=>i.descripcion);
proy.arbolProblema={consecuencias:[...document.querySelectorAll('#mp-arbol-cons input')].map(i=>i.value.trim()).filter(Boolean),problemaCentral:document.getElementById('mp-arbol-central').value.trim(),causas:[...document.querySelectorAll('#mp-arbol-causas input')].map(i=>i.value.trim()).filter(Boolean)}}

if(editId){const idx=camino.proyectos_colectivos.findIndex(p=>p.id===Number(editId));if(idx!==-1){proy.solicitudes_pendientes=camino.proyectos_colectivos[idx].solicitudes_pendientes||[];camino.proyectos_colectivos[idx]=proy}}
else camino.proyectos_colectivos.push(proy);

toast('Guardando...','info');
if(await guardarCamino()){
// Crear evento si se marcó
if(document.getElementById('mp-crear-evento').checked){try{
const desc=[proy.objetivo?'Objetivo: '+proy.objetivo:'',proy.justificacion?'Justificación: '+proy.justificacion:'',proy.beneficiarios?'Beneficiarios: '+proy.beneficiarios:''].filter(Boolean).join('\n');
const{data:ev,error:evE}=await sb.from('eventos').insert({nombre:proy.nombre,fecha_inicio:proy.inicio||null,fecha_fin:proy.termino||null,lugar:proy.lugar||'',descripcion:desc,publicado:false}).select().single();
if(evE)throw evE;await sb.from('tesoreria_cuentas').insert({nombre:proy.nombre,tipo:'evento',orden:0});
if(proy.objetivo)await sb.from('objetivos_evento').insert({evento_id:ev.id,objetivo_general:proy.objetivo});
const dias=(proy.inicio&&proy.termino)?Math.max(1,Math.ceil((new Date(proy.termino)-new Date(proy.inicio))/86400000)):1;
await sb.from('configuracion_presupuesto').insert({evento_id:ev.id,participantes:mpParticipantes.length,staff:Object.keys(mpResponsables).length,dias,nota:'Desde portal caminante'});
for(const pt of mpParticipantes){try{const{data:m}=await sb.from('mmbb_registrations').select('nombres,apellidos,email_apoderado,apoderado_titular_telefono,foto_url,unidad').ilike('run',pt.run).maybeSingle();await sb.from('jovenes').insert({evento_id:ev.id,nombre_patrulla:m?(m.nombres+' '+m.apellidos):pt.nombre,grupo_scout:'Salvador Sanfuentes',numero_integrantes:1,email:m?.email_apoderado||'',telefono:m?.apoderado_titular_telefono||'',foto_url:m?.foto_url||pt.foto||'',moneda:'CLP',confirmado:false,observaciones:'Unidad: '+(m?.unidad||'N/A')})}catch(e){}}
for(const[cargo,resp]of Object.entries(mpResponsables)){if(!resp?.run)continue;try{let d=null;const{data:a}=await sb.from('adultos_registros').select('nombres,apellidos,email,telefono,foto_url').ilike('run',resp.run).maybeSingle();if(a)d=a;else{const{data:j}=await sb.from('mmbb_registrations').select('nombres,apellidos,email_apoderado,apoderado_titular_telefono,foto_url').ilike('run',resp.run).maybeSingle();if(j)d={nombres:j.nombres,apellidos:j.apellidos,email:j.email_apoderado,telefono:j.apoderado_titular_telefono,foto_url:j.foto_url}}await sb.from('adultos').insert({evento_id:ev.id,nombre:d?(d.nombres+' '+d.apellidos):resp.nombre,grupo:'Salvador Sanfuentes',rol:cargo,email:d?.email||'',telefono:d?.telefono||'',foto_url:d?.foto_url||resp.foto||'',confirmado:false,observaciones:cargo+' — Importado'})}catch(e){}}
for(const item of(proy.presupuestoEstimado||[])){if(item.concepto){const{data:s}=await sb.from('secciones_presupuesto').select('id').order('orden').limit(1);await sb.from('items_presupuesto').insert({evento_id:ev.id,seccion_id:s?.[0]?.id||1,concepto:item.concepto,cantidad:item.cantidad,costo_unitario:item.costoUnitario,costo_final:item.cantidad*item.costoUnitario,observaciones:'Desde proyecto'})}}
for(const ind of(proy.indicadores||[])){if(ind.descripcion)await sb.from('metas_evento').insert({evento_id:ev.id,descripcion:ind.descripcion,valor_esperado:parseFloat(ind.meta)||0,unidad:'unidad'})}
toast('Evento creado con todos los datos del proyecto.','ok')}catch(evErr){toast('Proyecto guardado, error al crear evento: '+evErr.message,'err')}}
cerrarModalProy();cargarYRenderizarProyectos();toast(editId?'Proyecto actualizado.':'Proyecto creado y sincronizado.')
    if(btn){btn.disabled=false;btn.innerHTML='<i class="fas fa-save"></i> Guardar Proyecto';};
// Enviar emails a participantes y responsables
try{const cn=currentJoven.nombres+' '+currentJoven.apellidos;
for(const pt of(proy.participantes||[])){if(pt.run!==currentJoven.run)await enviarEmailProyecto(pt.run,pt.nombre,proy,'Participante',cn)}
for(const[cargo,resp]of Object.entries(proy.responsables||{})){if(resp&&resp.run&&resp.run!==currentJoven.run)await enviarEmailProyecto(resp.run,resp.nombre,proy,cargo,cn)}
}catch(eml){console.warn('Error emails:',eml)}}}

// ══════════ ELIMINAR ══════════
async function eliminarProyecto(idx){const p=camino.proyectos_colectivos[idx];if(!p||p.creadorRun!==currentJoven.run){toast('Solo puedes eliminar tus proyectos.','err');return}
if(!confirm('¿Eliminar "'+p.nombre+'"?'))return;toast('Eliminando...','info');
try{for(const pt of(p.participantes||[])){try{const{data:pj}=await sb.from('mmbb_registrations').select('id').ilike('run',pt.run).maybeSingle();if(pj){const{data:pp}=await sb.from('progresion_jovenes').select('camino').eq('joven_id',pj.id).maybeSingle();if(pp?.camino?.proyectos_colectivos){pp.camino.proyectos_colectivos=pp.camino.proyectos_colectivos.filter(pr=>pr.id!==p.id);await sb.from('progresion_jovenes').upsert({joven_id:pj.id,camino:pp.camino},{onConflict:'joven_id'})}}}catch(e){}}
camino.proyectos_colectivos.splice(idx,1);await guardarCamino();cargarYRenderizarProyectos();toast('Proyecto eliminado.')}catch(e){toast('Error: '+e.message,'err')}}

// ══════════ RENDER PROYECTOS ══════════

async function abandonarProyecto(proyId){
  if(!confirm('¿Seguro que quieres abandonar este proyecto? Ya no aparecerás como responsable ni participante.')) return;
  try {
    // Buscar el proyecto en toda la BD para localizarlo
    const {data:todos} = await sb.from('progresion_jovenes').select('joven_id,camino');
    const myRun = currentJoven.run.toLowerCase();
    let found = false;
    for(const pg of (todos||[])){
      const proys = pg.camino?.proyectos_colectivos||[];
      const idx = proys.findIndex(p=>p.id===proyId);
      if(idx===-1) continue;
      const proy = proys[idx];
      // Quitar de responsables
      if(proy.responsables){
        for(const area in proy.responsables){
          if(proy.responsables[area]?.run?.toLowerCase()===myRun) delete proy.responsables[area];
        }
      }
      // Quitar de participantes
      if(proy.participantes) proy.participantes = proy.participantes.filter(pt=>pt?.run?.toLowerCase()!==myRun);
      pg.camino.proyectos_colectivos[idx] = proy;
      await sb.from('progresion_jovenes').upsert({joven_id:pg.joven_id,camino:pg.camino},{onConflict:'joven_id'});
      found = true;
      break;
    }
    if(found){ toast('Abandonaste el proyecto.'); await cargarYRenderizarProyectos(); }
    else toast('No se encontró el proyecto.','err');
  } catch(e){ toast('Error: '+e.message,'err'); }
}
async function cargarYRenderizarProyectos(){
// Buscar en toda la BD proyectos donde este joven sea responsable o participante (no creador)
const myRun=currentJoven.run.toLowerCase();
const extra=[];
try{
  const{data:todos}=await sb.from('progresion_jovenes').select('joven_id,camino');
  if(todos){
    for(const pg of todos){
      for(const proy of(pg.camino?.proyectos_colectivos||[])){
        if(!proy.id)continue;
        // Saltear los que ya son propios
        const yaPropio=(camino.proyectos_colectivos||[]).some(p=>p.id===proy.id);
        if(yaPropio)continue;
        // Ver si estoy como responsable
        const esResp=proy.responsables&&Object.values(proy.responsables).some(r=>r&&r.run&&r.run.toLowerCase()===myRun);
        // Ver si estoy como participante
        const esPart=(proy.participantes||[]).some(pt=>pt&&pt.run&&pt.run.toLowerCase()===myRun);
        if(esResp||esPart) extra.push(proy);
      }
    }
  }
}catch(e){console.warn('Error buscando proyectos externos:',e);}
renderProyectos(extra);
}

// ── Estrategia educativa: ciclo de fases de la Empresa ──
function faseStepperHtml(p, esCreador){
  const fases=['Idear','Elegir','Planificar','Realizar','Evaluar','Celebrar'];
  const actual=Math.max(0, fases.indexOf(p.fase||'Idear'));
  const pasos=fases.map((f,i)=>{
    const done=i<actual, act=i===actual;
    return `<div style="display:flex;flex-direction:column;align-items:center;flex:1;min-width:0;">
      <div style="width:22px;height:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:800;
        background:${act?'#3949AB':done?'#16a34a':'#e5e7eb'};color:${act||done?'#fff':'#9ca3af'};border:2px solid ${act?'#283593':done?'#15803d':'#d1d5db'};">${done?'✓':i+1}</div>
      <span style="font-size:8.5px;font-weight:${act?'800':'600'};color:${act?'#3949AB':done?'#16a34a':'#9ca3af'};margin-top:2px;text-align:center;">${f}</span>
    </div>`;
  }).join('<div style="flex:0 0 8px;height:2px;background:#e5e7eb;margin-top:11px;"></div>');
  const btn = esCreador && actual < fases.length-1
    ? `<button onclick="avanzarFaseEmpresa(${p.id})" style="margin-top:6px;background:#EEF2FF;border:1.5px solid #A5B4FC;color:#3949AB;border-radius:8px;padding:4px 10px;font-size:10px;font-weight:800;cursor:pointer;">Avanzar a ${fases[actual+1]} →</button>`
    : (actual === fases.length-1 && esCreador ? '<span style="margin-top:6px;font-size:10px;font-weight:800;color:#16a34a;">🎉 Proyecto celebrado 🎉</span>' : '');
  return `<div style="background:#F5F7FF;border:1px solid #C7D2FE;border-radius:12px;padding:10px;margin:8px 0;">
    <p style="font-size:9px;font-weight:800;color:#283593;text-transform:uppercase;letter-spacing:.05em;margin:0 0 6px;">Ciclo del Proyecto</p>
    <div style="display:flex;align-items:flex-start;">${pasos}</div>${btn}</div>`;
}
async function avanzarFaseEmpresa(pid){
  const fases=['Idear','Elegir','Planificar','Realizar','Evaluar','Celebrar'];
  const p=(camino.proyectos_colectivos||[]).find(x=>x.id===pid);
  if(!p||p.creadorRun!==currentJoven.run){toast('Solo quien creó el proyecto puede avanzar la fase.','err');return}
  const i=Math.max(0,fases.indexOf(p.fase||'Idear'));
  if(i>=fases.length-1)return;
  p.fase=fases[i+1];
  if(await guardarCamino()){toast(`📍 Proyecto en fase: ${p.fase}`);renderProyectos()}
}

function renderProyectos(extra=[]){const c=document.getElementById('portal-proyectos');const propios=camino.proyectos_colectivos||[];
// Combinar propios + externos (sin duplicados por id)
const seen=new Set(propios.map(p=>p.id));
const externos=extra.filter(p=>!seen.has(p.id));
const proys=[...propios,...externos];
if(!proys.length){c.innerHTML='<p class="text-center text-gray-400 py-8"><i class="fas fa-inbox text-3xl block mb-3 opacity-30"></i>No tienes proyectos aún. Si te asignaron a uno, aparecerá aquí. También puedes crear uno con el botón de arriba.</p>';return}
c.innerHTML=proys.map((p,i)=>{const sc={'Finalizado':'#10b981','En curso':'#3b82f6','Planificación':'#f59e0b','Evaluación':'#8b5cf6'};const color=sc[p.estado]||'#f59e0b';const esMio=p.creadorRun===currentJoven.run;
return `<div class="proyecto-card-portal" style="border-left:3px solid ${esMio?'#10b981':'#94a3b8'}"><div class="proyecto-header-portal" onclick="const b=document.getElementById('pb-${i}'),ic=document.getElementById('pi-${i}');b.classList.toggle('open');ic.classList.toggle('rotate-180')"><h4 class="font-bold text-sm flex-1">${esc(p.nombre)}</h4>${esMio?`<span class="bg-green-50 text-green-700 px-2 py-0.5 rounded text-xs font-bold">MI PROYECTO</span><span class="${p.privado ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'} px-2 py-0.5 rounded text-xs font-bold ml-1"><i class="fas ${p.privado ? 'fa-lock' : 'fa-globe'}"></i></span>`:(()=>{const myRun=currentJoven.run;const esResp=p.responsables&&Object.values(p.responsables).some(r=>r&&r.run&&r.run.toLowerCase()===myRun.toLowerCase());return esResp?'<span class="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs font-bold">🎖 RESPONSABLE</span>':'<span class="bg-gray-100 text-gray-500 px-2 py-0.5 rounded text-xs font-bold">👥 PARTICIPANTE</span>';})()}<span style="background:${color}20;color:${color}" class="px-2 py-0.5 rounded text-xs font-bold">${esc(p.estado||'Planificación')}</span><i class="fas fa-chevron-down text-gray-400 text-xs transition-transform" id="pi-${i}"></i></div>
<div class="proyecto-body-portal" id="pb-${i}">${faseStepperHtml(p, esMio)}${esMio?`
<p class="text-xs text-gray-500 mb-2"><strong>Objetivo:</strong> ${esc(p.objetivo||'')}</p>
<p class="text-xs text-gray-500 mb-2"><strong>Campo:</strong> ${esc(p.campoAccion||'')} | <strong>Fechas:</strong> ${p.inicio||'?'} → ${p.termino||'?'}</p>
${(p.participantes||[]).length?`<p class="text-xs text-gray-500 mb-2"><strong>Participantes:</strong> ${(p.participantes||[]).map(pt=>esc(pt.nombre)).join(', ')}</p>`:''}
${Object.keys(p.responsables||{}).length?`<p class="text-xs text-gray-500 mb-2"><strong>Organigrama:</strong> ${Object.entries(p.responsables||{}).map(([c,r])=>c+': '+esc(r.nombre)).join(' | ')}</p>`:''}
${(p.solicitudes_pendientes||[]).length?`<div class="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-2">
<p class="text-xs font-bold text-amber-800 mb-2"><i class="fas fa-bell mr-1"></i> ${(p.solicitudes_pendientes||[]).length} solicitud(es) pendiente(s)</p>
${(p.solicitudes_pendientes||[]).map(s=>`<div class="flex items-center gap-2 bg-white border border-amber-100 rounded-lg p-2 mb-1">
  <img src="${esc(s.foto||'')}" style="width:28px;height:28px;border-radius:50%;object-fit:cover;background:#e2e8f0;">
  <div class="flex-1 min-w-0"><p class="text-xs font-bold text-gray-800 truncate">${esc(s.nombre)}</p><p class="text-[10px] text-gray-400">${esc(s.rama||'')} · ${s.fecha||''}</p></div>
  <button onclick="abrirModalAceptar(${p.id},'${s.run}','${esc(s.nombre)}')" style="background:#10b981;border:none;color:#fff;border-radius:6px;padding:4px 8px;font-size:10px;font-weight:700;cursor:pointer;white-space:nowrap;">✅ Aceptar</button>
  <button onclick="abrirModalRechazar(${p.id},'${s.run}','${esc(s.nombre)}')" style="background:#ef4444;border:none;color:#fff;border-radius:6px;padding:4px 8px;font-size:10px;font-weight:700;cursor:pointer;">❌</button>
</div>`).join('')}
</div>`:''}
<div class="flex gap-2 mt-3 flex-wrap">
<button onclick="abrirModalProyecto(${i})" class="bg-indigo-600 hover:bg-indigo-700 text-white border-none rounded-lg px-4 py-2 font-bold text-xs cursor-pointer shadow"><i class="fas fa-pen mr-1"></i> Editar</button>
<button onclick="eliminarProyecto(${i})" class="bg-red-50 hover:bg-red-500 hover:text-white text-red-600 border border-red-200 rounded-lg px-4 py-2 font-bold text-xs cursor-pointer transition"><i class="fas fa-trash mr-1"></i> Eliminar</button>
<button onclick="togglePrivacidadProyecto(${p.id})" class="${p.privado ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'} border rounded-lg px-4 py-2 font-bold text-xs cursor-pointer transition ml-auto">
<i class="fas ${p.privado ? 'fa-lock' : 'fa-globe'} mr-1"></i>${p.privado ? 'Privado' : 'Público'}
</button></div>
`:`
<p class="text-xs text-gray-500 mb-2"><strong>Objetivo:</strong> ${esc(p.objetivo||'')}</p>
<p class="text-xs text-gray-500 mb-2"><strong>Campo de Acción:</strong> ${esc(p.campoAccion||'')} &nbsp;|&nbsp; <strong>Fechas:</strong> ${p.inicio||'?'} → ${p.termino||'En ejecución'}</p>
${p.justificacion?`<p class="text-xs text-gray-500 mb-2"><strong>Justificación:</strong> ${esc(p.justificacion)}</p>`:''}
${p.beneficiarios?`<p class="text-xs text-gray-500 mb-2"><strong>Beneficiarios:</strong> ${esc(p.beneficiarios)}</p>`:''}
${p.lugar?`<p class="text-xs text-gray-500 mb-2"><strong>Lugar:</strong> ${esc(p.lugar)}</p>`:''}
${(p.objetivosEspecificos||[]).length?`<div class="mb-2"><p class="text-xs font-bold text-gray-600">Objetivos Específicos:</p><ul class="list-disc list-inside text-xs text-gray-500">${(p.objetivosEspecificos||[]).map(o=>`<li>${esc(o)}</li>`).join('')}</ul></div>`:''}
${Object.keys(p.responsables||{}).length?`<div class="mb-2"><p class="text-xs font-bold text-gray-600 mb-1">Organigrama:</p><div class="grid grid-cols-2 gap-1">${Object.entries(p.responsables||{}).filter(([,r])=>r&&r.nombre).map(([cargo,r])=>`<div class="bg-blue-50 border border-blue-100 rounded-lg px-2 py-1 flex items-center gap-1"><img src="${esc(r.foto||'')}" style="width:18px;height:18px;border-radius:50%;object-fit:cover;"><span class="text-xs text-blue-800"><strong>${esc(cargo)}:</strong> ${esc(r.nombre)}</span></div>`).join('')}</div></div>`:''}
${(p.participantes||[]).length?`<div class="mb-2"><p class="text-xs font-bold text-gray-600 mb-1">Participantes (${(p.participantes||[]).length}):</p><div class="flex flex-wrap gap-1">${(p.participantes||[]).map(pt=>`<span class="bg-gray-100 text-gray-700 text-xs px-2 py-0.5 rounded-full flex items-center gap-1"><img src="${esc(pt.foto||'')}" style="width:14px;height:14px;border-radius:50%;object-fit:cover;">${esc(pt.nombre)}</span>`).join('')}</div></div>`:''}
${(p.planAccion||[]).length?`<div class="mb-2"><p class="text-xs font-bold text-gray-600 mb-1">Plan de Acción:</p><table class="w-full text-xs border-collapse"><thead><tr class="bg-gray-100"><th class="text-left p-1 border border-gray-200">Acción</th><th class="text-left p-1 border border-gray-200">Responsable</th><th class="text-left p-1 border border-gray-200">Cronograma</th></tr></thead><tbody>${(p.planAccion||[]).map(a=>`<tr><td class="p-1 border border-gray-100">${esc(a.accion||'')}</td><td class="p-1 border border-gray-100">${esc(a.responsable||'')}</td><td class="p-1 border border-gray-100">${esc(a.cronograma||'')}</td></tr>`).join('')}</tbody></table></div>`:''}
${(p.presupuestoEstimado||[]).length?`<div class="mb-2"><p class="text-xs font-bold text-gray-600 mb-1">Presupuesto Estimado:</p><table class="w-full text-xs border-collapse"><thead><tr class="bg-gray-100"><th class="text-left p-1 border border-gray-200">Concepto</th><th class="text-center p-1 border border-gray-200">Cant.</th><th class="text-right p-1 border border-gray-200">Total</th></tr></thead><tbody>${(p.presupuestoEstimado||[]).map(i=>`<tr><td class="p-1 border border-gray-100">${esc(i.concepto||'')}</td><td class="text-center p-1 border border-gray-100">${i.cantidad||0}</td><td class="text-right p-1 border border-gray-100">$${((i.cantidad||0)*(i.costoUnitario||0)).toLocaleString('es-CL')}</td></tr>`).join('')}</tbody></table></div>`:''}
${(p.evidencias||[]).length?`<div class="mb-2"><p class="text-xs font-bold text-gray-600 mb-1"><i class="fas fa-paperclip mr-1"></i> Evidencias (${p.evidencias.length}):</p><div class="flex flex-wrap gap-2">${p.evidencias.map(ev=>ev.tipo==='imagen'?`<a href="${esc(ev.url)}" target="_blank"><img src="${esc(ev.url)}" style="width:48px;height:48px;object-fit:cover;border-radius:6px;border:2px solid #e5e7eb;"></a>`:`<a href="${esc(ev.url)}" target="_blank" class="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded border border-gray-200"><i class="fas fa-file mr-1"></i>${esc(ev.nombre||'Archivo')}</a>`).join('')}</div></div>`:''}
${(p.fichaExtendida&&p.arbolProblema&&p.arbolProblema.problemaCentral)?`<div class="mb-2 border border-amber-200 bg-amber-50 rounded-xl p-2">
<p class="text-[0.62rem] font-extrabold text-amber-700 uppercase mb-1"><i class="fas fa-tree mr-1"></i> Arbol del Problema</p>
${(p.arbolProblema.consecuencias||[]).length?`<p class="text-[0.6rem] font-bold text-amber-600 uppercase mb-1">Consecuencias</p><div class="flex flex-wrap gap-1 mb-1">${(p.arbolProblema.consecuencias||[]).map(cons=>`<span class="bg-amber-200 text-amber-900 text-xs px-2 py-0.5 rounded-full border border-amber-300">${esc(cons)}</span>`).join('')}</div>`:''}
<div class="bg-amber-600 text-white rounded px-2 py-1 text-xs font-extrabold text-center mb-1">${esc(p.arbolProblema.problemaCentral)}</div>
${(p.arbolProblema.causas||[]).length?`<p class="text-[0.6rem] font-bold text-green-700 uppercase mb-1">Causas</p><div class="flex flex-wrap gap-1">${(p.arbolProblema.causas||[]).map(c=>`<span class="bg-green-100 text-green-900 text-xs px-2 py-0.5 rounded-full border border-green-300">${esc(c)}</span>`).join('')}</div>`:''}
</div>`:''}
<div class="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
  <p class="text-xs text-gray-400"><i class="fas fa-info-circle mr-1"></i> Solo lectura — no puedes editar este proyecto.</p>
  <button onclick="abandonarProyecto(${p.id})" class="bg-red-50 hover:bg-red-500 hover:text-white text-red-600 border border-red-200 rounded-lg px-3 py-1.5 font-bold text-xs cursor-pointer transition"><i class="fas fa-door-open mr-1"></i> Abandonar proyecto</button>
</div>
`}
</div></div>`}).join('')}

