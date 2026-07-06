async function cargarCalendario() {
    const cont = document.getElementById('portal-calendario');
    if (!cont) return;
    cont.innerHTML = '<p class="text-center text-gray-400 py-4"><i class="fas fa-spinner fa-spin"></i> Cargando...</p>';
    try {
        const { data: progs } = await sb.from('progresion_jovenes')
            .select('joven_id, camino');
        const { data: jovenes } = await sb.from('mmbb_registrations')
            .select('id, nombres, apellidos, unidad')
            .or('unidad.ilike.%avanzada%,unidad.ilike.%clan%,unidad.ilike.%caminante%,unidad.ilike.%pionero%');

        const hoy = new Date();
        const eventos = [];
        (progs || []).forEach(p => {
            const jov = (jovenes || []).find(j => j.id === p.joven_id);
            (p.camino?.proyectos_colectivos || []).forEach(proy => {
                if (proy.estado === 'Finalizado') return;
                if (!proy.inicio && !proy.termino) return;
                const inicio = proy.inicio ? new Date(proy.inicio + 'T12:00') : null;
                const termino = proy.termino ? new Date(proy.termino + 'T12:00') : null;
                const enCurso = inicio && termino && inicio <= hoy && termino >= hoy;
                const proximo = inicio && inicio > hoy;
                if (!enCurso && !proximo) return;
                eventos.push({ proy, jov, inicio, termino, enCurso });
            });
        });

        if (!eventos.length) {
            cont.innerHTML = '<p class="text-center text-gray-400 py-4"><i class="fas fa-calendar-check text-2xl block mb-2 opacity-30"></i>No hay proyectos con fechas próximas.</p>';
            return;
        }

        eventos.sort((a, b) => (a.inicio || a.termino) - (b.inicio || b.termino));

        const fmtFecha = d => d ? d.toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

        cont.innerHTML = eventos.map(({ proy, jov, inicio, termino, enCurso }) => {
            const diasRestantes = termino ? Math.ceil((termino - hoy) / 86400000) : null;
            const badge = enCurso
                ? '<span class="text-xs bg-green-100 text-green-700 font-bold px-2 py-0.5 rounded-full">En curso</span>'
                : '<span class="text-xs bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded-full">Próximo</span>';
            return `<div class="border border-gray-100 rounded-xl p-4 mb-3 hover:shadow-sm transition-shadow">
                <div class="flex items-start justify-between gap-2">
                    <div>
                        <div class="font-bold text-gray-800 text-sm">${proy.nombre || 'Sin nombre'}</div>
                        <div class="text-xs text-gray-500 mt-0.5">${proy.campoAccion || ''}</div>
                    </div>
                    ${badge}
                </div>
                <div class="mt-2 grid grid-cols-2 gap-2 text-xs text-gray-600">
                    <div><i class="fas fa-play text-green-500 mr-1"></i><b>Inicio:</b> ${fmtFecha(inicio)}</div>
                    <div><i class="fas fa-flag-checkered text-red-500 mr-1"></i><b>Término:</b> ${fmtFecha(termino)}</div>
                    ${proy.lugar ? `<div class="col-span-2"><i class="fas fa-map-marker-alt text-purple-500 mr-1"></i>${proy.lugar}</div>` : ''}
                    ${diasRestantes !== null ? `<div class="col-span-2 text-${diasRestantes <= 7 ? 'red' : 'gray'}-500 font-semibold"><i class="fas fa-clock mr-1"></i>${diasRestantes} día(s) para el término</div>` : ''}
                </div>
            </div>`;
        }).join('');
    } catch(e) {
        cont.innerHTML = '<p class="text-red-500 text-sm text-center">Error: ' + e.message + '</p>';
    }
}

// ══════════ PORTAFOLIO DE RUTA ══════════
async function cargarPortafolio() {
    const cont = document.getElementById('portal-portafolio');
    if (!cont || !currentJoven) return;

    try {
        const { data: prog } = await sb.from('progresion_jovenes')
            .select('etapa_actual, camino, especialidades, actividades, territorios')
            .eq('joven_id', currentJoven.id)
            .maybeSingle();

        if (!prog) {
            cont.innerHTML = '<p class="text-center text-gray-400 py-4">Sin registro de progresión aún.</p>';
            return;
        }

        // Etapas oficiales Clan AGSCh con sus insignias
        const ETAPAS = [
            { nombre: 'Bienvenida', img: 'https://hyixmaxhoxvamoecuars.supabase.co/storage/v1/object/public/payment-receipts/insignias/dYr6dIU.png', color: '#F59E0B' },
            { nombre: 'Fuego',      img: 'https://hyixmaxhoxvamoecuars.supabase.co/storage/v1/object/public/payment-receipts/insignias/IEr3Kms.png', color: '#EF4444' },
            { nombre: 'Antorcha',   img: 'https://hyixmaxhoxvamoecuars.supabase.co/storage/v1/object/public/payment-receipts/insignias/qTTibWH.png', color: '#8B5CF6' }
        ];
        const IMG_COMPROMISO = 'https://hyixmaxhoxvamoecuars.supabase.co/storage/v1/object/public/payment-receipts/insignias/eX1hXDn.png?1';

        const etapa   = prog.etapa_actual || null;
        const idxAct  = ETAPAS.findIndex(e => e.nombre === etapa);
        const promesa = prog.camino?.prom;
        const compromiso = currentJoven.compromiso_caminante || false;
        const proyectoVida = (prog.camino?.proyectoPersonal || '').trim();
        const nProy = (prog.camino?.proyectos_colectivos || []).length;
        const nEsp  = (prog.especialidades || []).length;
        const competencias = (prog.territorios?.competencias_mayores || []);

        // Línea de insignias de etapas
        const lineaEtapas = ETAPAS.map((e, i) => {
            const activa = i === idxAct;
            const pasada = i < idxAct;
            const opacidad = activa ? '1' : pasada ? '0.75' : '0.2';
            const escala   = activa ? 'transform:scale(1.15);' : '';
            const sombra   = activa ? `box-shadow:0 0 0 3px ${e.color}40;border-radius:50%;` : '';
            return `
                <div class="flex flex-col items-center" style="flex:1">
                    <div style="${escala}${sombra}margin-bottom:6px;">
                        <img src="${e.img}" style="width:52px;height:52px;object-fit:contain;opacity:${opacidad};transition:all 0.3s;">
                    </div>
                    <span style="font-size:0.7rem;font-weight:800;text-align:center;color:${activa ? e.color : pasada ? '#6B7280' : '#D1D5DB'}">
                        ${e.nombre}${pasada ? ' ✓' : ''}
                    </span>
                </div>
                ${i < ETAPAS.length - 1 ? `<div style="width:20px;height:2px;background:${i < idxAct ? '#9CA3AF' : '#E5E7EB'};margin-top:20px;flex-shrink:0"></div>` : ''}`;
        }).join('');



        // Checklist del estado de la progresión personal
        const items = [
            { ok: !!promesa,              label: 'Promesa Scout hecha',                  icon: '⚜️' },
            { ok: proyectoVida !== '',    label: 'Proyecto de Vida redactado',           icon: '✍️' },
            { ok: nProy > 0,             label: `${nProy} proyecto(s) colectivo(s)`,    icon: '🚀' },
            { ok: nEsp > 0,              label: `${nEsp} especialidad(es)`,             icon: '🏅' },
            { ok: competencias.length > 0, label: `${competencias.length} competencia(s) acreditada(s)`, icon: '🎓' },
        ];

        // Nivel badge de competencia
        const nivelColor = { 'Exploración': '#3B82F6', 'Desarrollo': '#F59E0B', 'Maestría': '#10B981' };
        const compCards = competencias.length > 0
            ? competencias.map(comp => `
                <div class="flex items-start gap-3 py-2 border-b border-gray-50 last:border-0">
                    <div class="text-lg">🎓</div>
                    <div class="flex-1 min-w-0">
                        <div class="font-semibold text-sm text-gray-800">${comp.nombre || 'Sin nombre'}</div>
                        <div class="text-xs text-gray-500">${comp.area || ''}</div>
                        ${comp.proyecto ? `<div class="text-xs text-gray-400 mt-0.5 italic">${comp.proyecto}</div>` : ''}
                    </div>
                    <span class="text-xs font-bold px-2 py-0.5 rounded-full text-white flex-shrink-0"
                        style="background:${nivelColor[comp.nivel] || '#6B7280'}">${comp.nivel || ''}</span>
                </div>`).join('')
            : '<p class="text-xs text-gray-400 py-2">Aún sin competencias acreditadas</p>';



        // Sección 1: Etapas
        const secEtapas = `
            <div class="mb-5">
                <p class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">① Etapas de Progresión</p>
                <div class="flex items-start">${lineaEtapas}</div>
                ${!etapa ? '<p class="text-xs text-gray-400 text-center mt-2">Aún no asignada por tu guiadora</p>' : ''}
            </div>`;

        // Sección 2: Competencias
        const secCompetencias = `
            <div class="mb-5 pt-4 border-t border-gray-100">
                <p class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">② Competencias Acreditadas</p>
                ${competencias.length > 0 ? compCards : '<p class="text-xs text-gray-400 py-2 text-center">Aún sin competencias acreditadas</p>'}
            </div>`;

        // Sección 3: Compromiso
        const secCompromiso = `
            <div class="pt-4 border-t border-gray-100">
                <p class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">③ Compromiso</p>
                <div class="flex items-center gap-4">
                    <img src="${IMG_COMPROMISO}" style="width:52px;height:52px;object-fit:contain;opacity:${compromiso ? '1' : '0.2'};${compromiso ? 'filter:drop-shadow(0 0 6px #10B981)' : 'filter:grayscale(1)'}">
                    <div>
                        <p class="font-bold text-sm ${compromiso ? 'text-green-700' : 'text-gray-400'}">
                            ${compromiso ? '✓ Compromiso realizado' : 'Aún sin compromiso formalizado'}
                        </p>
                        <p class="text-xs text-gray-400">Compromiso anual del Caminante</p>
                    </div>
                </div>
            </div>`;

        cont.innerHTML = secEtapas + secCompetencias + secCompromiso;

    } catch(e) {
        cont.innerHTML = '<p class="text-red-500 text-sm text-center">Error: ' + e.message + '</p>';
    }
}

// ══════════ LOGOUT ══════════
function cerrarSesion(){currentJoven=null;camino=null;document.getElementById('portal-screen').style.display='none';document.getElementById('login-screen').style.display='flex';document.getElementById('input-rut').value='';document.getElementById('input-clave').value=''}