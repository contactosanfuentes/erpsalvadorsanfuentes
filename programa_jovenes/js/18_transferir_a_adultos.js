        let pendingTransferJovenId = null;
        function abrirModalTransferirAdulto(jovenId) {
            pendingTransferJovenId = jovenId;
            document.getElementById('modal-transferir-adulto').classList.add('active');
        }
        function cerrarModalTransferir() {
            pendingTransferJovenId = null;
            document.getElementById('modal-transferir-adulto').classList.remove('active');
        }
        async function confirmarTransferirAdulto() {
            if (!pendingTransferJovenId) return;
            const joven = personasJovenes.find(j => j.id === pendingTransferJovenId);
            if (!joven) return;
            try {
                const adultoPayload = {
                    primer_nombre: joven.nombres?.split(' ')[0] || '',
                    segundo_nombre: joven.nombres?.split(' ').slice(1).join(' ') || null,
                    apellido_paterno: joven.apellidos?.split(' ')[0] || '',
                    apellido_materno: joven.apellidos?.split(' ').slice(1).join(' ') || null,
                    nombres: joven.nombres || '',
                    apellidos: joven.apellidos || '',
                    run: joven.run,
                    fecha_nacimiento: joven.fecha_nacimiento,
                    nacionalidad: joven.nacionalidad || 'No registra',
                    domicilio: joven.domicilio || 'No registra',
                    telefono: joven.apoderado_titular_telefono || 'No registra',
                    email: joven.apoderado_titular_email || 'no-email@example.com',
                    prevision_salud: joven.prevision_salud || 'No registra',
                    grupo_sanguineo: joven.grupo_sanguineo || 'Desconocido',
                    foto_url: joven.foto,
                    unidad_rol: joven.unidad,
                    fecha_ingreso_grupo: joven.fecha_ingreso_grupo,
                    tipo_ingreso: joven.tipo_miembro || 'Antiguo miembro',
                    emergencia_nombre: joven.apoderado_suplente1_nombre || 'No registra',
                    emergencia_parentesco: joven.apoderado_suplente1_parentesco || 'No registra',
                    emergencia_telefono: joven.apoderado_suplente1_telefono || 'No registra',
                    emergencia_email: joven.apoderado_suplente1_email || null,
                    firma_url: 'https://via.placeholder.com/150?text=Firma',
                    acepta_ciclo: true,
                    cert_antecedentes_url: null,
                    cert_inhabilidad_url: null,
                    carta_recomendacion_url: null,
                    cuota_pagada: joven.registro_pagado || false,
                    cuenta_institucional: joven.email_creado_dominio || false,
                    ficha_medica: true,
                    comprobante_url: joven.comprobante_url || null
                };
                const { error: insertError } = await supabaseClient.from('adultos_registros').insert([adultoPayload]);
                if (insertError) throw insertError;
                const { error: deleteError } = await supabaseClient.from('mmbb_registrations').delete().eq('id', joven.id);
                if (deleteError) throw deleteError;
                personasJovenes = personasJovenes.filter(j => j.id !== joven.id);
                mostrarNotificacion('exito', `El joven ${joven.nombre} ha sido transferido exitosamente al padrón de adultos.`);
                renderYouthList();
                const profileView = document.getElementById('youth-profile-view');
                profileView.innerHTML = `<div style="display:flex; height:100%; justify-content:center; align-items:center; flex-direction:column; color:var(--texto-claro); background:white;">
                    <div class="bg-gray-50 p-10 rounded-full mb-6 border-4 border-dashed border-gray-200">
                        <i class="fas fa-id-card-alt" style="font-size:4rem; color:#cbd5e0;"></i>
                    </div>
                    <h2 class="text-2xl font-bold text-gray-800 mb-2">Seleccione un Expediente</h2>
                    <p class="text-center text-sm font-medium text-gray-500 max-w-sm">Explore el historial de progresión, evaluación de pares, competencias técnicas, proyectos de vida e información general del beneficiario.</p>
                </div>`;
            } catch (error) {
                console.error('Error en transferencia:', error);
                mostrarNotificacion('error', 'Error al transferir el registro. Verifique consola.');
            }
            cerrarModalTransferir();
        }

        // ================= PASE DE UNIDAD =================
