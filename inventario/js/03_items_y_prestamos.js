    window.agregarItem=async function(){
        const prod=document.getElementById('nProd').value.trim();
        if(!prod)return alert('El nombre del producto es obligatorio.');
        const total = parseInt(document.getElementById('nCantTotal').value)||1;
        const dist = leerDistribucion();
        const sumDist = Object.values(dist).reduce((s,n)=>s+n, 0);

        // Validación: si se distribuye, la suma no debe superar el total
        if(sumDist > total){
            return alert(`La distribución (${sumDist}) supera la cantidad disponible (${total}). Ajusta los números.`);
        }
        // Si no hay distribución, se asume "Grupo" por defecto
        const distribucion = sumDist === 0 ? { Grupo: total } : dist;

        const{data,error}=await db.from('inventario_grupo').insert({
            producto:prod,
            cantidad:document.getElementById('nCantTxt').value||'unidades',
            cantidad_total:total,
            cantidad_prestada:0,
            categoria:document.getElementById('nCat').value,
            unidad_responsable:distribucionATexto(distribucion),
            estado:document.getElementById('nEstado').value,
            responsable:document.getElementById('nResp').value.trim()||null,
            ubicacion:document.getElementById('nUbic').value.trim()||null,
            valor_estimado:parseFloat(document.getElementById('nValor').value)||null,
            fecha_adquisicion:document.getElementById('nFecha').value||null
        }).select().single();
        if(error)return alert('Error: '+error.message);
        document.getElementById('modalNuevo').classList.remove('show');
        document.getElementById('nProd').value='';
        // Reset distribución
        document.querySelectorAll('#nDistBox .dist-inp').forEach(i => i.value = 0);
        actualizarTotalesDist();
        todosItems.push({...data});
        actualizarStats();filtrar();
    };

    window.verPrestamos=async function(itemId,itemNombre){
        document.getElementById('prestItemNombre').textContent=itemNombre;
        document.getElementById('modalPrestamos').classList.add('show');
        const body=document.getElementById('prestListaBody');
        body.innerHTML='<div class="empty"><i class="fas fa-circle-notch fa-spin"></i>Cargando...</div>';

        const{data:prestamos}=await db.from('inventario').select('id,cantidad_prestada,evento_id').eq('inventario_grupo_id',itemId);
        if(!prestamos||!prestamos.length){body.innerHTML='<div class="empty"><i class="fas fa-check-circle" style="color:var(--success)"></i>No hay préstamos activos.</div>';return;}

        const evIds=[...new Set(prestamos.map(p=>p.evento_id))];
        const{data:evs}=await db.from('eventos').select('id,nombre,fecha_inicio').in('id',evIds);
        const evMap={};(evs||[]).forEach(e=>evMap[e.id]={id:e.id,nombre:e.nombre,fecha_inicio:e.fecha_inicio});

        body.innerHTML=prestamos.map(p=>{
            const ev=evMap[p.evento_id];
            const f=ev?.fecha_inicio?new Date(ev.fecha_inicio+'T12:00:00').toLocaleDateString('es-CL',{day:'2-digit',month:'short',year:'numeric'}):'—';
            return`<div style="display:flex;justify-content:space-between;align-items:center;padding:11px 14px;background:#fef9e7;border-radius:9px;margin-bottom:7px;border:1px solid var(--amarillo)">
                <div>
                    <strong style="font-size:0.88rem;color:var(--texto-oscuro)">${ev?.nombre||'Evento'}</strong>
                    <div style="font-size:0.77rem;color:#78350f;margin-top:2px"><i class="far fa-calendar"></i> ${f} · Cantidad: <strong>${p.cantidad_prestada||0}</strong></div>
                </div>
                <button class="btn btn-v btn-sm" onclick="devolverPrestamo('${p.id}','${itemId}',${p.cantidad_prestada||0})"><i class="fas fa-undo"></i> Devolver</button>
            </div>`;
        }).join('');
    };

    window.devolverPrestamo=async function(inventarioEvId,inventarioGrupoId,cant){
        if(!confirm(`¿Devolver ${cant} unidad(es) al inventario?`))return;
        await db.from('inventario').delete().eq('id',inventarioEvId);
        const item=todosItems.find(i=>String(i.id)===String(inventarioGrupoId));
        if(item){
            const nuevaPrestada=Math.max(0,(item.cantidad_prestada||0)-cant);
            await db.from('inventario_grupo').update({cantidad_prestada:nuevaPrestada}).eq('id',inventarioGrupoId);
            item.cantidad_prestada=nuevaPrestada;
        }
        document.getElementById('modalPrestamos').classList.remove('show');
        await cargar();
    };

    window.filtrar=function(){
        const q=document.getElementById('buscar').value.toLowerCase();
        const cat=document.getElementById('filtCat').value;
        const est=document.getElementById('filtEst').value;
        const unid=document.getElementById('filtUnid').value;
        const prest=document.getElementById('filtPrest').value;
        renderTabla(todosItems.filter(i=>{
            const matchQ=!q||(i.producto||'').toLowerCase().includes(q)||(i.responsable||'').toLowerCase().includes(q)||(i.ubicacion||'').toLowerCase().includes(q);
            const matchC=!cat||i.categoria===cat;
            const matchE=!est||i.estado===est;
            const matchU=!unid || Object.keys(textoADistribucion(i.unidad_responsable)).includes(unid);
            let matchP=true;
            if(prest==='disponible')matchP=(i.cantidad_prestada||0)===0;
            else if(prest==='prestado')matchP=(i.cantidad_prestada||0)>0;
            return matchQ&&matchC&&matchE&&matchU&&matchP;
        }));
    };

    window.exportarCSV=function(){
        const rows=[['Producto','Cantidad total','Prestada','Disponible','Categoría','Unidad','Estado','Responsable','Ubicación','Valor CLP','Fecha Adquisición']];
        todosItems.forEach(i=>{
            const total=i.cantidad_total||1,prest=i.cantidad_prestada||0;
            rows.push([i.producto,total,prest,total-prest,i.categoria,i.unidad_responsable,i.estado,i.responsable||'',i.ubicacion||'',i.valor_estimado||'',i.fecha_adquisicion||'']);
        });
        const csv=rows.map(r=>r.map(c=>`"${String(c||'').replace(/"/g,'""')}"`).join(',')).join('\n');
        // Descargar CSV localmente
        const a=document.createElement('a');a.href=URL.createObjectURL(new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8;'}));
        a.download='inventario_grupo.csv';a.click();
        // Subir copia a Drive (carpeta Administración/Documentos)
        (async()=>{
            try {
                const csvB64 = btoa(unescape(encodeURIComponent('\ufeff'+csv)));
                const fecha = new Date().toLocaleDateString('es-CL').replace(/\//g,'-');
                await window.DriveHelper.subir({
                    supabaseClient: window.supabaseClient || db,
                    nombre: `Inventario_Grupo_${fecha}.csv`,
                    base64: csvB64,
                    mimeType: 'text/csv',
                    claveCarpeta: 'admin_documentos'
                });
                console.log('✅ Inventario guardado en Drive');
            } catch(e){ console.warn('Drive inventario:', e.message); }
        })();
    };

