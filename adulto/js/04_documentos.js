// ══════════ DOCUMENTOS: renovación de certificados y foto ══════════
// Los certificados de antecedentes e inhabilidades VENCEN: el adulto puede renovarlos
// desde aquí sin pasar por el equipo de grupo. El ERP ve siempre la última versión.
const DOCS = [
  { k:'cert_antecedentes_url',          n:'Certificado de antecedentes', b:'adult-docs' },
  { k:'cert_inhabilidad_url',           n:'Cert. inhabilidad para trabajar con menores', b:'adult-docs' },
  { k:'cert_inhabilidad_relevante_url', n:'Cert. inhabilidades por maltrato relevante', b:'adult-docs', ayuda:'https://inhabilidades.srcei.cl/InhabilidadesRelevante/' },
  { k:'carta_recomendacion_url',        n:'Carta de recomendación (opcional)', b:'adult-docs' },
  { k:'foto_url',                       n:'Fotografía tipo carnet (uniformado y sonriente)', b:'adult-photos', img:true }
];

function renderDocumentos(){
  $('sec-documentos').innerHTML = `
  <div class="card"><h3><i class="fas fa-folder-open"></i> Mis documentos</h3>
    <p class="hint">Sube la versión más reciente (PDF o imagen, máx. 10 MB). Los certificados de antecedentes e inhabilidades deben renovarse periódicamente.</p>
    ${DOCS.map(d => `
      <div class="doc-row">
        <span class="nombre"><i class="fas ${d.img?'fa-portrait':'fa-file-pdf'}" style="color:var(--oro-osc);margin-right:6px"></i>${d.n}
          ${d.ayuda?`<br><a href="${d.ayuda}" target="_blank" rel="noopener" style="font-weight:600">obtener aquí</a>`:''}</span>
        <span id="doc-est-${d.k}" style="font-size:0.72rem;font-weight:800;color:${adulto[d.k]?'#059669':'#b91c1c'}">${adulto[d.k]?'✓ Cargado':'Pendiente'}</span>
        ${adulto[d.k]?`<a href="${adulto[d.k]}" target="_blank" rel="noopener">ver actual</a>`:''}
        <div style="display:flex;gap:6px;flex:1;min-width:230px;align-items:center;margin-left:auto">
          <input id="doc-url-${d.k}" placeholder="o pega la URL (Drive, etc.)" style="flex:1;border:1.5px solid #e2e8f0;border-radius:10px;padding:7px 10px;font-size:0.75rem;outline:none">
          <button class="btn-sec" onclick="guardarDocUrl('${d.k}')" title="Guardar URL"><i class="fas fa-link"></i></button>
          <label class="btn-sec" style="cursor:pointer" title="Subir archivo"><i class="fas fa-upload"></i> ${adulto[d.k]?'Renovar':'Subir'}
            <input type="file" accept="${d.img?'image/*':'.pdf,image/*'}" style="display:none" onchange="subirDocumento(this,'${d.k}','${d.b}')">
          </label>
        </div>
      </div>`).join('')}
  </div>` + renderCertsFormacion();
}


// ══ Subida a Google Drive: carpeta base de adultos + subcarpeta de expediente personal ══
function nombreExpediente(){
  return `${adulto.primer_nombre||adulto.nombres||''} ${adulto.apellido_paterno||adulto.apellidos||''}`.trim() || ('Adulto ' + adulto.id);
}
async function subirArchivoExpediente(file, etiqueta){
  const base64 = await new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result.split(',')[1]); r.onerror = rej; r.readAsDataURL(file); });
  const ext = (file.name.split('.').pop() || 'pdf').toLowerCase();
  const limpio = t => String(t||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9]/g,'_');
  const nombreArchivo = `${limpio(etiqueta)}_${limpio(nombreExpediente())}_${new Date().toISOString().slice(0,10)}.${ext}`;
  // 1º Drive: carpeta 'adultos' → subcarpeta con el nombre del adulto (su expediente)
  try {
    const r = await window.DriveHelper.subir({ supabaseClient: sb, nombre: nombreArchivo, base64, mimeType: file.type || 'application/pdf', claveCarpeta: 'adultos', nombrePersona: nombreExpediente() });
    if (r && r.ok && r.link) return { url: r.link, destino: 'drive' };
    throw new Error((r && r.error) || 'sin enlace');
  } catch (e) {
    // 2º respaldo: storage de Supabase (p. ej. si el sitio no tiene credenciales de Drive configuradas)
    console.warn('Drive no disponible, usando respaldo en storage:', e.message);
    const ruta = `portal/${adulto.id}/${nombreArchivo}`;
    const { error } = await sb.storage.from('adult-docs').upload(ruta, file, { contentType: file.type || 'application/octet-stream' });
    if (error) throw new Error('Drive y respaldo fallaron: ' + error.message);
    return { url: sb.storage.from('adult-docs').getPublicUrl(ruta).data.publicUrl, destino: 'storage' };
  }
}

async function guardarDocUrl(campo){
  const url = $('doc-url-' + campo).value.trim();
  if (!url) { toast('Pega una URL o usa el botón de subir archivo.', 'err'); return; }
  if (!/^https?:\/\//i.test(url)) { toast('La URL debe comenzar con http(s)://', 'err'); return; }
  const ok = await guardarAdulto({ [campo]: url });
  if (ok) { toast('📄 Documento registrado.'); if (campo === 'foto_url') { $('hdr-foto').src = url; $('hdr-foto').style.display = ''; } renderDocumentos(); }
}

async function subirDocumento(input, campo, bucket){
  const f = input.files[0]; if (!f) return;
  if (f.size > 10 * 1024 * 1024) { toast('El archivo supera 10 MB.', 'err'); return; }
  const est = $('doc-est-' + campo); est.textContent = '⏳ Subiendo...'; est.style.color = '#64748b';
  try {
    const etiqueta = (DOCS.find(d => d.k === campo) || {}).n || campo;
    const { url, destino } = await subirArchivoExpediente(f, etiqueta);
    const ok = await guardarAdulto({ [campo]: url });
    if (ok) {
      est.textContent = '✓ Cargado'; est.style.color = '#059669';
      toast(destino === 'drive' ? '📁 Guardado en tu expediente de Drive.' : '📄 Guardado (respaldo en storage: Drive no disponible en este sitio).');
      if (campo === 'foto_url') { $('hdr-foto').src = url; $('hdr-foto').style.display = ''; }
      renderDocumentos();
    }
  } catch (e) { est.textContent = '✗ Error'; est.style.color = '#b91c1c'; toast('Error al subir: ' + e.message, 'err'); }
}

// ══ Certificados de cursos de formación (mismo JSON que muestra el ERP en tu perfil) ══
const CERTS_FORMACION = [
  { k:'ingreso',  n:'Certificado de Ingreso' },
  { k:'basico',   n:'Certificado Básico (Curso Inicial)' },
  { k:'medio',    n:'Certificado Medio' },
  { k:'avanzado', n:'Certificado IM (Avanzado)' },
  { k:'im3',      n:'Certificado IM3' },
  { k:'im4',      n:'Certificado IM4' }
];

function renderCertsFormacion(){
  const certs = adulto.certificados_formacion || {};
  return `<div class="card"><h3><i class="fas fa-graduation-cap"></i> Certificados de mis cursos de formación</h3>
    <p class="hint">Pega el enlace (Drive, AGSCh, etc.) o sube el archivo. Lo que registres aquí aparece de inmediato en tu perfil del ERP.</p>
    ${CERTS_FORMACION.map(c => {
      const url = certs[c.k] || '';
      return `<div class="doc-row">
        <span class="nombre"><i class="fas fa-certificate" style="color:var(--oro-osc);margin-right:6px"></i>${c.n}</span>
        <span id="cf-est-${c.k}" style="font-size:0.72rem;font-weight:800;color:${url?'#059669':'#94a3b8'}">${url?'✓ Registrado':'Sin certificado'}</span>
        ${url?`<a href="${url}" target="_blank" rel="noopener">ver</a>`:''}
        <div style="display:flex;gap:6px;flex:1;min-width:230px;align-items:center">
          <input id="cf-url-${c.k}" placeholder="Pega la URL del certificado" value="" style="flex:1;border:1.5px solid #e2e8f0;border-radius:10px;padding:7px 10px;font-size:0.75rem;outline:none">
          <button class="btn-sec" onclick="guardarCertFormacion('${c.k}')" title="Guardar URL"><i class="fas fa-link"></i></button>
          <label class="btn-sec" style="cursor:pointer" title="Subir archivo"><i class="fas fa-upload"></i><input type="file" accept=".pdf,image/*" style="display:none" onchange="subirCertFormacion(this,'${c.k}')"></label>
        </div>
      </div>`; }).join('')}
  </div>`;
}

async function guardarCertFormacion(key, urlDirecta){
  const url = urlDirecta || $('cf-url-' + key).value.trim();
  if (!url) { toast('Pega una URL o sube un archivo.', 'err'); return; }
  if (!/^https?:\/\//i.test(url)) { toast('La URL debe comenzar con http(s)://', 'err'); return; }
  const certs = Object.assign({}, adulto.certificados_formacion || {});
  certs[key] = url;
  const ok = await guardarAdulto({ certificados_formacion: certs });
  if (ok) { toast('🎓 Certificado registrado: ya es visible en tu perfil del ERP.'); renderDocumentos(); }
}

async function subirCertFormacion(input, key){
  const f = input.files[0]; if (!f) return;
  if (f.size > 10 * 1024 * 1024) { toast('El archivo supera 10 MB.', 'err'); return; }
  const est = $('cf-est-' + key); est.textContent = '⏳ Subiendo...'; est.style.color = '#64748b';
  try {
    const etiqueta = (CERTS_FORMACION.find(c => c.k === key) || {}).n || ('Cert_' + key);
    const { url, destino } = await subirArchivoExpediente(f, etiqueta);
    await guardarCertFormacion(key, url);
    if (destino !== 'drive') toast('📄 Guardado con respaldo en storage (Drive no disponible en este sitio).');
  } catch (e) { est.textContent = '✗ Error'; est.style.color = '#b91c1c'; toast('Error al subir: ' + e.message, 'err'); }
}
