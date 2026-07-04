        let cropperInstance = null;
        let _fotoCallback = null;
        let _fotoMenuTarget = null;

        // Menú contextual al hacer clic en la cámara
        function abrirMenuFoto(event, id, fotoActualUrl, tipo) {
            event.stopPropagation();
            // Cerrar cualquier menú previo
            document.getElementById('foto-context-menu')?.remove();
            const menu = document.createElement('div');
            menu.id = 'foto-context-menu';
            menu.style.cssText = 'position:fixed;background:white;border-radius:12px;box-shadow:0 8px 30px rgba(0,0,0,0.2);z-index:99998;padding:6px;min-width:200px;animation:fadeIn 0.1s ease-out;';
            const rect = event.target.getBoundingClientRect();
            menu.style.top = (rect.bottom + 6) + 'px';
            menu.style.left = Math.min(rect.left, window.innerWidth - 220) + 'px';
            menu.innerHTML = `
                <div style="padding:8px 12px;font-size:0.7rem;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;">Foto de perfil</div>
                <button onclick="editarFotoActual('${fotoActualUrl}',${id},'${tipo}');document.getElementById('foto-context-menu').remove();" style="display:flex;align-items:center;gap:10px;width:100%;padding:10px 12px;border:none;background:none;cursor:pointer;border-radius:8px;font-size:0.85rem;font-weight:600;color:#1e293b;text-align:left;" onmouseover="this.style.background='#f1f5f9'" onmouseout="this.style.background='none'">
                    <i class="fas fa-crop-alt" style="color:#6366f1;width:16px;"></i> Editar foto actual
                </button>
                <button onclick="document.getElementById('foto-context-menu').remove();document.getElementById('input-foto-${tipo==='joven'?'joven':'adulto'}-${id}').click();" style="display:flex;align-items:center;gap:10px;width:100%;padding:10px 12px;border:none;background:none;cursor:pointer;border-radius:8px;font-size:0.85rem;font-weight:600;color:#1e293b;text-align:left;" onmouseover="this.style.background='#f1f5f9'" onmouseout="this.style.background='none'">
                    <i class="fas fa-upload" style="color:#10b981;width:16px;"></i> Subir nueva foto
                </button>`;
            document.body.appendChild(menu);
            // Cerrar al hacer clic fuera
            setTimeout(() => document.addEventListener('click', () => document.getElementById('foto-context-menu')?.remove(), { once: true }), 10);
        }

        // Editar la foto ya subida (cargarla desde URL en el editor)
        async function editarFotoActual(url, id, tipo) {
            if (!url || url.includes('ui-avatars')) {
                mostrarNotificacion('info', 'No hay foto subida aún. Sube una nueva primero.');
                return;
            }
            try {
                mostrarNotificacion('info', 'Cargando foto para editar...');
                // Extraer el path dentro del bucket desde la URL pública
                // URL pública: https://xxx.supabase.co/storage/v1/object/public/fotos/fotos_perfil/joven_123_xxx.jpg
                let filePath = null;
                const match = url.match(/\/storage\/v1\/object\/public\/fotos\/(.+)/);
                if (match) filePath = match[1];

                let blob;
                if (filePath) {
                    // Descargar via SDK (sin problemas CORS)
                    const { data, error } = await supabaseClient.storage.from('fotos').download(filePath);
                    if (error) throw error;
                    blob = data;
                } else {
                    // Fallback: fetch directo
                    const resp = await fetch(url);
                    if (!resp.ok) throw new Error('No se pudo cargar la foto');
                    blob = await resp.blob();
                }

                const file = new File([blob], 'foto-actual.jpg', { type: blob.type || 'image/jpeg' });
                abrirEditorFoto(file, async (editedBlob) => {
                    const newPath = `fotos_perfil/${tipo}_${id}_${Date.now()}.jpg`;
                    try {
                        mostrarNotificacion('info', 'Guardando cambios...');
                        const { error: upErr } = await supabaseClient.storage.from('fotos').upload(newPath, editedBlob, { upsert: true, contentType: 'image/jpeg' });
                        if (upErr) throw upErr;
                        const { data: urlData } = supabaseClient.storage.from('fotos').getPublicUrl(newPath);
                        const newUrl = urlData.publicUrl;
                        if (tipo === 'joven') {
                            await supabaseClient.from('mmbb_registrations').update({ foto_url: newUrl }).eq('id', id);
                            const imgEl = document.getElementById(`foto-joven-${id}`);
                            if (imgEl) imgEl.src = newUrl + '?t=' + Date.now();
                            const joven = personasJovenes.find(j => j.id === id);
                            if (joven) joven.foto = newUrl;
                            renderYouthList();
                        }
                        mostrarNotificacion('exito', 'Foto actualizada correctamente.');
                    } catch(err) { mostrarNotificacion('error', 'Error al guardar: ' + err.message); }
                });
            } catch(err) {
                mostrarNotificacion('error', 'Error al cargar foto: ' + err.message);
            }
        }

        // Rotar la imagen REAL en un canvas (no depende de Cropper.js)
        function rotarImagenReal(grados) {
            if (!cropperInstance) return;
            // Obtener la imagen actual del Cropper como data URL
            const imgEl = document.getElementById('foto-crop-img');
            const srcActual = imgEl.src;
            
            // Crear imagen temporal para rotar
            const tempImg = new Image();
            tempImg.onload = function() {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                // Rotar 90° intercambia ancho y alto
                if (Math.abs(grados) === 90 || Math.abs(grados) === 270) {
                    canvas.width = tempImg.height;
                    canvas.height = tempImg.width;
                } else {
                    canvas.width = tempImg.width;
                    canvas.height = tempImg.height;
                }
                // Trasladar al centro, rotar, y dibujar
                ctx.translate(canvas.width / 2, canvas.height / 2);
                ctx.rotate((grados * Math.PI) / 180);
                ctx.drawImage(tempImg, -tempImg.width / 2, -tempImg.height / 2);
                // Convertir a data URL
                const rotatedDataUrl = canvas.toDataURL('image/jpeg', 0.95);
                // Destruir Cropper, cambiar imagen, re-inicializar
                if (cropperInstance) { cropperInstance.destroy(); cropperInstance = null; }
                imgEl.src = rotatedDataUrl;
                setTimeout(() => {
                    cropperInstance = new Cropper(imgEl, {
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
        }

        function abrirEditorFoto(file, callback) {
            if (!file) return;
            _fotoCallback = callback;
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = document.getElementById('foto-crop-img');
                img.src = e.target.result;
                document.getElementById('modal-editor-foto').classList.add('active');
                if (cropperInstance) { cropperInstance.destroy(); cropperInstance = null; }
                setTimeout(() => {
                    cropperInstance = new Cropper(img, {
                        aspectRatio: 1,
                        viewMode: 2,
                        dragMode: 'move',
                        autoCropArea: 1,
                        restore: false,
                        guides: true,
                        center: true,
                        highlight: false,
                        cropBoxMovable: true,
                        cropBoxResizable: true,
                        toggleDragModeOnDblclick: false,
                        checkCrossOrigin: false,
                        checkOrientation: false,
                    });
                }, 200);
            };
            reader.readAsDataURL(file);
        }

        function setAspecto(ratio, btn) {
            document.querySelectorAll('.aspect-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            if (cropperInstance) cropperInstance.setAspectRatio(ratio);
        }

        function cerrarEditorFoto() {
            document.getElementById('modal-editor-foto').classList.remove('active');
            if (cropperInstance) { cropperInstance.destroy(); cropperInstance = null; }
            _fotoCallback = null;
        }

        function confirmarFotoEditada() {
            if (!cropperInstance || !_fotoCallback) {
                mostrarNotificacion('error', 'Editor no disponible. Intenta de nuevo.');
                return;
            }
            try {
                const canvas = cropperInstance.getCroppedCanvas({ 
                    width: 400, height: 400, 
                    imageSmoothingQuality: 'high',
                    fillColor: '#fff'
                });
                if (!canvas) {
                    mostrarNotificacion('error', 'No se pudo procesar la imagen. Intenta subir una nueva foto.');
                    return;
                }
                // Guardar callback ANTES de cerrar (cerrarEditorFoto lo anula)
                const cb = _fotoCallback;
                canvas.toBlob((blob) => {
                    if (!blob) {
                        mostrarNotificacion('error', 'Error al convertir la imagen. Prueba con otra foto.');
                        return;
                    }
                    cerrarEditorFoto();
                    cb(blob);
                }, 'image/jpeg', 0.92);
            } catch(err) {
                console.error('Error confirmarFotoEditada:', err);
                mostrarNotificacion('error', 'Error al guardar foto: ' + err.message);
            }
        }

        async function cambiarFotoJoven(jovenId, input) {
            const file = input.files[0]; if (!file) return;
            if (file.size > 10 * 1024 * 1024) { mostrarNotificacion('error', 'La imagen no puede superar 10 MB.'); return; }
            input.value = '';
            abrirEditorFoto(file, async (blob) => {
                const filePath = `fotos_perfil/joven_${jovenId}_${Date.now()}.jpg`;
                try {
                    mostrarNotificacion('info', 'Subiendo nueva foto...');
                    const { error: upErr } = await supabaseClient.storage.from('fotos').upload(filePath, blob, { upsert: true, contentType: 'image/jpeg' });
                    if (upErr) throw upErr;
                    const { data: urlData } = supabaseClient.storage.from('fotos').getPublicUrl(filePath);
                    const newUrl = urlData.publicUrl;
                    const { error: dbErr } = await supabaseClient.from('mmbb_registrations').update({ foto_url: newUrl }).eq('id', jovenId);
                    if (dbErr) throw dbErr;
                    const imgEl = document.getElementById(`foto-joven-${jovenId}`);
                    if (imgEl) imgEl.src = newUrl + '?t=' + Date.now();
                    const joven = personasJovenes.find(j => j.id === jovenId);
                    if (joven) { joven.foto = newUrl; }
                    renderYouthList();
                    mostrarNotificacion('exito', 'Foto actualizada correctamente.');
                } catch (err) { console.error(err); mostrarNotificacion('error', 'Error al cambiar la foto: ' + err.message); }
            });
        }

