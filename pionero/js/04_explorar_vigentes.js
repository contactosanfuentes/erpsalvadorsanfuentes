// ══════════ EXPLORAR VIGENTES ══════════
async function cargarProyectosVigentes(){const c=document.getElementById('portal-proyectos-vigentes');c.innerHTML='<p class="text-center text-gray-400 py-4"><i class="fas fa-spinner fa-spin"></i> Cargando...</p>';
try{const{data:jov}=await sb.from('mmbb_registrations').select('id,nombres,apellidos,unidad,foto_url,run').or('unidad.ilike.%avanzada%,unidad.ilike.%clan%,unidad.ilike.%caminante%,unidad.ilike.%pionero%');
if(!jov||!jov.length){c.innerHTML='<p class="text-center text-gray-400 py-6">No hay proyectos disponibles.</p>';return}
const{data:progs}=await sb.from('progresion_jovenes').select('joven_id,camino').in('joven_id',jov.map(j=>j.id));
const proyectos=[];const seen=new Set();(progs||[]).forEach(p=>{const j=jov.find(x=>x.id===p.joven_id);(p.camino?.proyectos_colectivos||[]).forEach(proy=>{if(proy.estado==='Finalizado'||seen.has(proy.id)||proy.privado===true)return;seen.add(proy.id);const u=(j?.unidad||'').toLowerCase();
proyectos.push({...proy,rama:(u.includes('avanzada')||u.includes('pionero'))?'Avanzada':'Clan',creadorNombre:j?`${j.nombres} ${j.apellidos}`:'',creadorFoto:j?.foto_url,creadorId:j?.id})})});
if(!proyectos.length){c.innerHTML='<p class="text-center text-gray-400 py-6"><i class="fas fa-inbox text-2xl block mb-2 opacity-30"></i>No hay proyectos vigentes.</p>';return}
_todosVigentes=proyectos;c.innerHTML=proyectos.map(p=>renderTarjetaVigentePV(p)).join('')}catch(e){c.innerHTML='<p class="text-red-500 text-center text-sm">Error: '+e.message+'</p>'}}


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

    // Evidencias (solo lectura, solo proyectos públicos — ya filtrados en cargarProyectosVigentes)
    if ((p.evidencias||[]).length) {
        html += '<div class="border-t border-gray-100 px-3 py-2 bg-white">';
        html += '<p class="text-[0.62rem] font-extrabold text-gray-400 uppercase tracking-wider mb-2"><i class="fas fa-paperclip mr-1"></i> Soportes del proyecto (' + p.evidencias.length + ')</p>';
        html += '<div class="flex flex-wrap gap-2">';
        (p.evidencias||[]).forEach(ev => {
            const url = typeof ev === 'string' ? ev : (ev.url||'');
            const nom = typeof ev === 'string' ? url.split('/').pop() : (ev.nombre||'archivo');
            const m = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
            const did = m ? m[1] : null;
            const isImg = did || /\.(jpe?g|png|gif|webp|bmp)(\?|$)/i.test(url);
            if (isImg) {
                const thumb = did ? 'https://drive.google.com/thumbnail?id='+did+'&sz=w200' : url;
                html += '<a href="'+esc(url)+'" target="_blank" rel="noopener" style="display:block;width:72px;height:72px;border-radius:8px;overflow:hidden;border:1.5px solid #e2e8f0;flex-shrink:0">';
                html += '<img src="'+thumb+'" style="width:72px;height:72px;object-fit:cover">';
                html += '</a>';
            } else {
                const n = nom.length>14 ? nom.slice(0,12)+'…' : nom;
                html += '<a href="'+esc(url)+'" target="_blank" rel="noopener" style="display:flex;align-items:center;gap:6px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:6px 10px;font-size:11px;color:#475569;font-weight:600;text-decoration:none"><i class="fas fa-file"></i>'+esc(n)+'</a>';
            }
        });
        html += '</div></div>';
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

const html = '<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"></head><body style="font-family:Segoe UI,Arial,sans-serif;background:#f4f7f9;margin:0;padding:20px;"><div style="max-width:620px;margin:0 auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.1);"><div style="background:linear-gradient(135deg,#0E2586,#1e3a8a,#E31837);padding:30px;text-align:center;"><img src="https://i.imgur.com/11u9rUD.png" style="height:70px;margin-bottom:12px;"><h1 style="color:white;margin:0;font-size:1.4rem;font-weight:800;">Grupo Guías y Scouts<br>Salvador Sanfuentes</h1><p style="color:rgba(255,255,255,0.85);font-size:0.85rem;margin:10px 0 0;">Invitación a Proyecto</p></div><div style="padding:30px;"><p style="font-size:1rem;color:#1e293b;">Estimado/a <strong>' + nombrePersona + '</strong>,</p><p style="color:#475569;line-height:1.6;">Has sido ' + (esResp ? 'designado/a como <strong>' + rol + '</strong> en' : 'incorporado/a como participante en') + ' el siguiente proyecto:</p><div style="background:linear-gradient(135deg,#fef2f2,#EEF2FF);border:2px solid #E31837;border-radius:14px;padding:22px;margin:20px 0;"><h2 style="margin:0 0 14px;font-size:1.15rem;color:#1e293b;">📋 ' + np + '</h2><table style="width:100%;border-collapse:collapse;"><tr><td style="padding:5px 8px;font-size:0.82rem;color:#64748b;width:130px;border-bottom:1px solid #fde8e8;"><strong>Tu rol:</strong></td><td style="padding:5px 8px;border-bottom:1px solid #fde8e8;"><span style="background:' + (esResp ? '#E31837' : '#10b981') + ';color:white;padding:3px 12px;border-radius:6px;font-weight:700;font-size:0.78rem;">' + rol + '</span></td></tr><tr><td style="padding:5px 8px;font-size:0.82rem;color:#64748b;border-bottom:1px solid #fde8e8;"><strong>Invitado por:</strong></td><td style="padding:5px 8px;font-size:0.82rem;color:#1e293b;border-bottom:1px solid #fde8e8;">' + invitadoPor + '</td></tr>' + (p.campoAccion ? '<tr><td style="padding:5px 8px;font-size:0.82rem;color:#64748b;border-bottom:1px solid #fde8e8;"><strong>Campo:</strong></td><td style="padding:5px 8px;font-size:0.82rem;color:#1e293b;border-bottom:1px solid #fde8e8;">' + p.campoAccion + '</td></tr>' : '') + (p.inicio ? '<tr><td style="padding:5px 8px;font-size:0.82rem;color:#64748b;border-bottom:1px solid #fde8e8;"><strong>Período:</strong></td><td style="padding:5px 8px;font-size:0.82rem;color:#1e293b;border-bottom:1px solid #fde8e8;">' + p.inicio + (p.termino ? ' → ' + p.termino : '') + '</td></tr>' : '') + (p.lugar ? '<tr><td style="padding:5px 8px;font-size:0.82rem;color:#64748b;border-bottom:1px solid #fde8e8;"><strong>Lugar:</strong></td><td style="padding:5px 8px;font-size:0.82rem;color:#1e293b;border-bottom:1px solid #fde8e8;">' + p.lugar + '</td></tr>' : '') + (p.beneficiarios ? '<tr><td style="padding:5px 8px;font-size:0.82rem;color:#64748b;border-bottom:1px solid #fde8e8;"><strong>Beneficiarios:</strong></td><td style="padding:5px 8px;font-size:0.82rem;color:#1e293b;border-bottom:1px solid #fde8e8;">' + p.beneficiarios + '</td></tr>' : '') + '<tr><td style="padding:5px 8px;font-size:0.82rem;color:#64748b;"><strong>Equipo:</strong></td><td style="padding:5px 8px;font-size:0.82rem;color:#1e293b;">' + nParts + ' participante(s), ' + nResps + ' responsable(s)</td></tr></table></div>' + (p.objetivo ? '<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:16px;margin:16px 0;"><p style="font-weight:700;font-size:0.82rem;color:#0E2586;margin:0 0 6px;">🎯 Objetivo:</p><p style="margin:0;font-size:0.85rem;color:#334155;line-height:1.5;">' + p.objetivo + '</p></div>' : '') + (p.justificacion ? '<div style="background:#fefce8;border:1px solid #fde68a;border-radius:10px;padding:16px;margin:16px 0;"><p style="font-weight:700;font-size:0.82rem;color:#854d0e;margin:0 0 6px;">📝 Justificación:</p><p style="margin:0;font-size:0.85rem;color:#475569;">' + p.justificacion + '</p></div>' : '') + (objHTML ? '<div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:16px;margin:16px 0;"><p style="font-weight:700;font-size:0.82rem;color:#166534;margin:0 0 8px;">✅ Objetivos Específicos:</p><ol style="margin:0;padding-left:20px;">' + objHTML + '</ol></div>' : '') + (orgHTML ? '<div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;padding:16px;margin:16px 0;"><p style="font-weight:700;font-size:0.82rem;color:#1e40af;margin:0 0 8px;">👥 Organigrama:</p><table style="width:100%;border-collapse:collapse;">' + orgHTML + '</table></div>' : '') + arbolHTML + (esResp ? '<div style="background:#fef2f2;border-left:4px solid #E31837;padding:14px 18px;border-radius:0 8px 8px 0;margin:20px 0;"><p style="margin:0;font-size:0.85rem;color:#991b1b;font-weight:600;">📌 Como ' + rol + ', coordina con el equipo y revisa el plan de acción.</p></div>' : '<div style="background:#f0fdf4;border-left:4px solid #10b981;padding:14px 18px;border-radius:0 8px 8px 0;margin:20px 0;"><p style="margin:0;font-size:0.85rem;color:#065f46;font-weight:600;">🌱 Ya eres parte del equipo. Ingresa al portal para ver el plan completo.</p></div>') + '<div style="text-align:center;margin:28px 0 12px;"><a href="https://salvadorsanfuentes.netlify.app/portal_caminante.html" style="display:inline-block;background:linear-gradient(135deg,#E31837,#b91c1c);color:white;padding:14px 36px;border-radius:12px;text-decoration:none;font-weight:700;">Acceder al Portal</a></div><p style="text-align:center;font-size:0.78rem;color:#94a3b8;">RUT + últimos 4 dígitos como clave.</p><div style="border-top:1px solid #e2e8f0;margin-top:24px;padding-top:16px;"><p style="font-size:0.88rem;color:#1e293b;font-weight:600;">Siempre Listos, Siempre Listas,<br><span style="color:#64748b;font-weight:400;">Dirección del Grupo</span></p></div></div><div style="background:#0E2586;color:white;text-align:center;padding:16px;border-top:3px solid #FFD100;"><p style="margin:0;font-size:0.72rem;opacity:0.7;">Correo automático — Sistema de Gestión Educativa</p></div><\/div><\/body><\/html>';

await fetch('/.netlify/functions/send-email', { method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ to_email: email, subject: (esResp ? '📋' : '🌱') + ' Invitación: "' + np + '" — Grupo Scout', html_content: html }) });
} catch(e) { console.warn('Error email:', e); }
}

