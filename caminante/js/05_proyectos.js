async function mpGuardarProyecto(){
    const btn=document.getElementById('mp-btn-guardar');
    if(btn){if(btn.disabled)return;btn.disabled=true;btn.innerHTML='<i class="fas fa-spinner fa-spin"></i> Guardando...';}
const nombre=document.getElementById('mp-nombre').value.trim(),objetivo=document.getElementById('mp-objetivo').value.trim();
const campoSel=document.getElementById('mp-campo').value;const campo=campoSel==='Otros'?(document.getElementById('mp-campo-otro').value.trim()||'Otros'):campoSel;
const inicio=document.getElementById('mp-inicio').value;
if(!nombre||!objetivo||!campo||!inicio){toast('Completa nombre, objetivo, campo e inicio.','err');return}
const editId=document.getElementById('mp-edit-id').value;
const fichaExt=document.getElementById('mp-toggle-ficha')?.checked||false;
// Preservar visibilidad previa al editar; default: público
const prevPublico = editId
  ? (camino.proyectos_colectivos.find(p=>p.id===Number(editId))?.publico ?? true)
  : true;
const esPublico = document.getElementById('mp-toggle-publico')?.checked ?? prevPublico;
const proy={id:editId?Number(editId):Date.now(),nombre,objetivo,campoAccion:campo,inicio,termino:document.getElementById('mp-termino').value,
creadorRun:currentJoven.run,participantes:[...mpParticipantes],responsables:{...mpResponsables},fichaExtendida:fichaExt,evidencias:[...mpEvidencias],solicitudes_pendientes:[],publico:esPublico};

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

// ══════════ VISIBILIDAD ══════════
async function toggleVisibilidadProyecto(idx){
  const p=camino.proyectos_colectivos[idx];
  if(!p||p.creadorRun!==currentJoven.run){toast('Solo puedes cambiar la visibilidad de tus propios proyectos.','err');return}
  p.publico = p.publico===false ? true : false;
  toast('Guardando...','info');
  if(await guardarCamino()){
    renderProyectos();
    toast(p.publico ? '🌐 Proyecto ahora es público — visible para otros caminantes.' : '🔒 Proyecto ahora es privado — solo tú y los dirigentes lo ven.','ok');
  }
}

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
function renderProyectos(extra=[]){const c=document.getElementById('portal-proyectos');const propios=camino.proyectos_colectivos||[];
// Combinar propios + externos (sin duplicados por id)
const seen=new Set(propios.map(p=>p.id));
const externos=extra.filter(p=>!seen.has(p.id));
const proys=[...propios,...externos];
if(!proys.length){c.innerHTML='<p class="text-center text-gray-400 py-8"><i class="fas fa-inbox text-3xl block mb-3 opacity-30"></i>No tienes proyectos aún. Si te asignaron a uno, aparecerá aquí. También puedes crear uno con el botón de arriba.</p>';return}
c.innerHTML=proys.map((p,i)=>{const sc={'Finalizado':'#10b981','En curso':'#3b82f6','Planificación':'#f59e0b','Evaluación':'#8b5cf6'};const color=sc[p.estado]||'#f59e0b';const esMio=p.creadorRun===currentJoven.run;
return `<div class="proyecto-card-portal" style="border-left:3px solid ${esMio?'#10b981':'#94a3b8'}"><div class="proyecto-header-portal" onclick="const b=document.getElementById('pb-${i}'),ic=document.getElementById('pi-${i}');b.classList.toggle('open');ic.classList.toggle('rotate-180')"><h4 class="font-bold text-sm flex-1">${esc(p.nombre)}</h4>${esMio?'<span class="bg-green-50 text-green-700 px-2 py-0.5 rounded text-xs font-bold">MI PROYECTO</span>':(()=>{const myRun=currentJoven.run;const esResp=p.responsables&&Object.values(p.responsables).some(r=>r&&r.run&&r.run.toLowerCase()===myRun.toLowerCase());return esResp?'<span class="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs font-bold">🎖 RESPONSABLE</span>':'<span class="bg-gray-100 text-gray-500 px-2 py-0.5 rounded text-xs font-bold">👥 PARTICIPANTE</span>';})()}<span style="background:${color}20;color:${color}" class="px-2 py-0.5 rounded text-xs font-bold">${esc(p.estado||'Planificación')}</span><i class="fas fa-chevron-down text-gray-400 text-xs transition-transform" id="pi-${i}"></i></div>
<div class="proyecto-body-portal" id="pb-${i}">${esMio?`
<p class="text-xs text-gray-500 mb-2"><strong>Objetivo:</strong> ${esc(p.objetivo||'')}</p>
<p class="text-xs text-gray-500 mb-2"><strong>Campo:</strong> ${esc(p.campoAccion||'')} | <strong>Fechas:</strong> ${p.inicio||'?'} → ${p.termino||'?'}</p>
${(p.participantes||[]).length?`<p class="text-xs text-gray-500 mb-2"><strong>Participantes:</strong> ${(p.participantes||[]).map(pt=>esc(pt.nombre)).join(', ')}</p>`:''}
${Object.keys(p.responsables||{}).length?`<p class="text-xs text-gray-500 mb-2"><strong>Organigrama:</strong> ${Object.entries(p.responsables||{}).map(([c,r])=>c+': '+esc(r.nombre)).join(' | ')}</p>`:''}
${(p.solicitudes_pendientes||[]).length?`<div class="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-2"><p class="text-xs font-bold text-amber-800"><i class="fas fa-bell"></i> ${(p.solicitudes_pendientes||[]).length} solicitud(es) — se aprueban en el ERP</p></div>`:''}
<div class="flex gap-2 mt-3"><button onclick="abrirModalProyecto(${i})" class="bg-indigo-600 hover:bg-indigo-700 text-white border-none rounded-lg px-4 py-2 font-bold text-xs cursor-pointer shadow"><i class="fas fa-pen mr-1"></i> Editar</button><button onclick="toggleVisibilidadProyecto(${i})" class="border rounded-lg px-4 py-2 font-bold text-xs cursor-pointer transition ${p.publico===false ? 'bg-gray-100 text-gray-600 border-gray-300' : 'bg-green-50 text-green-700 border-green-300'}" title="${p.publico===false ? 'Proyecto privado — solo tú y los dirigentes lo ven. Clic para hacerlo público.' : 'Proyecto público — visible para otros caminantes. Clic para hacerlo privado.'}"><i class="fas ${p.publico===false ? 'fa-lock' : 'fa-globe'} mr-1"></i> ${p.publico===false ? 'Privado' : 'Público'}</button><button onclick="eliminarProyecto(${i})" class="bg-red-50 hover:bg-red-500 hover:text-white text-red-600 border border-red-200 rounded-lg px-4 py-2 font-bold text-xs cursor-pointer transition"><i class="fas fa-trash mr-1"></i> Eliminar</button></div>
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

// ══════════ EXPLORAR VIGENTES ══════════
async function cargarProyectosVigentes(){const c=document.getElementById('portal-proyectos-vigentes');c.innerHTML='<p class="text-center text-gray-400 py-4"><i class="fas fa-spinner fa-spin"></i> Cargando...</p>';
try{const{data:jov}=await sb.from('mmbb_registrations').select('id,nombres,apellidos,unidad,foto_url,run').or('unidad.ilike.%avanzada%,unidad.ilike.%clan%,unidad.ilike.%caminante%,unidad.ilike.%pionero%');
if(!jov||!jov.length){c.innerHTML='<p class="text-center text-gray-400 py-6">No hay proyectos disponibles.</p>';return}
const{data:progs}=await sb.from('progresion_jovenes').select('joven_id,camino').in('joven_id',jov.map(j=>j.id));
const proyectos=[];const seen=new Set();(progs||[]).forEach(p=>{const j=jov.find(x=>x.id===p.joven_id);(p.camino?.proyectos_colectivos||[]).forEach(proy=>{if(proy.estado==='Finalizado'||seen.has(proy.id))return;if(proy.publico===false){const myRun=currentJoven.run.toLowerCase();const esMio=(proy.creadorRun||'').toLowerCase()===myRun;const esInvolucrado=(proy.participantes||[]).some(pt=>pt?.run?.toLowerCase()===myRun)||(proy.responsables&&Object.values(proy.responsables).some(r=>r?.run?.toLowerCase()===myRun));if(!esMio&&!esInvolucrado)return;}seen.add(proy.id);const u=(j?.unidad||'').toLowerCase();
proyectos.push({...proy,rama:(u.includes('avanzada')||u.includes('pionero'))?'Avanzada':'Clan',creadorNombre:j?`${j.nombres} ${j.apellidos}`:'',creadorFoto:j?.foto_url,creadorId:j?.id})})});
if(!proyectos.length){c.innerHTML='<p class="text-center text-gray-400 py-6"><i class="fas fa-inbox text-2xl block mb-2 opacity-30"></i>No hay proyectos vigentes.</p>';return}
c.innerHTML=proyectos.map(p=>renderTarjetaVigentePV(p)).join('')}catch(e){c.innerHTML='<p class="text-red-500 text-center text-sm">Error: '+e.message+'</p>'}}


function renderTarjetaVigentePV(p) {
    const rc = p.rama==='Avanzada' ? '#8b5cf6' : '#E31837';
    const sc = {'En curso':'#3b82f6','Planificaci\u00f3n':'#f59e0b','Evaluaci\u00f3n':'#8b5cf6'};
    const ec = sc[p.estado] || '#f59e0b';
    const ramaLabel = p.rama==='Avanzada' ? 'Pioneros' : 'Caminantes';
    const pid = p.id;
    const myRun = currentJoven.run;
    const yaInsc = (p.participantes||[]).some(pt=>pt.run===myRun);
    const yaSol  = (p.solicitudes_pendientes||[]).some(s=>s.run===myRun);
    const esMio  = p.creadorRun===myRun;

    let btn = '';
    if (esMio) btn = '<span class="bg-green-50 text-green-700 px-3 py-1.5 rounded-lg text-xs font-bold"><i class="fas fa-star mr-1"></i> Mi proyecto</span>';
    else if (yaInsc) btn = '<span class="bg-green-50 text-green-700 px-3 py-1.5 rounded-lg text-xs font-bold"><i class="fas fa-check-circle mr-1"></i> Participas</span>';
    else if (yaSol)  btn = '<span class="bg-amber-50 text-amber-700 px-3 py-1.5 rounded-lg text-xs font-bold"><i class="fas fa-clock mr-1"></i> Pendiente</span>';
    else btn = '<button onclick="solicitarUnirse(' + pid + ',' + p.creadorId + ')" class="bg-gradient-to-r from-purple-600 to-red-600 text-white border-none rounded-lg px-4 py-1.5 font-bold text-xs cursor-pointer shadow"><i class="fas fa-user-plus mr-1"></i> Solicitar</button>';

    // Card principal
    let html = '<div class="pv-card" style="padding:0;overflow:hidden;">';

    // Cabecera visible
    html += '<div class="p-3">';
    html += '<div class="flex justify-between items-start gap-2 flex-wrap">';
    html += '<div class="flex-1 min-w-[160px]">';
    html += '<div class="flex items-center gap-1.5 mb-1 flex-wrap">';
    html += '<span class="font-bold text-sm">' + esc(p.nombre) + '</span>';
    html += '<span style="background:' + ec + '15;color:' + ec + '" class="px-2 py-0.5 rounded text-xs font-bold">' + (p.estado||'Planificaci\u00f3n') + '</span>';
    html += '</div>';
    html += '<div class="flex gap-2 text-xs text-gray-500 mb-1 flex-wrap">';
    html += '<span style="color:' + rc + ';font-weight:700;">' + ramaLabel + '</span>';
    html += '<span><i class="fas fa-leaf mr-1"></i>' + esc(p.campoAccion||'') + '</span>';
    if (p.inicio) html += '<span><i class="fas fa-calendar mr-1"></i>' + p.inicio + (p.termino ? ' \u2192 '+p.termino : '') + '</span>';
    html += '<span><i class="fas fa-users mr-1"></i>' + (p.participantes||[]).length + '</span>';
    html += '</div>';
    if (p.objetivo) html += '<p class="text-xs text-gray-500 italic mb-1">' + esc(p.objetivo) + '</p>';
    html += '<div class="flex items-center gap-1 mt-1">';
    if (p.creadorFoto) html += '<img src="' + esc(p.creadorFoto) + '" style="width:16px;height:16px;border-radius:50%;object-fit:cover;">';
    html += '<span class="text-xs text-gray-400">por <strong>' + esc(p.creadorNombre||'') + '</strong></span>';
    html += '</div>';
    html += '</div>';
    html += '<div class="flex flex-col gap-1.5 items-end">';
    html += btn;
    html += '<button onclick="toggleDetallePVP(' + pid + ')" class="text-xs text-indigo-600 font-bold underline cursor-pointer bg-transparent border-none flex items-center gap-1"><i class="fas fa-eye text-xs" id="pvpico' + pid + '"></i> Ver detalle</button>';
    html += '</div>';
    html += '</div>';
    html += '</div>'; // flex justify-between
    html += '</div>'; // p-3

    // Panel detalle expandible
    html += '<div id="pvpdet' + pid + '" style="display:none;" class="border-t border-gray-100 bg-gray-50 px-3 pb-3 pt-2 flex flex-col gap-2">';

    if (p.justificacion) html += '<div><p class="text-[0.62rem] font-extrabold text-gray-400 uppercase tracking-wider mb-0.5">Justificaci\u00f3n</p><p class="text-xs text-gray-700">' + esc(p.justificacion) + '</p></div>';
    if (p.beneficiarios) html += '<p class="text-xs text-gray-600"><strong>Beneficiarios:</strong> ' + esc(p.beneficiarios) + '</p>';
    if (p.lugar) html += '<p class="text-xs text-gray-600"><strong>Lugar:</strong> ' + esc(p.lugar) + '</p>';

    if ((p.objetivosEspecificos||[]).length) {
        html += '<div><p class="text-[0.62rem] font-extrabold text-gray-400 uppercase tracking-wider mb-0.5">Objetivos Espec\u00edficos</p><ul class="list-disc list-inside text-xs text-gray-700">';
        (p.objetivosEspecificos||[]).forEach(o => { html += '<li>' + esc(o) + '</li>'; });
        html += '</ul></div>';
    }

    const respEntries = Object.entries(p.responsables||{}).filter(([,r])=>r&&r.nombre);
    if (respEntries.length) {
        html += '<div><p class="text-[0.62rem] font-extrabold text-gray-400 uppercase tracking-wider mb-0.5">Organigrama</p><div class="grid grid-cols-2 gap-1">';
        respEntries.forEach(([cargo, r]) => { html += '<div class="bg-blue-50 border border-blue-100 rounded px-2 py-0.5 text-xs text-blue-800"><strong>' + esc(cargo) + ':</strong> ' + esc(r.nombre) + '</div>'; });
        html += '</div></div>';
    }

    if ((p.participantes||[]).length) {
        html += '<div><p class="text-[0.62rem] font-extrabold text-gray-400 uppercase tracking-wider mb-0.5">Participantes</p><div class="flex flex-wrap gap-1">';
        (p.participantes||[]).forEach(pt => { html += '<span class="bg-white border border-gray-200 text-gray-600 text-xs px-2 py-0.5 rounded-full">' + esc(pt.nombre||'') + '</span>'; });
        html += '</div></div>';
    }

    if ((p.planAccion||[]).length) {
        html += '<div><p class="text-[0.62rem] font-extrabold text-gray-400 uppercase tracking-wider mb-0.5">Plan de Acci\u00f3n</p><div class="overflow-x-auto"><table class="w-full text-xs border-collapse"><thead><tr class="bg-gray-100"><th class="text-left p-1 border border-gray-200">Acci\u00f3n</th><th class="text-left p-1 border border-gray-200">Responsable</th><th class="text-left p-1 border border-gray-200">Cronograma</th></tr></thead><tbody>';
        (p.planAccion||[]).forEach(a => { html += '<tr><td class="p-1 border border-gray-100">' + esc(a.accion||'') + '</td><td class="p-1 border border-gray-100">' + esc(a.responsable||'') + '</td><td class="p-1 border border-gray-100">' + esc(a.cronograma||'') + '</td></tr>'; });
        html += '</tbody></table></div></div>';
    }

    if (p.fichaExtendida && p.arbolProblema && (p.arbolProblema.problemaCentral || (p.arbolProblema.causas||[]).length || (p.arbolProblema.consecuencias||[]).length)) {
        html += '<div class="border border-amber-200 bg-amber-50 rounded-xl p-2">';
        html += '<p class="text-[0.62rem] font-extrabold text-amber-700 uppercase tracking-wider mb-1"><i class="fas fa-tree mr-1"></i> \u00c1rbol del Problema</p>';
        if ((p.arbolProblema.consecuencias||[]).length) {
            html += '<p class="text-[0.6rem] font-bold text-amber-600 uppercase mb-1">Consecuencias</p><div class="flex flex-wrap gap-1 mb-2">';
            (p.arbolProblema.consecuencias||[]).forEach(cons => { html += '<span class="bg-amber-200 text-amber-900 text-xs px-2 py-0.5 rounded-full border border-amber-300">' + esc(cons) + '</span>'; });
            html += '</div>';
        }
        if (p.arbolProblema.problemaCentral) {
            html += '<div class="bg-amber-600 text-white rounded-lg px-2 py-1.5 mb-2 text-xs font-extrabold text-center">⚠️ ' + esc(p.arbolProblema.problemaCentral) + '</div>';
        }
        if ((p.arbolProblema.causas||[]).length) {
            html += '<p class="text-[0.6rem] font-bold text-green-700 uppercase mb-1">Causas</p><div class="flex flex-wrap gap-1">';
            (p.arbolProblema.causas||[]).forEach(causa => { html += '<span class="bg-green-100 text-green-900 text-xs px-2 py-0.5 rounded-full border border-green-300">' + esc(causa) + '</span>'; });
            html += '</div>';
        }
        html += '</div>';
    }

    if (!(p.justificacion||p.beneficiarios||p.lugar||(p.objetivosEspecificos||[]).length||respEntries.length||(p.participantes||[]).length||(p.planAccion||[]).length||(p.fichaExtendida&&p.arbolProblema&&p.arbolProblema.problemaCentral))) {
        html += '<p class="text-xs text-gray-400 text-center py-1"><i class="fas fa-info-circle mr-1"></i> Sin informaci\u00f3n adicional cargada.</p>';
    }

    html += '</div>'; // panel detalle
    html += '</div>'; // card
    return html;
}

function toggleDetallePVP(pid) {
    const panel = document.getElementById('pvpdet' + pid);
    const ico   = document.getElementById('pvpico' + pid);
    if (!panel) return;
    const open = panel.style.display === 'none' || panel.style.display === '';
    panel.style.display = open ? 'flex' : 'none';
    panel.style.flexDirection = 'column';
    if (ico) { ico.className = open ? 'fas fa-eye-slash text-xs' : 'fas fa-eye text-xs'; }
}

async function solicitarUnirse(proyId,creadorId){toast('Enviando solicitud...','info');
try{const{data:pg}=await sb.from('progresion_jovenes').select('camino').eq('joven_id',creadorId).maybeSingle();if(!pg?.camino)throw new Error('Proyecto no encontrado.');
const proy=(pg.camino.proyectos_colectivos||[]).find(p=>p.id===proyId);if(!proy)throw new Error('Proyecto no encontrado.');
if((proy.participantes||[]).some(pt=>pt.run===currentJoven.run)){toast('Ya participas.','info');return}
if((proy.solicitudes_pendientes||[]).some(s=>s.run===currentJoven.run)){toast('Ya tienes solicitud pendiente.','info');return}
if(!proy.solicitudes_pendientes)proy.solicitudes_pendientes=[];
proy.solicitudes_pendientes.push({run:currentJoven.run,nombre:`${currentJoven.nombres} ${currentJoven.apellidos}`,foto:currentJoven.foto_url||'',rama:currentJoven.unidad||'',fecha:new Date().toISOString().split('T')[0],jovenId:currentJoven.id});
await sb.from('progresion_jovenes').upsert({joven_id:creadorId,camino:pg.camino},{onConflict:'joven_id'});
toast('Solicitud enviada. Debe ser aprobada.');await cargarProyectosVigentes()}catch(e){toast('Error: '+e.message,'err')}}

// ══════════ EMAIL NOTIFICACIÓN ══════════
async function enviarEmailProyecto(run, nombrePersona, proyecto, rol, invitadoPor) {
try {
const np = typeof proyecto === 'string' ? proyecto : proyecto.nombre;
const p = typeof proyecto === 'object' ? proyecto : {};
let email = null;
const { data: jov } = await sb.from('mmbb_registrations').select('email_apoderado, apoderado_titular_email').ilike('run', run).maybeSingle();
if (jov) email = jov.email_apoderado || jov.apoderado_titular_email;
if (!email) { const { data: adu } = await sb.from('adultos_registros').select('email').ilike('run', run).maybeSingle(); if (adu) email = adu.email; }
if (!email) return;
const esResp = rol !== 'Participante';
const nParts = (p.participantes || []).length;
const nResps = Object.keys(p.responsables || {}).length;
const orgHTML = Object.entries(p.responsables || {}).map(([c, r]) => '<tr><td style="padding:4px 8px;font-size:0.82rem;color:#64748b;border-bottom:1px solid #f1f5f9;">' + c + '</td><td style="padding:4px 8px;font-size:0.82rem;color:#1e293b;font-weight:600;border-bottom:1px solid #f1f5f9;">' + (r.nombre || 'Por asignar') + '</td></tr>').join('');
const objHTML = (p.objetivosEspecificos || []).map(o => '<li style="margin-bottom:4px;color:#475569;font-size:0.82rem;">' + o + '</li>').join('');
const arbolHTML = (p.fichaExtendida && p.arbolProblema && p.arbolProblema.problemaCentral) ? '<div style="border:2px solid #92400e;border-radius:12px;overflow:hidden;margin:20px 0;"><div style="background:linear-gradient(135deg,#92400e,#78350f);padding:10px 16px;text-align:center;"><p style="margin:0;font-size:0.82rem;font-weight:700;color:white;">🌳 Árbol del Problema</p></div><div style="padding:16px;background:linear-gradient(180deg,#eff6ff 0%,#f0fdf4 50%,#fefce8 100%);">' + ((p.arbolProblema.consecuencias||[]).length ? '<div style="background:#fef3c7;border:1.5px solid #f59e0b;border-radius:10px;padding:12px;text-align:center;margin-bottom:4px;"><p style="font-weight:700;font-size:0.72rem;color:#92400e;text-transform:uppercase;margin:0 0 6px;">☀️ CONSECUENCIAS</p>' + p.arbolProblema.consecuencias.map((c,i) => '<p style="margin:3px 0;font-size:0.82rem;color:#78350f;background:white;padding:5px 12px;border-radius:6px;border:1px solid #fde68a;">' + (i+1) + '. ' + c + '</p>').join('') + '</div>' : '') + '<div style="text-align:center;"><div style="width:6px;height:14px;background:#92400e;margin:0 auto;border-radius:3px;"></div></div><div style="background:linear-gradient(135deg,#dc2626,#991b1b);border:2px solid #7f1d1d;border-radius:10px;padding:14px;text-align:center;margin:4px 0;"><p style="font-weight:800;font-size:0.72rem;color:#fecaca;text-transform:uppercase;margin:0 0 6px;">🎯 PROBLEMA CENTRAL</p><p style="margin:0;font-size:0.9rem;color:white;font-weight:700;">' + p.arbolProblema.problemaCentral + '</p></div><div style="text-align:center;"><div style="width:6px;height:14px;background:#92400e;margin:0 auto;border-radius:3px;"></div></div>' + ((p.arbolProblema.causas||[]).length ? '<div style="background:#d1fae5;border:1.5px solid #10b981;border-radius:10px;padding:12px;text-align:center;margin-top:4px;"><p style="font-weight:700;font-size:0.72rem;color:#065f46;text-transform:uppercase;margin:0 0 6px;">🌱 CAUSAS</p>' + p.arbolProblema.causas.map((c,i) => '<p style="margin:3px 0;font-size:0.82rem;color:#064e3b;background:white;padding:5px 12px;border-radius:6px;border:1px solid #a7f3d0;">' + (i+1) + '. ' + c + '</p>').join('') + '</div>' : '') + '</div></div>' : '';

const html = '<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"></head><body style="font-family:Segoe UI,Arial,sans-serif;background:#f4f7f9;margin:0;padding:20px;"><div style="max-width:620px;margin:0 auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.1);"><div style="background:linear-gradient(135deg,#0E2586,#1e3a8a,#E31837);padding:30px;text-align:center;"><img src="https://i.imgur.com/11u9rUD.png" style="height:70px;margin-bottom:12px;"><h1 style="color:white;margin:0;font-size:1.4rem;font-weight:800;">Grupo Guías y Scouts<br>Salvador Sanfuentes</h1><p style="color:rgba(255,255,255,0.85);font-size:0.85rem;margin:10px 0 0;">Invitación a Proyecto</p></div><div style="padding:30px;"><p style="font-size:1rem;color:#1e293b;">Estimado/a <strong>' + nombrePersona + '</strong>,</p><p style="color:#475569;line-height:1.6;">Has sido ' + (esResp ? 'designado/a como <strong>' + rol + '</strong> en' : 'incorporado/a como participante en') + ' el siguiente proyecto:</p><div style="background:linear-gradient(135deg,#fef2f2,#fff7ed);border:2px solid #E31837;border-radius:14px;padding:22px;margin:20px 0;"><h2 style="margin:0 0 14px;font-size:1.15rem;color:#1e293b;">📋 ' + np + '</h2><table style="width:100%;border-collapse:collapse;"><tr><td style="padding:5px 8px;font-size:0.82rem;color:#64748b;width:130px;border-bottom:1px solid #fde8e8;"><strong>Tu rol:</strong></td><td style="padding:5px 8px;border-bottom:1px solid #fde8e8;"><span style="background:' + (esResp ? '#E31837' : '#10b981') + ';color:white;padding:3px 12px;border-radius:6px;font-weight:700;font-size:0.78rem;">' + rol + '</span></td></tr><tr><td style="padding:5px 8px;font-size:0.82rem;color:#64748b;border-bottom:1px solid #fde8e8;"><strong>Invitado por:</strong></td><td style="padding:5px 8px;font-size:0.82rem;color:#1e293b;border-bottom:1px solid #fde8e8;">' + invitadoPor + '</td></tr>' + (p.campoAccion ? '<tr><td style="padding:5px 8px;font-size:0.82rem;color:#64748b;border-bottom:1px solid #fde8e8;"><strong>Campo:</strong></td><td style="padding:5px 8px;font-size:0.82rem;color:#1e293b;border-bottom:1px solid #fde8e8;">' + p.campoAccion + '</td></tr>' : '') + (p.inicio ? '<tr><td style="padding:5px 8px;font-size:0.82rem;color:#64748b;border-bottom:1px solid #fde8e8;"><strong>Período:</strong></td><td style="padding:5px 8px;font-size:0.82rem;color:#1e293b;border-bottom:1px solid #fde8e8;">' + p.inicio + (p.termino ? ' → ' + p.termino : '') + '</td></tr>' : '') + (p.lugar ? '<tr><td style="padding:5px 8px;font-size:0.82rem;color:#64748b;border-bottom:1px solid #fde8e8;"><strong>Lugar:</strong></td><td style="padding:5px 8px;font-size:0.82rem;color:#1e293b;border-bottom:1px solid #fde8e8;">' + p.lugar + '</td></tr>' : '') + (p.beneficiarios ? '<tr><td style="padding:5px 8px;font-size:0.82rem;color:#64748b;border-bottom:1px solid #fde8e8;"><strong>Beneficiarios:</strong></td><td style="padding:5px 8px;font-size:0.82rem;color:#1e293b;border-bottom:1px solid #fde8e8;">' + p.beneficiarios + '</td></tr>' : '') + '<tr><td style="padding:5px 8px;font-size:0.82rem;color:#64748b;"><strong>Equipo:</strong></td><td style="padding:5px 8px;font-size:0.82rem;color:#1e293b;">' + nParts + ' participante(s), ' + nResps + ' responsable(s)</td></tr></table></div>' + (p.objetivo ? '<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:16px;margin:16px 0;"><p style="font-weight:700;font-size:0.82rem;color:#0E2586;margin:0 0 6px;">🎯 Objetivo:</p><p style="margin:0;font-size:0.85rem;color:#334155;line-height:1.5;">' + p.objetivo + '</p></div>' : '') + (p.justificacion ? '<div style="background:#fefce8;border:1px solid #fde68a;border-radius:10px;padding:16px;margin:16px 0;"><p style="font-weight:700;font-size:0.82rem;color:#854d0e;margin:0 0 6px;">📝 Justificación:</p><p style="margin:0;font-size:0.85rem;color:#475569;">' + p.justificacion + '</p></div>' : '') + (objHTML ? '<div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:16px;margin:16px 0;"><p style="font-weight:700;font-size:0.82rem;color:#166534;margin:0 0 8px;">✅ Objetivos Específicos:</p><ol style="margin:0;padding-left:20px;">' + objHTML + '</ol></div>' : '') + (orgHTML ? '<div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;padding:16px;margin:16px 0;"><p style="font-weight:700;font-size:0.82rem;color:#1e40af;margin:0 0 8px;">👥 Organigrama:</p><table style="width:100%;border-collapse:collapse;">' + orgHTML + '</table></div>' : '') + arbolHTML + (esResp ? '<div style="background:#fef2f2;border-left:4px solid #E31837;padding:14px 18px;border-radius:0 8px 8px 0;margin:20px 0;"><p style="margin:0;font-size:0.85rem;color:#991b1b;font-weight:600;">📌 Como ' + rol + ', coordina con el equipo y revisa el plan de acción.</p></div>' : '<div style="background:#f0fdf4;border-left:4px solid #10b981;padding:14px 18px;border-radius:0 8px 8px 0;margin:20px 0;"><p style="margin:0;font-size:0.85rem;color:#065f46;font-weight:600;">🌱 Ya eres parte del equipo. Ingresa al portal para ver el plan completo.</p></div>') + '<div style="text-align:center;margin:28px 0 12px;"><a href="https://salvadorsanfuentes.netlify.app/portal_caminante.html" style="display:inline-block;background:linear-gradient(135deg,#E31837,#b91c1c);color:white;padding:14px 36px;border-radius:12px;text-decoration:none;font-weight:700;">Acceder al Portal</a></div><p style="text-align:center;font-size:0.78rem;color:#94a3b8;">RUT + últimos 4 dígitos como clave.</p><div style="border-top:1px solid #e2e8f0;margin-top:24px;padding-top:16px;"><p style="font-size:0.88rem;color:#1e293b;font-weight:600;">Siempre Listos, Siempre Listas,<br><span style="color:#64748b;font-weight:400;">Dirección del Grupo</span></p></div></div><div style="background:#0E2586;color:white;text-align:center;padding:16px;border-top:3px solid #FFD100;"><p style="margin:0;font-size:0.72rem;opacity:0.7;">Correo automático — Sistema de Gestión Educativa</p></div><\/div><\/body><\/html>';

await fetch('/.netlify/functions/send-email', { method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ to_email: email, subject: (esResp ? '📋' : '🌱') + ' Invitación: "' + np + '" — Grupo Scout', html_content: html }) });
} catch(e) { console.warn('Error email:', e); }
}

// ══════════ CALENDAR — Próximas actividades ══════════
