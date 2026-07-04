        async function renderGeneral() {
            try {
                let totalJovenes = 0, totalAdultos = 0, totalCuentas = 0, saldoTotal = 0;
                try { const { count, error } = await supabaseClient.from('mmbb_registrations').select('*', { count: 'exact', head: true }); if(!error) totalJovenes = count || 0; } catch (e) {}
                try { const { count, error } = await supabaseClient.from('adultos_registros').select('*', { count: 'exact', head: true }); if(!error) totalAdultos = count || 0; } catch (e) {}
                try {
                    const { data: cuentas, error } = await supabaseClient.from('tesoreria_cuentas').select('id');
                    if (!error && cuentas) {
                        totalCuentas = cuentas.length;
                        for (const c of cuentas) {
                            const { data: movs } = await supabaseClient.from('tesoreria_movimientos').select('monto').eq('cuenta_id', c.id);
                            saldoTotal += (movs || []).reduce((acc, m) => acc + (m.monto || 0), 0);
                        }
                    }
                } catch (e) {}

                // Guardar para el reporte de impresión
                window.reportData.kpi = { jovenes: totalJovenes, adultos: totalAdultos, cuentas: totalCuentas, saldoTotal: saldoTotal };

                document.getElementById('generalKPI').innerHTML = `
                    <div class="stat-card border-t-4 border-blue-500 hover:-translate-y-1 transition-transform"><i class="fas fa-child stat-icon-bg"></i><div class="flex justify-between items-start z-10 relative"><div><p class="text-xs text-gray-500 font-bold uppercase tracking-widest">Jóvenes</p><p class="text-4xl font-black text-blue-600 mt-2">${totalJovenes}</p></div><div class="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-500"><i class="fas fa-child"></i></div></div></div>
                    <div class="stat-card border-t-4 border-green-500 hover:-translate-y-1 transition-transform"><i class="fas fa-user-tie stat-icon-bg"></i><div class="flex justify-between items-start z-10 relative"><div><p class="text-xs text-gray-500 font-bold uppercase tracking-widest">Adultos</p><p class="text-4xl font-black text-green-600 mt-2">${totalAdultos}</p></div><div class="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-500"><i class="fas fa-user-tie"></i></div></div></div>
                    <div class="stat-card border-t-4 border-amber-500 hover:-translate-y-1 transition-transform"><i class="fas fa-wallet stat-icon-bg"></i><div class="flex justify-between items-start z-10 relative"><div><p class="text-xs text-gray-500 font-bold uppercase tracking-widest">Cuentas</p><p class="text-4xl font-black text-amber-600 mt-2">${totalCuentas}</p></div><div class="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-500"><i class="fas fa-wallet"></i></div></div></div>
                    <div class="stat-card border-t-4 border-purple-500 hover:-translate-y-1 transition-transform"><i class="fas fa-coins stat-icon-bg"></i><div class="flex justify-between items-start z-10 relative"><div><p class="text-xs text-gray-500 font-bold uppercase tracking-widest">Saldo Total</p><p class="text-2xl font-black text-purple-600 mt-2 truncate">${currency.format(saldoTotal)}</p></div><div class="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-500"><i class="fas fa-coins"></i></div></div></div>
                `;

                try {
                    const { data: eventos, error } = await supabaseClient.from('eventos').select('nombre, creado_en').order('creado_en', { ascending: true }).limit(5);
                    if (!error && eventos) {
                        document.getElementById('eventos-grupo-count').innerText = eventos.length;
                        document.getElementById('eventos-grupo-list').innerHTML = eventos.map(e => `
                            <div class="flex items-center gap-4 p-3.5 bg-blue-50 rounded-xl border border-blue-100 hover:bg-white hover:shadow-sm transition">
                                <div class="bg-blue-100 text-blue-600 w-10 h-10 rounded-full flex items-center justify-center shrink-0"><i class="fas fa-flag"></i></div>
                                <div class="flex-1"><p class="font-bold text-gray-800 text-sm leading-tight">${e.nombre}</p><p class="text-xs font-semibold text-blue-500 mt-1">${new Date(e.creado_en).toLocaleDateString('es-CL')}</p></div>
                            </div>
                        `).join('') || '<p class="text-gray-400 text-center py-6 italic font-medium">No hay eventos programados.</p>';
                    }
                } catch (e) {}

                const hoy = new Date(); const birthdays = []; let progresionMap = {};
                try { const { data: progData } = await supabaseClient.from('progresion_jovenes').select('joven_id, etapa_actual'); if(progData) progData.forEach(p => { progresionMap[p.joven_id] = p.etapa_actual; }); } catch (e) {}

                try {
                    const { data: jovenes, error } = await supabaseClient.from('mmbb_registrations').select('id, nombres, apellidos, fecha_nacimiento, unidad, foto_url, adelanto');
                    if (!error && jovenes) jovenes.forEach(p => {
                        if (!p.fecha_nacimiento) return;
                        const fecha = new Date(p.fecha_nacimiento + 'T12:00'); const esteAno = new Date(hoy.getFullYear(), fecha.getMonth(), fecha.getDate()); const diff = Math.ceil((esteAno - hoy) / (1000 * 60 * 60 * 24));
                        if (diff >= 0 && diff <= 7) birthdays.push({ nombre: `${p.nombres || ''} ${p.apellidos || ''}`.trim(), diff, unidad: p.unidad, foto: p.foto_url, esJoven: true, etapaData: { rama: extraerRama(p.unidad), etapaActual: progresionMap[p.id], adelanto: p.adelanto } }); 
                    });
                } catch (e) {}

                try {
                    const { data: adultos, error } = await supabaseClient.from('adultos_registros').select('nombres, apellidos, fecha_nacimiento, roles, foto_url');
                    if (!error && adultos) adultos.forEach(p => {
                        if (!p.fecha_nacimiento) return;
                        const fecha = new Date(p.fecha_nacimiento + 'T12:00'); const esteAno = new Date(hoy.getFullYear(), fecha.getMonth(), fecha.getDate()); const diff = Math.ceil((esteAno - hoy) / (1000 * 60 * 60 * 24));
                        if (diff >= 0 && diff <= 7) birthdays.push({ nombre: `${p.nombres || ''} ${p.apellidos || ''}`.trim(), diff, unidad: p.roles?.[0] || 'Adulto', foto: p.foto_url, esJoven: false }); 
                    });
                } catch (e) {}

                birthdays.sort((a, b) => a.diff - b.diff);
                document.getElementById('birthdays-list').innerHTML = birthdays.map(b => {
                    const ramaDetectada = extraerRama(b.unidad); const logoRama = LOGOS_RAMAS[ramaDetectada] ? `<img src="${LOGOS_RAMAS[ramaDetectada]}" class="w-4 h-4 inline-block opacity-80" title="${ramaDetectada}">` : '';
                    let insigniaHtml = '';
                    if(b.esJoven && b.etapaData) {
                        const etapaFinal = resolverEtapa(b.etapaData.rama, b.etapaData.etapaActual, b.etapaData.adelanto);
                if (window.innerWidth <= 768) setTimeout(poblarHomeMovil, 150);
                        if(etapaFinal && INSIGNIAS_ETAPAS[etapaFinal]) insigniaHtml = `<img src="${INSIGNIAS_ETAPAS[etapaFinal]}" class="w-5 h-5 inline-block drop-shadow-sm ml-1" title="Etapa: ${etapaFinal}">`;
                    }
                    return `
                    <div class="flex items-center gap-4 p-3 bg-amber-50 rounded-xl border border-amber-100 hover:bg-white hover:shadow-sm transition">
                        ${b.foto ? `<img src="${b.foto}" class="w-10 h-10 rounded-full object-cover border-2 border-amber-200" onerror="this.src='https://via.placeholder.com/40'">` : `<div class="person-avatar bg-amber-500">${getInitials(b.nombre)}</div>`}
                        <div class="flex-1">
                            <p class="font-bold text-gray-800 text-sm leading-tight flex items-center gap-1">${b.nombre} ${insigniaHtml}</p>
                            <p class="text-xs font-semibold text-amber-600 mt-1 flex items-center gap-1">${logoRama} <span class="truncate max-w-[120px]">${b.unidad || 'Sin Unidad'}</span> <span class="mx-1">•</span> ${b.diff === 0 ? '¡ES HOY!' : `en ${b.diff} días`}</p>
                        </div><i class="fas fa-gift text-amber-400 text-xl opacity-50"></i>
                    </div>`}).join('') || '<p class="text-gray-400 text-center py-6 italic font-medium">No hay cumpleaños próximos.</p>';

                let alertas = [];
                try {
                    const { data: adultos, error } = await supabaseClient.from('adultos_registros').select('run'); const { data: comps } = await supabaseClient.from('compromisos_adultos').select('run');
                    if (!error && adultos && comps) {
                        const runsConCompromiso = new Set(comps.map(c => c.run)); const adultosSinCompromiso = adultos.filter(a => !runsConCompromiso.has(a.run)).length;
                        if (adultosSinCompromiso > 0) alertas.push(`<div class="flex items-center gap-4 p-3 bg-white rounded-xl border border-red-100 shadow-sm"><div class="bg-red-100 text-red-600 w-10 h-10 rounded-full flex items-center justify-center shrink-0"><i class="fas fa-file-signature"></i></div><div><span class="font-bold text-red-700 text-sm block leading-tight">${adultosSinCompromiso} adultos irregulares</span><span class="text-xs text-gray-500 font-medium">Falta compromiso anual</span></div></div>`);
                    }
                } catch (e) {}

                try {
                    const { data: jovenesA, error } = await supabaseClient.from('mmbb_registrations').select('id'); const { data: progresionA } = await supabaseClient.from('progresion_jovenes').select('joven_id');
                    if (!error && jovenesA && progresionA) {
                        const idsConProgresion = new Set(progresionA.map(p => p.joven_id)); const sinProgresion = jovenesA.filter(j => !idsConProgresion.has(j.id)).length;
                        if (sinProgresion > 0) alertas.push(`<div class="flex items-center gap-4 p-3 bg-white rounded-xl border border-orange-100 shadow-sm"><div class="bg-orange-100 text-orange-600 w-10 h-10 rounded-full flex items-center justify-center shrink-0"><i class="fas fa-clock"></i></div><div><span class="font-bold text-orange-700 text-sm block leading-tight">${sinProgresion} jóvenes estancados</span><span class="text-xs text-gray-500 font-medium">Sin progresión registrada</span></div></div>`);
                    }
                } catch (e) {}
                document.getElementById('alertas-list').innerHTML = alertas.join('') || '<div class="text-center py-6"><i class="fas fa-check-circle text-4xl text-green-400 mb-2 block"></i><p class="text-green-700 font-bold text-sm">Todo en orden</p></div>';
                if (window.innerWidth <= 768) setTimeout(poblarHomeMovil, 150);

            } catch (error) { if(!document.getElementById('generalKPI').innerHTML.includes('Sesión Expirada')) document.getElementById('generalKPI').innerHTML = '<div class="error-message">Error al cargar datos generales</div>'; }
        }

        // ==================== ADMINISTRACIÓN ====================
        async function renderAdmin() {
            try {
                const { data: cuentas, error } = await supabaseClient.from('tesoreria_cuentas').select('*');
                if (error && await checkSupabaseError(error)) return;
                
                const cuentasGenerales = [], cuentasUnidades = [], cuentasNegativas = [];

                if (cuentas?.length) {
                    for (const c of cuentas) {
                        const { data: movs } = await supabaseClient.from('tesoreria_movimientos').select('monto').eq('cuenta_id', c.id);
                        const saldo = (movs || []).reduce((acc, m) => acc + (m.monto || 0), 0);
                        if (c.tipo === 'general') cuentasGenerales.push({ nombre: c.nombre, saldo });
                        else cuentasUnidades.push({ nombre: c.nombre, saldo });
                        if (saldo < 0) cuentasNegativas.push({ nombre: c.nombre, saldo });
                    }
                }

                if(document.getElementById('cuentas-generales').innerHTML.includes('expi')) return;

                const totalGeneral = cuentasGenerales.reduce((acc, c) => acc + c.saldo, 0);
                const totalUnidades = cuentasUnidades.reduce((acc, c) => acc + c.saldo, 0);
                
                // Guardar para el reporte de impresión
                window.reportData.finanzas = { cuentasGenerales, cuentasUnidades, negativas: cuentasNegativas, totalGeneral, totalUnidades };

                document.getElementById('cuentas-generales').innerHTML = cuentasGenerales.map(c => `<tr class="border-b border-gray-100 hover:bg-slate-50 transition-colors"><td class="py-3 px-3 text-sm font-medium text-gray-700">${c.nombre}</td><td class="text-right py-3 px-3 font-bold ${c.saldo < 0 ? 'text-red-600 bg-red-50 rounded-lg' : 'text-blue-700'}">${currency.format(c.saldo)}</td></tr>`).join('') || '<tr><td colspan="2" class="text-center py-6 text-gray-400 italic">No hay cuentas generales</td></tr>';
                document.getElementById('cuentas-unidades').innerHTML = cuentasUnidades.map(c => {
                    const rama = extraerRama(c.nombre); const logo = LOGOS_RAMAS[rama] ? `<img src="${LOGOS_RAMAS[rama]}" class="w-4 h-4 inline-block mr-2 opacity-80" title="${rama}">` : '';
                    return `<tr class="border-b border-gray-100 hover:bg-slate-50 transition-colors"><td class="py-3 px-3 text-sm font-medium text-gray-700 flex items-center">${logo}${c.nombre}</td><td class="text-right py-3 px-3 font-bold ${c.saldo < 0 ? 'text-red-600 bg-red-50 rounded-lg' : 'text-blue-700'}">${currency.format(c.saldo)}</td></tr>`;
                }).join('') || '<tr><td colspan="2" class="text-center py-6 text-gray-400 italic">No hay cuentas de unidad</td></tr>';
                
                document.getElementById('total-general').innerHTML = `<div class="flex justify-between items-center"><span class="uppercase tracking-wide font-bold text-xs text-gray-500">Saldo Consolidado</span> <span class="font-extrabold text-lg text-emerald-600">${currency.format(totalGeneral)}</span></div>`;
                document.getElementById('total-unidades').innerHTML = `<div class="flex justify-between items-center"><span class="uppercase tracking-wide font-bold text-xs text-gray-500">Saldo Consolidado</span> <span class="font-extrabold text-lg text-indigo-600">${currency.format(totalUnidades)}</span></div>`;

                document.getElementById('cuentas-negativas').innerHTML = cuentasNegativas.map(c => `<div class="flex items-center gap-4 p-3 bg-white rounded-xl border border-red-100 shadow-sm"><div class="bg-red-100 text-red-600 w-10 h-10 rounded-full flex items-center justify-center shrink-0"><i class="fas fa-exclamation-triangle"></i></div><span class="font-bold text-gray-800 text-sm">${c.nombre}</span><span class="text-sm font-extrabold text-red-600 ml-auto bg-red-50 px-2 py-1 rounded">${currency.format(c.saldo)}</span></div>`).join('') || '<div class="text-center py-6"><i class="fas fa-shield-check text-4xl text-emerald-400 mb-2 block"></i><p class="text-emerald-700 font-bold text-sm">Finanzas Sanas. No hay deudas.</p></div>';

                const ctx = document.getElementById('fondosChart')?.getContext('2d');
                if (ctx) {
                    if (chartFondos) chartFondos.destroy();
                    const labels = [...cuentasGenerales.map(c => c.nombre), ...cuentasUnidades.map(c => c.nombre)]; const data = [...cuentasGenerales.map(c => c.saldo), ...cuentasUnidades.map(c => c.saldo)];
                    if (labels.length > 0 && data.some(v => v !== 0)) {
                        chartFondos = new Chart(ctx, { type: 'doughnut', data: { labels: labels, datasets: [{ data: data, backgroundColor: ['#1E3A8A', '#F59E0B', '#10B981', '#EF4444', '#3B82F6', '#8B5CF6', '#0D9488', '#F97316'], borderWidth: 2, borderColor: '#ffffff', hoverOffset: 6 }] }, options: { responsive: true, maintainAspectRatio: false, cutout: '65%', plugins: { legend: { position: 'right', labels: { boxWidth: 12, font: { size: 11, weight: 'bold' } } }, tooltip: { callbacks: { label: (ctx) => ` ${ctx.label}: ${currency.format(ctx.raw)}` } } } } });
                    } else { ctx.font = 'bold 14px Poppins'; ctx.fillStyle = '#94A3B8'; ctx.textAlign = 'center'; ctx.fillText('Sin datos financieros', ctx.canvas.width/2, ctx.canvas.height/2); }
                }

            } catch (error) {}
        }

        // ==================== ADULTOS ====================
        async function renderAdultos() {
            try {
                const { data: adultos, error } = await supabaseClient.from('adultos_registros').select('*');
                if (error && await checkSupabaseError(error)) return;
                
                const total = adultos?.length || 0; const cargos = {};
                adultos?.forEach(a => { if (a.roles?.length) { a.roles.forEach(r => cargos[r] = (cargos[r] || 0) + 1); } else { cargos['Sin cargo'] = (cargos['Sin cargo'] || 0) + 1; } });

                const { data: progresion } = await supabaseClient.from('progresion_adultos').select('etapa_ciclo'); const ciclos = { captacion: 0, seleccion: 0, induccion: 0, desempeno: 0, renovacion: 0 };
                progresion?.forEach(p => { if (p.etapa_ciclo) ciclos[p.etapa_ciclo]++; });

                const { data: comps } = await supabaseClient.from('compromisos_adultos').select('run');
                const runsConCompromiso = new Set(comps?.map(c => c.run) || []); const firmados = comps?.length || 0; const pendientes = total - firmados; const porcentaje = total ? (firmados / total * 100) : 0;

                const adultosSinCompromiso = (adultos || []).filter(a => !runsConCompromiso.has(a.run));
                
                // Guardar para impresión
                window.reportData.adultos = { total, firmados, sinCompromiso: adultosSinCompromiso.map(a => ({ nombre: `${a.nombres||''} ${a.apellidos||''}`, cargo: a.roles?.[0] || 'Sin cargo' })) };

                if (document.getElementById('adultosKPI').innerHTML.includes('Sesión Expirada')) return;
                document.getElementById('adultosKPI').innerHTML = `
                    <div class="stat-card border-t-4 border-blue-500 hover:-translate-y-1 transition-transform text-center"><p class="text-xs text-gray-500 font-bold uppercase tracking-widest">Total Adultos</p><p class="text-4xl font-black text-blue-600 mt-2">${total}</p></div>
                    <div class="stat-card border-t-4 border-emerald-500 hover:-translate-y-1 transition-transform text-center"><p class="text-xs text-gray-500 font-bold uppercase tracking-widest">Con Compromiso</p><p class="text-4xl font-black text-emerald-600 mt-2">${firmados}</p></div>
                    <div class="stat-card border-t-4 border-purple-500 hover:-translate-y-1 transition-transform text-center"><p class="text-xs text-gray-500 font-bold uppercase tracking-widest">En Desempeño</p><p class="text-4xl font-black text-purple-600 mt-2">${ciclos.desempeno || 0}</p></div>
                `;
                
                document.getElementById('compromisos-ok').innerText = firmados; document.getElementById('compromisos-pend').innerText = pendientes; document.getElementById('compromisos-bar').style.width = porcentaje + '%';
                const circle = document.getElementById('compromiso-circle'); if (circle) circle.style.background = `conic-gradient(#10b981 ${porcentaje * 3.6}deg, #e2e8f0 0deg)`; document.getElementById('compromiso-porcentaje').innerText = Math.round(porcentaje) + '%';

                document.getElementById('adultos-sin-compromiso').innerHTML = adultosSinCompromiso.slice(0, 10).map(a => {
                    const nombre = `${a.nombres || ''} ${a.apellidos || ''}`.trim(); const cargo = a.roles?.[0] || 'Sin cargo'; const ramaDetectada = extraerRama(cargo); const logoRama = LOGOS_RAMAS[ramaDetectada] ? `<img src="${LOGOS_RAMAS[ramaDetectada]}" class="w-4 h-4 inline-block ml-1 opacity-80" title="${ramaDetectada}">` : '';
                    return `<div class="flex items-center gap-4 p-3 bg-white rounded-xl border border-amber-100 shadow-sm transition hover:shadow-md">${a.foto_url ? `<img src="${a.foto_url}" class="w-10 h-10 rounded-full object-cover border-2 border-amber-200" onerror="this.src='https://via.placeholder.com/40'">` : `<div class="person-avatar bg-amber-500">${getInitials(nombre)}</div>`}<div class="flex-1"><p class="font-bold text-gray-800 text-sm leading-tight">${nombre}</p><p class="text-xs font-semibold text-amber-600 mt-0.5 flex items-center">${cargo} ${logoRama}</p></div></div>`;
                }).join('') || '<div class="text-center py-6"><i class="fas fa-check-circle text-4xl text-emerald-400 mb-2 block"></i><p class="text-emerald-700 font-bold text-sm">Cumplimiento al 100%</p></div>';

                const ctxCargos = document.getElementById('cargosChart')?.getContext('2d');
                if (ctxCargos && Object.keys(cargos).length > 0) {
                    if (chartCargos) chartCargos.destroy();
                    chartCargos = new Chart(ctxCargos, { type: 'bar', data: { labels: Object.keys(cargos), datasets: [{ label: 'Voluntarios', data: Object.values(cargos), backgroundColor: '#3B82F6', borderRadius: 4 }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { stepSize: 1, font:{weight:'bold'} } } } } });
                }
            } catch (error) {}
        }

        // ==================== JÓVENES ====================
        async function renderJovenes() {
            try {
                const { data: jovenes, error } = await supabaseClient.from('mmbb_registrations').select('id, nombres, apellidos, unidad, fecha_nacimiento, foto_url, email_institucional, adelanto');
                if (error && await checkSupabaseError(error)) return;
                
                const total = jovenes?.length || 0;
                if (total === 0) return;

                const unidadMap = { 'Bandada': 'Bandada', 'Manada': 'Manada', 'Tropa': 'Tropa', 'Compañía': 'Compañía', 'Pioneros': 'Avanzada', 'Caminantes': 'Clan' };
                const unidades = { 'Bandada': 0, 'Manada': 0, 'Tropa': 0, 'Compañía': 0, 'Avanzada': 0, 'Clan': 0, 'Otra': 0 };
                const ideales = { 'Bandada': 24, 'Manada': 24, 'Tropa': 32, 'Compañía': 32, 'Avanzada': 24, 'Clan': 12 };
                
                jovenes.forEach(j => {
                    const rama = extraerRama(j.unidad);
                    if (rama && unidades.hasOwnProperty(rama)) unidades[rama]++; else unidades['Otra']++;
                });

                document.getElementById('jovenesKPI').innerHTML = `
                    <div class="stat-card border-t-4 border-blue-500 hover:-translate-y-1 transition-transform text-center"><p class="text-xs text-gray-500 font-bold uppercase tracking-widest">Censo Total</p><p class="text-4xl font-black text-blue-600 mt-2">${total}</p></div>
                    <div class="stat-card border-t-4 border-amber-500 hover:-translate-y-1 transition-transform text-center"><p class="text-xs text-gray-500 font-bold uppercase tracking-widest">Ramas Menores</p><p class="text-4xl font-black text-amber-500 mt-2">${(unidades['Bandada']||0)+(unidades['Manada']||0)}</p></div>
                    <div class="stat-card border-t-4 border-purple-500 hover:-translate-y-1 transition-transform text-center"><p class="text-xs text-gray-500 font-bold uppercase tracking-widest">Ramas Mayores</p><p class="text-4xl font-black text-purple-600 mt-2">${(unidades['Avanzada']||0)+(unidades['Clan']||0)}</p></div>
                `;

                let totalConProgresion = 0; let totalConEspecialidades = 0; let progresion = []; const conteoEtapas = {}; const mapaProgresion = {}; 
                try {
                    const { data: progData } = await supabaseClient.from('progresion_jovenes').select('joven_id, etapa_actual, especialidades');
                    if (progData) { 
                        progresion = progData; totalConProgresion = progData.length; totalConEspecialidades = progData.filter(p => p.especialidades && p.especialidades.length > 0).length; 
                        progData.forEach(p => { mapaProgresion[p.joven_id] = p; });
                        jovenes.forEach(j => {
                            const ramaDetectada = extraerRama(j.unidad); const prog = mapaProgresion[j.id] || {}; const etapaValida = resolverEtapa(ramaDetectada, prog.etapa_actual, j.adelanto);
                            if (etapaValida) { const matchedEtapa = Object.keys(INSIGNIAS_ETAPAS).find(e => e.toLowerCase() === String(etapaValida).toLowerCase()); if (matchedEtapa) conteoEtapas[matchedEtapa] = (conteoEtapas[matchedEtapa] || 0) + 1; }
                        });
                    }
                } catch (e) {}

                let unidadesHtml = '';
                const censoParaImpresion = [];
                for (let unidad of ['Bandada', 'Manada', 'Tropa', 'Compañía', 'Avanzada', 'Clan']) {
                    const count = unidades[unidad] || 0; const ideal = ideales[unidad] || 0; const porcentaje = ideal ? Math.min(100, (count / ideal) * 100) : 0;
                    censoParaImpresion.push({ nombre: unidad, censo: count, ideal: ideal });
                    let colorBarra = 'bg-blue-600'; let colorTexto = 'text-blue-700';
                    if (count > ideal) { colorBarra = 'bg-emerald-500'; colorTexto = 'text-emerald-700'; } else if (count < ideal * 0.5) { colorBarra = 'bg-red-500'; colorTexto = 'text-red-600'; } else if (count < ideal * 0.7) { colorBarra = 'bg-amber-500'; colorTexto = 'text-amber-600'; }
                    const logoRamaImg = LOGOS_RAMAS[unidad] ? `<img src="${LOGOS_RAMAS[unidad]}" title="${unidad}" class="w-10 h-10 object-contain drop-shadow-sm">` : '';
                    const insigniasHtml = (ETAPAS_POR_RAMA[unidad] || []).map(etapa => {
                        const num = conteoEtapas[etapa] || 0;
                        return `<div class="group relative flex flex-col items-center"><div class="relative"><img src="${INSIGNIAS_ETAPAS[etapa]}" class="w-8 h-8 object-contain drop-shadow hover:scale-110 transition-transform cursor-help">${num > 0 ? `<span class="absolute -top-2 -right-2 bg-blue-600 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full border border-white shadow-sm">${num}</span>` : ''}</div><span class="absolute -bottom-7 bg-gray-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">${etapa}</span></div>`;
                    }).join('');
                    
                    unidadesHtml += `<div class="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition"><div class="flex justify-between items-start mb-3"><div class="flex items-center gap-3">${logoRamaImg}<div><span class="text-xs font-bold text-gray-400 uppercase tracking-wide block">Unidad</span><span class="font-extrabold text-gray-800 text-base">${unidad}</span></div></div><div class="text-right"><span class="text-xs font-bold text-gray-400 uppercase tracking-wide block">Censo / Ideal</span><span class="${colorTexto} font-black text-xl">${count} <span class="text-sm font-bold opacity-50">/ ${ideal}</span></span></div></div><div class="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden shadow-inner mb-3"><div class="${colorBarra} h-full rounded-full transition-all duration-1000" style="width:${porcentaje}%"></div></div>${insigniasHtml ? `<div class="flex gap-4 justify-start mt-4 pt-3 border-t border-gray-100">${insigniasHtml}</div>` : ''}</div>`;
                }
                document.getElementById('unidades-grid').innerHTML = unidadesHtml;
                
                // Guardar Censo para Impresión
                window.reportData.jovenes.censoUnidades = censoParaImpresion;

                document.getElementById('progresion-unidades').innerHTML = `<div class="bg-white p-6 rounded-xl border border-gray-200 shadow-sm mb-5"><div class="flex justify-between items-center mb-3"><span class="font-bold text-sm text-gray-700 uppercase tracking-wide"><i class="fas fa-route text-teal-500 mr-2"></i> Jóvenes con progresión</span> <span class="font-black text-2xl text-teal-600">${totalConProgresion} <span class="text-sm font-bold text-gray-400">/ ${total}</span></span></div><div class="w-full bg-gray-100 h-3 rounded-full overflow-hidden shadow-inner"><div class="bg-teal-500 h-full rounded-full transition-all duration-1000" style="width:${total ? (totalConProgresion/total*100) : 0}%"></div></div></div><div class="bg-white p-6 rounded-xl border border-gray-200 shadow-sm"><div class="flex justify-between items-center mb-3"><span class="font-bold text-sm text-gray-700 uppercase tracking-wide"><i class="fas fa-medal text-blue-500 mr-2"></i> Con al menos 1 especialidad</span> <span class="font-black text-2xl text-blue-500">${totalConEspecialidades}</span></div><div class="w-full bg-gray-100 h-3 rounded-full overflow-hidden shadow-inner"><div class="bg-blue-500 h-full rounded-full transition-all duration-1000" style="width:${total ? (totalConEspecialidades/total*100) : 0}%"></div></div></div>`;

                const alertas = []; const idsConProgresion = new Set(progresion?.map(p => p.joven_id) || []); const sinProgresionList = []; const sinCorreoList = [];
                for (const j of jovenes || []) {
                    const ramaDetectada = extraerRama(j.unidad); const logoRama = LOGOS_RAMAS[ramaDetectada] ? `<img src="${LOGOS_RAMAS[ramaDetectada]}" class="w-4 h-4 inline-block ml-1 opacity-80" title="${ramaDetectada}">` : '';
                    const prog = mapaProgresion[j.id] || {}; const etapaFinal = resolverEtapa(ramaDetectada, prog.etapa_actual, j.adelanto); const insigniaHtml = (etapaFinal && INSIGNIAS_ETAPAS[etapaFinal]) ? `<img src="${INSIGNIAS_ETAPAS[etapaFinal]}" class="w-5 h-5 inline-block drop-shadow-sm ml-1" title="Estancado en: ${etapaFinal}">` : '';

                    if (!idsConProgresion.has(j.id)) {
                        sinProgresionList.push({joven: j, logo: logoRama, insignia: insigniaHtml});
                        alertas.push(`<div class="flex items-center gap-4 p-3 bg-white rounded-xl border border-red-100 shadow-sm transition hover:shadow-md">${j.foto_url ? `<img src="${j.foto_url}" class="w-10 h-10 rounded-full object-cover border border-red-200" onerror="this.src='https://via.placeholder.com/40'">` : `<div class="person-avatar bg-red-500">${getInitials(j.nombres)}</div>`}<div><p class="font-bold text-gray-800 text-sm leading-tight flex items-center gap-1">${j.nombres || ''} ${j.apellidos || ''} ${insigniaHtml}</p><p class="text-xs font-semibold text-red-500 mt-0.5 flex items-center">${j.unidad || 'Sin unidad'} ${logoRama} <span class="mx-1">•</span> Sin currículum</p></div></div>`);
                    }
                    if (!j.email_institucional) sinCorreoList.push({joven: j, logo: logoRama, insignia: insigniaHtml});
                }
                
                document.getElementById('alertas-progresion').innerHTML = alertas.slice(0,5).join('') + (alertas.length > 5 ? `<div class="text-xs font-bold text-center text-gray-400 mt-3 border-t pt-2">+ ${alertas.length-5} jóvenes más</div>` : '') || '<div class="text-center py-6"><i class="fas fa-check-circle text-4xl text-green-400 mb-2 block"></i><p class="text-green-700 font-bold text-sm mt-2">Todos tienen progresión registrada</p></div>';
                document.getElementById('jovenes-sin-correo').innerHTML = sinCorreoList.slice(0,4).map(item => `<div class="flex items-center gap-3 p-2.5 bg-white rounded-lg border border-orange-100 shadow-sm">${item.joven.foto_url ? `<img src="${item.joven.foto_url}" class="w-8 h-8 rounded-full object-cover" onerror="this.src='https://via.placeholder.com/32'">` : `<div class="person-avatar bg-orange-400" style="width:32px; height:32px; font-size:0.8rem;">${getInitials(item.joven.nombres)}</div>`}<div class="flex-1 flex flex-col justify-center"><span class="text-xs font-bold text-gray-700 flex items-center gap-1 truncate">${item.joven.nombres || ''} ${item.joven.apellidos || ''}</span><span class="text-[0.65rem] text-gray-400 flex items-center gap-1 mt-0.5">${item.logo} ${item.insignia}</span></div></div>`).join('') || '<p class="text-gray-400 text-center py-4 italic font-medium">Todos tienen correo</p>';
                if (sinCorreoList.length > 4) document.getElementById('jovenes-sin-correo').innerHTML += `<p class="text-xs font-bold text-center text-gray-400 mt-2">+ ${sinCorreoList.length - 4} más</p>`;
                document.getElementById('jovenes-sin-progresion').innerHTML = sinProgresionList.slice(0,4).map(item => `<div class="flex items-center gap-3 p-2.5 bg-white rounded-lg border border-gray-200 shadow-sm">${item.joven.foto_url ? `<img src="${item.joven.foto_url}" class="w-8 h-8 rounded-full object-cover" onerror="this.src='https://via.placeholder.com/32'">` : `<div class="person-avatar bg-gray-400" style="width:32px; height:32px; font-size:0.8rem;">${getInitials(item.joven.nombres)}</div>`}<div class="flex-1 flex flex-col justify-center"><span class="text-xs font-bold text-gray-700 flex items-center gap-1 truncate">${item.joven.nombres || ''} ${item.joven.apellidos || ''}</span><span class="text-[0.65rem] text-gray-400 flex items-center gap-1 mt-0.5">${item.logo} ${item.insignia}</span></div></div>`).join('') || '<p class="text-gray-400 text-center py-4 italic font-medium">Documentación al día</p>';
                if (sinProgresionList.length > 4) document.getElementById('jovenes-sin-progresion').innerHTML += `<p class="text-xs font-bold text-center text-gray-400 mt-2">+ ${sinProgresionList.length - 4} más</p>`;

                const totalEspecialidades = (progresion || []).reduce((acc, p) => acc + (p.especialidades?.length || 0), 0);
                document.getElementById('especialidades-resumen').innerHTML = `<div class="flex justify-between items-center p-4 bg-yellow-50 rounded-xl border border-yellow-100 mb-3"><span class="font-bold text-yellow-800 text-sm">Total Otorgadas</span> <span class="font-black text-2xl text-yellow-600">${totalEspecialidades}</span></div><div class="flex justify-between items-center p-4 bg-blue-50 rounded-xl border border-blue-200"><span class="font-bold text-blue-800 text-sm">Promedio por Joven</span> <span class="font-black text-xl text-blue-600">${total ? (totalEspecialidades / total).toFixed(1) : 0}</span></div>`;
            } catch (error) {}
        }

        // Init
        document.addEventListener('DOMContentLoaded', () => {
            loadData();
            const firstTabBtn = document.querySelector('.tab-button');
            if(firstTabBtn) window.switchTab('general', firstTabBtn);
        });
    
        // ════ HOME MÓVIL: poblar con los datos ya cargados ════
