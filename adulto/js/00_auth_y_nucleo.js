// ══════════ NÚCLEO Y AUTENTICACIÓN (Google, igual que el ERP) ══════════
const SUPABASE_URL = 'https://hyixmaxhoxvamoecuars.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5aXhtYXhob3h2YW1vZWN1YXJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3OTg1NDMsImV4cCI6MjA4ODM3NDU0M30.ZLeJIWdip2f00h4TqkZH7eqMX4wpwphaqkJpAa0N0X4';
const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let adulto = null;       // fila de adultos_registros
let authEmail = null;    // correo autenticado por Google
const $ = id => document.getElementById(id);

function toast(msg, tipo){
  const t = $('toast'); t.textContent = msg; t.className = 'toast' + (tipo === 'err' ? ' err' : '');
  t.style.display = 'block'; clearTimeout(t._h); t._h = setTimeout(() => t.style.display = 'none', 3500);
}

async function loginGoogle(){
  const { error } = await sb.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin + window.location.pathname,
      queryParams: { hd: 'salvadorsanfuentes.org', prompt: 'select_account' }
    }
  });
  if (error) { $('error-box').textContent = 'Error: ' + error.message; $('error-box').style.display = 'block'; }
}

async function loginPassword(){
  const email = $('lg-email').value.trim(), password = $('lg-pass').value;
  if (!email || !password) { $('error-box').textContent = 'Escribe tu correo y contraseña.'; $('error-box').style.display = 'block'; return; }
  const { error } = await sb.auth.signInWithPassword({ email, password });
  if (error) { $('error-box').textContent = 'Correo o contraseña incorrectos.'; $('error-box').style.display = 'block'; return; }
  await iniciarPortalAdulto();
}

function normalizarRun(r){ return String(r||'').replace(/[^0-9kK]/g,'').toLowerCase(); }

async function vincularPorRun(){
  const msg = $('sf-msg'); msg.style.display = 'block'; msg.style.color = '#64748b'; msg.textContent = 'Buscando tu ficha...';
  const runBuscado = normalizarRun($('sf-run').value);
  if (runBuscado.length < 7) { msg.style.color = '#b91c1c'; msg.textContent = 'Escribe tu RUN completo.'; return; }
  const { data, error } = await sb.from('adultos_registros').select('id, run, email, email_institucional');
  if (error) { msg.style.color = '#b91c1c'; msg.textContent = 'Error: ' + error.message; return; }
  const ficha = (data || []).find(r => normalizarRun(r.run) === runBuscado);
  if (!ficha) { msg.style.color = '#b91c1c'; msg.textContent = 'No encontramos un registro con ese RUN. Verifica el número o completa primero el Registro de Adultos.'; return; }
  // Protección: si la ficha ya está reclamada por otro correo, no se puede re-vincular desde aquí.
  if (ficha.email_institucional && ficha.email_institucional.toLowerCase() !== authEmail) {
    msg.style.color = '#b91c1c'; msg.textContent = 'Esa ficha ya está vinculada a otro correo institucional. Si es tuya, pide al equipo de grupo que lo corrija en el ERP.'; return;
  }
  const { error: e2 } = await sb.from('adultos_registros').update({ email_institucional: authEmail }).eq('id', ficha.id);
  if (e2) { msg.style.color = '#b91c1c'; msg.textContent = 'Error al vincular: ' + e2.message; return; }
  msg.style.color = '#059669'; msg.textContent = '✓ Ficha vinculada. Cargando tu portal...';
  $('sin-ficha').style.display = 'none';
  await iniciarPortalAdulto();
}

async function cerrarSesionAdulto(){ await sb.auth.signOut(); window.location.reload(); }

async function iniciarPortalAdulto(){
  const { data: { session } } = await sb.auth.getSession();
  if (!session) return; // se queda en login
  authEmail = (session.user.email || '').toLowerCase();
  $('login-screen').style.display = 'none';
  $('portal-screen').style.display = 'block';
  $('spinner').style.display = 'block';

  // Buscar la ficha: primero correo institucional, luego correo personal
  let { data } = await sb.from('adultos_registros').select('*').ilike('email_institucional', authEmail).limit(1);
  if (!data || !data.length) {
    const r2 = await sb.from('adultos_registros').select('*').ilike('email', authEmail).limit(1);
    data = r2.data;
  }
  $('spinner').style.display = 'none';
  if (!data || !data.length) { $('sf-email').textContent = authEmail; $('sin-ficha').style.display = 'block'; return; }
  adulto = data[0];

  // Header
  $('hdr-nombre').textContent = `${adulto.primer_nombre || adulto.nombres || ''} ${adulto.apellido_paterno || adulto.apellidos || ''}`.trim();
  $('hdr-rol').textContent = (adulto.roles && adulto.roles[0]) || 'Adulto Voluntario';
  if (adulto.foto_url) $('hdr-foto').src = adulto.foto_url; else $('hdr-foto').style.display = 'none';

  renderDatos();
  renderFormacion();
  renderCompromiso();
  renderDocumentos();
}

function verSeccion(id, tab){
  document.querySelectorAll('.seccion').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  $('sec-' + id).classList.add('active'); tab.classList.add('active');
}

// Guardado parcial: solo las columnas del portal (lista blanca explícita)
async function guardarAdulto(cambios){
  const PERMITIDAS = new Set(['domicilio','telefono','telefono_fijo','disponibilidad','profesion','nacionalidad',
    'prevision_salud','isapre_nombre','numero_afiliado','tiene_seguro_complementario','aseguradora','numero_poliza',
    'grupo_sanguineo','alergias','emergencia_nombre','emergencia_parentesco','emergencia_telefono','emergencia_email',
    'cursos','certificaciones','especialidades','en_formacion','ap_nombre','apf_nombre','etapa_ppf',
    'compromiso_formacion','compromiso_unidad','compromiso_asistencia','compromiso_ap','compromiso_ppf','compromiso_evaluacion','compromiso_otros',
    'cert_antecedentes_url','cert_inhabilidad_url','cert_inhabilidad_relevante_url','carta_recomendacion_url','foto_url','firma_url','certificados_formacion']);
  const payload = {};
  for (const k of Object.keys(cambios)) { if (PERMITIDAS.has(k)) payload[k] = cambios[k]; }
  if (!Object.keys(payload).length) return false;
  const { error } = await sb.from('adultos_registros').update(payload).eq('id', adulto.id);
  if (error) { toast('Error al guardar: ' + error.message, 'err'); return false; }
  Object.assign(adulto, payload);
  return true;
}

// Tarjeta de solo-lectura institucional (se edita en el ERP)
function tarjetaInstitucional(){
  const si = v => v ? '<span class="pill-si">Sí</span>' : '<span class="pill-no">No</span>';
  return `<div class="ro-box">
    <p class="titulo"><i class="fas fa-shield-alt"></i> Gestionado por el equipo de grupo (ERP)</p>
    <div class="ro-item"><span class="k">RUN</span><span class="v">${adulto.run || '—'}</span></div>
    <div class="ro-item"><span class="k">Rol(es) asignado(s)</span><span class="v">${(adulto.roles || []).join(', ') || '—'}</span></div>
    <div class="ro-item"><span class="k">Unidad</span><span class="v">${adulto.unidad_rol || '—'}</span></div>
    <div class="ro-item"><span class="k">Nivel de formación AGSCh</span><span class="v">${adulto.nivel_formacion || '—'}</span></div>
    <div class="ro-item"><span class="k">Fase del ciclo de vida</span><span class="v">${adulto.fase_ciclo_vida || '—'}</span></div>
    <div class="ro-item"><span class="k">Cuota anual pagada</span><span class="v">${si(adulto.cuota_pagada)}</span></div>
    <div class="ro-item"><span class="k">Ficha médica entregada</span><span class="v">${si(adulto.ficha_medica)}</span></div>
    <div class="ro-item"><span class="k">Correo institucional</span><span class="v">${adulto.email_institucional || '—'}</span></div>
    <p style="font-size:0.68rem;color:#94a3b8;margin-top:8px"><i class="fas fa-info-circle"></i> Si algo de esta sección está desactualizado, contacta a tu responsable de grupo: se corrige directamente en el ERP.</p>
  </div>`;
}

// Manejo del retorno OAuth y arranque
sb.auth.onAuthStateChange((_ev, _session) => { /* el flujo se maneja en iniciarPortalAdulto */ });
window.addEventListener('DOMContentLoaded', iniciarPortalAdulto);
