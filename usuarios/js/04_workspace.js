const ERP_URL='https://salvadorsanfuentes-erp.netlify.app';

async function cargarWorkspace(){
  const tab=document.getElementById('tab-workspace');
  tab.innerHTML='<div class="loading"><i class="fas fa-spinner fa-spin" style="font-size:1.5rem;color:#0E2586;margin-bottom:12px;display:block;"></i>Cargando...</div>';

  // Cargar pendientes de aprobación
  const pendR=await fetch(`${SUPA_URL}/rest/v1/rpc/obtener_pendientes_aprobacion`,{
    method:'POST',headers:{'apikey':SUPA_KEY,'Content-Type':'application/json'},body:'{}'});
  const pendientes=await pendR.json();
  const pendHtml=Array.isArray(pendientes)&&pendientes.length?`
    <div class="alert-warn" style="margin-bottom:16px;"><i class="fas fa-clock"></i>
      <b>${pendientes.length} registro(s) pendiente(s) de aprobación</b>
    </div>
    ${pendientes.map(p=>`
    <div class="ws-card" style="border-left:4px solid #f59e0b;background:#fffbeb;">
      <div style="flex:1;min-width:0;">
        <div style="font-weight:700;">${p.nombre} ${p.apellido} 
          <span style="font-size:0.7rem;background:${p.tipo==='joven'?'#f5f3ff':'#eff6ff'};color:${p.tipo==='joven'?'#6d28d9':'#2563eb'};padding:2px 8px;border-radius:10px;margin-left:4px;">${p.tipo}</span>
          <span style="font-size:0.7rem;background:#fef3c7;color:#92400e;padding:2px 8px;border-radius:10px;margin-left:4px;">${p.tipo_registro==='nuevo'?'🆕 Nuevo':'🔄 Actualización'}</span>
        </div>
        <div style="font-size:0.75rem;color:#64748b;">RUT: ${p.run||'—'} · ${p.unidad||'Sin unidad'}</div>
        <div style="font-size:0.75rem;color:#0E2586;font-weight:600;">📧 ${p.email_institucional||'Sin email generado'}</div>
        <div style="font-size:0.72rem;color:#94a3b8;">Notificar a: ${p.email_personal||'—'}</div>
      </div>
      <div style="display:flex;flex-direction:column;gap:6px;">
        <button id="btn-aprobar-${p.tipo}-${p.id}" class="btn btn-success btn-sm" onclick="aprobarRegistro(${p.id},'${p.tipo}','${p.email_institucional}','${p.email_personal||''}','${p.nombre}','${p.apellido}')">
          <i class="fas fa-check"></i> Aprobar</button>
        <button class="btn btn-danger btn-sm" onclick="rechazarRegistro(${p.id},'${p.tipo}','${p.nombre} ${p.apellido}')">
          <i class="fas fa-times"></i> Rechazar</button>
      </div>
    </div>`).join('')}
    <hr style="border:none;border-top:1px solid #e2e8f0;margin:20px 0;">
  `:'<div class="alert-info" style="margin-bottom:16px;"><i class="fas fa-check-circle"></i> Sin registros pendientes de aprobación.</div>';

  tab.innerHTML=pendHtml+'<div class="loading"><i class="fas fa-spinner fa-spin"></i> Cargando cuentas Google...</div>';

  const r=await wsCall('listar_usuarios');
  if(r.error||!r.resultado){
    const existing=document.getElementById('tab-workspace');
    existing.innerHTML=pendHtml+`<div class="alert-warn"><i class="fas fa-exclamation-triangle"></i> Error al conectar con Google Workspace: ${r.error||'Sin respuesta'}</div>`;return;
  }
  const gwUsers=r.resultado||[];
  // Cruzar con perfiles de Supabase por email
  const erpEmails=new Set(usuarios.map(u=>(u.email||'').toLowerCase()));
  const conErp=gwUsers.filter(u=>erpEmails.has(u.email.toLowerCase()));
  const sinErp=gwUsers.filter(u=>!erpEmails.has(u.email.toLowerCase()));

  tab.innerHTML=pendHtml+`
    <div class="alert-info"><i class="fas fa-info-circle"></i>
      <div><b>${gwUsers.length}</b> cuentas en Google Workspace &nbsp;·&nbsp; 
      <b style="color:#166534">${conErp.length}</b> con perfil ERP &nbsp;·&nbsp; 
      <b style="color:#92400e">${sinErp.length}</b> sin perfil ERP (aún no han iniciado sesión)</div>
    </div>
    ${sinErp.length?`<h3 style="font-size:0.85rem;font-weight:700;color:#92400e;margin-bottom:10px;"><i class="fas fa-clock"></i> Sin perfil ERP todavía (${sinErp.length})</h3>
    ${sinErp.map(u=>renderWsCard(u,false)).join('')}<hr style="border:none;border-top:1px solid #e2e8f0;margin:20px 0;">`:'' }
    <h3 style="font-size:0.85rem;font-weight:700;color:#166534;margin-bottom:10px;"><i class="fas fa-check-circle"></i> Con perfil ERP (${conErp.length})</h3>
    ${conErp.map(u=>renderWsCard(u,true)).join('')}`;
}

function renderWsCard(u,tieneErp){
  const estadoBadge=u.estado==='suspendido'
    ?'<span class="ws-status ws-suspendido">Suspendido</span>'
    :tieneErp?'<span class="ws-status ws-en-erp">En ERP</span>'
    :'<span class="ws-status ws-sin-erp">Sin perfil ERP</span>';
  const ini=u.nombre.split(' ').map(p=>p[0]||'').slice(0,2).join('').toUpperCase();
  const ultimoLogin=u.ultimoLogin==='nunca'?'Nunca':(new Date(u.ultimoLogin).toLocaleDateString('es-CL',{day:'2-digit',month:'2-digit',year:'2-digit'}));
  return `<div class="ws-card">
    <div class="user-avatar" style="width:40px;height:40px;font-size:0.85rem;">${ini}</div>
    <div style="flex:1;min-width:0;">
      <div style="font-weight:700;font-size:0.88rem;">${u.nombre}</div>
      <div style="font-size:0.75rem;color:#64748b;">${u.email}</div>
      <div style="font-size:0.72rem;color:#94a3b8;">Último login: ${ultimoLogin}</div>
    </div>
    ${estadoBadge}
    <div style="display:flex;gap:6px;flex-wrap:wrap;">
      ${u.estado!=='suspendido'
        ?`<button class="btn btn-danger btn-sm" onclick="wsAccion('suspender','${u.email}')"><i class="fas fa-ban"></i> Suspender</button>`
        :`<button class="btn btn-success btn-sm" onclick="wsAccion('reactivar','${u.email}')"><i class="fas fa-check"></i> Reactivar</button>`}
      <button class="btn btn-warn btn-sm" onclick="abrirReset('${u.email}')"><i class="fas fa-key"></i> Reset</button>
      ${!tieneErp?`<button class="btn btn-ghost btn-sm" onclick="wsAccion('invitar','${u.email}','${u.nombre}')"><i class="fas fa-envelope"></i> Recordar login</button>`:''}
    </div>
  </div>`;
}

async function wsAccion(tipo,email,nombre){
  if(tipo==='suspender'){
    if(!confirm('¿Suspender '+email+'?'))return;
    const r=await wsCall('suspender_usuario',{email});
    if(r.error){alert('Error: '+r.error);return;}
    // Actualizar en Supabase si tiene perfil
    await sb.from('perfiles').update({activo:false}).eq('email',email);
    alert('✅ Cuenta suspendida.');
    const u=usuarios.find(x=>x.email===email);if(u)u.activo=false;
    cargarWorkspace();
  } else if(tipo==='reactivar'){
    const r=await wsCall('reactivar_usuario',{email});
    if(r.error){alert('Error: '+r.error);return;}
    await sb.from('perfiles').update({activo:true}).eq('email',email);
    alert('✅ Cuenta reactivada.');
    const u=usuarios.find(x=>x.email===email);if(u)u.activo=true;
    cargarWorkspace();
  } else if(tipo==='invitar'){
    alert('Para activar su perfil ERP, '+nombre+' debe:\n\n1. Ir a '+window.location.origin+'\n2. Hacer clic en "Iniciar sesión con Google"\n3. Usar su cuenta '+email+'\n\nSu perfil se creará automáticamente.');
  }
}

// ══════════════════ ASESORADOS PPF ══════════════════
