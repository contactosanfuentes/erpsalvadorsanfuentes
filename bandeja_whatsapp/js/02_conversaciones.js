async function cargarConversaciones() {
    const { data, error } = await sb
        .from('wa_mensajes')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) { console.error(error); return; }

    // Agrupar por número
    const convMap = {};
    (data || []).forEach(msg => {
        const num = msg.from_number;
        if (!convMap[num]) {
            convMap[num] = {
                number: num,
                name: msg.from_name || formatearNumero(num),
                messages: [],
                unread: 0,
                tipo: msg.joven_id ? 'joven' : msg.adulto_id ? 'adulto' : 'desconocido',
                joven_id: msg.joven_id,
                adulto_id: msg.adulto_id,
                last_msg: null,
                last_time: null
            };
        }
        convMap[num].messages.push(msg);
        if (!msg.leido && msg.direction === 'entrante') convMap[num].unread++;
        if (!convMap[num].last_time || new Date(msg.created_at) > new Date(convMap[num].last_time)) {
            convMap[num].last_msg = msg.text || (msg.tipo !== 'texto' ? `📎 [${msg.tipo}]` : '');
            convMap[num].last_time = msg.created_at;
        }
    });

    conversaciones = Object.values(convMap).sort((a, b) => new Date(b.last_time) - new Date(a.last_time));
    renderConversaciones();
    actualizarBadge();
}

function formatearNumero(num) {
    if (!num) return 'Desconocido';
    if (num.startsWith('56') && num.length === 11) return '+56 9 ' + num.slice(3, 7) + ' ' + num.slice(7);
    return '+' + num;
}

function tiempoRelativo(ts) {
    if (!ts) return '';
    const d = typeof ts === 'number' ? new Date(ts * 1000) : new Date(ts);
    const hoy = new Date();
    const diff = hoy - d;
    if (diff < 86400000 && d.getDate() === hoy.getDate()) return d.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
    if (diff < 172800000) return 'Ayer';
    return d.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit' });
}

function renderConversaciones() {
    const container = document.getElementById('conv-items');
    const query = document.getElementById('search-conv').value.toLowerCase();
    let lista = conversaciones.filter(c => {
        if (filtroActual === 'noLeidos' && c.unread === 0) return false;
        if (filtroActual === 'joven' && c.tipo !== 'joven') return false;
        if (filtroActual === 'adulto' && c.tipo !== 'adulto') return false;
        if (query && !c.name.toLowerCase().includes(query) && !c.number.includes(query)) return false;
        return true;
    });

    if (!lista.length) {
        container.innerHTML = '<div class="empty-conv"><i class="fab fa-whatsapp"></i><p>Sin conversaciones</p></div>';
        return;
    }

    container.innerHTML = lista.map(c => `
        <div class="conv-item ${c.unread > 0 ? 'unread' : ''} ${contactoActivo?.number === c.number ? 'active' : ''}" onclick="abrirConversacion('${c.number}')">
            <div class="conv-avatar" style="background:${c.tipo === 'joven' ? 'linear-gradient(135deg,#25D366,#128C7E)' : c.tipo === 'adulto' ? 'linear-gradient(135deg,#3b82f6,#1d4ed8)' : 'linear-gradient(135deg,#94a3b8,#64748b)'};">
                ${c.name.charAt(0).toUpperCase()}
            </div>
            <div class="conv-info">
                <div class="conv-name">${esc(c.name)}</div>
                <div class="conv-preview">${esc(c.last_msg || 'Sin mensajes')}</div>
                <span class="conv-tag ${c.tipo}">${c.tipo === 'joven' ? '👤 Joven' : c.tipo === 'adulto' ? '🎖 Adulto' : '❓ Desconocido'}</span>
            </div>
            <div class="conv-meta">
                <span class="conv-time">${tiempoRelativo(c.last_time)}</span>
                ${c.unread > 0 ? `<span class="conv-unread-badge">${c.unread}</span>` : ''}
            </div>
        </div>`).join('');
}

function actualizarBadge() {
    const total = conversaciones.reduce((s, c) => s + c.unread, 0);
    const badge = document.getElementById('badge-noLeidos');
    badge.textContent = total;
    badge.style.display = total > 0 ? 'inline' : 'none';
}

function setFiltro(f, btn) {
    filtroActual = f;
    document.querySelectorAll('.filter-tab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderConversaciones();
}

function filtrarConversaciones() { renderConversaciones(); }

function recargarConversaciones() { cargarConversaciones(); }

// ── ABRIR CONVERSACIÓN ──
