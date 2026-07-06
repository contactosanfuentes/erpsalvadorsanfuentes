    async function cargarCroquisUrl() {
        if (!eventoActual) return;
        const { data, error } = await supabaseClient.from('configuracion_evento').select('croquis_url').eq('evento_id', eventoActual.id).maybeSingle();
        if (error) return;
        croquisUrl = data?.croquis_url || '';
        if (croquisUrl) { imgFondo.crossOrigin = "anonymous"; imgFondo.src = croquisUrl; imgFondo.onload = renderCroquis; }
    }

    window.cargarImagenFondo = async function() {
        if (!eventoActual) { await customAlert('Seleccione un evento'); return; }
        const fileInput = document.getElementById('cargarImagen');
        const file = fileInput.files[0];
        if (!file || !file.type.startsWith('image/')) { await customAlert('Seleccione un archivo de imagen válido'); return; }
        
        const ext = file.name.split('.').pop();
        const fName = `croquis_${Date.now()}.${ext}`;
        const { error } = await supabaseClient.storage.from('croquis').upload(`croquis/${fName}`, file, { upsert: true });
        if (error) { await customAlert('Error al subir imagen'); return; }
        
        const { data: urlData } = supabaseClient.storage.from('croquis').getPublicUrl(`croquis/${fName}`);
        croquisUrl = urlData.publicUrl;
        await supabaseClient.from('configuracion_evento').upsert({ evento_id: eventoActual.id, croquis_url: croquisUrl });
        
        imgFondo.crossOrigin = "anonymous"; imgFondo.src = croquisUrl; imgFondo.onload = renderCroquis;
    }

    window.cambiarSelectorCroquis = function() {
        actualizarSelectorElementosCroquis();
    }

    function actualizarSelectorElementosCroquis() {
        const sel = document.getElementById('selectorElementoCroquis');
        const modo = document.getElementById('tipoPuntoCroquis').value;
        const rowPers = document.getElementById('rowPersonalizado');
        sel.innerHTML = '';
        if(modo === 'posta') {
            rowPers.style.display = 'none'; sel.style.display = '';
            postasData.forEach(p => { sel.innerHTML += `<option value="${p.numero}">${p.numero}. ${p.nombre}</option>`; });
        } else if(modo === 'logistica') {
            rowPers.style.display = 'none'; sel.style.display = '';
            ['💧 Hidratación', '🚻 Baños', '⚕️ Enfermería', '🧯 Extintor', '⛺ Acampe', '⚠️ Encuentro', '🍽️ Comedor', '🏢 Adm/Staff'].forEach(op => {
                sel.innerHTML += `<option value="${op}">${op}</option>`;
            });
        } else {
            sel.style.display = 'none'; rowPers.style.display = 'flex';
        }
    }

    window.renderCroquis = function() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (imgFondo.complete && imgFondo.naturalWidth > 0) {
            ctx.drawImage(imgFondo, 0, 0, canvas.width, canvas.height);
        } else {
            ctx.fillStyle = '#f0f0f0'; ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        const verPostas = document.getElementById('filtroPostas').checked;
        const verLog = document.getElementById('filtroLogistica').checked;
        const verPers = document.getElementById('filtroPersonalizado')?.checked ?? true;
        const lista = document.getElementById('lista-puntos');
        lista.innerHTML = '';

        puntosCroquis.forEach(p => {
            const isPosta = p.numero_posta !== 9999 && p.numero_posta !== 8888;
            const isPersonalizado = p.numero_posta === 8888;
            const isLogistica = p.numero_posta === 9999;
            const visible = (isPosta && verPostas) || (isLogistica && verLog) || (isPersonalizado && verPers);
            if (!visible) return;

            ctx.beginPath();
            ctx.arc(p.x, p.y, isPosta ? 12 : 16, 0, 2 * Math.PI);
            ctx.fillStyle = isPosta ? 'rgba(248,2,2,0.9)' : isPersonalizado ? 'rgba(59,130,246,0.9)' : 'rgba(255,255,255,0.9)';
            ctx.fill();
            ctx.strokeStyle = isPosta ? 'white' : isPersonalizado ? 'white' : 'var(--verde)';
            ctx.lineWidth = 2; ctx.stroke();
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';

            if (isPersonalizado) {
                const partes = p.nombre.split('||');
                const icono = partes[0] || '📍'; const nombre = partes[1] || p.nombre;
                ctx.font = '14px Poppins'; ctx.fillStyle = 'white';
                ctx.fillText(icono, p.x, p.y - 2);
                ctx.fillStyle = '#1d4ed8'; ctx.font = 'bold 10px Poppins';
                ctx.fillText(nombre, p.x, p.y + 18);
            } else {
                ctx.fillStyle = isPosta ? 'white' : 'black';
                ctx.font = isPosta ? 'bold 12px Poppins' : '14px Poppins';
                ctx.fillText(isPosta ? p.numero_posta : p.nombre, p.x, p.y);
            }

            const div = document.createElement('div');
            div.className = 'punto-item';
            div.style.borderLeftColor = isPosta ? 'var(--rojo-intenso)' : isPersonalizado ? '#3b82f6' : 'var(--verde)';
            const label = isPosta ? `Posta ${p.numero_posta}: ${p.nombre}` : isPersonalizado ? (() => { const pts = p.nombre.split('||'); return `${pts[0]||'📍'} ${pts[1]||p.nombre}`; })() : p.nombre;
            div.innerHTML = `
                <div><strong>${label}</strong><br><small>${p.descripcion || ''}</small></div>
                <button onclick="eliminarPunto('${p.id}')" style="color:var(--rojo-intenso);"><i class="fas fa-times"></i></button>
            `;
            lista.appendChild(div);
        });
    }

    canvas.addEventListener('click', async function(e) {
        if (!eventoActual) { await customAlert('Seleccione evento'); return; }
        const modo = document.getElementById('tipoPuntoCroquis').value;
        const desc = document.getElementById('descripcionPunto').value;
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width; const scaleY = canvas.height / rect.height;
        const x = (e.clientX - rect.left) * scaleX; const y = (e.clientY - rect.top) * scaleY;
        let nuevo = { evento_id: eventoActual.id, x: Math.round(x), y: Math.round(y), descripcion: desc };
        if(modo === 'posta') {
            const val = document.getElementById('selectorElementoCroquis').value; if(!val) return;
            const p = postasData.find(post => post.numero == val); if(!p) return;
            nuevo.numero_posta = p.numero; nuevo.nombre = p.nombre;
        } else if(modo === 'personalizado') {
            const nombre = document.getElementById('customNombre').value.trim();
            const icono = document.getElementById('customIcono').value;
            if(!nombre) { await customAlert('Escribe un nombre para el punto personalizado.'); return; }
            nuevo.numero_posta = 8888; nuevo.nombre = `${icono}||${nombre}`;
        } else {
            const val = document.getElementById('selectorElementoCroquis').value; if(!val) return;
            nuevo.numero_posta = 9999; nuevo.nombre = val;
        }
        try {
            const { data } = await supabaseClient.from('puntos_croquis').insert(nuevo).select();
            if(data) { puntosCroquis.push(data[0]); renderCroquis(); document.getElementById('descripcionPunto').value = ''; }
        }catch(e){}
    });

    window.agregarPuntoCroquisCentro = async function() {
        if (!eventoActual) return;
        const modo = document.getElementById('tipoPuntoCroquis').value;
        const desc = document.getElementById('descripcionPunto').value;
        let nuevo = { evento_id: eventoActual.id, x: 400, y: 250, descripcion: desc };
        if(modo === 'posta') {
            const val = document.getElementById('selectorElementoCroquis').value;
            const p = postasData.find(post => post.numero == val); if(!p) return;
            nuevo.numero_posta = p.numero; nuevo.nombre = p.nombre;
        } else if(modo === 'personalizado') {
            const nombre = document.getElementById('customNombre').value.trim();
            const icono = document.getElementById('customIcono').value;
            if(!nombre) { await customAlert('Escribe un nombre para el punto personalizado.'); return; }
            nuevo.numero_posta = 8888; nuevo.nombre = `${icono}||${nombre}`;
        } else {
            const val = document.getElementById('selectorElementoCroquis').value;
            nuevo.numero_posta = 9999; nuevo.nombre = val;
        }
        try{
            const { data } = await supabaseClient.from('puntos_croquis').insert(nuevo).select();
            if(data) { puntosCroquis.push(data[0]); renderCroquis(); document.getElementById('descripcionPunto').value = ''; }
        }catch(e){}
    }

    window.eliminarPunto = async function(id) {
        try{ await supabaseClient.from('puntos_croquis').delete().eq('id', id); }catch(e){}
        puntosCroquis = puntosCroquis.filter(p => p.id != id);
        renderCroquis();
    }

    window.limpiarPuntos = async function() {
        if(await customConfirm("¿Eliminar todos los puntos del mapa?")) {
            for(let p of puntosCroquis) { try{await supabaseClient.from('puntos_croquis').delete().eq('id', p.id);}catch(e){} }
            puntosCroquis = []; renderCroquis();
        }
    }

    window.imprimirCroquisSolo = function() {
        const evtTitulo = document.getElementById('evento-titulo')?.value || 'Evento Scout';
        const dataUrl = getCroquisDataUrl();
        if (!dataUrl) { customAlert('No hay croquis para imprimir.'); return; }
        const w = window.open('', '_blank');
        w.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Croquis - ${evtTitulo}</title>
        <style>
            @page { size: landscape; margin: 0.8cm; }
            * { margin:0; padding:0; box-sizing:border-box; }
            body { font-family:Arial,sans-serif; background:white; width:100%; height:100vh; display:flex; flex-direction:column; }
            .hdr { display:flex; align-items:center; justify-content:space-between; border-bottom:3px solid #0E2586; padding-bottom:8px; margin-bottom:8px; }
            .hdr img { height:48px; }
            .hdr h2 { color:#0E2586; font-size:16pt; font-weight:800; text-transform:uppercase; text-align:center; flex:1; }
            .hdr h3 { color:#555; font-size:10pt; font-weight:normal; }
            .mapa { flex:1; display:flex; align-items:center; justify-content:center; }
            .mapa img { width:100%; height:auto; max-height:calc(100vh - 90px); object-fit:contain; border:1px solid #ccc; border-radius:6px; }
            .leyenda { display:flex; gap:20px; justify-content:center; margin-top:6px; font-size:9pt; flex-wrap:wrap; }
            .dot { width:12px; height:12px; border-radius:50%; display:inline-block; }
        </style></head><body>
        <div class="hdr">
            <img src="https://hyixmaxhoxvamoecuars.supabase.co/storage/v1/object/public/payment-receipts/insignias/11u9rUD.png">
            <div style="text-align:center;flex:1"><h2>${evtTitulo}</h2><h3>Croquis Logístico y de Juego</h3></div>
            <img src="https://hyixmaxhoxvamoecuars.supabase.co/storage/v1/object/public/payment-receipts/insignias/DcxzvpX.png">
        </div>
        <div class="mapa"><img src="${dataUrl}"></div>
        <div class="leyenda">
            <div style="display:flex;align-items:center;gap:5px;"><span class="dot" style="background:rgba(248,2,2,0.9);"></span> Posta</div>
            <div style="display:flex;align-items:center;gap:5px;"><span class="dot" style="background:#fff;border:2px solid #22c55e;"></span> Logística</div>
            <div style="display:flex;align-items:center;gap:5px;"><span class="dot" style="background:rgba(59,130,246,0.9);"></span> Personalizado</div>
        </div>
        </body></html>`);
        w.document.close();
        setTimeout(() => w.print(), 600);
    }

    // ========== INVENTARIO ==========
