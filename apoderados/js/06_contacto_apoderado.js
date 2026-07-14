// ══════════ CONTACTO DEL APODERADO: sección editable en la pestaña General ══════════
// El apoderado autenticado puede mantener al día los datos de contacto de la familia
// (nombres, parentescos y teléfonos de titular y suplentes). Los CORREOS no se editan aquí:
// los gestiona la vinculación por RUN (y el equipo de grupo en el ERP), para no romper accesos.
(function(){
    const CAMPOS_EDITABLES = [
        'apoderado_titular_nombre','apoderado_titular_parentesco','apoderado_titular_telefono',
        'apoderado_suplente1_nombre','apoderado_suplente1_parentesco','apoderado_suplente1_telefono',
        'apoderado_suplente2_nombre','apoderado_suplente2_parentesco','apoderado_suplente2_telefono'
    ];

    function filaSlot(j, slot, titulo){
        const n = j[`apoderado_${slot}_nombre`] || '', p = j[`apoderado_${slot}_parentesco`] || '',
              t = j[`apoderado_${slot}_telefono`] || '', e = j[`apoderado_${slot}_email`] || '';
        return `<div style="border:1.5px solid #e2e8f0;border-radius:12px;padding:12px;margin-bottom:10px">
            <p style="font-size:0.7rem;font-weight:800;text-transform:uppercase;color:#0E2586;margin:0 0 8px">${titulo}
              ${e ? `<span style="font-weight:600;text-transform:none;color:#94a3b8"> · ${e}</span>` : ''}</p>
            <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px">
                <input data-campo="apoderado_${slot}_nombre" value="${n.replace(/"/g,'&quot;')}" placeholder="Nombre" style="border:1.5px solid #e2e8f0;border-radius:8px;padding:7px 9px;font-size:0.78rem;outline:none">
                <input data-campo="apoderado_${slot}_parentesco" value="${p.replace(/"/g,'&quot;')}" placeholder="Parentesco" style="border:1.5px solid #e2e8f0;border-radius:8px;padding:7px 9px;font-size:0.78rem;outline:none">
                <input data-campo="apoderado_${slot}_telefono" value="${t.replace(/"/g,'&quot;')}" placeholder="Teléfono" style="border:1.5px solid #e2e8f0;border-radius:8px;padding:7px 9px;font-size:0.78rem;outline:none">
            </div>
        </div>`;
    }

    window._postRender = function(jovenes){
        for (const j of jovenes) {
            const tabGeneral = document.getElementById(`tab-general-${j.id}`);
            if (!tabGeneral || tabGeneral.querySelector('.apo-contacto-edit')) continue;
            const div = document.createElement('div');
            div.className = 'apo-contacto-edit';
            div.innerHTML = `
                <h4 style="font-size:0.85rem;font-weight:800;color:#0E2586;margin:18px 0 4px"><i class="fas fa-address-book" style="color:#1d5c8f"></i> Contactos de apoderados <span style="font-size:0.65rem;font-weight:700;background:#dcfce7;color:#166534;border-radius:999px;padding:2px 8px;vertical-align:middle">Editable</span></h4>
                <p style="font-size:0.7rem;color:#94a3b8;margin:0 0 10px">Mantén estos datos al día: son los que usa el grupo ante cualquier emergencia. Los correos se gestionan con la vinculación.</p>
                ${filaSlot(j,'titular','Apoderado titular')}
                ${filaSlot(j,'suplente1','Suplente 1')}
                ${filaSlot(j,'suplente2','Suplente 2')}
                <div style="text-align:right"><button onclick="guardarContactoApoderado(${j.id}, this)" style="background:linear-gradient(135deg,#123a63,#1d5c8f);color:white;border:none;border-radius:10px;padding:9px 18px;font-size:0.8rem;font-weight:800;cursor:pointer"><i class="fas fa-save"></i> Guardar contactos</button></div>
                <p class="apo-cont-msg" style="display:none;font-size:0.75rem;margin-top:6px"></p>`;
            tabGeneral.appendChild(div);
        }
    };

    window.guardarContactoApoderado = async function(jovenId, btn){
        const cont = btn.closest('.apo-contacto-edit');
        const msg = cont.querySelector('.apo-cont-msg');
        const payload = {};
        cont.querySelectorAll('input[data-campo]').forEach(inp => {
            const c = inp.dataset.campo;
            if (CAMPOS_EDITABLES.includes(c)) payload[c] = inp.value.trim();
        });
        btn.disabled = true; btn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Guardando...';
        const { error } = await db.from('mmbb_registrations').update(payload).eq('id', jovenId);
        btn.disabled = false; btn.innerHTML = '<i class="fas fa-save"></i> Guardar contactos';
        msg.style.display = 'block';
        if (error) { msg.style.color = '#b91c1c'; msg.textContent = 'Error al guardar: ' + error.message; return; }
        msg.style.color = '#059669'; msg.textContent = '✓ Contactos actualizados. ¡Gracias por mantenerlos al día!';
        setTimeout(() => msg.style.display = 'none', 3500);
    };
})();
