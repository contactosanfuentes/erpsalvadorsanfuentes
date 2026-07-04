    window.toggleObjetivo=async function(jId,area,idx){
        const prog=progresiones[jId]||{joven_id:jId};
        const obj=getObjetivos(prog);
        if(!obj[area]||!obj[area][idx])return;
        const yaAprobado = obj[area][idx].estado==='aprobado'||obj[area][idx].logrado===true;
        obj[area][idx].estado = yaAprobado ? 'propuesto' : 'aprobado';
        obj[area][idx].logrado = !yaAprobado;
        // Actualiza progresion_jovenes manteniendo la estructura existente
        const payload={joven_id:jId};
        if(prog.territorios){payload.territorios={...prog.territorios,objetivos:obj};}
        else{payload.semillero={...prog.semillero,objetivos:obj};}
        await db.from('progresion_jovenes').upsert(payload,{onConflict:'joven_id'});
        progresiones[jId]={...prog,...payload};
        renderObjetivos(jovenActivo,progresiones[jId]);
        renderGrid(todosJovenes.filter(j=>true));// re-render sutil
    };

    window.cambiarEtapa=async function(etapa){
        if(!jovenActivo)return;
        const prog=progresiones[jovenActivo.id]||{};
        await db.from('progresion_jovenes').upsert({joven_id:jovenActivo.id,...prog,etapa_actual:etapa},{onConflict:'joven_id'});
        progresiones[jovenActivo.id]={...prog,joven_id:jovenActivo.id,etapa_actual:etapa};
        document.getElementById('detSub').textContent=`${jovenActivo.unidad||'—'} · ${jovenActivo.run||'—'} · Etapa: ${etapa}`;
        renderStepper(jovenActivo,progresiones[jovenActivo.id]);
        renderEtapaSelector(jovenActivo,progresiones[jovenActivo.id]);
        actualizarStats();
        filtrar();
    };

    window.agregarEsp=async function(){
        const nombre=document.getElementById('nuevaEsp').value.trim();if(!nombre)return;
        const prog=progresiones[jovenActivo.id]||{joven_id:jovenActivo.id};
        const esps=[...(prog.especialidades||[]),{nombre,fecha:new Date().toISOString().split('T')[0]}];
        await db.from('progresion_jovenes').upsert({...prog,joven_id:jovenActivo.id,especialidades:esps},{onConflict:'joven_id'});
        progresiones[jovenActivo.id]={...prog,especialidades:esps};
        document.getElementById('nuevaEsp').value='';
        renderEspecialidades(progresiones[jovenActivo.id]);
        actualizarStats();
    };

    window.eliminarEsp=async function(idx){
        const prog=progresiones[jovenActivo.id]||{};
        const esps=(prog.especialidades||[]).filter((_,i)=>i!==idx);
        await db.from('progresion_jovenes').upsert({...prog,joven_id:jovenActivo.id,especialidades:esps},{onConflict:'joven_id'});
        progresiones[jovenActivo.id]={...prog,especialidades:esps};
        renderEspecialidades(progresiones[jovenActivo.id]);
        actualizarStats();
    };

    window.cerrarDetalle=function(){document.getElementById('detallePanel').classList.remove('show');document.querySelectorAll('.jcard').forEach(c=>c.classList.remove('selected'));jovenActivo=null;};
    window.recargar=async function(){document.getElementById('gridJovenes').innerHTML='<div class="loading"><i class="fas fa-circle-notch fa-spin" style="font-size:2rem;margin-bottom:10px;display:block"></i>Recargando...</div>';await cargar();};

