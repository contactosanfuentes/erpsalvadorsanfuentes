let _todosAdultos=null;

async function cargarAsesorados(uid){
  const div=document.getElementById('ap-lista-'+uid);if(!div)return;
  const{data}=await sb.from('asesores_personales')
    .select('id,asesorado_adulto_id,adultos_registros(nombres,apellido_paterno,unidad_rol)')
    .eq('asesor_perfil_id',uid).eq('activo',true);
  if(!data?.length){div.innerHTML='<span class="ap-empty">Sin asesorados asignados</span>';return;}
  div.innerHTML=data.map(ap=>{
    const a=ap.adultos_registros;
    const nom=a?((a.nombres||'')+' '+(a.apellido_paterno||'')).trim():'Desconocido';
    return `<div class="asesorado-badge"><span>${nom} <small style="opacity:0.6;">(${a?.unidad_rol||''})</small></span>
      <button onclick="quitarAsesorado(${ap.id},'${uid}')"><i class="fas fa-times"></i></button></div>`;
  }).join('');
}

async function buscarAsesorado(uid,q){
  const res=document.getElementById('ap-resultados-'+uid);
  if(!q||q.length<2){res.style.display='none';return;}
  if(!_todosAdultos){
    const{data}=await sb.from('adultos_registros').select('id,nombres,apellido_paterno,unidad_rol').order('apellido_paterno');
    _todosAdultos=data||[];
  }
  const ql=q.toLowerCase();
  const found=_todosAdultos.filter(a=>(a.nombres||'').toLowerCase().includes(ql)||(a.apellido_paterno||'').toLowerCase().includes(ql)).slice(0,8);
  res.innerHTML=found.length
    ?found.map(a=>`<div class="ap-resultado-item" onclick="asignarAsesorado('${uid}',${a.id},'${((a.nombres||'')+' '+(a.apellido_paterno||'')).trim().replace(/'/g,"\\'")}')">
      ${(a.nombres||'')+' '+(a.apellido_paterno||'')} <small style="color:#64748b;">${a.unidad_rol||''}</small></div>`).join('')
    :'<div class="ap-resultado-item" style="color:#94a3b8;">Sin resultados</div>';
  res.style.display='block';
}

async function asignarAsesorado(uid,adultoId,nombre){
  document.getElementById('ap-resultados-'+uid).style.display='none';
  document.getElementById('ap-buscar-'+uid).value='';
  const{data:{user}}=await sb.auth.getUser();
  const{error}=await sb.from('asesores_personales').upsert(
    {asesor_perfil_id:uid,asesorado_adulto_id:adultoId,asignado_por:user?.id,activo:true},
    {onConflict:'asesor_perfil_id,asesorado_adulto_id'});
  if(error){alert('Error: '+error.message);return;}
  await cargarAsesorados(uid);
}

async function quitarAsesorado(apId,uid){
  if(!confirm('¿Quitar este asesorado?'))return;
  await sb.from('asesores_personales').update({activo:false}).eq('id',apId);
  await cargarAsesorados(uid);
}

