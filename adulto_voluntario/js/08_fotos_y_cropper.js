        window.abrirMenuFotoAdulto = function(event, id, fotoActualUrl) {
            event.stopPropagation();
            document.getElementById('foto-context-menu-adulto')?.remove();
            const menu = document.createElement('div');
            menu.id = 'foto-context-menu-adulto';
            menu.style.cssText = 'position:fixed;background:white;border-radius:12px;box-shadow:0 8px 30px rgba(0,0,0,0.2);z-index:99998;padding:6px;min-width:200px;';
            const rect = event.target.getBoundingClientRect();
            menu.style.top = (rect.bottom + 6) + 'px';
            menu.style.left = Math.min(rect.left, window.innerWidth - 220) + 'px';
            menu.innerHTML = `
                <div style="padding:8px 12px;font-size:0.7rem;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;">Foto de perfil</div>
                <button onclick="window.editarFotoActualAdulto('${fotoActualUrl}',${id});document.getElementById('foto-context-menu-adulto').remove();" style="display:flex;align-items:center;gap:10px;width:100%;padding:10px 12px;border:none;background:none;cursor:pointer;border-radius:8px;font-size:0.85rem;font-weight:600;color:#1e293b;text-align:left;" onmouseover="this.style.background='#f1f5f9'" onmouseout="this.style.background='none'">
                    <i class="fas fa-crop-alt" style="color:#6366f1;width:16px;"></i> Editar foto actual
                </button>
                <button onclick="document.getElementById('foto-context-menu-adulto').remove();document.getElementById('input-foto-adulto-${id}').click();" style="display:flex;align-items:center;gap:10px;width:100%;padding:10px 12px;border:none;background:none;cursor:pointer;border-radius:8px;font-size:0.85rem;font-weight:600;color:#1e293b;text-align:left;" onmouseover="this.style.background='#f1f5f9'" onmouseout="this.style.background='none'">
                    <i class="fas fa-upload" style="color:#10b981;width:16px;"></i> Subir nueva foto
                </button>`;
            document.body.appendChild(menu);
            setTimeout(() => document.addEventListener('click', () => document.getElementById('foto-context-menu-adulto')?.remove(), { once: true }), 10);
        };

        window.editarFotoActualAdulto = async function(url, id) {
            if (!url || url.includes('ui-avatars')) { window.mostrarNotificacion('info', 'No hay foto subida aún. Sube una nueva primero.'); return; }
            try {
                window.mostrarNotificacion('info', 'Cargando foto para editar...');
                let filePath = null;
                const match = url.match(/\/storage\/v1\/object\/public\/fotos\/(.+)/);
                if (match) filePath = match[1];

                let blob;
                if (filePath) {
                    const { data, error } = await window.supabaseClient.storage.from('fotos').download(filePath);
                    if (error) throw error;
                    blob = data;
                } else {
                    const resp = await fetch(url);
                    if (!resp.ok) throw new Error('No se pudo cargar la foto');
                    blob = await resp.blob();
                }

                const file = new File([blob], 'foto-actual.jpg', { type: blob.type || 'image/jpeg' });
                window.abrirEditorFotoAdulto(file, async (editedBlob) => {
                    const newPath = `fotos_perfil/adulto_${id}_${Date.now()}.jpg`;
                    try {
                        window.mostrarNotificacion('info', 'Guardando cambios...');
                        const { error: upErr } = await window.supabaseClient.storage.from('fotos').upload(newPath, editedBlob, { upsert: true, contentType: 'image/jpeg' });
                        if (upErr) throw upErr;
                        const { data: urlData } = window.supabaseClient.storage.from('fotos').getPublicUrl(newPath);
                        const newUrl = urlData.publicUrl;
                        await window.supabaseClient.from('adultos_registros').update({ foto_url: newUrl }).eq('id', id);
                        const imgEl = document.getElementById(`foto-adulto-${id}`);
                        if (imgEl) imgEl.src = newUrl + '?t=' + Date.now();
                        const adulto = window.padronAdultos.find(a => a.id === id);
                        if (adulto) adulto.foto_url = newUrl;
                        window.renderAdultList();
                        window.mostrarNotificacion('exito', 'Foto actualizada correctamente.');
                    } catch(err) { window.mostrarNotificacion('error', 'Error al guardar: ' + err.message); }
                });
            } catch(err) {
                window.mostrarNotificacion('error', 'Error al cargar foto: ' + err.message);
            }
        };

        // Editor de foto para adultos
        window.cropperAdulto = null;
        window.window._fotoCallbackAdulto = null;

        // Rotar la imagen REAL en un canvas (no depende de Cropper.js)
        window.rotarImagenRealAdulto = function(grados) {
            if (!window.cropperAdulto) return;
            const imgEl = document.getElementById('foto-crop-img-adulto');
            const srcActual = imgEl.src;
            const tempImg = new Image();
            tempImg.onload = function() {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                if (Math.abs(grados) === 90 || Math.abs(grados) === 270) {
                    canvas.width = tempImg.height;
                    canvas.height = tempImg.width;
                } else {
                    canvas.width = tempImg.width;
                    canvas.height = tempImg.height;
                }
                ctx.translate(canvas.width / 2, canvas.height / 2);
                ctx.rotate((grados * Math.PI) / 180);
                ctx.drawImage(tempImg, -tempImg.width / 2, -tempImg.height / 2);
                const rotatedDataUrl = canvas.toDataURL('image/jpeg', 0.95);
                if (window.cropperAdulto) { window.cropperAdulto.destroy(); window.cropperAdulto = null; }
                imgEl.src = rotatedDataUrl;
                setTimeout(() => {
                    window.cropperAdulto = new Cropper(imgEl, {
                        aspectRatio: 1, viewMode: 2, dragMode: 'move',
                        autoCropArea: 1, restore: false, guides: true,
                        center: true, highlight: false,
                        cropBoxMovable: true, cropBoxResizable: true,
                        toggleDragModeOnDblclick: false,
                        checkCrossOrigin: false, checkOrientation: false,
                    });
                }, 100);
            };
            tempImg.src = srcActual;
        };

        window.abrirEditorFotoAdulto = function(file, callback) {
            if (!file) return;
            window._fotoCallbackAdulto = callback;
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = document.getElementById('foto-crop-img-adulto');
                img.src = e.target.result;
                document.getElementById('modal-editor-foto-adulto').classList.add('active');
                if (window.cropperAdulto) { window.cropperAdulto.destroy(); window.cropperAdulto = null; }
                setTimeout(() => {
                    window.cropperAdulto = new Cropper(img, {
                        aspectRatio: 1, viewMode: 2, dragMode: 'move',
                        autoCropArea: 1, restore: false, guides: true,
                        center: true, highlight: false,
                        cropBoxMovable: true, cropBoxResizable: true,
                        toggleDragModeOnDblclick: false,
                        checkCrossOrigin: false, checkOrientation: false
                    });
                }, 200);
            };
            reader.readAsDataURL(file);
        };

        window.setAspectoAdulto = function(ratio, btn) {
            document.querySelectorAll('.aspect-btn-a').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            if (window.cropperAdulto) window.cropperAdulto.setAspectRatio(ratio);
        };

        window.cerrarEditorFotoAdulto = function() {
            document.getElementById('modal-editor-foto-adulto').classList.remove('active');
            if (window.cropperAdulto) { window.cropperAdulto.destroy(); window.cropperAdulto = null; }
            window._fotoCallbackAdulto = null;
        };

        window.confirmarFotoAdulto = function() {
            if (!window.cropperAdulto || !window._fotoCallbackAdulto) {
                window.mostrarNotificacion('error', 'Editor no disponible. Intenta de nuevo.');
                return;
            }
            try {
                const canvas = window.cropperAdulto.getCroppedCanvas({ 
                    width: 400, height: 400, 
                    imageSmoothingQuality: 'high',
                    fillColor: '#fff'
                });
                if (!canvas) {
                    window.mostrarNotificacion('error', 'No se pudo procesar la imagen. Intenta subir una nueva foto.');
                    return;
                }
                // Guardar callback ANTES de cerrar (cerrarEditorFotoAdulto lo anula)
                const cb = window._fotoCallbackAdulto;
                canvas.toBlob((blob) => {
                    if (!blob) {
                        window.mostrarNotificacion('error', 'Error al convertir la imagen.');
                        return;
                    }
                    window.cerrarEditorFotoAdulto();
                    cb(blob);
                }, 'image/jpeg', 0.92);
            } catch(err) {
                console.error('Error confirmarFotoAdulto:', err);
                window.mostrarNotificacion('error', 'Error al guardar: ' + err.message);
            }
        };

        window.cambiarFotoAdulto = async function(adultoId, input) {
            const file = input.files[0]; if (!file) return;
            if (file.size > 10 * 1024 * 1024) { window.mostrarNotificacion('error', 'La imagen no puede superar 10 MB.'); return; }
            input.value = '';
            window.abrirEditorFotoAdulto(file, async (blob) => {
                const filePath = `fotos_perfil/adulto_${adultoId}_${Date.now()}.jpg`;
                try {
                    window.mostrarNotificacion('info', 'Subiendo nueva foto...');
                    const { error: upErr } = await window.supabaseClient.storage.from('fotos').upload(filePath, blob, { upsert: true, contentType: 'image/jpeg' });
                    if (upErr) throw upErr;
                    const { data: urlData } = window.supabaseClient.storage.from('fotos').getPublicUrl(filePath);
                    const newUrl = urlData.publicUrl;
                    const { error: dbErr } = await window.supabaseClient.from('adultos_registros').update({ foto_url: newUrl }).eq('id', adultoId);
                    if (dbErr) throw dbErr;
                    const imgEl = document.getElementById(`foto-adulto-${adultoId}`);
                    if (imgEl) imgEl.src = newUrl + '?t=' + Date.now();
                    const adulto = window.padronAdultos.find(a => a.id === adultoId);
                    if (adulto) adulto.foto_url = newUrl;
                    window.renderAdultList();
                    window.mostrarNotificacion('exito', 'Foto actualizada correctamente.');
                } catch (err) { console.error(err); window.mostrarNotificacion('error', 'Error: ' + err.message); }
            });
        };

