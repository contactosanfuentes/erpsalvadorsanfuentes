function iniciarRealtime() {
    realtimeChannel = sb.channel('wa-mensajes-live')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'wa_mensajes' }, (payload) => {
            const msg = payload.new;
            // Actualizar conversaciones
            const num = msg.from_number;
            let conv = conversaciones.find(c => c.number === num);
            if (!conv) {
                conv = { number: num, name: msg.from_name || formatearNumero(num), messages: [], unread: 0, tipo: msg.joven_id ? 'joven' : msg.adulto_id ? 'adulto' : 'desconocido', joven_id: msg.joven_id, adulto_id: msg.adulto_id, last_msg: null, last_time: null };
                conversaciones.unshift(conv);
            }
            conv.messages.push(msg);
            conv.last_msg = msg.text || `[${msg.tipo}]`;
            conv.last_time = msg.created_at;
            if (msg.direction === 'entrante') {
                if (contactoActivo?.number !== num) conv.unread++;
                else {
                    mensajesActivos.push(msg);
                    renderMensajes();
                    sb.from('wa_mensajes').update({ leido: true }).eq('id', msg.id);
                }
            }
            conversaciones.sort((a, b) => new Date(b.last_time) - new Date(a.last_time));
            renderConversaciones();
            actualizarBadge();
            // Sonido/vibración
            if (msg.direction === 'entrante' && contactoActivo?.number !== num) {
                if ('vibrate' in navigator) navigator.vibrate([200]);
            }
        })
        .subscribe();
}

// ── BOTÓN VOLVER EN MÓVIL ──
document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
        document.getElementById('conv-list-panel').classList.remove('hidden');
        document.getElementById('chat-panel').classList.remove('visible');
    }
});

// ── INIT ──
(async () => {
    await cargarConversaciones();
    iniciarRealtime();
})();