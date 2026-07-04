    window.abrirEditarDistribucion = function(itemId){
        const item = todosItems.find(i => String(i.id) === String(itemId));
        if(!item) return;
        const dist = textoADistribucion(item.unidad_responsable);
        const total = item.cantidad_total || 1;

        const existente = document.getElementById('modalEditDist');
        if(existente) existente.remove();

        const modal = document.createElement('div');
        modal.id = 'modalEditDist';
        modal.className = 'modal-overlay show';
        const unidades = ['Bandada','Manada','Tropa','Compañía','Avanzada','Clan','Grupo'];
        modal.innerHTML = `
            <div class="modal-box">
                <h3><i class="fas fa-share-nodes" style="color:var(--azul-claro)"></i> Distribuir "${esc(item.producto)}"</h3>
                <p style="font-size:0.82rem;color:var(--texto-claro);margin-bottom:13px">Reparte las <strong>${total}</strong> unidades disponibles entre las unidades del grupo:</p>
                <div id="editDistBox" style="background:#f8fafc;border:1px solid var(--gris-claro);border-radius:8px;padding:12px;display:grid;grid-template-columns:1fr 1fr;gap:9px">
                    ${unidades.map(u => {
                        const color = COLORES_UNIDAD[u] || '#64748b';
                        const val = typeof dist[u] === 'number' ? dist[u] : 0;
                        return `<label style="display:flex;align-items:center;justify-content:space-between;gap:7px;padding:6px 10px;background:white;border-radius:6px;border-left:3px solid ${color}">
                            <span style="font-size:0.82rem;font-weight:600">${u}</span>
                            <input type="number" min="0" value="${val}" class="edit-dist-inp" data-unidad="${u}" style="width:65px;padding:4px 7px;border:1px solid var(--gris-claro);border-radius:5px;text-align:center">
                        </label>`;
                    }).join('')}
                </div>
                <div style="display:flex;justify-content:space-between;align-items:center;margin-top:11px;font-size:0.82rem;color:var(--texto-claro)">
                    <span>Total repartido: <strong id="editDistTotal" style="color:var(--azul-profundo)">0</strong> / ${total}</span>
                    <span id="editDistWarn" style="color:#dc2626;font-weight:600;display:none"><i class="fas fa-exclamation-triangle"></i> Excede el total</span>
                </div>
                <div class="modal-btns">
                    <button class="btn btn-cancel btn-sm" onclick="document.getElementById('modalEditDist').remove()">Cancelar</button>
                    <button class="btn btn-v btn-sm" onclick="guardarDistribucion('${itemId}')"><i class="fas fa-save"></i> Guardar</button>
                </div>
            </div>`;
        document.body.appendChild(modal);

        const recalc = () => {
            const inputs = modal.querySelectorAll('.edit-dist-inp');
            const sum = Array.from(inputs).reduce((s,i) => s + (parseInt(i.value)||0), 0);
            document.getElementById('editDistTotal').textContent = sum;
            document.getElementById('editDistWarn').style.display = sum > total ? 'inline' : 'none';
            document.getElementById('editDistTotal').style.color = sum > total ? '#dc2626' : (sum === total ? '#16a34a' : 'var(--azul-profundo)');
        };
        modal.addEventListener('input', recalc);
        recalc();
    };

    window.guardarDistribucion = async function(itemId){
        const modal = document.getElementById('modalEditDist');
        if(!modal) return;
        const item = todosItems.find(i => String(i.id) === String(itemId));
        if(!item) return;
        const total = item.cantidad_total || 1;

        const dist = {};
        modal.querySelectorAll('.edit-dist-inp').forEach(inp => {
            const n = parseInt(inp.value) || 0;
            if(n > 0) dist[inp.dataset.unidad] = n;
        });
        const sum = Object.values(dist).reduce((s,n)=>s+n, 0);
        if(sum > total){
            return alert(`La distribución (${sum}) supera la cantidad total disponible (${total}). Ajusta los números.`);
        }

        const nuevoValor = distribucionATexto(dist) || 'DIST:{}';
        await db.from('inventario_grupo').update({ unidad_responsable: nuevoValor }).eq('id', itemId);
        item.unidad_responsable = nuevoValor;
        modal.remove();
        filtrar();
    };

    window.update=async function(id,field,value){
        await db.from('inventario_grupo').update({[field]:value}).eq('id',id);
        const item=todosItems.find(i=>String(i.id)===String(id));
        if(item)item[field]=value;
        actualizarStats();filtrar();
    };

    window.eliminar=async function(id,prestada){
        if(prestada>0){alert('Este ítem tiene préstamos activos. Devuélvelos primero antes de eliminar.');return;}
        if(!confirm('¿Eliminar este ítem del inventario?'))return;
        await db.from('inventario_grupo').delete().eq('id',id);
        todosItems=todosItems.filter(i=>String(i.id)!==String(id));
        actualizarStats();filtrar();
    };

    // Helper: leer inputs de distribución
    function leerDistribucion(){
        const dist = {};
        document.querySelectorAll('#nDistBox .dist-inp').forEach(inp => {
            const n = parseInt(inp.value) || 0;
            if(n > 0) dist[inp.dataset.unidad] = n;
        });
        return dist;
    }
    // Helper: serializar a texto legible para unidad_responsable
    function distribucionATexto(dist){
        if(!dist || !Object.keys(dist).length) return null;
        return 'DIST:' + JSON.stringify(dist);
    }
    // Helper: leer desde texto guardado (retrocompatible con strings planos)
    function textoADistribucion(txt){
        if(!txt) return {};
        if(txt.startsWith('DIST:')){
            try { return JSON.parse(txt.slice(5)); } catch(e){ return {}; }
        }
        // Formato antiguo: "Tropa" → {Tropa: cantidad_total}
        return { [txt]: null };
    }

    // Recalcula el total distribuido y muestra el "Cantidad disponible" como límite
    function actualizarTotalesDist(){
        const total = Array.from(document.querySelectorAll('#nDistBox .dist-inp'))
            .reduce((s,i) => s + (parseInt(i.value)||0), 0);
        const max = parseInt(document.getElementById('nCantTotal').value) || 0;
        const elTotal = document.getElementById('nDistTotal');
        const elMax = document.getElementById('nDistMax');
        elTotal.textContent = total;
        elMax.textContent = max;
        elTotal.style.color = total > max ? '#dc2626' : (total === max ? '#16a34a' : 'var(--azul-profundo)');
    }
    // Listener global sobre el box de distribución
    document.getElementById('nDistBox').addEventListener('input', actualizarTotalesDist);
    document.getElementById('nCantTotal').addEventListener('input', actualizarTotalesDist);

