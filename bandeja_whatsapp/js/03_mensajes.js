async function abrirConversacion(numero) {
    contactoActivo = conversaciones.find(c => c.number === numero);
    if (!contactoActivo) return;

    // Marcar como leídos
    await sb.from('wa_mensajes').update({ leido: true }).eq('from_number', numero).eq('direction', 'entrante').eq('leido', false);
    contactoActivo.unread = 0;
    renderConversaciones();
    actualizarBadge();

    // Mostrar panel
    document.getElementById('no-chat').style.display = 'none';
    const chatActive = document.getElementById('chat-active');
    chatActive.style.display = 'flex';

    // Header
    const tipo = contactoActivo.tipo;
    document.getElementById('chat-header').innerHTML = `
        <div class="chat-avatar" style="background:${tipo === 'joven' ? 'linear-gradient(135deg,#25D366,#128C7E)' : tipo === 'adulto' ? 'linear-gradient(135deg,#3b82f6,#1d4ed8)' : '#94a3b8'};">
            ${contactoActivo.name.charAt(0).toUpperCase()}
        </div>
        <div class="chat-contact-info">
            <div class="chat-contact-name">${esc(contactoActivo.name)}</div>
            <div class="chat-contact-sub">${formatearNumero(numero)} · ${tipo === 'joven' ? '👤 Beneficiario' : tipo === 'adulto' ? '🎖 Dirigente' : '❓ No registrado'}</div>
        </div>
        <div class="chat-actions">
            ${tipo !== 'desconocido' ? `<button class="chat-action-btn" onclick="irAlPerfil()"><i class="fas fa-user"></i> Perfil</button>` : ''}
            <button class="chat-action-btn" onclick="copiarNumero('${numero}')"><i class="fas fa-copy"></i> ${numero}</button>
        </div>`;

    // Cargar mensajes
    mensajesActivos = contactoActivo.messages.sort((a, b) => {
        const ta = a.timestamp ? a.timestamp * 1000 : new Date(a.created_at).getTime();
        const tb = b.timestamp ? b.timestamp * 1000 : new Date(b.created_at).getTime();
        return ta - tb;
    });
    renderMensajes();

    // Responsive móvil
    if (window.innerWidth <= 680) {
        document.getElementById('conv-list-panel').classList.add('hidden');
        document.getElementById('chat-panel').classList.add('visible');
    }
}

function renderMensajes() {
    const area = document.getElementById('messages-area');
    let lastDay = null;
    let html = '';
    mensajesActivos.forEach(msg => {
        const ts = msg.timestamp ? new Date(msg.timestamp * 1000) : new Date(msg.created_at);
        const dayStr = ts.toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' });
        if (dayStr !== lastDay) {
            html += `<div class="msg-day-divider"><span>${dayStr}</span></div>`;
            lastDay = dayStr;
        }
        const timeStr = ts.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
        const es = msg.direction === 'entrante';
        html += `<div class="msg-bubble ${msg.direction}">
            ${es ? `<div class="msg-sender-name">${esc(contactoActivo?.name || msg.from_number)}</div>` : ''}
            <div class="msg-text">${esc(msg.text || (msg.tipo !== 'texto' ? '📎 ' + msg.tipo : ''))}</div>
            <div class="msg-footer">
                <span class="msg-time">${timeStr}</span>
                ${!es ? '<span class="msg-status">✓✓</span>' : ''}
            </div>
        </div>`;
    });
    area.innerHTML = html;
    area.scrollTop = area.scrollHeight;
}

// ── ENVIAR RESPUESTA ──
async function enviarRespuesta() {
    if (!contactoActivo) return;
    const input = document.getElementById('chat-input');
    const texto = input.value.trim();
    if (!texto) return;

    const btn = document.getElementById('send-btn');
    btn.disabled = true;
    input.value = '';
    autoResizeTA(input);

    try {
        // Enviar por WhatsApp
        const nombre = contactoActivo.name.split(' ')[0];
        const resultado = await WA.enviar(contactoActivo.number, nombre, texto);

        // Guardar saliente en Supabase
        const { data: msgData } = await sb.from('wa_mensajes').insert({
            from_number: contactoActivo.number,
            from_name: contactoActivo.name,
            joven_id: contactoActivo.joven_id || null,
            adulto_id: contactoActivo.adulto_id || null,
            text: texto,
            tipo: 'texto',
            direction: 'saliente',
            leido: true,
            timestamp: Math.floor(Date.now() / 1000),
            wamid: resultado?.wamid || null
        }).select().single();

        if (msgData) {
            mensajesActivos.push(msgData);
            contactoActivo.messages.push(msgData);
            contactoActivo.last_msg = texto;
            contactoActivo.last_time = new Date().toISOString();
            renderMensajes();
            renderConversaciones();
        }
        if (!resultado?.ok) alert('Mensaje enviado al ERP pero WhatsApp reportó error: ' + (resultado?.error || 'desconocido'));
    } catch(e) {
        alert('Error al enviar: ' + e.message);
    } finally {
        btn.disabled = false;
    }
}

function irAlPerfil() {
    if (!contactoActivo) return;
    if (contactoActivo.tipo === 'joven') window.open('programa_jovenes.html', '_blank');
    else if (contactoActivo.tipo === 'adulto') window.open('adulto_voluntario.html', '_blank');
}

function copiarNumero(num) {
    navigator.clipboard.writeText(num).then(() => alert('Número copiado: ' + num));
}

function autoResizeTA(el) {
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 100) + 'px';
}

function esc(s) { const d = document.createElement('div'); d.textContent = s || ''; return d.innerHTML; }

// ── REALTIME: escuchar mensajes nuevos ──
