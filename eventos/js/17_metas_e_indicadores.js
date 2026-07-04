    function renderMetas() {
        const container = document.getElementById('metas-container');
        if (!container) return;
        let html = '';
        metas.forEach((meta, mIdx) => {
            html += `
                <div class="meta-card">
                    <div style="display:flex; justify-content:space-between; align-items:center; border-bottom: 2px solid var(--border-color); padding-bottom: 10px; margin-bottom: 15px;">
                        <h3 style="margin: 0; color: var(--azul-profundo);">Meta ${mIdx+1}</h3>
                        <button class="btn btn-danger btn-sm" onclick="eliminarMeta(${mIdx})"><i class="fas fa-trash"></i></button>
                    </div>
                    <div style="display:grid; grid-template-columns:1fr 100px 100px; gap:10px; margin-bottom:15px;">
                        <input type="text" placeholder="Descripción" value="${meta.descripcion || ''}" onchange="actualizarMeta(${mIdx}, 'descripcion', this.value)">
                        <input type="number" placeholder="Valor" value="${meta.valor_esperado || ''}" onchange="actualizarMeta(${mIdx}, 'valor_esperado', this.value)">
                        <input type="text" placeholder="Unidad" value="${meta.unidad || ''}" onchange="actualizarMeta(${mIdx}, 'unidad', this.value)">
                    </div>
                    <div><strong>Indicadores:</strong><div>
                        ${meta.indicadores ? meta.indicadores.map((ind, iIdx) => `
                            <div style="display:flex; align-items:center; gap:10px; margin:8px 0; background:var(--gris-fondo); padding:8px; border-radius:8px;">
                                <input type="checkbox" ${ind.cumplido ? 'checked' : ''} onchange="toggleIndicador(${mIdx}, ${iIdx}, this.checked)">
                                <input type="text" style="flex:1; border:none; background:transparent;" placeholder="Descripción" value="${ind.descripcion}" onchange="actualizarIndicador(${mIdx}, ${iIdx}, 'descripcion', this.value)">
                                <button class="btn btn-danger btn-sm" onclick="eliminarIndicador(${mIdx}, ${iIdx})"><i class="fas fa-times"></i></button>
                            </div>
                        `).join('') : ''}
                    </div><button class="btn btn-success btn-sm" onclick="agregarIndicador(${mIdx})" style="margin-top:10px;"><i class="fas fa-plus"></i> Añadir Indicador</button></div>
                </div>
            `;
        });
        if (metas.length === 0) html = '<p>No hay metas. Agrega una para empezar.</p>';
        container.innerHTML = html;
    }

    window.agregarMeta = function() { metas.push({ id: Date.now(), descripcion: '', valor_esperado: '', unidad: '', indicadores: [] }); renderMetas(); }
    window.eliminarMeta = function(idx) { metas.splice(idx, 1); renderMetas(); }
    window.actualizarMeta = function(idx, campo, valor) { metas[idx][campo] = valor; }
    window.agregarIndicador = function(mIdx) { metas[mIdx].indicadores.push({ descripcion: '', cumplido: false }); renderMetas(); }
    window.eliminarIndicador = function(mIdx, iIdx) { metas[mIdx].indicadores.splice(iIdx, 1); renderMetas(); }
    window.actualizarIndicador = function(mIdx, iIdx, campo, valor) { metas[mIdx].indicadores[iIdx][campo] = valor; }
    window.toggleIndicador = function(mIdx, iIdx, cumplido) { metas[mIdx].indicadores[iIdx].cumplido = cumplido; }

    window.guardarObjetivoGeneral = async function() {
        if (!eventoActual) return;
        const obj = document.getElementById('objetivo-general').value;
        try{ await supabaseClient.from('objetivos_evento').upsert({ evento_id: eventoActual.id, objetivo_general: obj }); }catch(e){}
        customAlert('Objetivo guardado exitosamente');
    }

    window.guardarMetas = async function() {
        if (!eventoActual) return;
        try {
            const { data: mData } = await supabaseClient.from('metas_evento').select('id').eq('evento_id', eventoActual.id);
            if (mData && mData.length > 0) {
                const mIds = mData.map(m => m.id);
                await supabaseClient.from('indicadores_meta').delete().in('meta_id', mIds);
                await supabaseClient.from('metas_evento').delete().in('id', mIds);
            }
            for (let i = 0; i < metas.length; i++) {
                const meta = metas[i];
                const { data } = await supabaseClient.from('metas_evento').insert({ evento_id: eventoActual.id, descripcion: meta.descripcion, valor_esperado: meta.valor_esperado ? parseFloat(meta.valor_esperado) : null, unidad: meta.unidad, orden: i }).select();
                if (meta.indicadores && meta.indicadores.length > 0 && data && data.length > 0) {
                    const inds = meta.indicadores.map((ind, j) => ({ meta_id: data[0].id, descripcion: ind.descripcion, cumplido: ind.cumplido || false, orden: j }));
                    await supabaseClient.from('indicadores_meta').insert(inds);
                }
            }
            customAlert('Metas guardadas exitosamente');
        } catch (e) { console.error(e); customAlert('Error al guardar metas'); }
    }

    async function cargarObjetivosCatalogo() {
        const { data } = await supabaseClient.from('objetivos_catalogo').select('*').order('id');
        if (data) objetivosCatalogo = data;
    }

    async function cargarObjetivosYMetas() {
        if (!eventoActual) { metas = []; document.getElementById('objetivo-general').value = ''; renderMetas(); return; }
        const { data: objData } = await supabaseClient.from('objetivos_evento').select('objetivo_general').eq('evento_id', eventoActual.id).maybeSingle();
        if (objData) document.getElementById('objetivo-general').value = objData.objetivo_general || '';
        const { data: mData } = await supabaseClient.from('metas_evento').select('*').eq('evento_id', eventoActual.id).order('orden');
        if (mData) {
            metas = [];
            for (const m of mData) {
                const { data: iData } = await supabaseClient.from('indicadores_meta').select('*').eq('meta_id', m.id).order('orden');
                metas.push({ id: m.id, descripcion: m.descripcion || '', valor_esperado: m.valor_esperado, unidad: m.unidad || '', indicadores: iData ? iData.map(i => ({ descripcion: i.descripcion, cumplido: i.cumplido })) : [] });
            }
        } else { metas = []; }
        renderMetas();
    }

    // ========== FUNCIONES DE IMPRESIÓN ADICIONALES (comprobantes) ==========
