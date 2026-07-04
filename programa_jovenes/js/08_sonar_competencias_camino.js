        function updateSonar(jId) {
            areasDesarrollo.forEach(a => {
                const slider = document.getElementById(`sonar-${a.valKey}`);
                const span = document.getElementById(`sval-${a.valKey}`);
                if (slider && span) {
                    span.innerText = slider.value;
                }
            });
        }
        function guardarSonar(jId) {
            let sonar = {};
            areasDesarrollo.forEach(a => {
                const slider = document.getElementById(`sonar-${a.valKey}`);
                if (slider) {
                    sonar[a.valKey] = parseInt(slider.value) || 1;
                } else {
                    sonar[a.valKey] = 1;
                }
            });
            updateProgresionDB(jId, 'sonar', sonar);
            mostrarNotificacion('exito', 'Datos de autoevaluación Sonar almacenados en la Nube.');
        }
        let radarChart = null;
        function renderSonarCanvas(joven) {
            const ctx = document.getElementById(`radar-pionero-${joven.id}`);
            if(!ctx) return;
            if(radarChart) radarChart.destroy();
            const data = areasDesarrollo.map(a => (joven.sonar && joven.sonar[a.valKey]) ? joven.sonar[a.valKey] : 1);
            radarChart = new Chart(ctx, {
                type: 'radar',
                data: {
                    labels: areasDesarrollo.map(a => a.nombre.substring(0,4)),
                    datasets: [{
                        label: 'Escala Evaluativa (1-7)',
                        data: data,
                        backgroundColor: 'rgba(139, 92, 246, 0.4)',
                        borderColor: '#7c3aed',
                        borderWidth: 3,
                        pointBackgroundColor: '#fff',
                        pointBorderColor: '#7c3aed',
                        pointRadius: 4
                    }]
                },
                options: {
                    scales: {
                        r: {
                            suggestedMin: 0,
                            suggestedMax: 7,
                            ticks:{stepSize:1, backdropColor:'transparent', font:{size:10, weight:'bold'}},
                            pointLabels:{font:{size:11, family:'system-ui', weight:'800'}, color:'#475569'},
                            grid:{color:'#e2e8f0'}
                        }
                    },
                    plugins: { legend: {display:false} }
                }
            });
        }

        // --- DESARROLLO DE COMPETENCIAS (AVANZADA / CLAN) ---
        function abrirModalCompetencia(jovenId, compId = null) {
            const j = personasJovenes.find(x => x.id === jovenId);
            if(!j) return;
            document.getElementById('mcomp-joven-id').value = jovenId;
            document.getElementById('mcomp-id').value = compId ? compId : '';

            let comp = compId ? (j.competencias_mayores||[]).find(c => c.id === compId) : { nombre:'', area:'Cultura y Artes', proyecto:'', tutor:'', tutorEmail:'', nivel:'Exploración' };

            document.getElementById('mcomp-nombre').value = comp.nombre;
            document.getElementById('mcomp-area').value = comp.area || 'General';
            document.getElementById('mcomp-proyecto').value = comp.proyecto || '';
            document.getElementById('mcomp-tutor').value = comp.tutor || '';
            document.getElementById('mcomp-tutor-email').value = comp.tutorEmail || '';
            document.getElementById('mcomp-nivel').value = comp.nivel || 'Exploración';

            document.getElementById('mcomp-btn-eliminar').style.display = compId ? 'block' : 'none';
            document.getElementById('modal-competencia').classList.add('active');
        }

        async function guardarEdicionCompetencia() {
            const jId = parseInt(document.getElementById('mcomp-joven-id').value);
            const cIdStr = document.getElementById('mcomp-id').value;
            const j = personasJovenes.find(x => x.id === jId);
            
            const n = document.getElementById('mcomp-nombre').value.trim();
            if(!n) return mostrarNotificacion('error', 'El nombre de la competencia es obligatorio.');
            
            const nivelAntes = cIdStr ? (j.competencias_mayores||[]).find(c => c.id === Number(cIdStr))?.nivel : null;
            const nuevoNivel = document.getElementById('mcomp-nivel').value;

            const nComp = {
                id: cIdStr ? Number(cIdStr) : Date.now(),
                nombre: n,
                area: document.getElementById('mcomp-area').value,
                proyecto: document.getElementById('mcomp-proyecto').value.trim(),
                tutor: document.getElementById('mcomp-tutor').value.trim(),
                tutorEmail: document.getElementById('mcomp-tutor-email').value.trim(),
                nivel: nuevoNivel
            };

            let arr = j.competencias_mayores || [];
            if(cIdStr) {
                const idx = arr.findIndex(c => c.id === nComp.id);
                if(idx > -1) arr[idx] = nComp;
            } else {
                arr.push(nComp);
            }

            updateProgresionDB(jId, 'competencias_mayores', arr);
            document.getElementById('modal-competencia').classList.remove('active');
            mostrarNotificacion('exito', 'Certificación de Competencia actualizada.');
            // ── Generar, subir y adjuntar certificado de competencia ──
            if (window._certCompEnCurso) return;
            window._certCompEnCurso = true;
            let adjuntoComp = null;
            try {
                const jComp = personasJovenes.find(x => x.id === parseInt(document.getElementById('mcomp-joven-id')?.value));
                const nomComp = document.getElementById('mcomp-nombre')?.value || 'Competencia';
                if (jComp) {
                    const datosCertComp = {
                        titulo: 'DE COMPETENCIA',
                        nombre: `${jComp.nombres || ''} ${jComp.apellidos || ''}`.trim(),
                        unidad: jComp.unidad,
                        detalle: `Por haber alcanzado la competencia "${nomComp}"`,
                        subdetalle: 'Evaluada y validada por su equipo de Guiadoras/Dirigentes',
                        nombreArchivo: `Cert_Competencia_${nomComp.replace(/[^a-zA-Z0-9]/g,'_')}_${(jComp.apellidos||'').replace(/[^a-zA-Z0-9]/g,'_')}`
                    };
                    const resDriveComp = await Certificados.generarYSubir(datosCertComp, window.supabaseClient, null);
                    const pdfCompCorreo = resDriveComp?.pdf?.pdfBase64 || (await Certificados.generar(datosCertComp)).pdfBase64;
                    if (pdfCompCorreo && pdfCompCorreo.length > 500) {
                        adjuntoComp = [{ filename: datosCertComp.nombreArchivo + '.pdf', content: pdfCompCorreo, type: 'application/pdf' }];
                    }
                    mostrarNotificacion('exito', '✅ Certificado de competencia guardado en Drive.');
                    // Enviar notificación CON certificado adjunto
                    await enviarNotificacionHito(jComp, 'competencia', { nombre: nomComp, proyecto: document.getElementById('mcomp-proyecto')?.value || '' }, adjuntoComp);
                }
            } catch(err) { console.error('Error certificado competencia:', err); }
            window._certCompEnCurso = false;
        }

        function eliminarCompetenciaActual() {
            if(!confirm("¿Retirar esta competencia del perfil?")) return;
            const jId = parseInt(document.getElementById('mcomp-joven-id').value);
            const cIdStr = document.getElementById('mcomp-id').value;
            const j = personasJovenes.find(x => x.id === jId);
            j.competencias_mayores = (j.competencias_mayores||[]).filter(c => c.id !== Number(cIdStr));
            updateProgresionDB(jId, 'competencias_mayores', j.competencias_mayores);
            document.getElementById('modal-competencia').classList.remove('active');
            mostrarNotificacion('info', 'Competencia eliminada.');
        }

        // --- CAMINANTES / CLAN (PORTAFOLIO DE VIDA) ---
        function guardarCamino(jId) {
            const j = personasJovenes.find(x => x.id === jId);
            j.camino.proyectoPersonal = document.getElementById(`cam-vida-${jId}`)?.value ?? j.camino.proyectoPersonal;
            j.camino.pv_q1           = document.getElementById(`pv-q1-${jId}`)?.value ?? j.camino.pv_q1;
            j.camino.pv_q2           = document.getElementById(`pv-q2-${jId}`)?.value ?? j.camino.pv_q2;
            j.camino.pv_q3           = document.getElementById(`pv-q3-${jId}`)?.value ?? j.camino.pv_q3;
            j.camino.pv_potenciar    = document.getElementById(`pv-pot-${jId}`)?.value ?? j.camino.pv_potenciar;
            j.camino.pv_reformular   = document.getElementById(`pv-ref-${jId}`)?.value ?? j.camino.pv_reformular;
            j.camino.compromiso_dia  = document.getElementById(`comp-dia-${jId}`)?.value ?? j.camino.compromiso_dia;
            j.camino.compromiso_lugar= document.getElementById(`comp-lugar-${jId}`)?.value ?? j.camino.compromiso_lugar;
            j.camino.compromiso_que  = document.getElementById(`comp-que-${jId}`)?.value ?? j.camino.compromiso_que;
            updateProgresionDB(jId, 'camino', j.camino);
            mostrarNotificacion('exito', 'Proyecto de Vida guardado.');
        }
