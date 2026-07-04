    function renderMenu() {
        const container = document.getElementById('menu-dias-container');
        if (!container) return;
        container.innerHTML = '';
        const dias = {};
        menuItems.forEach(item => {
            if (!dias[item.dia_nombre]) dias[item.dia_nombre] = { orden: item.dia_orden, comidas: [] };
            dias[item.dia_nombre].comidas.push(item);
        });
        const diasOrdenados = Object.entries(dias).sort((a, b) => a[1].orden - b[1].orden);
        
        diasOrdenados.forEach(([diaNombre, diaData]) => {
            const card = document.createElement('div');
            card.className = 'dia-card';
            
            let html = `
                <button class="btn-eliminar-dia" onclick="eliminarDia('${diaNombre}')"><i class="fas fa-trash"></i></button>
                <div class="dia-header"><input type="text" value="${diaNombre}" onchange="renombrarDia('${diaNombre}', this.value)"></div>
            `;

            diaData.comidas.forEach(comida => {
                let icono = 'fas fa-utensils';
                if(comida.tipo_comida === 'desayuno') icono = 'fas fa-coffee';
                else if(comida.tipo_comida === 'almuerzo') icono = 'fas fa-sun';
                else if(comida.tipo_comida === 'merienda') icono = 'fas fa-cookie-bite';
                else if(comida.tipo_comida === 'cena') icono = 'fas fa-moon';
                
                html += `
                <div class="comida-item">
                    <div class="comida-label">
                        <span><i class="${icono}"></i> ${comida.tipo_comida.charAt(0).toUpperCase() + comida.tipo_comida.slice(1)}</span>
                        <button class="btn btn-danger btn-sm" style="padding:2px 6px;" onclick="eliminarComida('${comida.id}')"><i class="fas fa-times"></i></button>
                    </div>
                    <input type="text" class="comida-input" placeholder="Descripción" value="${comida.descripcion}" onchange="actualizarComida('${comida.id}', 'descripcion', this.value)">
                    <input type="text" class="comida-input" placeholder="Notas" value="${comida.notas}" onchange="actualizarComida('${comida.id}', 'notas', this.value)">
                </div>`;
            });
            
            html += `<button class="btn btn-success btn-sm" onclick="agregarComidaExtra('${diaNombre}')" style="margin-top: 10px; width: 100%;"><i class="fas fa-plus"></i> Agregar otra comida</button>`;
            card.innerHTML = html;
            container.appendChild(card);
        });
    }

    window.agregarDiaMenu = async function() {
        if (!eventoActual) { await customAlert('Seleccione un evento'); return; }
        const nombreDia = await customPrompt('Nombre del nuevo día (Ej. Sábado):');
        if (!nombreDia) return;
        const nuevoOrden = menuItems.length ? Math.max(...menuItems.map(i => i.dia_orden)) + 1 : 1;
        const comidasPorDefecto = ['desayuno', 'almuerzo', 'merienda', 'cena'];
        for (let tipo of comidasPorDefecto) {
            const nuevo = { evento_id: eventoActual.id, dia_nombre: nombreDia, dia_orden: nuevoOrden, tipo_comida: tipo, descripcion: '', notas: '' };
            try {
                const { data } = await supabaseClient.from('menu_evento').insert(nuevo).select();
                if(data && data.length > 0) menuItems.push(data[0]);
                else { nuevo.id = Date.now() + Math.random(); menuItems.push(nuevo); }
            } catch(e) { nuevo.id = Date.now() + Math.random(); menuItems.push(nuevo); }
        }
        renderMenu();
    }

    window.eliminarDia = async function(diaNombre) {
        if(await customConfirm(`¿Eliminar el día ${diaNombre} completo?`)) {
            try { await supabaseClient.from('menu_evento').delete().eq('evento_id', eventoActual.id).eq('dia_nombre', diaNombre); }catch(e){}
            menuItems = menuItems.filter(i => i.dia_nombre !== diaNombre); renderMenu();
        }
    }

    window.renombrarDia = async function(diaViejo, diaNuevo) {
        if (!diaNuevo || diaViejo === diaNuevo) return;
        try { await supabaseClient.from('menu_evento').update({ dia_nombre: diaNuevo }).eq('evento_id', eventoActual.id).eq('dia_nombre', diaViejo); }catch(e){}
        menuItems.forEach(i => { if (i.dia_nombre === diaViejo) i.dia_nombre = diaNuevo; }); renderMenu();
    }

    window.actualizarComida = async function(id, campo, valor) {
        try { await supabaseClient.from('menu_evento').update({ [campo]: valor }).eq('id', id); } catch(e){}
        let item = menuItems.find(i => i.id == id); if(item) item[campo] = valor;
    }

    window.agregarComidaExtra = async function(diaNombre) {
        const diaOrden = menuItems.find(i => i.dia_nombre === diaNombre)?.dia_orden || 1;
        const nuevo = { evento_id: eventoActual.id, dia_nombre: diaNombre, dia_orden: diaOrden, tipo_comida: 'otros', descripcion: 'Nueva comida', notas: '' };
        try {
            const { data } = await supabaseClient.from('menu_evento').insert(nuevo).select();
            if (data && data.length > 0) { menuItems.push(data[0]); }
            else { nuevo.id = Date.now(); menuItems.push(nuevo); }
        } catch(e) { nuevo.id = Date.now(); menuItems.push(nuevo); }
        renderMenu();
    }

    window.eliminarComida = async function(id) {
        try{ await supabaseClient.from('menu_evento').delete().eq('id', id); }catch(e){}
        menuItems = menuItems.filter(i => i.id != id); renderMenu();
    }

    window.guardarMenu = function() { customAlert("Se guarda automáticamente en base de datos."); }

    // ========== ENTREGAS DINÁMICAS ==========
    let entregasColumnas = ['Comida', 'Bebida'];
    let entregasJovenes = {};
    let entregasAdultos = {};

    function renderEntregas() {
        const cJovenes = document.getElementById('entregas-jovenes-contenedor');
        const cAdultos = document.getElementById('entregas-adultos-contenedor');
        if(!cJovenes || !cAdultos) return;

        // Tabla Jóvenes
        let htmlJ = `<div class="table-container"><table style="width:100%; border-collapse:collapse;"><thead> <th>Registro / Patrulla</th><th>Grupo</th>`;
        entregasColumnas.forEach((col, i) => { htmlJ += `<th style="text-align:center;">${col} <button class="btn btn-danger btn-sm" onclick="eliminarColumnaEntregas(${i})" style="padding:2px 6px; margin-left:5px;"><i class="fas fa-times"></i></button></th>`; });
        htmlJ += `</thead><tbody>`;
        
        jovenes.forEach(j => {
            htmlJ += `<tr><td>${j.nombre_patrulla}</td><td>${j.grupo_scout}</td>`;
            if(!entregasJovenes[j.id]) entregasJovenes[j.id] = {};
            entregasColumnas.forEach(col => {
                let check = entregasJovenes[j.id][col] ? 'checked' : '';
                htmlJ += `<td style="text-align:center;"><input type="checkbox" style="width:20px;height:20px;" ${check} onchange="toggleEntrega('${j.id}', '${col}', this.checked, 'joven')"></td>`;
            });
            htmlJ += `</tr>`;
        });
        htmlJ += `</tbody></table></div>`;
        cJovenes.innerHTML = htmlJ;

        // Tabla Adultos
        let htmlA = `<div class="table-container"><table style="width:100%; border-collapse:collapse;"><thead> <th>Staff / Adulto</th><th>Rol</th>`;
        entregasColumnas.forEach(col => { htmlA += `<th style="text-align:center;">${col}</th>`; });
        htmlA += `</thead><tbody>`;
        
        adultos.forEach(a => {
            htmlA += `<tr><td>${a.nombre}</td><td>${a.rol}</td>`;
            if(!entregasAdultos[a.id]) entregasAdultos[a.id] = {};
            entregasColumnas.forEach(col => {
                let check = entregasAdultos[a.id][col] ? 'checked' : '';
                htmlA += `<td style="text-align:center;"><input type="checkbox" style="width:20px;height:20px;" ${check} onchange="toggleEntrega('${a.id}', '${col}', this.checked, 'adulto')"></td>`;
            });
            htmlA += `</tr>`;
        });
        htmlA += `</tbody></table></div>`;
        cAdultos.innerHTML = htmlA;
    }

    window.agregarColumnaEntregas = async function() {
        const val = document.getElementById('nueva-columna-nombre').value.trim();
        if(val && !entregasColumnas.includes(val)) {
            entregasColumnas.push(val);
            // Guardar en Supabase
            await supabaseClient.from('entregas_columnas').upsert({
                evento_id: eventoActual.id,
                columnas: entregasColumnas
            }, { onConflict: 'evento_id' });
            document.getElementById('nueva-columna-nombre').value = '';
            renderEntregas();
        }
    }

    window.eliminarColumnaEntregas = async function(index) {
        entregasColumnas.splice(index, 1);
        await supabaseClient.from('entregas_columnas').upsert({
            evento_id: eventoActual.id,
            columnas: entregasColumnas
        }, { onConflict: 'evento_id' });
        renderEntregas();
    }

    window.toggleEntrega = async function(id, columna, valor, tipo) {
        if(tipo === 'joven') {
            if(!entregasJovenes[id]) entregasJovenes[id] = {};
            entregasJovenes[id][columna] = valor;
            await supabaseClient.from('entregas_jovenes').upsert({
                evento_id: eventoActual.id,
                patrulla_id: id,
                entregas: entregasJovenes[id]
            }, { onConflict: 'evento_id, patrulla_id' });
        } else {
            if(!entregasAdultos[id]) entregasAdultos[id] = {};
            entregasAdultos[id][columna] = valor;
            await supabaseClient.from('entregas_adultos').upsert({
                evento_id: eventoActual.id,
                adulto_id: id,
                entregas: entregasAdultos[id]
            }, { onConflict: 'evento_id, adulto_id' });
        }
    }

    // ========== PRESUPUESTO ==========
