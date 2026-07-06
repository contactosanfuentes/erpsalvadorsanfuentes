    async function cargarTodosLosDatos() {
        if (!eventoActual) {
            jovenes = []; adultos = []; ingresos = []; gastos = [];
            postasData = []; inventario = []; itemsPresupuesto = []; 
            menuItems = []; puntosCroquis = [];
            renderTodo();
            return;
        }

        try {
            // Cargar jóvenes
            let { data: j } = await supabaseClient.from('jovenes').select('*').eq('evento_id', eventoActual.id);
            jovenes = j || [];
            
            // Cargar adultos
            let { data: a } = await supabaseClient.from('adultos').select('*').eq('evento_id', eventoActual.id);
            adultos = a || [];
            
            // Cargar ingresos
            let { data: i } = await supabaseClient.from('ingresos').select('*').eq('evento_id', eventoActual.id);
            ingresos = i || [];
            
            // Cargar gastos
            let { data: g } = await supabaseClient.from('gastos').select('*').eq('evento_id', eventoActual.id);
            gastos = g || [];
            
            // Cargar postas
            let { data: p } = await supabaseClient.from('postas').select('*').eq('evento_id', eventoActual.id).order('numero');
            postasData = (p || []).map(posta => {
                if (typeof posta.objetivos_educativos === 'string') try { posta.objetivos_educativos = JSON.parse(posta.objetivos_educativos); } catch { posta.objetivos_educativos = []; }
                else if (!posta.objetivos_educativos) posta.objetivos_educativos = [];
                return posta;
            });
            
            // Cargar inventario
            let { data: inv } = await supabaseClient.from('inventario').select('*').eq('evento_id', eventoActual.id);
            inventario = inv || [];
            
            // Cargar menú
            let { data: m } = await supabaseClient.from('menu_evento').select('*').eq('evento_id', eventoActual.id).order('dia_orden');
            menuItems = m || [];
            
            // Cargar puntos croquis
            let { data: pc } = await supabaseClient.from('puntos_croquis').select('*').eq('evento_id', eventoActual.id);
            puntosCroquis = pc || [];
            
            // Cargar configuraciones (entregas, presupuesto, etc.)
            await cargarPresupuesto(eventoActual.id);
            await cargarObjetivosYMetas();
            await cargarCroquisUrl();
            
            // Cargar configuración de columnas de entregas
            let { data: colsData } = await supabaseClient.from('entregas_columnas').select('columnas').eq('evento_id', eventoActual.id).maybeSingle();
            entregasColumnas = colsData ? colsData.columnas : ['Comida', 'Bebida'];
            
            // Cargar entregas jóvenes
            let { data: entregasJ } = await supabaseClient.from('entregas_jovenes').select('*').eq('evento_id', eventoActual.id);
            entregasJovenes = {};
            if (entregasJ) {
                entregasJ.forEach(e => { entregasJovenes[e.patrulla_id] = e.entregas; });
            }
            
            // Cargar entregas adultos
            let { data: entregasA } = await supabaseClient.from('entregas_adultos').select('*').eq('evento_id', eventoActual.id);
            entregasAdultos = {};
            if (entregasA) {
                entregasA.forEach(e => { entregasAdultos[e.adulto_id] = e.entregas; });
            }
            
            // Cargar pasaportes
            let { data: pas } = await supabaseClient.from('pasaportes').select('*').eq('evento_id', eventoActual.id);
            pasaportes = {};
            if (pas) {
                pas.forEach(p => { pasaportes[p.patrulla_id] = { postaInicio: p.posta_inicio, puntuaciones: p.puntuaciones }; });
            }
            
            // Cargar planilla_data
            let { data: pl } = await supabaseClient.from('planilla_data').select('*').eq('evento_id', eventoActual.id);
            planillaData = {};
            if (pl) {
                pl.forEach(item => {
                    if (!planillaData[item.patrulla_id]) planillaData[item.patrulla_id] = {};
                    if (!planillaData[item.patrulla_id][item.posta_id]) planillaData[item.patrulla_id][item.posta_id] = [];
                    planillaData[item.patrulla_id][item.posta_id][item.criterio_idx] = item.valor;
                });
            }
            
            // Cargar puntuaciones
            let { data: pts } = await supabaseClient.from('puntuaciones').select('*').eq('evento_id', eventoActual.id);
            puntuaciones = {};
            if (pts) {
                pts.forEach(p => {
                    if (!puntuaciones[p.patrulla_id]) puntuaciones[p.patrulla_id] = [];
                    puntuaciones[p.patrulla_id][p.posta_id] = p.valor;
                });
            }
            
            // Cargar reglas pasaporte (desde localStorage como antes, pero podemos guardarlas en tabla si se desea)
            const localKey = 'conf_evt_' + eventoActual.id;
            let conf = JSON.parse(localStorage.getItem(localKey) || '{}');
            if (conf.reglasPasaporte) document.getElementById('pasaporte-reglas').value = conf.reglasPasaporte;
            
            document.getElementById('evento-titulo').value = eventoActual.nombre;
            document.getElementById('evento-fecha').value = eventoActual.fecha_evento || '';
            
            // Cargar estado de publicación y opciones de inscripción
            const estaPublicado = eventoActual.publicado === true;
            const toggleCb = document.getElementById('toggle-publicado');
            toggleCb.checked = estaPublicado;
            actualizarUIPublicado(estaPublicado);
            actualizarUIFichaSalud(eventoActual.pide_ficha_salud === true);
            actualizarUIDieta(eventoActual.pide_dieta_especial === true);
            if (typeof actualizarUITipoEvento === 'function') actualizarUITipoEvento(eventoActual.tipo || 'interno');
            
            renderTodo();
        } catch (error) {
            console.error('Error cargando datos:', error);
        }
    }

    function renderTodo() {
        renderJovenes();
        renderAdultos();
        renderIngresos();
        renderGastos();
        renderPostas();
        renderPlanilla();
        renderPuntuacion();
        actualizarSelectorPasaporte();
        renderCroquis();
        renderInventario();
        renderMenu();
        renderEntregas();
        renderPresupuesto();
        updateTotalsJovenes();
        updateTotalesRecursos();
    }

    window.guardarConfLocal = function() {
        if(!eventoActual) return;
        const localKey = 'conf_evt_' + eventoActual.id;
        const conf = {
            reglasPasaporte: document.getElementById('pasaporte-reglas').value,
            // no guardamos más en localStorage, todo en Supabase
        };
        localStorage.setItem(localKey, JSON.stringify(conf));
    }

    // ========== GESTIÓN DE EVENTOS ==========
    async function cargarEventos() {
        const { data, error } = await supabaseClient.from('eventos').select('*').order('creado_en', { ascending: false });
        if (!error) {
            const select = document.getElementById('selector-evento');
            select.innerHTML = '<option value="">-- Seleccionar Evento --</option>';
            data.forEach(evento => {
                const option = document.createElement('option');
                option.value = evento.id; option.textContent = (evento.codigo ? '[' + evento.codigo + '] ' : '') + evento.nombre;
                select.appendChild(option);
            });
        }
    }

    async function abrirImportarDesdeProyecto() {
        const modal = document.createElement('div');
        modal.id = 'modal-importar-proyecto';
        modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;';
        modal.innerHTML = `<div style="background:white;border-radius:16px;max-width:650px;width:100%;max-height:80vh;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,0.3);"><div style="background:linear-gradient(135deg,#8b5cf6,#6d28d9);padding:16px 24px;display:flex;justify-content:space-between;align-items:center;"><div><h3 style="color:white;margin:0;font-size:1rem;font-weight:800;"><i class="fas fa-file-import" style="margin-right:8px;"></i> Importar Proyecto como Evento</h3><p style="color:#c4b5fd;font-size:0.75rem;margin:2px 0 0;">Selecciona un proyecto vigente para crear un evento con sus datos.</p></div><button onclick="document.getElementById('modal-importar-proyecto').remove()" style="background:none;border:none;color:white;font-size:1.2rem;cursor:pointer;"><i class="fas fa-times"></i></button></div><div id="lista-importar-proyectos" style="padding:16px 20px;max-height:60vh;overflow-y:auto;"><p style="text-align:center;color:#94a3b8;padding:20px;"><i class="fas fa-spinner fa-spin"></i> Cargando proyectos...</p></div></div>`;
        document.body.appendChild(modal);
        modal.onclick = (e) => { if (e.target === modal) modal.remove(); };

        try {
            const { data: allProg } = await supabaseClient.from('progresion_jovenes').select('joven_id, camino');
            const { data: allJov } = await supabaseClient.from('mmbb_registrations').select('id, nombres, apellidos, unidad');
            const proyectos = [];
            const seen = new Set();
            (allProg || []).forEach(p => {
                const j = (allJov || []).find(x => x.id === p.joven_id);
                (p.camino?.proyectos_colectivos || []).forEach(proy => {
                    if (proy.estado === 'Finalizado' || seen.has(proy.id)) return;
                    seen.add(proy.id);
                    proyectos.push({ ...proy, creadorNombre: j ? `${j.nombres} ${j.apellidos}` : 'Desconocido' });
                });
            });

            const container = document.getElementById('lista-importar-proyectos');
            if (!proyectos.length) { container.innerHTML = '<p style="text-align:center;color:#94a3b8;padding:30px;">No hay proyectos vigentes para importar.</p>'; return; }
            container.innerHTML = proyectos.map(p => {
                const sc = { 'En curso':'#3b82f6', 'Planificación':'#f59e0b', 'Evaluación':'#8b5cf6' };
                return `<div style="border:1px solid #e2e8f0;border-radius:12px;padding:12px 16px;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center;gap:12px;transition:border-color 0.2s;cursor:pointer;" onmouseover="this.style.borderColor='#8b5cf6'" onmouseout="this.style.borderColor='#e2e8f0'"><div style="flex:1;"><p style="font-weight:800;font-size:0.9rem;color:#1e293b;margin:0 0 2px;">${p.nombre}</p><div style="display:flex;gap:8px;font-size:0.72rem;color:#64748b;flex-wrap:wrap;"><span><i class="fas fa-leaf"></i> ${p.campoAccion || 'Sin campo'}</span><span><i class="fas fa-calendar"></i> ${p.inicio || 'Sin fecha'}</span><span style="background:${(sc[p.estado]||'#f59e0b')}20;color:${sc[p.estado]||'#f59e0b'};padding:1px 6px;border-radius:4px;font-weight:700;">${p.estado||'Planificación'}</span><span><i class="fas fa-user"></i> ${p.creadorNombre}</span></div></div><button onclick="importarProyectoComoEvento(${p.id}, '${p.nombre.replace(/'/g,"\\'")}', '${(p.inicio||'').replace(/'/g,"\\'")}', '${(p.termino||'').replace(/'/g,"\\'")}', '${(p.lugar||'').replace(/'/g,"\\'")}')" style="background:#8b5cf6;color:white;border:none;border-radius:8px;padding:8px 16px;font-weight:700;font-size:0.78rem;cursor:pointer;white-space:nowrap;"><i class="fas fa-download"></i> Importar</button></div>`;
            }).join('');
        } catch(e) { document.getElementById('lista-importar-proyectos').innerHTML = '<p style="color:#ef4444;text-align:center;">Error: '+e.message+'</p>'; }
    }

    async function importarProyectoComoEvento(proyId, nombre, inicio, termino, lugar) {
        try {
            // 1) Buscar los datos completos del proyecto en progresion_jovenes
            const { data: allProg } = await supabaseClient.from('progresion_jovenes').select('joven_id, camino');
            let proyectoCompleto = null;
            (allProg || []).forEach(p => {
                if (proyectoCompleto) return;
                (p.camino?.proyectos_colectivos || []).forEach(proy => {
                    if (proy.id === proyId) proyectoCompleto = proy;
                });
            });

            // 2) Crear el evento con descripción completa
            const descripcion = [
                proyectoCompleto?.objetivo ? `Objetivo: ${proyectoCompleto.objetivo}` : '',
                proyectoCompleto?.justificacion ? `Justificación: ${proyectoCompleto.justificacion}` : '',
                proyectoCompleto?.beneficiarios ? `Beneficiarios: ${proyectoCompleto.beneficiarios}` : '',
                proyectoCompleto?.campoAccion ? `Campo de Acción: ${proyectoCompleto.campoAccion}` : ''
            ].filter(Boolean).join('\n');

            const { data: evtData, error: evtErr } = await supabaseClient.from('eventos').insert({
                nombre, fecha_inicio: inicio || null, fecha_fin: termino || null,
                lugar: lugar || proyectoCompleto?.lugar || '', descripcion, publicado: false
            }).select().single();
            if (evtErr) throw evtErr;
            const eventoId = evtData.id;

            // 3) Crear cuenta de tesorería
            await supabaseClient.from('tesoreria_cuentas').insert({ nombre, tipo: 'evento', orden: 0 });

            // 4) Insertar objetivo general
            if (proyectoCompleto?.objetivo) {
                await supabaseClient.from('objetivos_evento').insert({ evento_id: eventoId, objetivo_general: proyectoCompleto.objetivo });
            }

            // 5) Insertar participantes (jóvenes) buscando sus datos completos
            const participantes = proyectoCompleto?.participantes || [];
            for (const part of participantes) {
                try {
                    const { data: mmbb } = await supabaseClient.from('mmbb_registrations').select('nombres, apellidos, unidad, email_apoderado, apoderado_titular_email, apoderado_titular_telefono, foto_url').ilike('run', part.run).maybeSingle();
                    await supabaseClient.from('jovenes').insert({
                        evento_id: eventoId,
                        nombre_patrulla: mmbb ? `${mmbb.nombres} ${mmbb.apellidos}` : part.nombre,
                        grupo_scout: 'Salvador Sanfuentes',
                        email: mmbb?.email_apoderado || mmbb?.apoderado_titular_email || '',
                        telefono: mmbb?.apoderado_titular_telefono || '',
                        foto_url: mmbb?.foto_url || part.foto || '',
                        observaciones: `Importado desde proyecto: ${nombre}`
                    });
                } catch(e) { console.warn('Error insertando joven:', e); }
            }

            // 6) Insertar responsables (adultos del organigrama) con sus cargos
            const responsables = proyectoCompleto?.responsables || {};
            for (const [cargo, resp] of Object.entries(responsables)) {
                if (!resp || !resp.run) continue;
                try {
                    const { data: adu } = await supabaseClient.from('adultos_registros').select('nombres, apellidos, email, telefono, foto_url').ilike('run', resp.run).maybeSingle();
                    // Si no es adulto, buscar en jóvenes
                    let datosPersona = adu;
                    if (!datosPersona) {
                        const { data: jov } = await supabaseClient.from('mmbb_registrations').select('nombres, apellidos, email_apoderado, apoderado_titular_telefono, foto_url').ilike('run', resp.run).maybeSingle();
                        if (jov) datosPersona = { nombres: jov.nombres, apellidos: jov.apellidos, email: jov.email_apoderado, telefono: jov.apoderado_titular_telefono, foto_url: jov.foto_url };
                    }
                    await supabaseClient.from('adultos').insert({
                        evento_id: eventoId,
                        nombre: datosPersona ? `${datosPersona.nombres} ${datosPersona.apellidos}` : resp.nombre,
                        rol: cargo,
                        email: datosPersona?.email || '',
                        telefono: datosPersona?.telefono || '',
                        foto_url: datosPersona?.foto_url || resp.foto || '',
                        observaciones: `${cargo} — Importado desde proyecto: ${nombre}`
                    });
                } catch(e) { console.warn('Error insertando responsable:', e); }
            }

            // 7) Items de presupuesto desde ficha extendida del proyecto
            const pptoItems = proyectoCompleto?.presupuestoEstimado || [];
            if (pptoItems.length) {
                const { data: secs } = await supabaseClient.from('secciones_presupuesto').select('id').order('orden').limit(1);
                const secId = secs?.[0]?.id || 1; let ord = 0;
                for (const item of pptoItems) {
                    if (item.concepto) {
                        await supabaseClient.from('items_presupuesto').insert({
                            evento_id: eventoId, seccion_id: secId, concepto: item.concepto,
                            cantidad: item.cantidad || 0, costo_unitario: item.costoUnitario || 0,
                            costo_final: (item.cantidad || 0) * (item.costoUnitario || 0),
                            orden: ++ord, observaciones: 'Importado de ficha de proyecto'
                        });
                    }
                }
            }

            // 8) Metas/indicadores desde ficha extendida
            const indItems = proyectoCompleto?.indicadores || [];
            let metaOrden = 0;
            for (const ind of indItems) {
                if (ind.descripcion) {
                    await supabaseClient.from('metas_evento').insert({
                        evento_id: eventoId, descripcion: ind.descripcion,
                        valor_esperado: parseFloat(ind.meta) || 0, unidad: 'unidad', orden: ++metaOrden
                    });
                }
            }

            // 9) Objetivos específicos como metas adicionales
            const objEsp = proyectoCompleto?.objetivosEspecificos || [];
            for (const obj of objEsp) {
                if (obj) {
                    await supabaseClient.from('metas_evento').insert({
                        evento_id: eventoId, descripcion: 'Obj. Específico: ' + obj,
                        valor_esperado: 1, unidad: 'cumplimiento', orden: ++metaOrden
                    });
                }
            }

            // 10) Plan de acción como nota en descripción del evento
            const planAccion = proyectoCompleto?.planAccion || [];
            if (planAccion.length) {
                const planTexto = planAccion.map((a, i) => `${i+1}. ${a.accion} | Recursos: ${a.recurso || 'N/A'} | Resp: ${a.responsable || 'N/A'} | Crono: ${a.cronograma || 'N/A'}`).join('\n');
                const descActual = evtData?.descripcion || '';
                await supabaseClient.from('eventos').update({ descripcion: descActual + '\n\nPlan de Acción:\n' + planTexto }).eq('id', eventoId);
            }

            // 11) Árbol del problema como nota
            const arbol = proyectoCompleto?.arbolProblema;
            if (arbol && arbol.problemaCentral) {
                const arbolTexto = [
                    'ÁRBOL DEL PROBLEMA:',
                    'Problema Central: ' + arbol.problemaCentral,
                    arbol.causas?.length ? 'Causas: ' + arbol.causas.join('; ') : '',
                    arbol.consecuencias?.length ? 'Consecuencias: ' + arbol.consecuencias.join('; ') : ''
                ].filter(Boolean).join('\n');
                const { data: evtActual } = await supabaseClient.from('eventos').select('descripcion').eq('id', eventoId).single();
                await supabaseClient.from('eventos').update({ descripcion: (evtActual?.descripcion || '') + '\n\n' + arbolTexto }).eq('id', eventoId);
            }

            document.getElementById('modal-importar-proyecto').remove();
            await cargarEventos();
            document.getElementById('selector-evento').value = eventoId;
            await cambiarEvento();
            await customAlert(`Evento "${nombre}" creado con:\n• ${participantes.length} participante(s)\n• ${Object.keys(responsables).length} responsable(s) con cargo\n• ${pptoItems.length} ítems de presupuesto\n• ${indItems.length + objEsp.length} metas/indicadores\n• ${planAccion.length} acciones del plan\n${arbol?.problemaCentral ? '• Árbol del problema incluido' : ''}\n\nTodo listo para gestionar.`);
        } catch(e) { await customAlert('Error: ' + e.message); }
    }

    async function crearNuevoEvento() {
        const nombre = await customPrompt('Nombre del nuevo evento:');
        if (!nombre) return;
        const { data, error } = await supabaseClient.from('eventos').insert({ nombre }).select().single();
        if (error) { await customAlert('Error: ' + error.message); return; }
        await supabaseClient.from('tesoreria_cuentas').insert({ nombre: nombre, tipo: 'evento', orden: 0 });
        await cargarEventos();
        document.getElementById('selector-evento').value = data.id;
        await cambiarEvento();
    }

    async function eliminarEventoActual() {
        if (!eventoActual) { await customAlert('No hay evento seleccionado'); return; }
        if (!(await customConfirm(`¿Eliminar "${eventoActual.nombre}" y TODOS sus datos?`))) return;

        try {
            // Eliminar todas las dependencias
            await supabaseClient.from('jovenes').delete().eq('evento_id', eventoActual.id);
            await supabaseClient.from('adultos').delete().eq('evento_id', eventoActual.id);
            await supabaseClient.from('ingresos').delete().eq('evento_id', eventoActual.id);
            await supabaseClient.from('gastos').delete().eq('evento_id', eventoActual.id);
            await supabaseClient.from('postas').delete().eq('evento_id', eventoActual.id);
            await supabaseClient.from('puntos_croquis').delete().eq('evento_id', eventoActual.id);
            await supabaseClient.from('inventario').delete().eq('evento_id', eventoActual.id);
            await supabaseClient.from('items_presupuesto').delete().eq('evento_id', eventoActual.id);
            await supabaseClient.from('menu_evento').delete().eq('evento_id', eventoActual.id);
            await supabaseClient.from('objetivos_evento').delete().eq('evento_id', eventoActual.id);
            await supabaseClient.from('metas_evento').delete().eq('evento_id', eventoActual.id);
            await supabaseClient.from('configuracion_presupuesto').delete().eq('evento_id', eventoActual.id);
            await supabaseClient.from('puntuaciones').delete().eq('evento_id', eventoActual.id);
            await supabaseClient.from('planilla_data').delete().eq('evento_id', eventoActual.id);
            await supabaseClient.from('pasaportes').delete().eq('evento_id', eventoActual.id);
            await supabaseClient.from('entregas_jovenes').delete().eq('evento_id', eventoActual.id);
            await supabaseClient.from('entregas_adultos').delete().eq('evento_id', eventoActual.id);
            await supabaseClient.from('entregas_columnas').delete().eq('evento_id', eventoActual.id);
            
            // Eliminar cuenta(s) de tesorería asociada(s).
            // Nota: se buscan TODAS las homónimas — maybeSingle() fallaba en silencio
            // con cuentas duplicadas y dejaba cuentas huérfanas al borrar el evento.
            const { data: cuentasEvento } = await supabaseClient.from('tesoreria_cuentas').select('id').or(`evento_id.eq.${eventoActual.id},and(evento_id.is.null,tipo.eq.evento,nombre.eq."${eventoActual.nombre.replace(/"/g,'')}")`);
            for (const cuentaEvento of (cuentasEvento || [])) {
                const { data: movs } = await supabaseClient.from('tesoreria_movimientos').select('monto').eq('cuenta_id', cuentaEvento.id);
                const saldo = (movs || []).reduce((a, m) => a + (m.monto || 0), 0);
                if ((movs || []).length > 0) {
                    const ok = await customConfirm(`La cuenta de tesorería del evento tiene ${movs.length} movimiento(s) (saldo $${saldo.toLocaleString('es-CL')}).\n¿Eliminar también el historial contable? (Si eliges No, la cuenta se conserva en Tesorería)`);
                    if (!ok) continue;
                }
                await supabaseClient.from('cuenta_tipos_cuota').delete().eq('cuenta_id', cuentaEvento.id);
                await supabaseClient.from('tesoreria_movimientos').delete().eq('cuenta_id', cuentaEvento.id);
                await supabaseClient.from('tesoreria_cuentas').delete().eq('id', cuentaEvento.id);
            }
            
            await supabaseClient.from('eventos').delete().eq('id', eventoActual.id);
            await customAlert('Evento eliminado');
            await cargarEventos();
            document.getElementById('selector-evento').value = '';
            await cambiarEvento();
        } catch (error) {
            console.error(error); await customAlert('Error al eliminar el evento.');
        }
    }

    async function cambiarEvento() {
        const eventoId = document.getElementById('selector-evento').value;
        if (!eventoId) {
            eventoActual = null;
            document.getElementById('evento-titulo').value = 'Colocar aqui Nombre de la Actividad y/o Evento';
            document.getElementById('evento-fecha').value = '';
            await cargarTodosLosDatos();
            actualizarIframeCheckinQR();
            return;
        }
        const { data } = await supabaseClient.from('eventos').select('*').eq('id', eventoId).single();
        eventoActual = data;
        await cargarTodosLosDatos();
        actualizarIframeCheckinQR();
        iniciarRealtime(eventoId);
    }

    // ── REALTIME: suscripción a cambios en jovenes y adultos ──
