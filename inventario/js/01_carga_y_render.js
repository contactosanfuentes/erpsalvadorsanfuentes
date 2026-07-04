    let todosItems=[];

    window.cargar=async function(){
        const{data,error}=await db.from('inventario_grupo').select('*').order('categoria').order('producto');
        if(error){document.getElementById('tbody').innerHTML=`<tr><td colspan="10"><div class="empty"><i class="fas fa-exclamation-triangle" style="color:var(--danger)"></i>${error.message}</div></td></tr>`;return;}
        todosItems=(data||[]).map(r=>({...r}));
        actualizarStats();
        renderTabla(todosItems);
    };

    function actualizarStats(){
        document.getElementById('stTotal').textContent=todosItems.length;
        document.getElementById('stBueno').textContent=todosItems.filter(i=>i.estado==='bueno').length;
        document.getElementById('stDeter').textContent=todosItems.filter(i=>i.estado==='deteriorado').length;
        document.getElementById('stRep').textContent=todosItems.filter(i=>i.estado==='reparacion').length;
        document.getElementById('stPrest').textContent=todosItems.filter(i=>(i.cantidad_prestada||0)>0).length;
        const val=todosItems.reduce((s,i)=>s+(parseFloat(i.valor_estimado)||0),0);
        document.getElementById('stValor').textContent='$'+val.toLocaleString('es-CL');
    }

    function renderTabla(lista){
        if(!lista.length){document.getElementById('tbody').innerHTML='<tr><td colspan="10"><div class="empty"><i class="fas fa-box-open"></i>Sin ítems en el inventario.</div></td></tr>';return;}
        document.getElementById('tbody').innerHTML=lista.map(item=>{
            const total=item.cantidad_total||1;
            const prestada=item.cantidad_prestada||0;
            const disp=total-prestada;
            const filaCls=prestada>0?'prestado':'';
            const prestamoBadge=prestada>0
                ? `<span class="badge-prestamo" onclick="verPrestamos('${item.id}','${esc(item.producto)}')" title="Ver préstamos activos"><i class="fas fa-handshake"></i> ${prestada}/${total} prestada${prestada>1?'s':''}</span>`
                : `<span class="badge-disponible"><i class="fas fa-check"></i> ${disp} disp.</span>`;
            return`<tr class="${filaCls}">
                <td><input class="editable" value="${esc(item.producto||'')}" onchange="update('${item.id}','producto',this.value)"></td>
                <td>
                    <div style="display:flex;gap:4px;align-items:center">
                        <input class="editable editable-num" value="${total}" type="number" min="0" onchange="update('${item.id}','cantidad_total',parseInt(this.value)||0)" title="Cantidad total">
                        <span style="font-size:0.78rem;color:var(--texto-claro)">${esc(item.cantidad||'')}</span>
                    </div>
                </td>
                <td>${prestamoBadge}</td>
                <td><select class="cel-select" onchange="update('${item.id}','categoria',this.value)">
                    ${['Campamento','Cocina','Uniformes','Herramientas','Actividades','Documentos','General'].map(c=>`<option ${item.categoria===c?'selected':''}>${c}</option>`).join('')}
                </select></td>
                <td>${renderDistribucion(item)}</td>
                <td><select class="cel-select" onchange="update('${item.id}','estado',this.value)">
                    ${['bueno','deteriorado','reparacion','extraviado'].map(e=>`<option value="${e}" ${item.estado===e?'selected':''}>${{bueno:'Bueno',deteriorado:'Deteriorado',reparacion:'En reparación',extraviado:'Extraviado'}[e]}</option>`).join('')}
                </select></td>
                <td><input class="editable" value="${esc(item.responsable||'')}" onchange="update('${item.id}','responsable',this.value)"></td>
                <td><input class="editable" value="${esc(item.ubicacion||'')}" onchange="update('${item.id}','ubicacion',this.value)"></td>
                <td><input class="editable editable-num" value="${item.valor_estimado||''}" type="number" onchange="update('${item.id}','valor_estimado',parseFloat(this.value)||0)"></td>
                <td>
                    ${prestada>0?`<button class="btn btn-mo btn-sm" onclick="verPrestamos('${item.id}','${esc(item.producto)}')" title="Ver préstamos"><i class="fas fa-handshake"></i></button> `:''}
                    <button class="btn btn-r btn-sm" onclick="eliminar('${item.id}',${prestada})" title="Eliminar"><i class="fas fa-trash"></i></button>
                </td>
            </tr>`;
        }).join('');
    }

    function esc(s){return String(s||'').replace(/"/g,'&quot;').replace(/</g,'&lt;');}

    // ── Render de la columna "Distribución" con badges por unidad ──
    const COLORES_UNIDAD = {
        Bandada: '#4169E1', Manada: '#FFD100', Tropa: '#00853F',
        Compañía: '#40E0D0', Avanzada: '#8B5CF6', Clan: '#E31837',
        Caminantes: '#E31837', Grupo: '#0E2586'
    };
    function renderDistribucion(item){
        const dist = textoADistribucion(item.unidad_responsable);
        const entries = Object.entries(dist).filter(([_, n]) => n !== 0);
        if(!entries.length){
            return `<button class="btn btn-sm" style="background:#f1f5f9;color:#64748b;border:1px dashed #cbd5e1;font-size:0.72rem;padding:4px 8px" onclick="abrirEditarDistribucion('${item.id}')"><i class="fas fa-plus"></i> Asignar</button>`;
        }
        const badges = entries.map(([u, n]) => {
            const color = COLORES_UNIDAD[u] || '#64748b';
            const txtColor = (u==='Manada' || u==='Bandada') ? '#4E110B' : 'white';
            return `<span style="display:inline-block;padding:2px 7px;border-radius:10px;background:${color};color:${txtColor};font-size:0.7rem;font-weight:700;margin:1px">${n !== null ? n+' · ' : ''}${u}</span>`;
        }).join('');
        return `<div style="display:flex;flex-wrap:wrap;gap:2px;align-items:center">
            ${badges}
            <button onclick="abrirEditarDistribucion('${item.id}')" title="Editar distribución" style="background:none;border:none;color:#64748b;cursor:pointer;font-size:0.76rem;margin-left:3px"><i class="fas fa-edit"></i></button>
        </div>`;
    }

    // ── Modal para editar la distribución de un ítem existente ──
