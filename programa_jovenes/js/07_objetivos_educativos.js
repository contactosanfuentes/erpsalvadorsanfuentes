        function abrirModalObjetivos(jovenId, rama, area) {
            document.getElementById('mcp-joven-id').value = jovenId;
            document.getElementById('mcp-area').value = area;
            document.getElementById('mo-area-label').innerText = areasDesarrollo.find(a=>a.valKey===area).nombre;
            
            let categoriaObj = 'Iniciales';
            let descModal = 'Selecciona un objetivo educativo para este ciclo, el cual será monitoreado a través de la observación empírica del equipo de Guiadoras/Viejos Lobos.';
            
            if(rama === 'Tropa' || rama === 'Compañía') {
                categoriaObj = 'Medios';
                descModal = 'Selecciona o propón un objetivo educativo medio para el ciclo actual, el cual será monitoreado en terreno y co-evaluado por tu Patrulla/Equipo.';
            } else if(rama === 'Avanzada') {
                categoriaObj = 'Medios-Terminales';
                descModal = 'Selecciona o propón un objetivo educativo medio-terminal para el ciclo actual, el cual será evaluado heurísticamente y respaldará la adquisición de competencias.';
            } else if(rama === 'Clan') {
                categoriaObj = 'Terminales';
                descModal = 'Estructura un objetivo educativo terminal para el ciclo actual alineado con tu Proyecto de Vida, monitoreado mediante la Evaluación para el Desarrollo.';
            }

            document.getElementById('modal-objetivos-desc').innerText = descModal;
            const select = document.getElementById('mo-select');
            select.innerHTML = `<option value="">-- Catálogo de Objetivos ${categoriaObj} Nacionales --</option>`;
            
            const opciones = objetivosAgrupados[categoriaObj]?.[area] || [];
            opciones.forEach(o => select.innerHTML += `<option value="${escapeHtml(o)}">${escapeHtml(o)}</option>`);
            select.innerHTML += '<option value="OTRO">Personalizado (escribir meta manual)...</option>';
            checkOtroObjetivo();
            document.getElementById('modal-objetivos').classList.add('active');
        }
        function checkOtroObjetivo() { document.getElementById('mo-otro-container').style.display = document.getElementById('mo-select').value === 'OTRO' ? 'block' : 'none'; }
        function cerrarModalObjetivos() { document.getElementById('modal-objetivos').classList.remove('active'); }
        
        function guardarObjetivoSeleccionado() {
            let txt = document.getElementById('mo-select').value;
            if(txt === 'OTRO') txt = document.getElementById('mo-otro-input').value.trim();
            if(!txt) return mostrarNotificacion('error', 'Debe especificar o seleccionar el desafío obligatoriamente.');
            
            const jId = parseInt(document.getElementById('mcp-joven-id').value);
            const area = document.getElementById('mcp-area').value;
            const j = personasJovenes.find(x => x.id === jId);
            let objs = j.objetivos;
            if(!objs[area]) objs[area] = [];
            const initStatus = (j.rama === 'Bandada' || j.rama === 'Manada') ? 'aprobado' : 'propuesto';
            objs[area].push({ id: Date.now(), texto: txt, estado: initStatus });
            
            updateProgresionDB(j.id, 'objetivos', objs);
            mostrarNotificacion('exito', 'Desafío educativo vinculado al expediente del joven.');
            cerrarModalObjetivos();
        }

        function toggleObjetivoMenores(jId, area, oId) {
            const j = personasJovenes.find(x => x.id === jId);
            const o = j.objetivos[area].find(x => x.id === oId);
            if(o) { o.estado = o.estado === 'aprobado' ? 'propuesto' : 'aprobado'; updateProgresionDB(jId, 'objetivos', j.objetivos); }
        }

        function editarObjetivoMenor(jId, area, oId, currentText) {
            const newText = prompt('Editar objetivo:', currentText);
            if (newText && newText.trim() !== currentText) {
                const j = personasJovenes.find(x => x.id === jId);
                const o = j.objetivos[area].find(x => x.id === oId);
                if(o) { o.texto = newText.trim(); updateProgresionDB(jId, 'objetivos', j.objetivos); mostrarNotificacion('exito', 'Objetivo actualizado.'); }
            }
        }

        function eliminarObjetivoMenor(jId, area, oId) {
            if(confirm('¿Eliminar este objetivo permanentemente?')) {
                const j = personasJovenes.find(x => x.id === jId);
                j.objetivos[area] = j.objetivos[area].filter(o => o.id !== oId);
                updateProgresionDB(jId, 'objetivos', j.objetivos);
                mostrarNotificacion('info', 'Objetivo eliminado.');
            }
        }

        function editarObjetivo(jId, area, oId, currentText) {
            document.getElementById('edit-obj-joven-id').value = jId;
            document.getElementById('edit-obj-area').value = area;
            document.getElementById('edit-obj-id').value = oId;
            document.getElementById('edit-obj-texto').value = currentText;
            document.getElementById('modal-editar-objetivo').classList.add('active');
        }

        function cerrarModalEditarObjetivo() {
            document.getElementById('modal-editar-objetivo').classList.remove('active');
        }

        function guardarEdicionObjetivo() {
            const jId = parseInt(document.getElementById('edit-obj-joven-id').value);
            const area = document.getElementById('edit-obj-area').value;
            const oId = parseInt(document.getElementById('edit-obj-id').value);
            const newText = document.getElementById('edit-obj-texto').value.trim();
            if(!newText) return mostrarNotificacion('error', 'El texto no puede estar vacío.');
            const j = personasJovenes.find(x => x.id === jId);
            const o = j.objetivos[area].find(x => x.id === oId);
            if(o) { o.texto = newText; updateProgresionDB(jId, 'objetivos', j.objetivos); mostrarNotificacion('exito', 'Objetivo actualizado.'); }
            cerrarModalEditarObjetivo();
        }

        function eliminarObjetivo(jId, area, oId) {
            if(confirm('¿Eliminar este objetivo permanentemente?')) {
                const j = personasJovenes.find(x => x.id === jId);
                j.objetivos[area] = j.objetivos[area].filter(o => o.id !== oId);
                updateProgresionDB(jId, 'objetivos', j.objetivos);
                mostrarNotificacion('info', 'Objetivo eliminado.');
            }
        }

        function marcarHitoManada(jId, area, num, isAdding) {
            const j = personasJovenes.find(x => x.id === jId);
            let hitos = j.mapaSeeonee.hitos;
            if(!hitos[area]) hitos[area] = [];
            if(isAdding) { if(!hitos[area].includes(num)) hitos[area].push(num); }
            else { hitos[area] = hitos[area].filter(h => h !== num); }
            const total = Object.values(hitos).flat().length;
            j.mapaSeeonee.etapaActual = total >= 32 ? 'Cazador' : (total >= 24 ? 'Diestro' : (total >= 16 ? 'Saltador' : 'Lobezno'));
            updateProgresionDB(jId, 'mapa_seeonee', j.mapaSeeonee);
        }

        // --- OBJETIVOS (TROPA/CIA CO-EVAL) ---
        function procesarAvanceTropa(jId, area, objId, estadoActual) {
            if (estadoActual === 'propuesto') {
                document.getElementById('mcp-joven-id').value = jId; document.getElementById('mcp-area').value = area; document.getElementById('mcp-obj-id').value = objId;
                const j = personasJovenes.find(x => x.id === jId);
                const o = j.objetivos[area].find(x => x.id === objId);
                document.getElementById('mcp-objetivo-texto').innerText = o.texto;
                document.getElementById('mcp-comentarios').value = o.comentarios || '';
                document.getElementById('modal-consejo-patrulla').classList.add('active');
            } else if (estadoActual === 'patrulla') {
                solicitarFirmaDigital(jId, 'objetivo_tropa', { area, objId });
            }
        }
        function confirmarConsejoPatrulla() {
            const jId = parseInt(document.getElementById('mcp-joven-id').value);
            const area = document.getElementById('mcp-area').value;
            const objId = parseFloat(document.getElementById('mcp-obj-id').value);
            const j = personasJovenes.find(x => x.id === jId);
            const o = j.objetivos[area].find(x => x.id === objId);
            o.estado = 'patrulla'; o.comentarios = document.getElementById('mcp-comentarios').value;
            updateProgresionDB(jId, 'objetivos', j.objetivos);
            document.getElementById('modal-consejo-patrulla').classList.remove('active');
            mostrarNotificacion('exito', 'Acta del Consejo de Patrulla validada e ingresada en bitácora digital.');
        }

        // --- ACTIVIDADES DE PATRULLA/EQUIPO (TROPA Y CIA) ---
        function abrirModalActividadTropa(jovenId, actId = null) {
            const j = personasJovenes.find(x => x.id === jovenId);
            if(!j) return;
            document.getElementById('edit-actividad-id').value = actId ? actId : '';
            
            let act = actId ? (j.actividades_tropa||[]).find(a => a.id === actId) : { nombre:'', tipo:'Excursión', fecha:'', rol:'', observaciones:'' };
            
            document.getElementById('act-nombre').value = act.nombre;
            document.getElementById('act-tipo').value = act.tipo || 'Excursión';
            document.getElementById('act-fecha').value = act.fecha;
            document.getElementById('act-rol').value = act.rol;
            document.getElementById('act-obs').value = act.observaciones || '';
            
            document.getElementById('modal-actividad-tropa').classList.add('active');
        }

        function guardarActividadTropa() {
            const j = personasJovenes.find(x => x.id === activeProfileId);
            if(!j) return;
            
            const n = document.getElementById('act-nombre').value.trim();
            const f = document.getElementById('act-fecha').value;
            const r = document.getElementById('act-rol').value.trim();
            if(!n || !f || !r) return mostrarNotificacion('error', 'Campos obligatorios: Nombre, Fecha y Rol');

            const actIdStr = document.getElementById('edit-actividad-id').value;
            const nAct = {
                id: actIdStr ? Number(actIdStr) : Date.now(),
                nombre: n, tipo: document.getElementById('act-tipo').value, fecha: f, rol: r,
                observaciones: document.getElementById('act-obs').value.trim()
            };

            let arr = j.actividades_tropa || [];
            if(actIdStr) {
                const idx = arr.findIndex(a => a.id === nAct.id);
                if(idx > -1) arr[idx] = nAct;
            } else {
                arr.push(nAct);
            }

            updateProgresionDB(j.id, 'actividades_tropa', arr);
            document.getElementById('modal-actividad-tropa').classList.remove('active');
            mostrarNotificacion('exito', 'Actividad de Patrulla registrada en la bitácora.');
        }

        function eliminarActividadTropa(jId, actId) {
            if(!confirm('¿Eliminar registro de esta actividad?')) return;
            const j = personasJovenes.find(x => x.id === jId);
            j.actividades_tropa = j.actividades_tropa.filter(a => a.id !== actId);
            updateProgresionDB(jId, 'actividades_tropa', j.actividades_tropa);
            mostrarNotificacion('info', 'Registro de actividad eliminado.');
        }

        // --- PIONEROS / AVANZADA ---
