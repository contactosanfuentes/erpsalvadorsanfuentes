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
        <label class="btn-sec" style="cursor:pointer;margin-left:auto"><i class="fas fa-upload"></i> ${adulto[d.k]?'Renovar':'Subir'}
          <input type="file" accept="${d.img?'image/*':'.pdf,image/*'}" style="display:none" onchange="subirDocumento(this,'${d.k}','${d.b}')">
        </label>
      </div>`).join('')}
  </div>`;
}

async function subirDocumento(input, campo, bucket){
  const f = input.files[0]; if (!f) return;
  if (f.size > 10 * 1024 * 1024) { toast('El archivo supera 10 MB.', 'err'); return; }
  const est = $('doc-est-' + campo); est.textContent = '⏳ Subiendo...'; est.style.color = '#64748b';
  const ext = (f.name.split('.').pop() || 'pdf').toLowerCase();
  const ruta = `portal/${adulto.id}/${campo}_${Date.now()}.${ext}`;
  const { error } = await sb.storage.from(bucket).upload(ruta, f, { contentType: f.type || 'application/octet-stream' });
  if (error) { est.textContent = '✗ Error'; est.style.color = '#b91c1c'; toast('Error al subir: ' + error.message, 'err'); return; }
  const url = sb.storage.from(bucket).getPublicUrl(ruta).data.publicUrl;
  const ok = await guardarAdulto({ [campo]: url });
  if (ok) {
    est.textContent = '✓ Cargado'; est.style.color = '#059669';
    toast('📄 Documento actualizado.');
    if (campo === 'foto_url') { $('hdr-foto').src = url; $('hdr-foto').style.display = ''; }
    renderDocumentos();
  }
}
