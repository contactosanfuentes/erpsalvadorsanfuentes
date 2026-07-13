        function obtenerLogoRama(rama) {
            const logos = {
                'Bandada': 'https://i.imgur.com/1aGKetX.png',
                'Manada': 'https://i.imgur.com/0bZQNJs.png',
                'Tropa': 'https://i.imgur.com/2M19fp0.png',
                'Compañía': 'https://i.imgur.com/eoG0c2D.png',
                'Avanzada': 'https://hyixmaxhoxvamoecuars.supabase.co/storage/v1/object/public/logos/avanzada_toki_pillan.png',
                'Clan': 'https://i.imgur.com/abtMi0i.png'
            };
            return logos[rama] || 'https://i.imgur.com/11u9rUD.png';
        }

        function obtenerIconoEtapa(etapa, rama) {
            const iconosPorRama = {
                'Bandada': {
                    'Pichón': 'https://i.imgur.com/FV5CyzO.png',
                    'Aprendiz': 'https://i.imgur.com/w25teqR.png',
                    'Viajera': 'https://i.imgur.com/a9xgrWU.png',
                    'Guía de Vuelo': 'https://i.imgur.com/XGGnl9N.png'
                },
                'Manada': {
                    'Lobezno': 'https://i.imgur.com/lSrmFXz.png',
                    'Saltador': 'https://i.imgur.com/AXcwr5h.png',
                    'Diestro': 'https://i.imgur.com/VBD3nDy.png',
                    'Cazador': 'https://i.imgur.com/QrsX3NY.png'
                },
                'Tropa': {
                    'Cernícalo': 'https://i.imgur.com/yJyps57.png',
                    'Halcón': 'https://i.imgur.com/AAZdzEG.png',
                    'Águila': 'https://i.imgur.com/j2OYdiD.png',
                    'Cóndor': 'https://i.imgur.com/GQNxp25.png'
                },
                'Compañía': {
                    'Alba': 'https://i.imgur.com/CyEFpPL.png',
                    'Amanecer': 'https://i.imgur.com/JQqcy0X.png',
                    'Luz': 'https://i.imgur.com/9ZheqTf.png',
                    'Resplandor': 'https://i.imgur.com/vkJj0bK.png'
                },
                'Avanzada': {
                    'Sendero': 'https://i.imgur.com/VHZrlFN.png',
                    'Cumbre': 'https://i.imgur.com/3MeclHS.png'
                },
                'Clan': {
                    'Fuego': 'https://i.imgur.com/IEr3Kms.png',
                    'Antorcha': 'https://i.imgur.com/qTTibWH.png'
                }
            };
            return (iconosPorRama[rama] && iconosPorRama[rama][etapa]) ? iconosPorRama[rama][etapa] : '';
        }

        // ================= MÓDULO DE EMISIÓN DE EXPEDIENTE DOCUMENTAL (PDF) =================
        function imprimirExpediente(jovenId) {
            const j = personasJovenes.find(x => x.id === jovenId);
            if (!j) return;
            const w = window.open('', '_blank');
            const fotoUrl = j.foto || 'https://ui-avatars.com/api/?name='+encodeURIComponent(j.nombre)+'&background=f1f5f9&color=0E2586&bold=true';
            const logoRamaUrl = obtenerLogoRama(j.rama);
            const iconoEtapaUrl = obtenerIconoEtapa(j.etapaActual, j.rama);
            
            w.document.write(`
            <html><head>
                <title>Expediente Institucional - ${escapeHtml(j.nombre)} - Grupo Guías y Scouts Salvador Sanfuentes</title>
                <style>
                    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #1e293b; line-height: 1.5; font-size: 14px; }
                    .header-box { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #0E2586; padding-bottom: 15px; margin-bottom: 25px; }
                    .title-sys { color: #0E2586; margin: 0; font-size: 24px; font-weight: 900; text-transform: uppercase; letter-spacing: -0.5px;}
                    .subtitle { color: #64748b; margin: 5px 0 0 0; font-size: 12px; font-weight: bold; }
                    .photo-box { width: 100px; height: 100px; border-radius: 8px; border: 2px solid #cbd5e0; object-fit: cover; }
                    h2 { color: #0E2586; border-bottom: 2px solid #e2e8f0; padding-bottom: 5px; margin-top: 30px; font-size: 16px; text-transform: uppercase; font-weight: 900; }
                    .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px 25px; margin-bottom: 10px; }
                    .grid.col-3 { grid-template-columns: repeat(3, 1fr); }
                    .data-box { background: #f8fafc; padding: 10px 15px; border-radius: 6px; border: 1px solid #e2e8f0; }
                    .data-label { display: block; font-size: 10px; color: #64748b; font-weight: bold; text-transform: uppercase; margin-bottom: 3px; }
                    .data-val { display: block; font-size: 14px; color: #0f172a; font-weight: 600; }
                    .data-val.alert { color: #b91c1c; font-weight: 900; }
                    .badge { background: #0E2586; color: white; padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: bold; display: inline-block;}
                    .rama-logo { width: 32px; height: 32px; vertical-align: middle; margin-right: 8px; }
                    .etapa-icono { width: 24px; height: 24px; vertical-align: middle; margin-right: 5px; }
                    ul { margin: 10px 0; padding-left: 20px; } li { margin-bottom: 5px; }
                    .footer-sys { margin-top: 50px; text-align: center; font-size: 10px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 20px; }
                    .rama-etapa-container { display: flex; align-items: center; gap: 12px; margin-bottom: 10px; flex-wrap: wrap; }
                </style>
            </head><body>
                <div class="header-box">
                    <div>
                        <h1 class="title-sys">Expediente Oficial de Progresión</h1>
                        <p class="subtitle">SISTEMA NACIONAL DE GESTIÓN EDUCATIVA - GRUPO GUÍAS Y SCOUTS SALVADOR SANFUENTES</p>
                        <div style="margin-top:20px;">
                            <div class="data-val" style="font-size:22px; margin-bottom:5px;">${escapeHtml(j.nombre)}</div>
                            <div class="rama-etapa-container">
                                <span class="badge"><img src="${logoRamaUrl}" class="rama-logo"> Rama ${escapeHtml(j.rama)}</span>
                                <span class="badge" style="background:#475569;">Unidad: ${escapeHtml(j.unidad)}</span>
                                <span class="badge" style="background:#10b981;">Etapa Actual: ${iconoEtapaUrl ? `<img src="${iconoEtapaUrl}" class="etapa-icono">` : ''} ${escapeHtml(j.etapaActual)}</span>
                            </div>
                        </div>
                    </div>
                    <div style="display: flex; flex-direction: column; align-items: center;">
                        <img src="${fotoUrl}" class="photo-box" style="width:100px; height:100px; object-fit:cover;">
                        <div style="margin-top: 5px; font-size: 10px; color:#64748b;">Foto de registro</div>
                    </div>
                </div>

                <h2>Identificación Civil y Demográfica</h2>
                <div class="grid">
                    <div class="data-box"><span class="data-label">RUN Nacional</span><span class="data-val">${escapeHtml(j.run||'No registra')}</span></div>
                    <div class="data-box"><span class="data-label">Nacimiento (Edad)</span><span class="data-val">${escapeHtml(j.fecha_nacimiento||'N/A')} (${j.edad} años)</span></div>
                    <div class="data-box"><span class="data-label">Domicilio Residencia</span><span class="data-val">${escapeHtml(j.domicilio||'No registra')}</span></div>
                    <div class="data-box"><span class="data-label">Religión / Confesión</span><span class="data-val">${escapeHtml(j.religion||'No registra')}</span></div>
                </div>

                <h2>Red de Apoyo Tutelar (Contactos)</h2>
                <div class="grid">
                    <div class="data-box" style="border-left: 4px solid #3b82f6;"><span class="data-label">Apoderado Titular (${escapeHtml(j.apoderado_titular_parentesco||'N/A')})</span><span class="data-val">${escapeHtml(j.apoderado_titular_nombre||'N/A')}</span><span class="data-label" style="margin-top:5px;">Tel: ${escapeHtml(j.apoderado_titular_telefono||'N/A')} | Correo: ${escapeHtml(j.apoderado_titular_email||'N/A')}</span></div>
                    <div class="data-box" style="border-left: 4px solid #cbd5e0;"><span class="data-label">Apoderado Suplente Emergencia</span><span class="data-val">${escapeHtml(j.apoderado_suplente1_nombre||'N/A')}</span><span class="data-label" style="margin-top:5px;">Tel: ${escapeHtml(j.apoderado_suplente1_telefono||'N/A')}</span></div>
                </div>

                <h2 style="color: #b91c1c; border-bottom-color: #fca5a5;">Expediente Médico (Ficha Crítica de Riesgos)</h2>
                <div class="grid col-3">
                    <div class="data-box bg-red-50"><span class="data-label text-red-800">Previsión Base</span><span class="data-val">${escapeHtml(j.prevision_salud||'N/A')}</span></div>
                    <div class="data-box bg-red-50"><span class="data-label text-red-800">Grupo Sanguíneo</span><span class="data-val">${escapeHtml(j.grupo_sanguineo||'Desconocido')}</span></div>
                    <div class="data-box bg-red-50"><span class="data-label text-red-800">Seguro Complementario</span><span class="data-val">${j.tiene_seguro_complementario?'Sí Activo':'No registra'}</span></div>
                </div>
                <div class="data-box" style="background:#fef2f2; border: 2px solid #fca5a5; margin-top:15px;">
                    <span class="data-label" style="color: #991b1b; font-size:12px;">Condiciones Médicas / Restricciones Alimentarias / Alergias Severas</span>
                    <span class="data-val alert" style="font-size: 16px; margin-top:5px;">${j.condiciones_necesidades && j.condiciones_necesidades.length ? escapeHtml(j.condiciones_necesidades.join(' | ')) : 'Ninguna declarada por el apoderado legal.'}</span>
                    <span class="data-label" style="margin-top:10px;">Tratamientos Específicos Adicionales:</span>
                    <span style="font-size: 12px; color: #450a0a; font-style: italic;">${escapeHtml(j.condiciones_explicacion||'Sin observaciones adicionales en ficha.')}</span>
                </div>

                <h2>Resumen Académico (Malla Curricular Scout)</h2>
                <div class="grid">
                    <div class="data-box"><span class="data-label">Etapa Formal Actual Registrada en Acta</span><span class="data-val">${escapeHtml(j.etapaActual)}</span></div>
                    <div class="data-box"><span class="data-label">Estado Registro Anual (ORI) Institucional</span><span class="data-val" style="color: ${j.registro_pagado?'#15803d':'#b91c1c'};">${j.registro_pagado ? 'Cuota Pagada - Seguro Vigente' : 'Inactivo - Sin Seguro Institucional'}</span></div>
                </div>
                <div class="data-box" style="margin-top:15px;">
                    <span class="data-label">Central de Certificación de Especialidades (Validadas en 4 Pilares)</span>
                    <ul style="margin: 5px 0 0 0; font-size:13px; color: #334155;">
                        ${j.especialidades.map(e=>`<li><strong>${escapeHtml(e.nombre)}</strong> <em>(Cat: ${escapeHtml(e.categoria)})</em> - Monitor Experto Aval: ${escapeHtml(e.monitor||'N/A')}</li>`).join('')||'<li><i style="color:#94a3b8;">El joven no registra especialidades certificadas en la base de datos nacional en este momento.</i></li>'}
                    </ul>
                </div>

                <div class="footer-sys">
                    DOCUMENTO IMPRESO GENERADO DE FORMA AUTOMATIZADA DESDE LA PLATAFORMA ERP DE GESTIÓN EDUCATIVA<br>
                    <strong>GRUPO GUÍAS Y SCOUTS SALVADOR SANFUENTES</strong><br>
                    FECHA DE EXTRACCIÓN DEL REPORTE (TIME-STAMP): ${new Date().toLocaleString('es-CL')}
                </div>
            

</body></html>
            `);
            w.document.close();
            setTimeout(() => { w.print(); }, 800);
        }

        // ================= DASHBOARD ANALÍTICO INSTITUCIONAL (KPIs) =================
