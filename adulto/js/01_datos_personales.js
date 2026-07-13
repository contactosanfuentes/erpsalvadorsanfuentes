// ══════════ MIS DATOS: contacto, salud y emergencia (editables por el adulto) ══════════
const ALERGIAS_OPC = ['Asma','Diabetes','Alergias alimentarias','Alergias a medicamentos','Problemas cardíacos','Hipertensión','Epilepsia'];
const ISAPRES = ['Banmédica','Consalud','Cruz Blanca','Nueva Masvida','Vida Tres','Colmena Golden Cross','Fundación','Ferrosalud','Río Blanco','San Lorenzo'];
const GRUPOS_SANGRE = ['A+','A-','B+','B-','AB+','AB-','O+','O-','Desconocido'];

function chipGroup(id, opciones, seleccion){
  return `<div class="chips" id="${id}">` + opciones.map(o =>
    `<span class="chip ${(seleccion||[]).includes(o)?'on':''}" data-v="${o}" onclick="this.classList.toggle('on')">${o}</span>`).join('') + `</div>`;
}
function chipsSeleccion(id){ return [...document.querySelectorAll(`#${id} .chip.on`)].map(c => c.dataset.v); }
function opt(lista, val){ return lista.map(o => `<option ${o===val?'selected':''}>${o}</option>`).join(''); }

function renderDatos(){
  const a = adulto;
  $('sec-datos').innerHTML = `
  <div class="card"><h3><i class="fas fa-address-book"></i> Contacto y perfil</h3>
    <p class="hint">Estos datos son tuyos: mantenlos al día para que el grupo pueda ubicarte.</p>
    <div class="grid2">
      <div class="fg" style="grid-column:1/-1"><label>Domicilio completo</label><input id="d-domicilio" value="${a.domicilio||''}"></div>
      <div class="fg"><label>Teléfono móvil</label><input id="d-telefono" value="${a.telefono||''}"></div>
      <div class="fg"><label>Teléfono fijo</label><input id="d-fijo" value="${a.telefono_fijo||''}"></div>
      <div class="fg"><label>Profesión / oficio</label><input id="d-profesion" value="${a.profesion||''}"></div>
      <div class="fg"><label>Nacionalidad</label><input id="d-nacionalidad" value="${a.nacionalidad||''}"></div>
      <div class="fg" style="grid-column:1/-1"><label>Disponibilidad horaria</label><input id="d-disponibilidad" value="${a.disponibilidad||''}" placeholder="Ej: sábados todo el día, martes por la tarde"></div>
    </div>
  </div>
  <div class="card"><h3><i class="fas fa-heartbeat"></i> Información de salud</h3>
    <p class="hint">Esta información puede salvarte la vida en una actividad. Solo la ve el equipo responsable.</p>
    <div class="grid2">
      <div class="fg"><label>Previsión</label><select id="d-prevision"><option value="">Seleccionar...</option>${opt(['FONASA','ISAPRE','Ninguna'],a.prevision_salud)}</select></div>
      <div class="fg"><label>ISAPRE</label><select id="d-isapre"><option value="">Seleccionar...</option>${opt(ISAPRES,a.isapre_nombre)}</select></div>
      <div class="fg"><label>N° de afiliado</label><input id="d-afiliado" value="${a.numero_afiliado||''}"></div>
      <div class="fg"><label>Grupo sanguíneo</label><select id="d-sangre"><option value="">Seleccionar...</option>${opt(GRUPOS_SANGRE,a.grupo_sanguineo)}</select></div>
      <div class="fg"><label>¿Seguro complementario?</label><select id="d-seguro"><option value="no" ${!a.tiene_seguro_complementario?'selected':''}>No</option><option value="si" ${a.tiene_seguro_complementario?'selected':''}>Sí</option></select></div>
      <div class="fg"><label>Aseguradora</label><input id="d-aseguradora" value="${a.aseguradora||''}"></div>
      <div class="fg" style="grid-column:1/-1"><label>N° de póliza</label><input id="d-poliza" value="${a.numero_poliza||''}"></div>
    </div>
    <div class="fg" style="margin-top:12px"><label>Alergias / condiciones relevantes</label>${chipGroup('d-alergias', ALERGIAS_OPC, a.alergias)}</div>
  </div>
  <div class="card"><h3><i class="fas fa-phone-volume"></i> Contacto de emergencia</h3>
    <div class="grid2">
      <div class="fg"><label>Nombre completo</label><input id="d-em-nombre" value="${a.emergencia_nombre||''}"></div>
      <div class="fg"><label>Parentesco</label><input id="d-em-parentesco" value="${a.emergencia_parentesco||''}"></div>
      <div class="fg"><label>Teléfono</label><input id="d-em-telefono" value="${a.emergencia_telefono||''}"></div>
      <div class="fg"><label>Correo (opcional)</label><input id="d-em-email" value="${a.emergencia_email||''}"></div>
    </div>
    <div style="margin-top:14px;text-align:right"><button class="btn" onclick="guardarDatos()"><i class="fas fa-save"></i> Guardar mis datos</button></div>
  </div>
  ${tarjetaInstitucional()}`;
}

async function guardarDatos(){
  const ok = await guardarAdulto({
    domicilio: $('d-domicilio').value.trim(), telefono: $('d-telefono').value.trim(),
    telefono_fijo: $('d-fijo').value.trim(), profesion: $('d-profesion').value.trim(),
    nacionalidad: $('d-nacionalidad').value.trim(), disponibilidad: $('d-disponibilidad').value.trim(),
    prevision_salud: $('d-prevision').value, isapre_nombre: $('d-isapre').value,
    numero_afiliado: $('d-afiliado').value.trim(), grupo_sanguineo: $('d-sangre').value,
    tiene_seguro_complementario: $('d-seguro').value === 'si',
    aseguradora: $('d-aseguradora').value.trim(), numero_poliza: $('d-poliza').value.trim(),
    alergias: chipsSeleccion('d-alergias'),
    emergencia_nombre: $('d-em-nombre').value.trim(), emergencia_parentesco: $('d-em-parentesco').value.trim(),
    emergencia_telefono: $('d-em-telefono').value.trim(), emergencia_email: $('d-em-email').value.trim()
  });
  if (ok) toast('✅ Datos actualizados. ¡Gracias por mantener tu ficha al día!');
}
