    window.crearReunion=async function(){
        const titulo=document.getElementById('nTitulo').value.trim();
        const fecha=document.getElementById('nFecha').value;
        if(!titulo||!fecha){alert('El título y la fecha son obligatorios.');return;}
        const{data,error}=await db.from('reuniones').insert({
            titulo,
            unidad:document.getElementById('nUnidad').value,
            fecha,
            hora_inicio:document.getElementById('nHoraI').value||null,
            hora_fin:document.getElementById('nHoraF').value||null,
            lugar:document.getElementById('nLugar').value.trim()||null,
            objetivo:document.getElementById('nObjetivo').value.trim()||null,
            estado:'planificada',actividades:[],creado_en:new Date().toISOString()
        }).select().single();
        if(error){alert('Error al guardar: '+error.message);return;}
        document.getElementById('nTitulo').value='';
        document.getElementById('nObjetivo').value='';
        document.getElementById('nLugar').value='';
        await cargarReuniones();
        seleccionarReunion(data);
    };

    window.cargarReuniones=async function(){
        const u=document.getElementById('filtroUnidadR').value;
        const e=document.getElementById('filtroEstado').value;
        let q=db.from('reuniones').select('*').order('fecha',{ascending:false});
        if(u)q=q.eq('unidad',u);
        if(e)q=q.eq('estado',e);
        const{data}=await q;
        const lista=document.getElementById('listaReuniones');
        if(!data?.length){lista.innerHTML='<div class="empty"><i class="fas fa-calendar-times"></i>No hay reuniones.</div>';return;}
        lista.innerHTML=data.map(r=>{
            const c=COLOR_UNIDAD[r.unidad]||'#3498db';
            const f=r.fecha?new Date(r.fecha+'T12:00:00').toLocaleDateString('es-CL',{weekday:'short',day:'2-digit',month:'short'}):'—';
            const nActs=(r.actividades||[]).length;
            return`<div class="reunion-item ${reunionActiva?.id===r.id?'sel':''}" onclick="seleccionarReunion(${JSON.stringify(r).replace(/"/g,'&quot;')})">
                <div class="ri-header">
                    <div class="ri-dot" style="background:${c}"></div>
                    <div class="ri-info">
                        <h4>${r.titulo}</h4>
                        <div class="meta">
                            <span><i class="far fa-calendar"></i>${f}</span>
                            ${r.hora_inicio?`<span><i class="far fa-clock"></i>${r.hora_inicio}</span>`:''}
                            <span><i class="fas fa-users"></i>${r.unidad}</span>
                            <span class="estado-badge estado-${r.estado}">${r.estado}</span>
                        </div>
                    </div>
                    <div class="ri-actions">
                        <button class="btn btn-r btn-sm" onclick="event.stopPropagation();eliminarDirecto('${r.id}')"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
                ${nActs?`<p style="font-size:0.74rem;color:var(--texto-claro);margin-top:6px;margin-left:20px"><i class="fas fa-list"></i> ${nActs} actividad${nActs>1?'es':''}</p>`:''}
            </div>`;
        }).join('');
    };

    window.seleccionarReunion=function(r){
        if(typeof r==='string')r=JSON.parse(r);
        reunionActiva=r;
        document.getElementById('bienvenida').style.display='none';
        document.getElementById('panelDetalle').style.display='block';
        document.getElementById('detTitulo').textContent=r.titulo;
        const f=r.fecha?new Date(r.fecha+'T12:00:00').toLocaleDateString('es-CL',{weekday:'long',day:'numeric',month:'long',year:'numeric'}):'Sin fecha';
        document.getElementById('detFecha').innerHTML=`<i class="far fa-calendar"></i>${f}`;
        document.getElementById('detHora').innerHTML=`<i class="far fa-clock"></i>${r.hora_inicio||'—'} — ${r.hora_fin||'—'}`;
        document.getElementById('detLugar').innerHTML=`<i class="fas fa-map-marker-alt"></i>${r.lugar||'Sin definir'}`;
        document.getElementById('detUnidad').innerHTML=`<i class="fas fa-users"></i>${r.unidad}`;
        document.getElementById('editObjetivo').value=r.objetivo||'';
        document.getElementById('editNotas').value=r.notas||'';
        document.getElementById('editAsistentes').value=r.asistentes_esperados||'';
        // Botón "Ver Acta" — mostrar si ya existe el doc
        const btnActa = document.getElementById('btnVerActa');
        if(r.acta_url){ btnActa.href=r.acta_url; btnActa.style.display='inline-flex'; }
        else { btnActa.style.display='none'; }
        renderActividades(r.actividades||[]);
        cargarReuniones();
    };

    function renderActividades(acts){
        const sorted=[...acts].sort((a,b)=>(a.hora||'').localeCompare(b.hora||''));
        document.getElementById('actTimeline').innerHTML=sorted.length?sorted.map((a,i)=>`
            <div class="act-item">
                <div class="act-time">${a.hora||'—'}</div>
                <div class="act-content">
                    <span class="act-tipo tipo-${a.tipo||'otro'}">${a.tipo||'otro'}</span>
                    <h5>${a.nombre}</h5>
                    ${a.desc?`<p>${a.desc}</p>`:''}
                </div>
                <button onclick="eliminarActividad(${i})" style="background:none;border:none;color:var(--texto-claro);cursor:pointer;font-size:0.9rem;margin-top:5px;padding:4px"><i class="fas fa-times"></i></button>
            </div>`).join(''):`<p style="font-size:0.83rem;color:var(--texto-claro);text-align:center;padding:14px">Sin actividades planificadas.</p>`;
    }

    window.agregarActividad=async function(){
        if(!reunionActiva)return;
        const nombre=document.getElementById('actNombre').value.trim();
        if(!nombre)return;
        const acts=[...(reunionActiva.actividades||[]),{hora:document.getElementById('actHora').value,tipo:document.getElementById('actTipo').value,nombre,desc:document.getElementById('actDesc').value.trim()}];
        await db.from('reuniones').update({actividades:acts}).eq('id',reunionActiva.id);
        reunionActiva.actividades=acts;
        document.getElementById('actNombre').value='';
        document.getElementById('actDesc').value='';
        renderActividades(acts);
    };

    window.eliminarActividad=async function(idx){
        if(!reunionActiva)return;
        const acts=(reunionActiva.actividades||[]).filter((_,i)=>i!==idx);
        await db.from('reuniones').update({actividades:acts}).eq('id',reunionActiva.id);
        reunionActiva.actividades=acts;renderActividades(acts);
    };

    window.guardarObjetivo=async function(){
        if(!reunionActiva)return;
        await db.from('reuniones').update({objetivo:document.getElementById('editObjetivo').value,notas:document.getElementById('editNotas').value}).eq('id',reunionActiva.id);
        reunionActiva.objetivo=document.getElementById('editObjetivo').value;
        reunionActiva.notas=document.getElementById('editNotas').value;
        alert('Guardado.');
    };

    window.cambiarEstado=async function(estado){
        if(!reunionActiva)return;
        await db.from('reuniones').update({estado}).eq('id',reunionActiva.id);
        reunionActiva.estado=estado;
        await cargarReuniones();
    };

    window.guardarAsistentes=async function(){
        if(!reunionActiva)return;
        const n=parseInt(document.getElementById('editAsistentes').value)||0;
        await db.from('reuniones').update({asistentes_esperados:n}).eq('id',reunionActiva.id);
        alert('Asistencia guardada.');
    };

    window.eliminarReunion=async function(){
        if(!reunionActiva||!confirm('¿Eliminar esta reunión?'))return;
        await db.from('reuniones').delete().eq('id',reunionActiva.id);
        reunionActiva=null;
        document.getElementById('bienvenida').style.display='block';
        document.getElementById('panelDetalle').style.display='none';
        await cargarReuniones();
    };

    window.eliminarDirecto=async function(id){
        if(!confirm('¿Eliminar esta reunión?'))return;
        await db.from('reuniones').delete().eq('id',id);
        if(reunionActiva?.id===id){reunionActiva=null;document.getElementById('bienvenida').style.display='block';document.getElementById('panelDetalle').style.display='none';}
        await cargarReuniones();
    };

    window.cambiarTab=function(tab,el){
        document.querySelectorAll('.tab').forEach(t=>t.classList.remove('act'));
        el.classList.add('act');
        ['tProg','tObjetivo','tInvitados','tEstado'].forEach(id=>document.getElementById(id).classList.remove('vis'));
        const map={programa:'tProg',objetivo:'tObjetivo',invitados:'tInvitados',estado:'tEstado'};
        document.getElementById(map[tab]).classList.add('vis');
        if(tab === 'invitados') cargarInvitables();
    };

    // ══════════════════════════════════════════════
    // INVITADOS: lee adultos_registros + mmbb_registrations (apoderados)
    // ══════════════════════════════════════════════
