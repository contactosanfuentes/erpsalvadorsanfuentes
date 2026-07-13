// ══════════ MODAL PROYECTO ══════════
function abrirModalProyecto(editIdx){
mpResponsables={};mpParticipantes=[];mpEvidencias=[];
document.getElementById('mp-edit-id').value='';document.getElementById('mp-nombre').value='';document.getElementById('mp-objetivo').value='';
document.getElementById('mp-campo').value='Servicio';document.getElementById('mp-campo-otro').style.display='none';document.getElementById('mp-campo-otro').value='';
document.getElementById('mp-inicio').value='';document.getElementById('mp-termino').value='';
document.getElementById('mp-toggle-ficha').checked=false;document.getElementById('mp-ficha-ext').style.display='none';
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
async function mpBuscarResp(input,area){const q=input.value.trim();if(q.length<2)return;
const{data:all}=await sb.from('mmbb_registrations').select('run,nombres,apellidos,foto_url').or(`run.ilike.%${q}%,nombres.ilike.%${q}%,apellidos.ilike.%${q}%`).limit(5);
const{data:adu}=await sb.from('adultos_registros').select('run,nombres,apellidos,foto_url').or(`run.ilike.%${q}%,nombres.ilike.%${q}%,apellidos.ilike.%${q}%`).limit(5);
let results=[...(all||[]).map(p=>({run:p.run,nombre:`${p.nombres} ${p.apellidos}`,foto:p.foto_url,tipo:'joven'})),...(adu||[]).map(a=>({run:a.run,nombre:`${a.nombres} ${a.apellidos}`,foto:a.foto_url,tipo:'adulto'}))];
const key=areaKey(area);const cont=input.parentElement.querySelector('.resp-result-'+key);
if(!results.length){cont.innerHTML='';return}
cont.innerHTML=`<div class="bg-white border border-gray-200 rounded-lg shadow-lg max-h-40 overflow-y-auto" style="width:100%;">${results.map(r=>`<div class="flex items-center gap-2 p-2 hover:bg-indigo-50 cursor-pointer text-sm" onclick="mpSelResp('${area}','${esc(r.run)}','${esc(r.nombre)}','${esc(r.foto||'')}','${r.tipo}');this.closest('.resp-result-${key}').innerHTML=''"><img src="${esc(r.foto||'')}" style="width:22px;height:22px;border-radius:50%;object-fit:cover;" onerror="this.style.display='none'"><span class="font-medium">${esc(r.nombre)}</span><span class="text-xs text-gray-400 ml-auto">${r.tipo}</span></div>`).join('')}</div>`}
function mpSelResp(area,run,nombre,foto,tipo){mpResponsables[area]={run,nombre,foto,tipo};renderMpResponsables();const key=areaKey(area);const cont=document.querySelector('.resp-result-'+key);if(cont)cont.innerHTML=''}
function renderMpResponsables(){AREAS_RESP.forEach(area=>{const key=areaKey(area);const el=document.getElementById('mp-resp-sel-'+key);if(!el)return;const r=mpResponsables[area];if(!r){el.innerHTML='';return}
el.innerHTML=`<div class="flex items-center gap-2 bg-indigo-50 border border-indigo-200 rounded-lg p-2"><img src="${esc(r.foto||'')}" style="width:24px;height:24px;border-radius:50%;object-fit:cover;" onerror="this.style.display='none'"><span class="text-xs font-bold">${esc(r.nombre)}</span><span class="text-xs text-indigo-500 font-bold ml-auto">${r.tipo}</span><button onclick="delete mpResponsables['${area}'];renderMpResponsables()" class="text-red-400 hover:text-red-600 ml-1"><i class="fas fa-times text-xs"></i></button></div>`})}

// Participantes search
async function mpBuscarParticipante(){const q=document.getElementById('mp-buscar-part').value.trim();if(q.length<2)return;
const{data:j}=await sb.from('mmbb_registrations').select('run,nombres,apellidos,foto_url').or(`run.ilike.%${q}%,apellidos.ilike.%${q}%,nombres.ilike.%${q}%`).limit(8);
const{data:a}=await sb.from('adultos_registros').select('run,nombres,apellidos,foto_url').or(`run.ilike.%${q}%,apellidos.ilike.%${q}%,nombres.ilike.%${q}%`).limit(5);
let all=[...(j||[]).map(p=>({run:p.run,nombre:`${p.nombres} ${p.apellidos}`,foto:p.foto_url,tipo:'joven'})),...(a||[]).map(p=>({run:p.run,nombre:`${p.nombres} ${p.apellidos}`,foto:p.foto_url,tipo:'adulto'}))];
const c=document.getElementById('mp-resultados-part');
if(!all.length){c.innerHTML='<p class="p-3 text-center text-gray-400 text-sm">Sin resultados.</p>';c.classList.remove('hidden');return}
c.innerHTML=all.map(r=>`<div class="flex items-center gap-2 p-2 cursor-pointer" onclick="mpAddParticipante('${esc(r.run)}','${esc(r.nombre)}','${esc(r.foto||'')}','${r.tipo}')"><img src="${esc(r.foto||'')}" style="width:24px;height:24px;border-radius:50%;object-fit:cover;" onerror="this.style.display='none'"><span class="text-sm font-medium">${esc(r.nombre)}</span><span class="text-xs text-gray-400 ml-auto">${r.tipo}</span></div>`).join('');c.classList.remove('hidden')}
function mpAddParticipante(run,nombre,foto,tipo){if(mpParticipantes.find(p=>p.run===run)){toast('Ya está agregado.','info');return}mpParticipantes.push({run,nombre,foto,tipo});renderMpParticipantes();document.getElementById('mp-resultados-part').classList.add('hidden');document.getElementById('mp-buscar-part').value=''}
function renderMpParticipantes(){document.getElementById('mp-participantes-list').innerHTML=mpParticipantes.map((p,i)=>`<div class="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg p-2"><img src="${esc(p.foto||'')}" style="width:28px;height:28px;border-radius:50%;object-fit:cover;" onerror="this.style.display='none'"><div><p class="text-xs font-bold">${esc(p.nombre)}</p><p class="text-xs text-gray-400">${p.tipo}</p></div><button onclick="mpParticipantes.splice(${i},1);renderMpParticipantes()" class="ml-auto text-red-400 hover:text-red-600"><i class="fas fa-times text-xs"></i></button></div>`).join('')}

// Evidencias
function driveIdDesdeUrl(url){const m=(url||'').match(/\/d\/([a-zA-Z0-9_-]+)/);return m?m[1]:null}
function driveThumbnailUrl(url){const id=driveIdDesdeUrl(url);return id?`https://drive.google.com/thumbnail?id=${id}&sz=w300`:url}
async function fileToBase64(file){return new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result.split(',')[1]);r.onerror=rej;r.readAsDataURL(file)})}

// Comprime imagen a máx 1400px y calidad 0.8 — reduce fotos de 5MB a ~300KB
async function comprimirImagen(file, maxPx=1400, quality=0.8) {
    if (!file.type.startsWith('image/')) return file;
    return new Promise((resolve) => {
        const timeout = setTimeout(() => resolve(file), 8000); // fallback si canvas no responde
        try {
            const img = new Image();
            const url = URL.createObjectURL(file);
            img.onload = () => {
                try {
                    let w = img.width, h = img.height;
                    if (w > maxPx || h > maxPx) {
                        if (w > h) { h = Math.round(h * maxPx / w); w = maxPx; }
                        else { w = Math.round(w * maxPx / h); h = maxPx; }
                    }
                    const canvas = document.createElement('canvas');
                    canvas.width = w; canvas.height = h;
                    canvas.getContext('2d').drawImage(img, 0, 0, w, h);
                    canvas.toBlob(blob => {
                        clearTimeout(timeout);
                        URL.revokeObjectURL(url);
                        if (!blob) { resolve(file); return; }
                        try { resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' })); }
                        catch(e) { resolve(file); }
                    }, 'image/jpeg', quality);
                } catch(e) { clearTimeout(timeout); URL.revokeObjectURL(url); resolve(file); }
            };
            img.onerror = () => { clearTimeout(timeout); URL.revokeObjectURL(url); resolve(file); };
            img.src = url;
        } catch(e) { clearTimeout(timeout); resolve(file); }
    });
}
async function mpSubirEvidencia(){
    const allFiles=document.getElementById('mp-evidencia-file').files;
    if(allFiles.length>10){mostrarError('Selecciona máximo 10 archivos por vez. Tienes '+allFiles.length+'.');return;}
    const files=allFiles;
    if(!files.length)return;
    const errBox=document.getElementById('mp-evidencia-error');
    if(errBox)errBox.innerHTML='';
    const mostrarError=msg=>{if(errBox){errBox.innerHTML='<div style="background:#fee2e2;border:1px solid #fca5a5;color:#991b1b;padding:8px 12px;border-radius:8px;font-size:13px;margin-top:6px;">⚠️ '+msg+'</div>';}toast(msg,'err');};
    toast('Subiendo a Drive...','info');
    const FOLDER_ID='1YRTHTvFHQ6U6CPWMfwVvfEUdNKBfmR9q';
    let subFolder=FOLDER_ID;
    try{
        // Nivel 1: carpeta "Evidencias - Proyectos" dentro del Clan
        const sr=await fetch('/.netlify/functions/subir-drive',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({accion:'crear_carpeta',nombre:'Evidencias - Proyectos',folder_id:FOLDER_ID})});
        const sd=JSON.parse(await sr.text());
        if(sd.ok){
            subFolder=sd.id;
            // Nivel 2: subcarpeta por nombre del proyecto
            const nombreProy=(document.getElementById('mp-nombre')?.value||'Sin nombre').trim().slice(0,60);
            const sr2=await fetch('/.netlify/functions/subir-drive',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({accion:'crear_carpeta',nombre:nombreProy,folder_id:subFolder})});
            const sd2=JSON.parse(await sr2.text());
            if(sd2.ok)subFolder=sd2.id;
        }
    }catch(e){mostrarError('Conexión con Drive falló: '+e.message);}
    const errores=[];let subidos=0;
    const MAX_B64_BYTES=4*1024*1024; // 3MB de archivo real → ~4MB base64, seguro bajo límite 6MB
    for(const f of files){
        try{
            const fProc=await comprimirImagen(f);
            const b64=await fileToBase64(fProc);
            if(b64.length>MAX_B64_BYTES){
                // Recomprimir más agresivamente si sigue muy grande
                const fProc2=await comprimirImagen(f,800,0.6);
                const b642=await fileToBase64(fProc2);
                if(b642.length>MAX_B64_BYTES){errores.push(f.name+' (demasiado grande)');continue;}
                var b64final=b642;var fFinal=fProc2;
            } else { var b64final=b64;var fFinal=fProc; }
            const ext=fFinal.name.split('.').pop().toLowerCase();
            const mimeMap={jpg:'image/jpeg',jpeg:'image/jpeg',png:'image/png',gif:'image/gif',webp:'image/webp',pdf:'application/pdf',mp4:'video/mp4',mov:'video/quicktime',mp3:'audio/mpeg',m4a:'audio/mp4',wav:'audio/wav'};
            const mime=mimeMap[ext]||'application/octet-stream';
            const nombre=(currentJoven.nombres||'joven').replace(/\s+/g,'_')+'_'+Date.now()+'.'+ext;
            const res=await fetch('/.netlify/functions/subir-drive',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({folder_id:subFolder,nombre,contenido_base64:b64final,mime_type:mime})});
            const text=await res.text();
            let data;
            try{data=JSON.parse(text);}catch(pe){errores.push(f.name+' (error servidor)');continue;}
            if(!data.ok){errores.push(f.name+': '+(data.error||'Drive rechazó'));continue;}
            mpEvidencias.push({url:data.link,nombre:f.name,driveId:data.id});
            subidos++;
        }catch(e){errores.push(f.name+': '+e.message);}
    }
    renderMpEvidencias();
    document.getElementById('mp-evidencia-file').value='';
    document.getElementById('mp-file-label').textContent='Elegir imágenes o archivos';
    // Mostrar resumen
    let resumen='';
    if(subidos>0) resumen+='✓ '+subidos+' archivo(s) subido(s) a Drive.\n';
    if(errores.length>0) resumen+='⚠ '+errores.length+' fallaron:\n- '+errores.join('\n- ');
    if(errores.length>0 && errBox) errBox.innerHTML='<div style="background:#fee2e2;border:1px solid #fca5a5;color:#991b1b;padding:8px 12px;border-radius:8px;font-size:12px;margin-top:6px;white-space:pre-wrap">'+resumen+'</div>';
    if(subidos===0)return;
    const editId=document.getElementById('mp-edit-id')?.value;
    if(editId){
        const idx=camino.proyectos_colectivos.findIndex(p=>p.id===Number(editId));
        if(idx!==-1){
            camino.proyectos_colectivos[idx].evidencias=[...mpEvidencias];
            if(await guardarCamino()){if(errBox)errBox.innerHTML='';toast('✓ Guardado en Drive y en el proyecto','ok');}
            else mostrarError('Drive OK, pero falló el guardado en BD. Haz clic en Guardar.');
        }
    }
}

function renderMpEvidencias(){
    const isImg=url=>/\.(jpe?g|png|gif|webp|bmp)(\?|$)/i.test(url);
    document.getElementById('mp-evidencias-list').innerHTML='<div class="flex flex-wrap gap-2 mt-1">'+mpEvidencias.map((e,i)=>{
        const url=e.url||e;const nombre=e.nombre||'Archivo';
        const isDrive=url.includes('drive.google.com');
        if(isDrive||isImg(url)){
            return `<div class="relative group border border-indigo-200 rounded-xl overflow-hidden" style="width:90px;">
                <a href="${esc(url)}" target="_blank">
                    <img src="${isDrive?driveThumbnailUrl(url):url}" style="width:90px;height:70px;object-fit:cover;display:block;" onerror="this.parentElement.parentElement.querySelector('.fb').style.display='flex';this.style.display='none'">
                    <div class="fb" style="display:none;width:90px;height:70px;align-items:center;justify-content:center;background:#eff6ff;"><i class="fas fa-file-image text-2xl text-indigo-400"></i></div>
                </a>
                <div class="p-1 bg-white text-center"><span class="text-xs text-gray-500 truncate block" title="${esc(nombre)}">${nombre.length>10?nombre.slice(0,8)+'…':nombre}</span></div>
                <button onclick="mpEvidencias.splice(${i},1);renderMpEvidencias()" class="absolute top-1 right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100"><i class="fas fa-times"></i></button>
            </div>`;
        }
        return `<a href="${esc(url)}" target="_blank" class="bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg text-xs font-bold border border-indigo-200 flex items-center gap-1"><i class="fas fa-file mr-1"></i>${esc(nombre)}</a>`;
    }).join('')+'</div>';
}

