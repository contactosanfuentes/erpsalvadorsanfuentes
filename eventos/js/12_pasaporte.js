    function actualizarSelectorPasaporte() {
        const select = document.getElementById('selectGrupoPasaporte');
        select.innerHTML = '<option value="">-- Seleccione Patrulla --</option>';
        jovenes.forEach(p => { const option = document.createElement('option'); option.value = p.id; option.textContent = `${p.nombre_patrulla} (${p.grupo_scout})`; select.appendChild(option); });
    }

    window.cargarPasaporte = function() {
        const select = document.getElementById('selectGrupoPasaporte');
        const id = parseInt(select.value);
        if (!id) {
            document.getElementById('pasaporte-nombre').innerText = ''; document.getElementById('pasaporte-grupo').innerText = ''; document.getElementById('pasaporte-jovenes').innerText = ''; document.getElementById('pasaporte-body').innerHTML = '';
            return;
        }
        const joven = jovenes.find(j => j.id == id);
        if (!joven) return;
        document.getElementById('pasaporte-nombre').innerText = joven.nombre_patrulla;
        document.getElementById('pasaporte-grupo').innerText = joven.grupo_scout;
        document.getElementById('pasaporte-jovenes').innerText = joven.numero_integrantes;

        const pasaporte = pasaportes[id] || { postaInicio: 1, puntuaciones: postasData.map(() => ({ letras: '', numeros: '', firma: '' })) };
        document.getElementById('pasaporte-postaInicio').value = pasaporte.postaInicio;

        const tbody = document.getElementById('pasaporte-body');
        tbody.innerHTML = '';
        let total = 0;
        postasData.forEach((p, i) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td style="text-align:center; background:var(--gris-fondo); font-weight:bold;">${p.numero}</td>
                <td>${p.nombre}</td>
                <td><input type="text" value="${pasaporte.puntuaciones[i]?.letras || ''}" onchange="actualizarPasaporte('${id}', ${i}, 'letras', this.value)"></td>
                <td><input type="number" value="${pasaporte.puntuaciones[i]?.numeros || ''}" onchange="actualizarPasaporte('${id}', ${i}, 'numeros', this.value)"></td>
                <td><input type="text" value="${pasaporte.puntuaciones[i]?.firma || ''}" onchange="actualizarPasaporte('${id}', ${i}, 'firma', this.value)"></td>
            `;
            tbody.appendChild(row);
            total += parseInt(pasaporte.puntuaciones[i]?.numeros) || 0;
        });
        document.getElementById('pasaporte-total').innerText = total;
    }

    window.actualizarPasaporte = async function(jovenId, postaIndex, campo, valor) {
        if (!pasaportes[jovenId]) { pasaportes[jovenId] = { postaInicio: 1, puntuaciones: postasData.map(() => ({ letras: '', numeros: '', firma: '' })) }; }
        pasaportes[jovenId].puntuaciones[postaIndex][campo] = valor;
        await supabaseClient.from('pasaportes').upsert({
            evento_id: eventoActual.id,
            patrulla_id: jovenId,
            posta_inicio: pasaportes[jovenId].postaInicio,
            puntuaciones: pasaportes[jovenId].puntuaciones
        }, { onConflict: 'evento_id, patrulla_id' });
        let total = 0;
        pasaportes[jovenId].puntuaciones.forEach(p => total += parseInt(p.numeros) || 0);
        document.getElementById('pasaporte-total').innerText = total;
    }

    window.guardarPasaporte = async function() {
        const select = document.getElementById('selectGrupoPasaporte');
        const id = parseInt(select.value);
        if (!id) { customAlert('Seleccione una patrulla'); return; }
        const postaInicio = parseInt(document.getElementById('pasaporte-postaInicio').value) || 1;
        if (!pasaportes[id]) pasaportes[id] = { puntuaciones: [] };
        pasaportes[id].postaInicio = postaInicio;
        await supabaseClient.from('pasaportes').upsert({
            evento_id: eventoActual.id,
            patrulla_id: id,
            posta_inicio: postaInicio,
            puntuaciones: pasaportes[id].puntuaciones
        }, { onConflict: 'evento_id, patrulla_id' });
        customAlert('Pasaporte guardado correctamente.');
    }

    // ========== CROQUIS UNIFICADO ==========
