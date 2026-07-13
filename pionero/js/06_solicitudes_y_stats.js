// ══════════ NOTIFICACIONES Y SOLICITUDES ══════════
// ══════════ STATS SIDEBAR ══════════
function actualizarStats() {
    if (!camino) return;
    const proyectos = (camino.proyectos_colectivos || []).filter(p => p.estado !== 'Finalizado');
    const evidencias = proyectos.reduce((s, p) => s + (p.evidencias || []).length, 0);
    const solicitudes = proyectos.reduce((s, p) => s + (p.solicitudes_pendientes || []).length, 0);
    const compas = new Set(proyectos.flatMap(p => (p.participantes || []).map(pt => pt.run))).size;
    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    set('stat-proyectos', proyectos.length);
    set('stat-evidencias', evidencias);
    set('stat-solicitudes', solicitudes);
    set('stat-compas', compas);
}

function contarSolicitudes() {
    const total = (camino?.proyectos_colectivos || []).reduce((s, p) => s + ((p.solicitudes_pendientes || []).length), 0);
    const btn = document.getElementById('portal-notif-btn');
    const cnt = document.getElementById('portal-notif-count');
    if (!btn || !cnt) return;
    if (total > 0) { btn.style.display = 'block'; cnt.textContent = total; }
    else { btn.style.display = 'none'; }
}

function irAMisProyectos() {
    if (window.innerWidth >= 1024) activarTab('proyectos', document.querySelector('.portal-tab:nth-child(2)'));
    else { const s = document.getElementById('portal-proyectos'); if (s) s.scrollIntoView({behavior:'smooth'}); }
}

let _solModalProy = null, _solModalRun = null;

function abrirModalAceptar(proyId, run, nombre) {
    _solModalProy = proyId; _solModalRun = run;
    document.getElementById('modal-aceptar-nombre').textContent = 'Solicitud de: ' + nombre;
    document.getElementById('modal-aceptar-rol').value = 'participante';
    document.getElementById('modal-aceptar-sol').style.display = 'flex';
}

function abrirModalRechazar(proyId, run, nombre) {
    _solModalProy = proyId; _solModalRun = run;
    document.getElementById('modal-rechazar-nombre').textContent = 'Solicitud de: ' + nombre;
    document.getElementById('modal-rechazar-razon').value = '';
    document.getElementById('modal-rechazar-sol').style.display = 'flex';
}


// ── Plantilla institucional para correos de respuesta a solicitudes ──
function _htmlRespuestaSolicitud(nombreDest, proy, aceptado, rolOMotivo, creador) {
    const colorHead = aceptado ? '#059669' : '#b91c1c';
    const titulo = aceptado ? '🎉 ¡Solicitud aceptada!' : 'Solicitud no aceptada';
    const cuerpo = aceptado
        ? '<p style="color:#475569;line-height:1.6;">¡Buenas noticias! <strong>'+esc(creador)+'</strong>, creador/a dla empresa, aceptó tu solicitud de ingreso. Ya formas parte del equipo con el siguiente rol:</p><div style="text-align:center;margin:18px 0;"><span style="background:'+(rolOMotivo==='Participante'?'#10b981':'#E31837')+';color:white;padding:8px 22px;border-radius:10px;font-weight:800;font-size:0.95rem;display:inline-block;">'+esc(rolOMotivo)+'</span></div><div style="background:#f0fdf4;border-left:4px solid #10b981;padding:14px 18px;border-radius:0 8px 8px 0;margin:20px 0;"><p style="margin:0;font-size:0.85rem;color:#065f46;font-weight:600;">🌱 Ingresa al portal para revisar el plan de acción, el organigrama y las próximas actividades dla empresa.</p></div>'
        : '<p style="color:#475569;line-height:1.6;">Lamentablemente <strong>'+esc(creador)+'</strong>, creador/a dla empresa, no aceptó tu solicitud de ingreso en esta oportunidad.'+(rolOMotivo?' Te dejó el siguiente mensaje:</p><div style="background:#fef2f2;border:1.5px solid #fecaca;border-radius:12px;padding:16px;margin:18px 0;"><p style="margin:0;font-size:0.88rem;color:#7f1d1d;font-style:italic;">&ldquo;'+esc(rolOMotivo)+'&rdquo;</p></div>':'</p>')+'<div style="background:#eff6ff;border-left:4px solid #3b82f6;padding:14px 18px;border-radius:0 8px 8px 0;margin:20px 0;"><p style="margin:0;font-size:0.85rem;color:#1e40af;font-weight:600;">💪 No te desanimes: en el portal encontrarás otros proyectos vigentes a los que puedes postular, o puedes crear el tuyo propio.</p></div>';
    return '<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"></head><body style="font-family:Segoe UI,Arial,sans-serif;background:#f4f7f9;margin:0;padding:20px;"><div style="max-width:620px;margin:0 auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.1);"><div style="background:linear-gradient(135deg,#0E2586,#1e3a8a,'+colorHead+');padding:30px;text-align:center;"><img src="https://i.imgur.com/11u9rUD.png" style="height:70px;margin-bottom:12px;"><h1 style="color:white;margin:0;font-size:1.4rem;font-weight:800;">Grupo Guías y Scouts<br>Salvador Sanfuentes</h1><p style="color:rgba(255,255,255,0.85);font-size:0.85rem;margin:10px 0 0;">Respuesta a tu solicitud de proyecto</p></div><div style="padding:30px;"><p style="font-size:1rem;color:#1e293b;">Estimado/a <strong>'+esc(nombreDest)+'</strong>,</p><h2 style="margin:6px 0 14px;font-size:1.15rem;color:'+colorHead+';">'+titulo+'</h2><div style="background:linear-gradient(135deg,#fef2f2,#fff7ed);border:2px solid #E31837;border-radius:14px;padding:18px;margin:14px 0;"><p style="margin:0;font-size:0.8rem;color:#64748b;font-weight:700;text-transform:uppercase;">Proyecto</p><p style="margin:4px 0 0;font-size:1.05rem;color:#1e293b;font-weight:800;">📋 '+esc(proy.nombre)+'</p>'+(proy.campoAccion?'<p style="margin:6px 0 0;font-size:0.82rem;color:#64748b;">Campo: <strong style="color:#1e293b;">'+esc(proy.campoAccion)+'</strong>'+(proy.inicio?' · Inicio: <strong style="color:#1e293b;">'+esc(proy.inicio)+'</strong>':'')+'</p>':'')+'</div>'+cuerpo+'<div style="text-align:center;margin:28px 0 12px;"><a href="https://salvadorsanfuentes-erp.netlify.app/portal_caminante.html" style="display:inline-block;background:linear-gradient(135deg,#E31837,#b91c1c);color:white;padding:14px 36px;border-radius:12px;text-decoration:none;font-weight:700;">Acceder al Portal</a></div><p style="text-align:center;font-size:0.78rem;color:#94a3b8;">RUT + últimos 4 dígitos como clave.</p><div style="border-top:1px solid #e2e8f0;margin-top:24px;padding-top:16px;"><p style="font-size:0.88rem;color:#1e293b;font-weight:600;">Siempre Listos, Siempre Listas,<br><span style="color:#64748b;font-weight:400;">'+esc(creador)+'</span></p></div></div><div style="background:#0E2586;color:white;text-align:center;padding:16px;border-top:3px solid #FFD100;"><p style="margin:0;font-size:0.72rem;opacity:0.7;">Correo automático — Sistema de Gestión Educativa</p></div></div></body></html>';
}

async function confirmarAceptar() {
    document.getElementById('modal-aceptar-sol').style.display = 'none';
    const rol = document.getElementById('modal-aceptar-rol').value;
    const idx = camino.proyectos_colectivos.findIndex(p => p.id === Number(_solModalProy));
    if (idx === -1) return;
    const proy = camino.proyectos_colectivos[idx];
    const sol = (proy.solicitudes_pendientes || []).find(s => s.run === _solModalRun);
    if (!sol) return;
    if (rol === 'participante') {
        if (!proy.participantes) proy.participantes = [];
        if (!proy.participantes.some(p => p.run === sol.run)) proy.participantes.push({run:sol.run,nombre:sol.nombre,foto:sol.foto||''});
    } else {
        if (!proy.responsables) proy.responsables = {};
        proy.responsables[rol] = {run:sol.run,nombre:sol.nombre,foto:sol.foto||''};
    }
    proy.solicitudes_pendientes = (proy.solicitudes_pendientes||[]).filter(s => s.run !== _solModalRun);
    camino.proyectos_colectivos[idx] = proy;
    toast('Guardando...','info');
    if (!await guardarCamino()) { toast('Error al guardar','err'); return; }
    toast('✅ Solicitud aceptada','ok'); renderProyectos(); contarSolicitudes();
    try {
        const {data:rd} = await sb.from('mmbb_registrations').select('email_institucional,apoderado_titular_email,nombres,apellidos').eq('run',_solModalRun).maybeSingle();
        const dest = rd?.email_institucional || rd?.apoderado_titular_email;
        if (dest) {
            await fetch('https://hyixmaxhoxvamoecuars.supabase.co/functions/v1/send-email',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+SUPABASE_ANON_KEY},body:JSON.stringify({to_email:dest,subject:'✅ Tu solicitud fue aceptada — '+proy.nombre,html_content:_htmlRespuestaSolicitud(rd.nombres, proy, true, (rol==='participante'?'Participante':rol), currentJoven.nombres+' '+currentJoven.apellidos)})});
        }
    } catch(e) { console.warn('Email error:',e); }
}

async function confirmarRechazar() {
    document.getElementById('modal-rechazar-sol').style.display = 'none';
    const razon = document.getElementById('modal-rechazar-razon').value.trim();
    const idx = camino.proyectos_colectivos.findIndex(p => p.id === Number(_solModalProy));
    if (idx === -1) return;
    const proy = camino.proyectos_colectivos[idx];
    proy.solicitudes_pendientes = (proy.solicitudes_pendientes||[]).filter(s => s.run !== _solModalRun);
    camino.proyectos_colectivos[idx] = proy;
    toast('Guardando...','info');
    if (!await guardarCamino()) { toast('Error al guardar','err'); return; }
    toast('Solicitud rechazada','ok'); renderProyectos(); contarSolicitudes();
    try {
        const {data:rd} = await sb.from('mmbb_registrations').select('email_institucional,apoderado_titular_email,nombres,apellidos').eq('run',_solModalRun).maybeSingle();
        const dest = rd?.email_institucional || rd?.apoderado_titular_email;
        if (dest) {
            await fetch('https://hyixmaxhoxvamoecuars.supabase.co/functions/v1/send-email',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+SUPABASE_ANON_KEY},body:JSON.stringify({to_email:dest,subject:'Respuesta a tu solicitud — '+proy.nombre,html_content:_htmlRespuestaSolicitud(rd.nombres, proy, false, razon, currentJoven.nombres+' '+currentJoven.apellidos)})});
        }
    } catch(e) { console.warn('Email error:',e); }
}

function togglePrivacidadProyecto(proyId) {
    const idx = camino.proyectos_colectivos.findIndex(p => p.id === Number(proyId));
    if (idx === -1) return;
    camino.proyectos_colectivos[idx].privado = !camino.proyectos_colectivos[idx].privado;
    const esPrivado = camino.proyectos_colectivos[idx].privado;
    guardarCamino().then(ok => {
        if (ok) { toast(esPrivado ? '🔒 Proyecto privado' : '🌐 Proyecto público', 'ok'); renderProyectos(); }
        else { camino.proyectos_colectivos[idx].privado = !esPrivado; toast('Error al guardar','err'); }
    });
}

