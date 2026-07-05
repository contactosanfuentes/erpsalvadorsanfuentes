function abrirModalProyecto(editIdx){
mpResponsables={};mpParticipantes=[];mpEvidencias=[];
document.getElementById('mp-edit-id').value='';document.getElementById('mp-nombre').value='';document.getElementById('mp-objetivo').value='';
document.getElementById('mp-campo').value='Servicio';document.getElementById('mp-campo-otro').style.display='none';document.getElementById('mp-campo-otro').value='';
document.getElementById('mp-inicio').value='';document.getElementById('mp-termino').value='';
document.getElementById('mp-toggle-ficha').checked=false;document.getElementById('mp-ficha-ext').style.display='none';
// Visibilidad: default público para proyectos nuevos
const togglePub=document.getElementById('mp-toggle-publico');
if(togglePub)togglePub.checked=true;
document.getElementById('mp-justificacion').value='';document.getElementById('mp-beneficiarios').value='';document.getElementById('mp-lugar').value='';
document.getElementById('mp-arbol-central').value='';document.getElementById('mp-crear-evento').checked=false;
document.getElementById('mp-title').textContent='Nuevo Proyecto';
renderMpParticipantes();renderMpEvidencias();renderMpResponsables();
const errBox2=document.getElementById('mp-evidencia-error');if(errBox2)errBox2.innerHTML='';
// Init dynamic lists
['mp-campos-list','mp-objetivos-list','mp-acciones-list','mp-ppto-list','mp-indicadores-list','mp-arbol-cons','mp-arbol-causas'].forEach(id=>document.getElementById(id).innerHTML='');
for(let i=0;i<2;i++){mpAddDynRow('mp-campos-list','Campo de acción');mpAddDynRow('mp-objetivos-list','Objetivo específico');mpAddAccionRow();mpAddPptoRow();mpAddArbolRow('mp-arbol-cons','Consecuencia','border-amber-300');mpAddArbolRow('mp-arbol-causas','Causa','border-green-300')}
mpAddIndRow();mpAddIndRow();
// Init responsables
const rc=document.getElementById('mp-responsables');rc.innerHTML='';
AREAS_RESP.forEach(area=>{rc.innerHTML+=`<div class="mb-3"><label class="font-bold text-xs text-gray-600 uppercase tracking-wide block mb-1">${area}</label><div style="position:relative;"><input type="text" placeholder="Buscar por nombre o RUN..." class="w-full border border-gray-300 rounded-lg p-2 text-sm outline-none focus:border-indigo-400" oninput="mpBuscarResp(this,'${area}')"><div class="resp-result-${areaKey(area)}" style="position:absolute;top:100%;left:0;right:0;z-index:9999;"></div></div><div id="mp-resp-sel-${areaKey(area)}" class="mt-1"></div></div>`});

if(editIdx!==undefined){
const p=camino.proyectos_colectivos[editIdx];if(!p)return;
document.getElementById('mp-edit-id').value=String(p.id);document.getElementById('mp-nombre').value=p.nombre||'';
document.getElementById('mp-objetivo').value=p.objetivo||'';
const campoVal=['Servicio','Trabajo','Viaje','Naturaleza','Cultura y Artes','Innovación / Técnica'].includes(p.campoAccion)?p.campoAccion:'Otros';
document.getElementById('mp-campo').value=campoVal;if(campoVal==='Otros'){document.getElementById('mp-campo-otro').style.display='block';document.getElementById('mp-campo-otro').value=p.campoAccion||''}
document.getElementById('mp-inicio').value=p.inicio||'';document.getElementById('mp-termino').value=p.termino||'';
document.getElementById('mp-title').textContent='Editar Proyecto';
mpParticipantes=[...(p.participantes||[])];mpResponsables={...(p.responsables||{})};mpEvidencias=[...(p.evidencias||[])];
// Restaurar visibilidad guardada
const togglePubEdit=document.getElementById('mp-toggle-publico');
if(togglePubEdit) togglePubEdit.checked = p.publico !== false;
renderMpParticipantes();renderMpEvidencias();renderMpResponsables();
if(p.justificacion||p.beneficiarios||p.lugar||p.objetivosEspecificos||p.planAccion||p.presupuestoEstimado||p.indicadores||p.arbolProblema){
document.getElementById('mp-toggle-ficha').checked=true;document.getElementById('mp-ficha-ext').style.display='block';
document.getElementById('mp-justificacion').value=p.justificacion||'';document.getElementById('mp-beneficiarios').value=p.beneficiarios||'';document.getElementById('mp-lugar').value=p.lugar||'';
['mp-campos-list','mp-objetivos-list','mp-acciones-list','mp-ppto-list','mp-indicadores-list','mp-arbol-cons','mp-arbol-causas'].forEach(id=>document.getElementById(id).innerHTML='');
(p.camposAccionPrioritarios||[]).forEach(v=>{mpAddDynRow('mp-campos-list','Campo');document.getElementById('mp-campos-list').lastElementChild.querySelector('input').value=v});
(p.objetivosEspecificos||[]).forEach(v=>{mpAddDynRow('mp-objetivos-list','Objetivo');document.getElementById('mp-objetivos-list').lastElementChild.querySelector('input').value=v});
(p.planAccion||[]).forEach(a=>{mpAddAccionRow();const r=document.getElementById('mp-acciones-list').lastElementChild;r.querySelectorAll('input')[0].value=a.accion||'';r.querySelectorAll('input')[1].value=a.recurso||'';r.querySelectorAll('input')[2].value=a.responsable||'';r.querySelectorAll('input')[3].value=a.cronograma||''});
(p.presupuestoEstimado||[]).forEach(i=>{mpAddPptoRow();const r=document.getElementById('mp-ppto-list').lastElementChild;r.querySelectorAll('input')[0].value=i.concepto||'';r.querySelectorAll('input')[1].value=i.cantidad||'';r.querySelectorAll('input')[2].value=i.costoUnitario||'';mpCalcPpto()});
(p.indicadores||[]).forEach(i=>{mpAddIndRow();const r=document.getElementById('mp-indicadores-list').lastElementChild;r.querySelectorAll('input')[0].value=i.descripcion||'';r.querySelectorAll('input')[1].value=i.meta||''});
if(p.arbolProblema){document.getElementById('mp-arbol-central').value=p.arbolProblema.problemaCentral||'';
document.getElementById('mp-arbol-cons').innerHTML='';(p.arbolProblema.consecuencias||[]).forEach(v=>{mpAddArbolRow('mp-arbol-cons','Cons','border-amber-300');document.getElementById('mp-arbol-cons').lastElementChild.querySelector('input').value=v});
document.getElementById('mp-arbol-causas').innerHTML='';(p.arbolProblema.causas||[]).forEach(v=>{mpAddArbolRow('mp-arbol-causas','Causa','border-green-300');document.getElementById('mp-arbol-causas').lastElementChild.querySelector('input').value=v})}
}}
document.getElementById('modal-proyecto-portal').classList.add('active')}

function cerrarModalProy(){document.getElementById('modal-proyecto-portal').classList.remove('active')}

// Dynamic rows
function mpAddDynRow(cid,ph){document.getElementById(cid).insertAdjacentHTML('beforeend',`<div class="flex gap-2 mb-2 items-center"><input type="text" class="flex-1 border border-gray-200 rounded-lg p-2 text-sm focus:border-amber-400 outline-none" placeholder="${ph}..."><button onclick="this.parentElement.remove()" class="text-red-400 hover:text-red-600 text-sm px-2"><i class="fas fa-times"></i></button></div>`)}
function mpAddAccionRow(){document.getElementById('mp-acciones-list').insertAdjacentHTML('beforeend',`<div class="grid grid-cols-5 gap-1 mb-1.5"><input type="text" class="border border-gray-200 rounded p-1.5 text-sm" placeholder="Acción..."><input type="text" class="border border-gray-200 rounded p-1.5 text-sm" placeholder="Recursos..."><input type="text" class="border border-gray-200 rounded p-1.5 text-sm" placeholder="Responsable..."><input type="text" class="border border-gray-200 rounded p-1.5 text-sm" placeholder="Cronograma..."><button onclick="this.parentElement.remove()" class="text-red-400 hover:text-red-600 text-sm"><i class="fas fa-times"></i></button></div>`)}
function mpAddPptoRow(){document.getElementById('mp-ppto-list').insertAdjacentHTML('beforeend',`<div class="grid grid-cols-5 gap-1 mb-1.5 items-center"><input type="text" class="border border-gray-200 rounded p-1.5 text-sm" placeholder="Concepto..."><input type="number" class="border border-gray-200 rounded p-1.5 text-sm text-center" placeholder="0" oninput="mpCalcPpto()"><input type="number" class="border border-gray-200 rounded p-1.5 text-sm text-center" placeholder="$0" oninput="mpCalcPpto()"><span class="text-center font-bold text-sm text-gray-700">$0</span><button onclick="this.parentElement.remove();mpCalcPpto()" class="text-red-400 hover:text-red-600 text-sm"><i class="fas fa-times"></i></button></div>`)}
function mpCalcPpto(){let t=0;document.querySelectorAll('#mp-ppto-list > div').forEach(r=>{const ins=r.querySelectorAll('input');const q=parseFloat(ins[1]?.value)||0,u=parseFloat(ins[2]?.value)||0;const s=q*u;t+=s;r.querySelector('span').textContent='$'+s.toLocaleString('es-CL')});document.getElementById('mp-ppto-total').textContent='Total: $'+t.toLocaleString('es-CL')}
function mpAddIndRow(){document.getElementById('mp-indicadores-list').insertAdjacentHTML('beforeend',`<div class="flex gap-2 mb-2"><input type="text" class="flex-1 border border-gray-200 rounded-lg p-2 text-sm focus:border-amber-400 outline-none" placeholder="Indicador..."><input type="text" class="w-20 border border-gray-200 rounded-lg p-2 text-sm text-center focus:border-amber-400 outline-none" placeholder="Meta"><button onclick="this.parentElement.remove()" class="text-red-400 hover:text-red-600 text-sm px-2"><i class="fas fa-times"></i></button></div>`)}
function mpAddArbolRow(cid,ph,bc){document.getElementById(cid).insertAdjacentHTML('beforeend',`<div class="flex gap-2 mb-2"><input type="text" class="flex-1 border ${bc} rounded-lg p-2 text-sm focus:border-amber-500 outline-none" placeholder="${ph}..."><button onclick="this.parentElement.remove()" class="text-red-400 text-sm px-1"><i class="fas fa-times"></i></button></div>`)}

// Responsables search
