        function abrirModalEvaluacionDesarrollo(jId, pId) { document.getElementById('modal-evaluacion-caminante').classList.add('active'); }

        // --- GOBERNANZA: MULTI-FIRMA DIGITAL SIMULADA ---
        let firmaContext = { jId: null, type: null, payload: null, firmas: 0 };
        function solicitarFirmaDigital(jId, type, payload) {
            firmaContext = { jId, type, payload, firmas: 0 };
            document.getElementById('firma-1').className = 'firma-slot flex flex-col items-center justify-center'; document.getElementById('firma-1').innerHTML = '<i class="fas fa-pen-nib text-3xl text-gray-300 mb-3"></i><span class="text-sm font-extrabold text-gray-700">Clic para Adherir Firma</span><span class="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Jefe de Unidad</span>';
            document.getElementById('firma-2').className = 'firma-slot flex flex-col items-center justify-center'; document.getElementById('firma-2').innerHTML = '<i class="fas fa-pen-nib text-3xl text-gray-300 mb-3"></i><span class="text-sm font-extrabold text-gray-700">Clic para Adherir Firma</span><span class="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Dirigente Asistente</span>';
            document.getElementById('btn-ejecutar-acta').disabled = true; document.getElementById('btn-ejecutar-acta').classList.add('opacity-50', 'cursor-not-allowed');
            
            const titles = { 'etapa': 'Transición Formal de Etapa Evolutiva Institucional', 'objetivo_tropa': 'Sancionar Cumplimiento Definitivo de Objetivo Educativo', 'competencia': 'Acreditación Colegiada de Competencia Estratégica' };
            document.getElementById('mfu-accion-titulo').innerText = titles[type] || 'Aprobación Colegiada DB';
            document.getElementById('mfu-accion-detalle').innerText = `Se demanda la inserción de claves criptográficas y firmas autorizadas de los Jefes Responsables para certificar la Hoja de Vida Nacional de ${personasJovenes.find(j=>j.id===jId).nombre}.`;
            document.getElementById('modal-firmas-unidad').classList.add('active');
        }
        function firmarSlot(num) {
            const slot = document.getElementById(`firma-${num}`);
            if(!slot.classList.contains('firmado')) {
                slot.className = 'firma-slot firmado flex flex-col items-center justify-center';
                slot.innerHTML = `<i class="fas fa-fingerprint text-4xl mb-2 text-green-500"></i><span class="text-sm font-extrabold text-green-700 uppercase tracking-wider">Identidad Verificada</span><span class="text-xs font-bold text-green-600 mt-1">Rúbrica Aprobada</span>`;
                firmaContext.firmas++;
                if(firmaContext.firmas >= 2) { const btn = document.getElementById('btn-ejecutar-acta'); btn.disabled = false; btn.classList.remove('opacity-50', 'cursor-not-allowed'); }
            }
        }
        function cancelarFirmas() { document.getElementById('modal-firmas-unidad').classList.remove('active'); firmaContext = { jId: null, type: null, payload: null, firmas: 0 }; }
        function ejecutarAccionFirmada() {
            const { jId, type, payload } = firmaContext;
            const j = personasJovenes.find(x => x.id === jId);
            if (type === 'etapa') { cambiarEtapaJoven(jId, payload); } 
            else if (type === 'objetivo_tropa') {
                const o = j.objetivos[payload.area].find(x => x.id === payload.objId);
                o.estado = 'aprobado'; updateProgresionDB(jId, 'objetivos', j.objetivos); mostrarNotificacion('exito', 'Acta sancionada. Registro inmutable grabado en la base de datos central.');
            } else if (type === 'competencia') {
                let c = j.competencias || [];
                if(c.some(x => x.id === payload)) c = c.filter(x => x.id !== payload);
                else c.push({ id: payload, fecha: new Date().toISOString() });
                updateProgresionDB(jId, 'competencias', c); mostrarNotificacion('exito', 'Competencia Acreditada legalmente en el expediente de la Avanzada.');
            }
            cancelarFirmas();
        }

        // --- ESPECIALIDADES 4 PILARES DE CERTIFICACIÓN ---
