        async function toggleActivoJoven(jovenId) {
            const joven = personasJovenes.find(j => j.id === jovenId);
            if (!joven) return;
            const nuevoValor = !joven.activo;
            try {
                const { error } = await supabaseClient.from('mmbb_registrations').update({ activo: nuevoValor }).eq('id', jovenId);
                if (error) throw error;
                joven.activo = nuevoValor;
                renderYouthProfile(joven);
                renderYouthList();
                mostrarNotificacion('exito', joven.nombre + (nuevoValor ? ' marcado como ACTIVO.' : ' marcado como INACTIVO para este período.'));
            } catch (err) { console.error(err); mostrarNotificacion('error', 'Error: ' + err.message); }
        }

        async function toggleCompromisoCaminante(jovenId) {
            const joven = personasJovenes.find(j => j.id === jovenId);
            if (!joven) return;
            const nuevoValor = !joven.compromiso_caminante;
            try {
                const { error } = await supabaseClient.from('mmbb_registrations').update({ compromiso_caminante: nuevoValor }).eq('id', jovenId);
                if (error) throw error;
                joven.compromiso_caminante = nuevoValor;
                renderYouthProfile(joven);
                mostrarNotificacion('exito', nuevoValor ? 'Compromiso del Caminante registrado.' : 'Compromiso desmarcado.');
            } catch (err) { console.error(err); mostrarNotificacion('error', 'Error al actualizar: ' + err.message); }
        }

        // ── Editor de foto compartido ──
