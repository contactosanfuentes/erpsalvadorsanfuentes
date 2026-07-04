    function generarHtmlCredencial(a, eventoNombre) {
        const fotoSrc = a.foto_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(a.nombre)}&background=E0E7FF&color=4338CA&bold=true&length=1`;
        const grupoLogo = 'https://i.imgur.com/11u9rUD.png';
        const rolTexto = (a.rol || 'PARTICIPANTE').toUpperCase();

        // Detectar color por unidad o rol — igual que en jóvenes
        const ctx = ((a.rol || '') + ' ' + (a.grupo || '')).toLowerCase();
        let colorUnidad = '#0E2586';
        if (ctx.includes('manada') || ctx.includes('bandada') || ctx.includes('lobato')) colorUnidad = '#FFD100';
        else if (ctx.includes('tropa') || ctx.includes('compañ') || ctx.includes('compani') || ctx.includes('scout')) colorUnidad = '#00853F';
        else if (ctx.includes('avanz') || ctx.includes('pionero')) colorUnidad = '#0055A5';
        else if (ctx.includes('clan') || ctx.includes('caminante') || ctx.includes('ruta')) colorUnidad = '#E31837';
        else if (ctx.includes('dirigente') || ctx.includes('staff') || ctx.includes('coordinador')) colorUnidad = '#0E2586';
        const textoUnidad = (colorUnidad === '#FFD100') ? '#4E110B' : 'white';

        return `
            <div class="credencial-card-print" style="
                width: 5.4cm; 
                height: 8.5cm; 
                border-radius: 12px; 
                font-family: Arial, sans-serif; 
                position: relative; 
                display: inline-block; 
                margin: 10px; 
                box-sizing: border-box; 
                background: #ffffff; 
                page-break-inside: avoid; 
                overflow: hidden;
                border: 3px solid ${colorUnidad};
                text-align: center;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            ">
                <div style="background: #0E2586 !important; height: 1.8cm; width: 100%; display: table;">
                    <div style="display: table-cell; vertical-align: middle; text-align: center; padding: 0 10px;">
                        <div style="color: rgba(255,255,255,0.7); font-size: 8px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">EVENTO OFICIAL</div>
                        <div style="color: #ffffff; font-size: 10px; font-weight: bold; text-transform: uppercase;">${eventoNombre}</div>
                    </div>
                </div>

                <div style="height: 1cm; width: 100%;"></div>

                <div style="text-align: center; position: relative; z-index: 10; margin-top: -1.2cm;">
                    <div style="display: inline-block; background: white; padding: 3px; border-radius: 50%; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                        <img src="${fotoSrc}" style="width: 2.8cm; height: 2.8cm; border-radius: 50%; border: 3px solid ${colorUnidad}; object-fit: cover; display: block;">
                    </div>
                </div>

                <div style="padding: 0 10px; text-align: center; position: relative; z-index: 5;">
                    <div style="height: 2.2cm; display: table; width: 100%;">
                        <div style="display: table-cell; vertical-align: middle;">
                            <h3 style="margin: 0; font-size: 15px; font-weight: bold; color: #111; line-height: 1.2; text-transform: uppercase;">
                                ${a.nombre}
                            </h3>
                            <div style="margin-top: 5px; display: inline-block; padding: 2px 10px; background: #f0f0f0; border-radius: 10px; font-size: 9px; color: #444; font-weight: bold;">
                                ${a.grupo || 'SCOUT'}
                            </div>
                        </div>
                    </div>
                </div>

                <img src="${grupoLogo}" style="
                    position: absolute; 
                    bottom: 0.6cm; 
                    right: -0.6cm; 
                    width: 2.6cm; 
                    opacity: 0.12; 
                    transform: rotate(-25deg); 
                    z-index: 1;
                    pointer-events: none;
                ">

                <div style="background: ${colorUnidad} !important; height: 1cm; width: 100%; position: absolute; bottom: 0; left: 0; display: table; z-index: 2;">
                    <div style="display: table-cell; vertical-align: middle; text-align: center;">
                        <div style="color: ${textoUnidad}; font-size: 14px; font-weight: 900; letter-spacing: 2px;">
                            ${rolTexto}
                        </div>
                        <div style="width: 30px; height: 2px; background: rgba(255,255,255,0.5); margin: 2px auto 0 auto; border-radius: 1px;"></div>
                    </div>
                </div>
            </div>
        `;
    }

    window.imprimirCredencialIndividual = function(a) {
        const evtTitulo = document.getElementById('evento-titulo').value || 'Evento Scout';
        const w = window.open('', '_blank');
        w.document.write(`<html><head><title>Credencial ${a.nombre}</title><style>body { margin: 0; padding: 20px; text-align: center; -webkit-print-color-adjust: exact; print-color-adjust: exact; }</style></head><body>${generarHtmlCredencial(a, evtTitulo)}</body></html>`);
        w.document.close();
        setTimeout(() => { w.focus(); w.print(); }, 500);
    }

    window.imprimirCredencialesMasivasJovenes = function() {
        if(typeof jovenes === 'undefined' || jovenes.length === 0) { alert('No hay jóvenes registrados.'); return; }
        const evtTitulo = document.getElementById('evento-titulo').value || 'Evento Scout';
        const w = window.open('', '_blank');
        let html = `<html><head><title>Credenciales Jóvenes</title><style>
            @page { size: letter; margin: 0.5cm; }
            body { margin: 0; padding: 10px; text-align: center; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .credencial-card-print { page-break-inside: avoid; margin-bottom: 0.5cm; }
        </style></head><body>`;
        jovenes.forEach(j => { html += generarHtmlCredencialJoven(j, evtTitulo); });
        html += `</body></html>`;
        w.document.write(html);
        w.document.close();
        setTimeout(() => { w.focus(); w.print(); }, 1000);
    }

    window.imprimirCredencialesMasivas = function() {
        if(typeof adultos === 'undefined' || adultos.length === 0) { alert("No hay adultos registrados."); return; }
        const evtTitulo = document.getElementById('evento-titulo').value || 'Evento Scout';
        const w = window.open('', '_blank');
        let html = `<html><head><title>Credenciales Masivas</title><style>@page { size: letter; margin: 0.5cm; } body { margin: 0; padding: 0; text-align: center; -webkit-print-color-adjust: exact; print-color-adjust: exact; } .credencial-card-print { page-break-inside: avoid; margin-bottom: 0.5cm; }</style></head><body>`;
        adultos.forEach(a => { html += generarHtmlCredencial(a, evtTitulo); });
        html += `</body></html>`;
        w.document.write(html);
        w.document.close();
        setTimeout(() => { w.focus(); w.print(); }, 1000);
    }

    // ========== COMPROBANTES Y CORREOS ==========
    function generarHtmlPasaporte(id) {
        const p = postasData;
        const pas = pasaportes[id] || { puntuaciones: [] };
        let totalPts = 0;
        let html = `
            <div style="margin-top: 20px; border-top: 2px dashed #999; padding-top: 20px;">
                <h3 style="text-align:center; color:#0E2586; margin-bottom: 15px;">PASAPORTE DE EVALUACIÓN</h3>
                <table style="width:100%; border-collapse: collapse; font-family:sans-serif;" border="1">
                    <tr style="background:#f0f0f0;"><th>Posta</th><th>Nombre</th><th>Letras</th><th>Puntos</th><th>Firma</th> </tr>
        `;
        postasData.forEach((posta, i) => {
            const pt = pas.puntuaciones[i] || {};
            html += ` <tr>
                <td style="padding:6px; text-align:center;">${posta.numero}</td><td style="padding:6px;">${posta.nombre}</td>
                <td style="padding:6px; text-align:center;">${pt.letras||''}</td><td style="padding:6px; text-align:center;">${pt.numeros||''}</td><td style="padding:6px;">${pt.firma||''}</td>
              </tr>`;
            totalPts += parseInt(pt.numeros) || 0;
        });
        html += `
              <tr><td colspan="3" style="text-align:right; padding:6px;"><strong>TOTAL:</strong></td><td style="text-align:center; padding:6px;"><strong>${totalPts}</strong></td><td></td></tr>
              </table></div>
        `;
        return html;
    }

    // ── Generar HTML de credencial para un joven/patrulla ──
    function generarHtmlCredencialJoven(p, eventoNombre) {
        const fotoSrc = p.foto_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(p.nombre_patrulla || '?')}&background=E0E7FF&color=0E2586&bold=true&length=2`;
        const grupoLogo = 'https://i.imgur.com/11u9rUD.png';
        // Color por unidad
        const unidad = (unidades.find(u => u.id === p.unidad_id)?.nombre || '').toLowerCase();
        let colorUnidad = '#0E2586';
        if (unidad.includes('manada') || unidad.includes('bandada')) colorUnidad = '#FFD100';
        else if (unidad.includes('tropa') || unidad.includes('compañ') || unidad.includes('compani')) colorUnidad = '#00853F';
        else if (unidad.includes('avanz') || unidad.includes('pionero')) colorUnidad = '#0055A5';
        else if (unidad.includes('clan') || unidad.includes('caminante')) colorUnidad = '#E31837';
        const textoUnidad = (unidad.includes('manada')||unidad.includes('bandada')) ? '#4E110B' : 'white';

        return `
            <div class="credencial-card-print" style="
                width: 5.4cm; height: 8.5cm; border-radius: 12px;
                font-family: Arial, sans-serif; position: relative;
                display: inline-block; margin: 10px; box-sizing: border-box;
                background: #ffffff; page-break-inside: avoid; overflow: hidden;
                border: 3px solid ${colorUnidad}; text-align: center;
                -webkit-print-color-adjust: exact; print-color-adjust: exact;
            ">
                <div style="background: #0E2586 !important; height: 1.8cm; width: 100%; display: table;">
                    <div style="display: table-cell; vertical-align: middle; text-align: center; padding: 0 10px;">
                        <div style="color: rgba(255,255,255,0.7); font-size: 8px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">EVENTO OFICIAL</div>
                        <div style="color: #ffffff; font-size: 10px; font-weight: bold; text-transform: uppercase;">${eventoNombre}</div>
                    </div>
                </div>

                <div style="height: 1cm; width: 100%;"></div>

                <div style="text-align: center; position: relative; z-index: 10; margin-top: -1.2cm;">
                    <div style="display: inline-block; background: white; padding: 3px; border-radius: 50%; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                        <img src="${fotoSrc}" style="width: 2.8cm; height: 2.8cm; border-radius: 50%; border: 3px solid ${colorUnidad}; object-fit: cover; display: block;">
                    </div>
                </div>

                <div style="padding: 0 10px; text-align: center; position: relative; z-index: 5;">
                    <div style="height: 2.2cm; display: table; width: 100%;">
                        <div style="display: table-cell; vertical-align: middle;">
                            <h3 style="margin: 0; font-size: 13px; font-weight: bold; color: #111; line-height: 1.2; text-transform: uppercase;">${p.nombre_patrulla || 'Patrulla'}</h3>
                            <div style="margin-top: 5px; font-size: 10px; color: #666;">${p.grupo_scout || ''}</div>
                            <div style="margin-top: 4px; display: inline-block; padding: 2px 10px; background: #f0f0f0; border-radius: 10px; font-size: 9px; color: #444; font-weight: bold;">
                                ${p.numero_integrantes || 0} integrante${(p.numero_integrantes||0)===1?'':'s'}
                            </div>
                        </div>
                    </div>
                </div>

                <img src="${grupoLogo}" style="
                    position: absolute; bottom: 0.6cm; right: -0.6cm; width: 2.6cm;
                    opacity: 0.12; transform: rotate(-25deg); z-index: 1; pointer-events: none;
                ">

                <div style="background: ${colorUnidad} !important; height: 1cm; width: 100%; position: absolute; bottom: 0; left: 0; display: table; z-index: 2;">
                    <div style="display: table-cell; vertical-align: middle; text-align: center;">
                        <div style="color: ${textoUnidad}; font-size: 12px; font-weight: 900; letter-spacing: 2px; text-transform: uppercase;">
                            ${unidad ? unidad.toUpperCase() : 'PARTICIPANTE'}
                        </div>
                        <div style="width: 30px; height: 2px; background: rgba(255,255,255,0.5); margin: 2px auto 0 auto; border-radius: 1px;"></div>
                    </div>
                </div>
            </div>
        `;
    }

    window.imprimirCredencialJoven = function(p) {
        const evtTitulo = document.getElementById('evento-titulo').value || 'Evento Scout';
        const w = window.open('', '_blank');
        w.document.write(`<html><head><title>Credencial ${p.nombre_patrulla}</title><style>body{margin:0;padding:20px;text-align:center;-webkit-print-color-adjust:exact;print-color-adjust:exact;}</style></head><body>${generarHtmlCredencialJoven(p, evtTitulo)}</body></html>`);
        w.document.close();
        setTimeout(() => { w.focus(); w.print(); }, 500);
    }

