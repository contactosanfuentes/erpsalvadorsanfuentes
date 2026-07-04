async function wsCall(accion,params={}){
  try{
    const {data:{session}}=await sb.auth.getSession();
    const r=await fetch(WS_FN,{
      method:'POST',
      headers:{'Content-Type':'application/json','Authorization':'Bearer '+(session?.access_token||SUPA_KEY)},
      body:JSON.stringify({accion,...params})
    });
    return await r.json();
  }catch(e){return {error:e.message};}
}

async function init(){
  const {data:{user}}=await sb.auth.getUser();
  if(!user){render_noaccess('Debes iniciar sesión');return;}
  const {data:perfil}=await sb.from('perfiles').select('*').eq('id',user.id).single();
  miPerfil=perfil;
  const {data:roles}=await sb.from('roles_permisos').select('*');
  (roles||[]).forEach(r=>rolesDef[r.rol]=r);
  const perms={...(rolesDef[perfil?.rol]?.permisos||{}),...(perfil?.permisos_extra||{})};
  if(!perms.gestion_usuarios){render_noaccess('Solo administradores pueden gestionar usuarios.');return;}
  await cargarUsuarios();
  renderApp();
}

function render_noaccess(msg){
  document.getElementById('main-container').innerHTML=
    `<div class="no-access"><i class="fas fa-ban" style="font-size:3rem;color:#ef4444;margin-bottom:16px;display:block;"></i><h2>${msg}</h2></div>`;
}

async function cargarUsuarios(){
  const {data}=await sb.from('perfiles').select('*').order('nombre_completo');
  usuarios=data||[];
}

function renderApp(){
  document.getElementById('main-container').innerHTML=`
    <div class="alert-warn"><i class="fas fa-shield-alt"></i> Los cambios de permisos toman efecto de inmediato al guardar.</div>
    <div class="tabs">
      <button class="tab-btn active" onclick="switchTab('erp',this)"><i class="fas fa-users"></i> Usuarios ERP (${usuarios.length})</button>
      <button class="tab-btn" onclick="switchTab('workspace',this)"><i class="fab fa-google"></i> Google Workspace</button>
    </div>
    <div id="tab-erp" class="tab-content active"></div>
    <div id="tab-workspace" class="tab-content"></div>`;
  renderERP();
}

function switchTab(name,btn){
  document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(t=>t.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('tab-'+name).classList.add('active');
  if(name==='workspace') cargarWorkspace();
}

// ══════════════════ TAB ERP ══════════════════
function renderERP(filtro=''){
  const lista=usuarios.filter(u=>!filtro||
    (u.nombre_completo||'').toLowerCase().includes(filtro)||
    (u.email||'').toLowerCase().includes(filtro));
  document.getElementById('tab-erp').innerHTML=`
    <div class="toolbar">
      <input class="search-box" placeholder="🔍 Buscar usuario..." oninput="renderERP(this.value)" value="${filtro}">
      <button class="btn btn-primary" onclick="abrirModal('modal-nuevo')"><i class="fas fa-user-plus"></i> Nueva Cuenta</button>
    </div>
    ${lista.map(u=>renderUserCard(u)).join('')||'<p style="color:#94a3b8;text-align:center;padding:30px;">Sin usuarios</p>'}`;
}

function renderUserCard(u){
  const rd=rolesDef[u.rol]||{nivel:0,nombre_visible:'Sin rol'};
  const base=rd.permisos||{};
  const extra=u.permisos_extra||{};
  const eff={...base,...extra};
  const ini=(u.nombre_completo||'?').split(' ').map(p=>p[0]).slice(0,2).join('').toUpperCase();
  const avatarHtml=u.avatar_url
    ?`<img src="${u.avatar_url}" alt="${ini}">`
    :ini;
  const suspBadge=u.activo===false?'<span style="background:#fee2e2;color:#991b1b;font-size:0.68rem;font-weight:700;padding:2px 8px;border-radius:10px;margin-left:6px;">Suspendido</span>':'';

  const permItems=Object.keys(PLABELS).map(p=>{
    const eBase=base[p]||false;
    const eOverride=extra.hasOwnProperty(p)?extra[p]:null;
    const eEff=eOverride!==null?eOverride:eBase;
    const cls=eOverride===null?'':'permiso-override-'+(eOverride?'true':'false');
    return `<div class="permiso-item ${cls}">
      <div class="permiso-label"><span class="permiso-base" title="${eOverride!==null?'Excepción personal':'Del rol'}"></span>${PLABELS[p]}</div>
      <label class="switch"><input type="checkbox" ${eEff?'checked':''} onchange="chgPerm('${u.id}','${p}',this.checked,${eBase})">
      <span class="slider"></span></label></div>`;
  }).join('');

  const rolesOpts=['pendiente','lectura','comite','dirigente','coordinacion','admin'].map(r=>
    `<option value="${r}" ${u.rol===r?'selected':''}>${rolesDef[r]?.nombre_visible||r}</option>`).join('');
  const unidades=['','Bandada Pilmaikén Kalfü','Manada Kupëlwue Kadü','Compañía Antuwenüy','Tropa Manke Pillán','Avanzada Toki Pillan','Clan Kutral Raigüen','Equipo Adultos'];
  const unidOpts=unidades.map(un=>`<option value="${un}" ${u.unidad_asignada===un?'selected':''}>${un||'— Sin unidad —'}</option>`).join('');

  const isGS=u.email?.endsWith('@salvadorsanfuentes.org');

  return `<div class="user-card ${u.activo===false?'suspendido':''}">
    <div class="user-header">
      <div class="user-avatar">${avatarHtml}</div>
      <div class="user-info">
        <div class="user-name">${u.nombre_completo||'Sin nombre'}${suspBadge}</div>
        <div class="user-email">${u.email||''}</div>
      </div>
      <span class="rol-badge rol-${rd.nivel}">${rd.nombre_visible}</span>
    </div>
    <div class="user-controls">
      <div class="control-group"><label>Rol base</label>
        <select onchange="cambiarRol('${u.id}',this.value)">${rolesOpts}</select></div>
      <div class="control-group"><label>Unidad asignada</label>
        <select onchange="cambiarUnidad('${u.id}',this.value)">${unidOpts}</select></div>
    </div>
    <div class="user-actions">
      ${isGS && u.activo!==false?`<button class="btn btn-danger btn-sm" onclick="suspenderUsuario('${u.id}','${u.email}')"><i class="fas fa-ban"></i> Suspender</button>`:''}
      ${isGS && u.activo===false?`<button class="btn btn-success btn-sm" onclick="reactivarUsuario('${u.id}','${u.email}')"><i class="fas fa-check"></i> Reactivar</button>`:''}
      ${isGS?`<button class="btn btn-warn btn-sm" onclick="abrirReset('${u.email}')"><i class="fas fa-key"></i> Reset contraseña</button>`:''}
    </div>
    <details class="permisos-toggle">
      <summary><i class="fas fa-sliders-h"></i> Permisos individuales</summary>
      <div class="permisos-grid">${permItems}</div>
      <button class="btn btn-ghost btn-sm" style="margin-top:8px;" onclick="resetPerms('${u.id}')"><i class="fas fa-undo"></i> Restaurar del rol</button>
    </details>
    <div class="ap-section" ${rd.nivel<3?'style="display:none"':''}>
      <h4><i class="fas fa-user-friends"></i> Asesorados PPF</h4>
      <div class="ap-lista" id="ap-lista-${u.id}"><span class="ap-empty">Cargando...</span></div>
      <div class="asesorado-search"><input id="ap-buscar-${u.id}" placeholder="Buscar adulto para asignar como asesorado..." oninput="buscarAsesorado('${u.id}',this.value)">
      <div class="ap-resultados" id="ap-resultados-${u.id}"></div></div>
    </div>
  </div>`;
}

// Cargar asesorados al expandir detalles
document.addEventListener('toggle',e=>{
  if(e.target.tagName==='DETAILS'){
    const card=e.target.closest('.user-card');
    if(!card)return;
    const apLista=card.querySelector('[id^="ap-lista-"]');
    if(apLista&&e.target.open) cargarAsesorados(apLista.id.replace('ap-lista-',''));
  }
},true);

// ════ PERMISOS ════
