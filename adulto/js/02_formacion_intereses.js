// ══════════ FORMACIÓN E INTERESES ══════════
// Autodeclarado por el adulto: cursos/talleres realizados, especialidades, certificaciones,
// y su estado de acompañamiento (AP/APF/PPF). El NIVEL de formación (Insignia de Madera) y los
// ROLES son credenciales institucionales: solo se editan en el ERP.
const CURSOS_OPC = ['Curso Inicial (IILA)','Curso Medio - Manada','Curso Medio - Bandada','Curso Medio - Tropa','Curso Medio - Compañía','Curso Medio - Avanzada','Curso Medio - Clan','Curso Avanzado - Manada','Curso Avanzado - Bandada','Curso Avanzado - Tropa','Curso Avanzado - Compañía','Curso Avanzado - Avanzada','Curso Avanzado - Clan','Curso de Formadores','Taller de Planificación','Taller de Seguridad','Taller de Primeros Auxilios','Taller de Liderazgo','Taller de Programa'];
const ESPECIALIDADES_OPC = ['Campismo','Excursionismo','Primeros Auxilios','Nudos y Cabuyería','Liderazgo','Gestión de grupos','Comunicaciones','Medio Ambiente','Inclusión'];
const CERTIFICACIONES_OPC = ['Primeros auxilios','Reanimación RCP','Prevención de abusos','Manejo de grupos'];
const ETAPAS_PPF = ['No lo sé','En elaboración','En ejecución','En pausa','Completado'];

function renderFormacion(){
  const a = adulto;
  $('sec-formacion').innerHTML = `
  <div class="card"><h3><i class="fas fa-graduation-cap"></i> Cursos y talleres AGSCh realizados</h3>
    <p class="hint">Marca los que hayas completado. El nivel de formación oficial lo valida el equipo de grupo en el ERP.</p>
    ${chipGroup('f-cursos', CURSOS_OPC, a.cursos)}
  </div>
  <div class="card"><h3><i class="fas fa-star"></i> Especialidades e intereses</h3>
    ${chipGroup('f-especialidades', ESPECIALIDADES_OPC, a.especialidades)}
  </div>
  <div class="card"><h3><i class="fas fa-certificate"></i> Certificaciones vigentes</h3>
    ${chipGroup('f-certificaciones', CERTIFICACIONES_OPC, a.certificaciones)}
  </div>
  <div class="card"><h3><i class="fas fa-hands-helping"></i> Acompañamiento y PPF</h3>
    <p class="hint">El Acompañante Personal (AP) apoya tu incorporación; el Asesor Personal de Formación (APF) guía tu Plan Personal de Formación.</p>
    <div class="grid2">
      <div class="fg"><label>¿En proceso de formación?</label><select id="f-enformacion"><option value="no" ${!a.en_formacion?'selected':''}>No</option><option value="si" ${a.en_formacion?'selected':''}>Sí</option></select></div>
      <div class="fg"><label>Etapa de tu PPF</label><select id="f-etapa-ppf"><option value="">Selecciona...</option>${ETAPAS_PPF.map(o=>`<option ${o===a.etapa_ppf?'selected':''}>${o}</option>`).join('')}</select></div>
      <div class="fg"><label>Tu Acompañante Personal (AP)</label><input id="f-ap" value="${a.ap_nombre||''}"></div>
      <div class="fg"><label>Tu Asesor/a de Formación (APF)</label><input id="f-apf" value="${a.apf_nombre||''}"></div>
    </div>
    <div style="margin-top:14px;text-align:right"><button class="btn" onclick="guardarFormacion()"><i class="fas fa-save"></i> Guardar formación</button></div>
  </div>`;
}

async function guardarFormacion(){
  const ok = await guardarAdulto({
    cursos: chipsSeleccion('f-cursos'),
    especialidades: chipsSeleccion('f-especialidades'),
    certificaciones: chipsSeleccion('f-certificaciones'),
    en_formacion: $('f-enformacion').value === 'si',
    etapa_ppf: $('f-etapa-ppf').value,
    ap_nombre: $('f-ap').value.trim(),
    apf_nombre: $('f-apf').value.trim()
  });
  if (ok) toast('✅ Formación e intereses actualizados.');
}
