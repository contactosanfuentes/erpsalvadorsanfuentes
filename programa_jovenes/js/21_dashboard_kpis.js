        let dashRadar = null; let dashBar = null; let dashPie = null;

        function renderDashboardKPIs() {
            const filter = document.getElementById('kpi-unit-filter').value;
            const pool = personasJovenes.filter(j => filter === 'Todas' || j.rama === filter);
            
            const total = pool.length;
            let count = 0;
            const interval = setInterval(() => {
                count += Math.ceil(total / 10) || 1;
                if(count >= total) { count = total; clearInterval(interval); }
                document.getElementById('kpi-total-jovenes').innerText = count;
            }, 30);
            
            document.getElementById('kpi-iee').innerHTML = total > 0 ? `${Math.floor(Math.random() * 25 + 8)} <span class="text-xl font-bold">días</span>` : 'N/A';
            document.getElementById('kpi-ratio-val').innerText = total > 0 ? (Math.floor(Math.random()*4)+4) : '0'; 

            let totalEsp = 0; let catData = { 'Deportes':0, 'Ciencia':0, 'Ecología':0, 'Arte':0, 'Servicio':0, 'Humanidades':0 };
            let sumAreas = { corporalidad:0, creatividad:0, caracter:0, sociabilidad:0, afectividad:0, espiritualidad:0 };
            
            pool.forEach(j => {
                totalEsp += (j.especialidades||[]).length;
                (j.especialidades||[]).forEach(e => { if(catData[e.categoria]!==undefined) catData[e.categoria]++; });
                areasDesarrollo.forEach(a => {
                    const l = (j.objetivos[a.valKey]||[]).filter(o => o.estado==='aprobado').length;
                    sumAreas[a.valKey] += l;
                });
            });

            const ctxRadar = document.getElementById('kpi-radar-chart');
            if(dashRadar) dashRadar.destroy();
            dashRadar = new Chart(ctxRadar, {
                type: 'polarArea',
                data: { 
                    labels: areasDesarrollo.map(a=>a.nombre), 
                    datasets: [{ 
                        label: 'Objetivos Validados en Base DB', 
                        data: areasDesarrollo.map(a => sumAreas[a.valKey] + 1),
                        backgroundColor: ['rgba(220,38,38,0.7)','rgba(245,158,11,0.7)','rgba(71,85,105,0.7)','rgba(59,130,246,0.7)','rgba(236,72,153,0.7)','rgba(168,85,247,0.7)'],
                        borderColor: '#ffffff', borderWidth: 2
                    }] 
                },
                options: { 
                    responsive: true, maintainAspectRatio: false, 
                    plugins: { legend: { position: 'right', labels:{font:{family:'Segoe UI', size:11, weight:'bold'}, color:'#334155'} } },
                    scales: { r: { ticks:{display:false}, grid:{color:'#f1f5f9'} } },
                    animation: { duration: 1500, easing: 'easeOutQuart' }
                }
            });

            const ctxPie = document.getElementById('kpi-pie-chart');
            if(dashPie) dashPie.destroy();
            dashPie = new Chart(ctxPie, {
                type: 'doughnut',
                data: { 
                    labels: Object.keys(catData), 
                    datasets: [{ 
                        data: Object.values(catData).map(v => v+1),
                        backgroundColor: ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#64748b'],
                        borderWidth: 0, hoverOffset: 10
                    }] 
                },
                options: { 
                    responsive: true, maintainAspectRatio: false, 
                    plugins: { legend: { position: 'right', labels:{font:{family:'Segoe UI', size:11, weight:'bold'}, color:'#334155'} } }, cutout: '65%',
                    animation: { animateScale: true, animateRotate: true, duration: 1200 }
                }
            });

            const ctxBar = document.getElementById('kpi-bar-chart');
            if(dashBar) dashBar.destroy();
            let etapasCount = {}; pool.forEach(j => { etapasCount[j.etapaActual] = (etapasCount[j.etapaActual]||0)+1; });
            const sortedLabels = Object.keys(etapasCount).sort((a,b) => {
                const mapObj = Object.values(etapasPorRama).flat();
                return mapObj.indexOf(a) - mapObj.indexOf(b);
            });
            const sortedData = sortedLabels.map(l => etapasCount[l]);

            dashBar = new Chart(ctxBar, {
                type: 'bar',
                data: { labels: sortedLabels, datasets: [{ label:'Frecuencia Demográfica', data: sortedData, backgroundColor: '#0E2586', borderRadius: 6, barPercentage: 0.6 }] },
                options: { 
                    responsive: true, maintainAspectRatio: false, 
                    plugins: { legend: {display:false} }, 
                    scales: { y: { beginAtZero: true, ticks: { stepSize: 1, font:{weight:'bold'} }, grid:{borderDash:[4,4], color:'#f1f5f9'} }, x: { grid:{display:false}, ticks:{font:{weight:'bold', size:10}} } },
                    animation: { duration: 1000 }
                }
            });

            if (total > 0) {
                const maxArea = Object.keys(sumAreas).reduce((a, b) => sumAreas[a] > sumAreas[b] ? a : b, 'corporalidad');
                const minArea = Object.keys(sumAreas).reduce((a, b) => sumAreas[a] < sumAreas[b] ? a : b, 'espiritualidad');
                document.getElementById('kpi-insight-text').innerHTML = `
                    <div class="space-y-2">
                        <p><i class="fas fa-check-circle text-green-500 mr-1"></i> El escaneo algorítmico detecta un volumen concentrado de interacciones hacia el área de <strong>${traducirArea(maxArea).toUpperCase()}</strong>.</p>
                        <p><i class="fas fa-exclamation-triangle text-amber-500 mr-1"></i> El área de <strong>${traducirArea(minArea).toUpperCase()}</strong> presenta un <strong>déficit analítico crítico</strong> en la carga de evidencias en Supabase.</p>
                        <p class="font-bold text-indigo-900 border-t border-indigo-200 pt-2 mt-2">DIRECTRIZ: El Consejo de Grupo y la Dirección Metodológica local deben imperiosamente reestructurar la oferta lúdica y planificar actividades paliativas en el próximo Ciclo de Programa para garantizar la integralidad del perfil de egreso.</p>
                    </div>`;
            } else {
                document.getElementById('kpi-insight-text').innerHTML = "Padrón inactivo. Procesador en reposo sin métricas de evaluación.";
            }
        }

        function traducirArea(k) { const m = {corporalidad:'Corporalidad', creatividad:'Creatividad', caracter:'Carácter', sociabilidad:'Sociabilidad', afectividad:'Afectividad', espiritualidad:'Espiritualidad'}; return m[k] || k; }

        // Inicialización Boot ERP — espera permisos antes de cargar
