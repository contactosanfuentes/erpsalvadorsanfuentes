async function crearUsuario(){
  const nombre=document.getElementById('nu-nombre').value.trim();
  const apellido=document.getElementById('nu-apellido').value.trim();
  const alias=document.getElementById('nu-alias').value.trim().toLowerCase().replace(/\s+/g,'.');
  const password=document.getElementById('nu-password').value;
  const rol=document.getElementById('nu-rol').value;
  const unidad=document.getElementById('nu-unidad').value.trim();
  if(!nombre||!apellido||!alias){alert('Nombre, apellido y alias son obligatorios');return;}
  if(password.length<8){alert('La contraseña debe tener al menos 8 caracteres');return;}
  const email=alias+'@salvadorsanfuentes.org';
  const btn=document.getElementById('btn-crear');
  btn.disabled=true;btn.innerHTML='<i class="fas fa-spinner fa-spin"></i> Creando...';
  try{
    // 1. Crear en Google Workspace
    const wsRes=await wsCall('crear_usuario',{nombre,apellido,email_alias:alias,password});
    if(wsRes.error||wsRes.resultado?.error){
      alert('Error Google: '+(wsRes.error||wsRes.resultado?.message||'desconocido'));
      btn.disabled=false;btn.innerHTML='<i class="fas fa-check"></i> Crear Cuenta';return;
    }
    // 2. Pre-crear perfil en Supabase (sin UUID, buscado por email en primer login via trigger)
    // El trigger on_auth_user_created_google creará el perfil real cuando el usuario haga login.
    // Guardamos datos en una tabla temporal para que el trigger los use.
    await sb.from('perfiles').upsert({
      id:'00000000-0000-0000-0000-'+alias.replace(/[^a-z0-9]/g,'').padEnd(12,'0').slice(0,12),
      nombre_completo:nombre+' '+apellido,email,rol,
      unidad_asignada:unidad||null,cargo:rolesDef[rol]?.nombre_visible||rol,activo:true
    },{onConflict:'email',ignoreDuplicates:false}).select();
    alert('✅ Cuenta creada en Google Workspace.\n\nEl usuario debe iniciar sesión con Google SSO para activar su perfil en el ERP.\n\nEmail: '+email+'\nContraseña temporal: '+password);
    cerrarModal('modal-nuevo');
    await cargarUsuarios();
    renderApp();
  }finally{
    btn.disabled=false;btn.innerHTML='<i class="fas fa-check"></i> Crear Cuenta';
  }
}

// ════ SUSPENDER / REACTIVAR ════
async function suspenderUsuario(uid,email){
  if(!confirm('¿Suspender la cuenta Google de '+email+'? El usuario no podrá iniciar sesión.'))return;
  const r=await wsCall('suspender_usuario',{email});
  if(r.error){alert('Error: '+r.error);return;}
  await sb.from('perfiles').update({activo:false}).eq('id',uid);
  const u=usuarios.find(x=>x.id===uid);if(u)u.activo=false;
  renderERP();
}
async function reactivarUsuario(uid,email){
  const r=await wsCall('reactivar_usuario',{email});
  if(r.error){alert('Error: '+r.error);return;}
  await sb.from('perfiles').update({activo:true}).eq('id',uid);
  const u=usuarios.find(x=>x.id===uid);if(u)u.activo=true;
  renderERP();
}

// ════ RESET CONTRASEÑA ════
function abrirReset(email){
  _resetEmail=email;
  document.getElementById('reset-email-display').textContent=email;
  document.getElementById('reset-password').value='Scout2026!';
  abrirModal('modal-reset');
}
async function confirmarReset(){
  const pass=document.getElementById('reset-password').value;
  if(pass.length<8){alert('Mínimo 8 caracteres');return;}
  const r=await wsCall('resetear_password',{email:_resetEmail,password:pass});
  if(r.error){alert('Error: '+r.error);return;}
  alert('✅ Contraseña reseteada. El usuario deberá cambiarla al iniciar sesión.');
  cerrarModal('modal-reset');
}

// ══════════════════ TAB GOOGLE WORKSPACE ══════════════════
async function aprobarRegistro(id,tipo,emailInstitucional,emailPersonal,nombre,apellido){
  if(!confirm(`¿Aprobar registro de ${nombre} ${apellido}?\n\nSe activará la cuenta ${emailInstitucional} y se notificará a ${emailPersonal}.`))return;
  const btn=document.getElementById('btn-aprobar-'+tipo+'-'+id);
  if(btn){btn.disabled=true;btn.innerHTML='<i class="fas fa-spinner fa-spin"></i>';}
  try{
    // 1. Activar cuenta Google (unsuspend)
    const wsR=await wsCall('reactivar_usuario',{email:emailInstitucional});
    if(wsR.error){alert('Error Workspace: '+wsR.error);return;}
    // 2. Marcar como aprobado en Supabase
    const tabla=tipo==='joven'?'mmbb_registrations':'adultos_registros';
    const{data:{session}}=await sb.auth.getSession();
    await fetch(`${SUPA_URL}/rest/v1/${tabla}?id=eq.${id}`,{
      method:'PATCH',
      headers:{...Object.fromEntries([[' apikey',SUPA_KEY],['Authorization','Bearer '+(session?.access_token||SUPA_KEY)],['Content-Type','application/json']]),'apikey':SUPA_KEY,'Authorization':'Bearer '+(session?.access_token||SUPA_KEY),'Content-Type':'application/json'},
      body:JSON.stringify({pendiente_aprobacion:false,activo:true})
    });
    // 3. Enviar email de bienvenida con credenciales
    const htmlBienvenida=`<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;max-width:600px;margin:20px auto;">
<div style="background:linear-gradient(135deg,#001558,#15803d);padding:24px;border-radius:16px 16px 0 0;text-align:center;">
<h2 style="color:white;margin:0;">🎉 ¡Bienvenido/a al ERP Scout!</h2>
<p style="color:rgba(255,255,255,0.8);margin:6px 0 0;">Grupo Guías y Scouts Salvador Sanfuentes</p></div>
<div style="background:white;border:1px solid #e2e8f0;padding:24px;border-radius:0 0 16px 16px;">
<p>Hola <b>${nombre}</b>, tu registro ha sido aprobado. Ya puedes acceder al sistema del grupo.</p>
<div style="background:#f8fafc;border:2px solid #001558;border-radius:12px;padding:16px;margin:16px 0;">
<p style="margin:0 0 8px;font-weight:700;color:#001558;">Tus credenciales de acceso:</p>
<p style="margin:4px 0;">📧 <b>Correo:</b> ${emailInstitucional}</p>
<p style="margin:4px 0;">🔑 <b>Contraseña temporal:</b> Scout2026!</p>
<p style="margin:8px 0 0;font-size:0.82rem;color:#64748b;">Deberás cambiar la contraseña en tu primer inicio de sesión.</p></div>
<div style="text-align:center;margin-top:20px;">
<a href="${ERP_URL}" style="background:#001558;color:white;padding:12px 24px;border-radius:10px;text-decoration:none;font-weight:700;">Acceder al ERP</a></div>
<p style="color:#94a3b8;font-size:0.75rem;margin-top:16px;text-align:center;">Grupo Guías y Scouts Salvador Sanfuentes</p>
</div></body></html>`;
    await fetch(`${SUPA_URL}/functions/v1/send-email`,{
      method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({to:emailPersonal,subject:'✅ Acceso aprobado — ERP Scout Salvador Sanfuentes',html:htmlBienvenida})
    });
    alert(`✅ Aprobado. Se envió el acceso a ${emailPersonal}`);
    cargarWorkspace();
  }catch(e){alert('Error: '+e.message);}
}

async function rechazarRegistro(id,tipo,nombre){
  if(!confirm(`¿Rechazar el registro de ${nombre}?`))return;
  const tabla=tipo==='joven'?'mmbb_registrations':'adultos_registros';
  const{data:{session}}=await sb.auth.getSession();
  await fetch(`${SUPA_URL}/rest/v1/${tabla}?id=eq.${id}`,{
    method:'PATCH',
    headers:{'apikey':SUPA_KEY,'Authorization':'Bearer '+(session?.access_token||SUPA_KEY),'Content-Type':'application/json'},
    body:JSON.stringify({pendiente_aprobacion:false,activo:false})
  });
  cargarWorkspace();
}

