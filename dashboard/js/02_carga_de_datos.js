        async function loadData() {
            try {
                document.getElementById('lastUpdate').innerText = new Date().toLocaleTimeString('es-CL', {hour: '2-digit', minute:'2-digit'});
                
                await Promise.allSettled([
                    renderGeneral(),
                    renderAdmin(),
                    renderAdultos(),
                    renderJovenes(),
                    cargarEventosCalendario()
                ]);
                
            } catch (error) {
                console.error('Error general:', error);
                mostrarError('Error al cargar los datos. Revise la consola.');
            }
        }

        function handleSupabaseError(error) {
            if (error && (error.code === 'PGRST303' || error.message === 'JWT expired' || String(error.message).includes('JWT'))) {
                mostrarError('<i class="fas fa-lock text-3xl mb-2 text-red-500"></i><br>Sesión Expirada. Por favor vuelva a iniciar sesión en el ERP principal.');
                return true;
            }
            return false;
        }
        function checkSupabaseError(error) { return handleSupabaseError(error); }
        function mostrarError(mensaje) {
            ['generalKPI', 'birthdays-list', 'events-list', 'alertas-list'].forEach(id => {
                const el = document.getElementById(id);
                if (el && el.innerHTML === '') el.innerHTML = `<div class="error-message">${mensaje}</div>`;
            });
        }

        // ==================== EVENTOS DE CALENDARIO ====================
        async function cargarEventosCalendario() {
            try {
                const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(CALENDAR_ID)}/events?key=${CALENDAR_API_KEY}&maxResults=5&orderBy=startTime&singleEvents=true&timeMin=${new Date().toISOString()}`;
                const response = await fetch(url);
                const data = await response.json();
                const eventos = data.items || [];
                
                document.getElementById('eventos-calendar-count').innerText = eventos.length;
                if (eventos.length === 0) {
                    document.getElementById('eventos-calendar-list').innerHTML = '<p class="text-gray-400 text-center py-6 italic font-medium">No hay eventos agendados.</p>';
                    return;
                }
                
                document.getElementById('eventos-calendar-list').innerHTML = eventos.map(e => `
                    <div class="flex items-center gap-4 p-3.5 bg-red-50 rounded-xl border border-red-100">
                        <div class="bg-red-100 text-red-600 w-10 h-10 rounded-full flex items-center justify-center shrink-0"><i class="fas fa-calendar-day"></i></div>
                        <div class="flex-1">
                            <p class="font-bold text-gray-800 text-sm leading-tight">${e.summary || 'Evento sin título'}</p>
                            <p class="text-xs font-semibold text-red-500 mt-1">${new Date(e.start?.dateTime || e.start?.date).toLocaleDateString('es-CL', { day: '2-digit', month: 'short' })}</p>
                        </div>
                    </div>`).join('');
            } catch (error) { document.getElementById('eventos-calendar-list').innerHTML = '<p class="text-red-400 text-center py-4 font-bold">Error al cargar calendario</p>'; }
        }

        // ==================== GENERAL ====================
