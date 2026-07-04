async function chgPerm(uid,perm,val,baseVal){
  const u=usuarios.find(x=>x.id===uid);if(!u)return;
  const extra={...(u.permisos_extra||{})};
  if(val===baseVal) delete extra[perm]; else extra[perm]=val;
  const{error}=await sb.from('perfiles').update({permisos_extra:extra}).eq('id',uid);
  if(error){alert('Error: '+error.message);return;}
  u.permisos_extra=extra;
}
async function cambiarRol(uid,rol){
  const{error}=await sb.from('perfiles').update({rol,permisos_extra:{}}).eq('id',uid);
  if(error){alert('Error: '+error.message);return;}
  const u=usuarios.find(x=>x.id===uid);
  if(u){u.rol=rol;u.permisos_extra={};}
}
async function cambiarUnidad(uid,unidad){
  await sb.from('perfiles').update({unidad_asignada:unidad||null}).eq('id',uid);
  const u=usuarios.find(x=>x.id===uid);if(u)u.unidad_asignada=unidad||null;
}
async function resetPerms(uid){
  if(!confirm('¿Restaurar todos los permisos al valor por defecto del rol?'))return;
  const{error}=await sb.from('perfiles').update({permisos_extra:{}}).eq('id',uid);
  if(error){alert('Error: '+error.message);return;}
  const u=usuarios.find(x=>x.id===uid);if(u)u.permisos_extra={};
  renderERP();
}

// ════ CREAR USUARIO (Google Workspace) ════
function abrirModal(id){document.getElementById(id).classList.add('active');}
function cerrarModal(id){document.getElementById(id).classList.remove('active');}

