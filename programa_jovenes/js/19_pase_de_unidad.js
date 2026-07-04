        function mostrarModalPaseUnidad(jovenId) {
            document.getElementById('pase-unidad-joven-id').value = jovenId;
            document.getElementById('nueva-unidad-select').value = '';
            document.getElementById('unidad-personalizada').value = '';
            document.getElementById('modal-pase-unidad').classList.add('active');
        }
        
        function cerrarModalPaseUnidad() {
            document.getElementById('modal-pase-unidad').classList.remove('active');
        }
        
        async function confirmarPaseUnidad() {
            const jovenId = parseInt(document.getElementById('pase-unidad-joven-id').value);
            const unidadSeleccionada = document.getElementById('nueva-unidad-select').value;
            let unidadPersonalizada = document.getElementById('unidad-personalizada').value.trim();
            
            if (!unidadSeleccionada && !unidadPersonalizada) {
                mostrarNotificacion('error', 'Debe seleccionar una unidad o especificar una personalizada.');
                return;
            }
            
            let nuevaUnidad = unidadPersonalizada || unidadSeleccionada;
            let nuevaRama = '';
            const unidadLower = nuevaUnidad.toLowerCase();
            if (unidadLower.includes('bandada')) nuevaRama = 'Bandada';
            else if (unidadLower.includes('manada')) nuevaRama = 'Manada';
            else if (unidadLower.includes('tropa')) nuevaRama = 'Tropa';
            else if (unidadLower.includes('compañía') || unidadLower.includes('compania')) nuevaRama = 'Compañía';
            else if (unidadLower.includes('avanzada')) nuevaRama = 'Avanzada';
            else if (unidadLower.includes('clan') || unidadLower.includes('caminante')) nuevaRama = 'Clan';
            else {
                if (unidadSeleccionada) {
                    if (unidadSeleccionada.includes('Bandada')) nuevaRama = 'Bandada';
                    else if (unidadSeleccionada.includes('Manada')) nuevaRama = 'Manada';
                    else if (unidadSeleccionada.includes('Tropa')) nuevaRama = 'Tropa';
                    else if (unidadSeleccionada.includes('Compañía')) nuevaRama = 'Compañía';
                    else if (unidadSeleccionada.includes('Avanzada')) nuevaRama = 'Avanzada';
                    else if (unidadSeleccionada.includes('Clan')) nuevaRama = 'Clan';
                }
            }
            
            if (!nuevaRama) {
                mostrarNotificacion('error', 'No se pudo determinar la rama a partir de la unidad seleccionada. Por favor, seleccione una opción válida.');
                return;
            }
            
            const j = personasJovenes.find(x => x.id === jovenId);
            if (!j) return;
            
            const { error: updateError } = await supabaseClient
                .from('mmbb_registrations')
                .update({ unidad: nuevaUnidad })
                .eq('id', jovenId);
            if (updateError) {
                console.error(updateError);
                mostrarNotificacion('error', 'Error al actualizar la unidad en la base de datos.');
                return;
            }
            
            j.unidad = nuevaUnidad;
            j.rama = nuevaRama;
            j.color = {
                'Bandada': '#4169E1',
                'Manada': '#FFD100',
                'Tropa': '#00853F',
                'Compañía': '#40E0D0',
                'Avanzada': '#8B5CF6',
                'Clan': '#E31837'
            }[nuevaRama] || '#00853F';
            
            const nuevasEtapas = etapasPorRama[nuevaRama];
            if (nuevasEtapas && nuevasEtapas.length) {
                const nuevaEtapa = nuevasEtapas[0];
                await updateProgresionDB(jovenId, 'etapa_actual', nuevaEtapa);
                j.etapaActual = nuevaEtapa;
            }
            
            renderYouthProfile(j);
            renderYouthList();
            mostrarNotificacion('exito', `Pase de unidad completado: ${j.nombre} ahora pertenece a ${nuevaUnidad} (${nuevaRama}) con etapa ${j.etapaActual}.`);
            cerrarModalPaseUnidad();
        }

        // ================= FUNCIONES PARA LOGOS E ICONOS EN PDF =================
