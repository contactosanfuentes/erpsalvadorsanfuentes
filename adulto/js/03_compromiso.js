// ══════════ MI COMPROMISO (mismo modelo que registroadultos.netlify.app/compromiso) ══════════
// Al guardar: actualiza los campos compromiso_* de la ficha Y deja constancia con firma
// en compromisos_adultos (historial anual).
const CAMPOS_COMPROMISO = [
  { k:'compromiso_formacion',  n:'Formación', ph:'Ej: Completar el Curso Medio de mi rama antes de diciembre' },
  { k:'compromiso_unidad',     n:'Meta en mi unidad (si aplica)', ph:'Ej: Llevar la Avanzada a 24 integrantes este año' },
  { k:'compromiso_asistencia', n:'Asistencia y participación', ph:'Ej: Asistir al 90% de los sábados y a los 2 campamentos' },
  { k:'compromiso_ap',         n:'Acompañamiento Personal (AP)', ph:'Ej: Reunirme mensualmente con mi AP durante la inducción' },
  { k:'compromiso_ppf',        n:'Plan Personal de Formación (PPF)', ph:'Ej: Elaborar mi PPF con mi APF antes de marzo' },
  { k:'compromiso_evaluacion', n:'Evaluación del desempeño', ph:'Ej: Participar en las 2 evaluaciones anuales y aplicar la retroalimentación' },
  { k:'compromiso_otros',      n:'Otros compromisos (opcional)', ph:'' }
];

let _firmaDibujo = false, _firmaTrazos = false;

function renderCompromiso(){
  const a = adulto;
  const ultimo = a.fecha_registro ? new Date(a.fecha_registro).toLocaleDateString('es-CL') : null;
  $('sec-compromiso').innerHTML = `
  <div class="card"><h3><i class="fas fa-file-signature"></i> Mi compromiso personal</h3>
    <p class="hint">Basado en el Manual de Gestión del Voluntariado AGSCh. Redacta metas concretas y cuantificables (plazos, números, porcentajes). Al guardar quedará registrado con tu firma y fecha.</p>
    ${CAMPOS_COMPROMISO.map(c => `<div class="fg" style="margin-bottom:10px"><label>${c.n}</label><textarea id="${c.k}" rows="2" placeholder="${c.ph}">${a[c.k]||''}</textarea></div>`).join('')}
    <div class="fg" style="margin-bottom:6px"><label>Firma digital (dedo o mouse) *</label>
      <canvas class="firma" id="firma-canvas" width="600" height="150"></canvas>
      <div style="display:flex;gap:8px;margin-top:6px"><button class="btn-sec" onclick="limpiarFirma()">Limpiar</button></div>
    </div>
    <p style="font-size:0.7rem;color:#94a3b8;margin:8px 0">Declaro que he leído y comprendo el <a href="https://drive.google.com/file/d/1-5WRz1SnEDWsFnJCVlKQx_C9ZGzgaTII/view" target="_blank" rel="noopener" style="color:var(--azul);font-weight:700">Manual de Gestión del Voluntariado</a> y el instructivo del Ciclo de Vida del Adulto Voluntario, y que mi compromiso se alinea con sus lineamientos.</p>
    <div style="text-align:right"><button class="btn" onclick="guardarCompromiso()"><i class="fas fa-signature"></i> Firmar y guardar compromiso</button></div>
  </div>
  <div class="card"><h3><i class="fas fa-history"></i> Historial</h3><div id="comp-historial" class="hint">Cargando...</div></div>`;
  prepararFirma();
  cargarHistorialCompromisos();
}

function prepararFirma(){
  const c = $('firma-canvas'); if(!c) return;
  const ctx = c.getContext('2d'); if(!ctx) return;
  ctx.lineWidth = 2.2; ctx.lineCap = 'round'; ctx.strokeStyle = '#1e293b';
  const pos = e => { const r = c.getBoundingClientRect(); const p = e.touches ? e.touches[0] : e;
    return [(p.clientX - r.left) * (c.width / r.width), (p.clientY - r.top) * (c.height / r.height)]; };
  const ini = e => { _firmaDibujo = true; const [x,y] = pos(e); ctx.beginPath(); ctx.moveTo(x,y); e.preventDefault(); };
  const mov = e => { if(!_firmaDibujo) return; const [x,y] = pos(e); ctx.lineTo(x,y); ctx.stroke(); _firmaTrazos = true; e.preventDefault(); };
  const fin = () => { _firmaDibujo = false; };
  c.addEventListener('mousedown', ini); c.addEventListener('mousemove', mov); window.addEventListener('mouseup', fin);
  c.addEventListener('touchstart', ini, {passive:false}); c.addEventListener('touchmove', mov, {passive:false}); c.addEventListener('touchend', fin);
}
function limpiarFirma(){ const c = $('firma-canvas'); c.getContext('2d').clearRect(0,0,c.width,c.height); _firmaTrazos = false; }

async function guardarCompromiso(){
  if (!_firmaTrazos) { toast('Firma en el recuadro antes de guardar.', 'err'); return; }
  const cambios = {}; const compJson = {};
  for (const c of CAMPOS_COMPROMISO) { cambios[c.k] = $(c.k).value.trim(); compJson[c.k.replace('compromiso_','')] = cambios[c.k]; }
  // subir firma
  let firmaUrl = null;
  try {
    const blob = await new Promise(res => $('firma-canvas').toBlob(res, 'image/png'));
    const ruta = `portal/${adulto.id}_${Date.now()}.png`;
    const { error: eUp } = await sb.storage.from('adult-signatures').upload(ruta, blob, { contentType: 'image/png' });
    if (!eUp) firmaUrl = sb.storage.from('adult-signatures').getPublicUrl(ruta).data.publicUrl;
  } catch(e) {}
  if (firmaUrl) cambios.firma_url = firmaUrl;
  // Copia de la firma al expediente Drive del adulto (regla: todo documento del sistema, organizado en Drive)
  try {
    const blob2 = await new Promise(res => $('firma-canvas').toBlob(res, 'image/png'));
    const b64 = await new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result.split(',')[1]); r.onerror = rej; r.readAsDataURL(blob2); });
    await window.DriveHelper.subir({ supabaseClient: sb, nombre: `Compromiso_firmado_${new Date().toISOString().slice(0,10)}.png`, base64: b64, mimeType: 'image/png', claveCarpeta: 'adultos', nombrePersona: `${adulto.primer_nombre||adulto.nombres||''} ${adulto.apellido_paterno||adulto.apellidos||''}`.trim() });
  } catch (e) { console.warn('Firma: copia a Drive no disponible:', e.message); }
  const ok = await guardarAdulto(cambios);
  if (!ok) return;
  const { error } = await sb.from('compromisos_adultos').insert({
    run: adulto.run, nombre: `${adulto.primer_nombre||adulto.nombres||''} ${adulto.apellido_paterno||adulto.apellidos||''}`.trim(),
    email: authEmail, fecha: new Date().toISOString().slice(0,10),
    compromisos: compJson, ap_nombre: adulto.ap_nombre || null, apf_nombre: adulto.apf_nombre || null,
    firma_url: firmaUrl, firma_timestamp: new Date().toISOString()
  });
  if (error) { toast('Compromiso guardado en tu ficha, pero falló el historial: ' + error.message, 'err'); return; }
  toast('✍️ Compromiso firmado y registrado. ¡Buen ciclo!');
  cargarHistorialCompromisos();
}

async function cargarHistorialCompromisos(){
  const cont = $('comp-historial'); if(!cont) return;
  const { data } = await sb.from('compromisos_adultos').select('fecha, firma_url, created_at').ilike('email', authEmail).order('created_at', { ascending: false }).limit(10);
  if (!data || !data.length) { cont.textContent = 'Aún no tienes compromisos registrados desde el portal.'; return; }
  cont.innerHTML = data.map(r => `<div class="ro-item"><span class="k"><i class="fas fa-file-signature" style="color:var(--oro-osc)"></i> Compromiso firmado</span><span class="v">${new Date(r.fecha+'T12:00').toLocaleDateString('es-CL')} ${r.firma_url?`· <a href="${r.firma_url}" target="_blank" rel="noopener">ver firma</a>`:''}</span></div>`).join('');
}
