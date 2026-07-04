        async function fetchRealNotifications() {
            const notifBody = document.getElementById('notif-body-content');
            const badge = document.getElementById('notif-badge');
            let items = [];
            
            try {
                const hoy = new Date();
                const hoyISO = hoy.toISOString();
                const en30dias = new Date(); en30dias.setDate(en30dias.getDate() + 30);
                const en7dias = new Date(); en7dias.setDate(en7dias.getDate() + 7);

                // ═══ 1. EVENTOS PRÓXIMOS (30 días) ═══
                try {
                    const { data: eventos } = await supabaseClient.from('eventos').select('nombre, fecha_inicio, publicado').gte('fecha_inicio', hoyISO).lte('fecha_inicio', en30dias.toISOString());
                    if (eventos) eventos.forEach(e => {
                        const dias = Math.ceil((new Date(e.fecha_inicio) - hoy) / 86400000);
                        const urgente = dias <= 7;
                        items.push({ icon: 'fa-campground', bg: urgente ? '#fef2f2' : '#fff3e0', color: urgente ? '#dc2626' : '#ff9800', title: `Evento: ${e.nombre}`, sub: `En ${dias} día(s) · ${new Date(e.fecha_inicio).toLocaleDateString('es-CL')}${e.publicado ? ' · Publicado' : ' · No publicado'}`, target: 'view-eventos', priority: urgente ? 1 : 3, unread: urgente });
                    });
                } catch(e) {}

                // ═══ 2. SOLICITUDES PENDIENTES DE PROYECTOS ═══
                try {
                    const { data: allProg } = await supabaseClient.from('progresion_jovenes').select('joven_id, camino');
                    let totalSol = 0; let detalleSol = [];
                    if (allProg) allProg.forEach(p => {
                        (p.camino?.proyectos_colectivos || []).forEach(proy => {
                            const sols = proy.solicitudes_pendientes || [];
                            totalSol += sols.length;
                            sols.forEach(s => detalleSol.push(`${s.nombre} → "${proy.nombre}"`));
                        });
                    });
                    if (totalSol > 0) items.push({ icon: 'fa-user-plus', bg: '#fef3c7', color: '#d97706', title: `${totalSol} Solicitud(es) de Proyecto`, sub: detalleSol.slice(0,3).join(', ') + (detalleSol.length > 3 ? ` (+${detalleSol.length-3} más)` : ''), target: 'view-profiles', priority: 1, unread: true });
                } catch(e) {}

                // ═══ 3. JÓVENES SIN UNIDAD ASIGNADA ═══
                try {
                    const { data: sinUnidad } = await supabaseClient.from('mmbb_registrations').select('id').or('unidad.is.null,unidad.eq.,unidad.eq.Sin Unidad');
                    if (sinUnidad && sinUnidad.length > 0) items.push({ icon: 'fa-exclamation-triangle', bg: '#ffebee', color: '#f44336', title: 'Directorio Incompleto', sub: `${sinUnidad.length} joven(es) sin unidad asignada`, target: 'view-directorio', priority: 2, unread: true });
                } catch(e) {}

                // ═══ 4. REGISTRO INSTITUCIONAL IMPAGO (JÓVENES) ═══
                try {
                    const { data: sinPago } = await supabaseClient.from('mmbb_registrations').select('id').or('registro_pagado.is.null,registro_pagado.eq.false');
                    if (sinPago && sinPago.length > 0) items.push({ icon: 'fa-file-invoice-dollar', bg: '#fef2f2', color: '#dc2626', title: 'Registros Institucionales Pendientes', sub: `${sinPago.length} joven(es) sin cuota ORI pagada (sin seguro)`, target: 'view-profiles', priority: 2, unread: true });
                } catch(e) {}

                // ═══ 5. ADULTOS SIN CERTIFICADOS VCM ═══
                try {
                    const { data: adultos } = await supabaseClient.from('adultos_registros').select('id, cert_antecedentes_url, cert_inhabilidad_url, cert_inhabilidad_relevante_url').eq('activo', true);
                    if (adultos) {
                        const sinCerts = adultos.filter(a => !a.cert_antecedentes_url || !a.cert_inhabilidad_url || !a.cert_inhabilidad_relevante_url);
                        if (sinCerts.length > 0) items.push({ icon: 'fa-shield-alt', bg: '#fef2f2', color: '#b91c1c', title: '⚠ Riesgo Legal: Certificados VCM', sub: `${sinCerts.length} adulto(s) activo(s) con certificados faltantes o vencidos`, target: 'view-adultos', priority: 1, unread: true });
                    }
                } catch(e) {}

                // ═══ 6. ADULTOS SIN COMPROMISO ANUAL ═══
                try {
                    const { data: adultos } = await supabaseClient.from('adultos_registros').select('id').eq('activo', true);
                    const { data: compromisos } = await supabaseClient.from('compromisos_adultos').select('adulto_id');
                    if (adultos && compromisos) {
                        const conCompromiso = new Set(compromisos.map(c => c.adulto_id));
                        const sinComp = adultos.filter(a => !conCompromiso.has(a.id));
                        if (sinComp.length > 0) items.push({ icon: 'fa-file-signature', bg: '#fff7ed', color: '#ea580c', title: 'Compromisos Anuales Pendientes', sub: `${sinComp.length} adulto(s) sin compromiso formalizado`, target: 'view-adultos', priority: 2, unread: false });
                    }
                } catch(e) {}

                // ═══ 7. CUOTAS IMPAGOS ADULTOS ═══
                try {
                    const { data: sinCuota } = await supabaseClient.from('adultos_registros').select('id').eq('activo', true).or('cuota_pagada.is.null,cuota_pagada.eq.false');
                    if (sinCuota && sinCuota.length > 0) items.push({ icon: 'fa-money-bill-wave', bg: '#fef9c3', color: '#a16207', title: 'Cuotas de Adultos Pendientes', sub: `${sinCuota.length} dirigente(s) sin cuota institucional pagada`, target: 'view-adultos', priority: 3, unread: false });
                } catch(e) {}

                // ═══ 8. MIEMBROS INACTIVOS ═══
                try {
                    const { data: iJ } = await supabaseClient.from('mmbb_registrations').select('id').eq('activo', false);
                    const { data: iA } = await supabaseClient.from('adultos_registros').select('id').eq('activo', false);
                    const total = ((iJ||[]).length) + ((iA||[]).length);
                    if (total > 0) items.push({ icon: 'fa-user-slash', bg: '#f3f4f6', color: '#6b7280', title: 'Miembros Inactivos', sub: `${(iJ||[]).length} joven(es) y ${(iA||[]).length} adulto(s) inactivos este período`, target: 'view-profiles', priority: 4, unread: false });
                } catch(e) {}

                // ═══ 9. CUMPLEAÑOS PRÓXIMOS (7 días) ═══
                try {
                    const { data: jovenes } = await supabaseClient.from('mmbb_registrations').select('nombres, apellidos, fecha_nacimiento').eq('activo', true).not('fecha_nacimiento', 'is', null);
                    if (jovenes) {
                        const cumples = jovenes.filter(j => {
                            if (!j.fecha_nacimiento) return false;
                            const fn = new Date(j.fecha_nacimiento);
                            const este = new Date(hoy.getFullYear(), fn.getMonth(), fn.getDate());
                            if (este < hoy) este.setFullYear(este.getFullYear() + 1);
                            return (este - hoy) / 86400000 <= 7;
                        });
                        if (cumples.length > 0) {
                            const nombres = cumples.slice(0,3).map(c => c.nombres.split(' ')[0]).join(', ');
                            items.push({ icon: 'fa-birthday-cake', bg: '#fdf2f8', color: '#db2777', title: `🎂 ${cumples.length} Cumpleaño(s) esta semana`, sub: nombres + (cumples.length > 3 ? ` (+${cumples.length-3} más)` : ''), target: 'view-profiles', priority: 3, unread: false });
                        }
                    }
                } catch(e) {}

                // ═══ 10. JÓVENES SIN PROGRESIÓN ═══
                try {
                    const { data: jovActivos } = await supabaseClient.from('mmbb_registrations').select('id').eq('activo', true);
                    const { data: conProg } = await supabaseClient.from('progresion_jovenes').select('joven_id');
                    if (jovActivos && conProg) {
                        const idsConProg = new Set(conProg.map(p => p.joven_id));
                        const sinProg = jovActivos.filter(j => !idsConProg.has(j.id));
                        if (sinProg.length > 0) items.push({ icon: 'fa-chart-line', bg: '#fff7ed', color: '#c2410c', title: 'Progresión Pendiente', sub: `${sinProg.length} joven(es) activo(s) sin registro de progresión`, target: 'view-profiles', priority: 3, unread: false });
                    }
                } catch(e) {}

                // ═══ 11. TESORERÍA: SALDOS NEGATIVOS ═══
                try {
                    const { data: cuentas } = await supabaseClient.from('tesoreria_cuentas').select('id, nombre');
                    const { data: movimientos } = await supabaseClient.from('tesoreria_movimientos').select('cuenta_id, monto');
                    if (cuentas && movimientos) {
                        const saldos = {};
                        cuentas.forEach(c => saldos[c.id] = { nombre: c.nombre, total: 0 });
                        movimientos.forEach(m => { if (saldos[m.cuenta_id]) saldos[m.cuenta_id].total += m.monto; });
                        const negativos = Object.values(saldos).filter(s => s.total < 0);
                        if (negativos.length > 0) items.push({ icon: 'fa-wallet', bg: '#fef2f2', color: '#dc2626', title: 'Alerta Tesorería', sub: `${negativos.length} cuenta(s) con saldo negativo: ${negativos.map(n => n.nombre).join(', ')}`, target: 'view-tesoreria', priority: 1, unread: true });
                    }
                } catch(e) {}

                // ═══ ORDENAR POR PRIORIDAD Y RENDERIZAR ═══
                items.sort((a, b) => a.priority - b.priority);
                
                let unreadCount = items.filter(i => i.unread).length;

                if (items.length === 0) {
                    notifBody.innerHTML = `<div style="padding:30px;text-align:center;"><i class="fas fa-check-circle" style="font-size:2.5rem;color:#10b981;margin-bottom:10px;display:block;"></i><p style="font-weight:700;color:#10b981;margin:0;">Todo en orden</p><p style="font-size:0.78rem;color:#94a3b8;margin-top:4px;">No hay alertas pendientes.</p></div>`;
                } else {
                    notifBody.innerHTML = items.map(n => `
                        <div class="notif-item ${n.unread ? 'unread' : ''}" onclick="irAResultado('${n.target}')">
                            <div class="notif-icon" style="background:${n.bg};color:${n.color};"><i class="fas ${n.icon}"></i></div>
                            <div class="notif-content">
                                <p class="notif-title">${n.title}</p>
                                <p class="notif-time">${n.sub}</p>
                            </div>
                        </div>
                    `).join('');
                }

                if (badge) { badge.style.opacity = unreadCount > 0 ? '1' : '0'; badge.textContent = unreadCount > 0 ? unreadCount : ''; }
                
            } catch (error) {
                console.error("Error:", error);
                notifBody.innerHTML = `<div style="padding: 20px; text-align: center; color: #e74c3c;"><i class="fas fa-wifi"></i> Error de conexión</div>`;
            }
        }

        function toggleNotifications(e) {
            if (e) e.stopPropagation();
            const dropdown = document.getElementById('notifDropdown');
            const userDropdown = document.getElementById('userDropdown');
            if (dropdown) dropdown.classList.toggle('active');
            if (userDropdown) userDropdown.classList.remove('active');
        }

        function toggleUserDropdown(e) {
            if (e) e.stopPropagation();
            const dropdown = document.getElementById('userDropdown');
            const notifDropdown = document.getElementById('notifDropdown');
            if (dropdown) dropdown.classList.toggle('active');
            if (notifDropdown) notifDropdown.classList.remove('active');
        }

        function markAllRead() {
            document.querySelectorAll('.notif-item.unread').forEach(item => { 
                item.classList.remove('unread'); 
            });
            showToast('Todas las alertas marcadas como leídas', 'success');
        }

        // ========== NAVEGACIÓN Y MENÚ ==========
