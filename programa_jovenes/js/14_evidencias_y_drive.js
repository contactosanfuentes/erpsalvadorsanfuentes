        function driveIdDesdeUrl(url) {
            const m = (url||'').match(/\/d\/([a-zA-Z0-9_-]+)/);
            return m ? m[1] : null;
        }
        function driveThumbnailUrl(url) {
            const id = driveIdDesdeUrl(url);
            return id ? `https://drive.google.com/thumbnail?id=${id}&sz=w400` : url;
        }

        async function fileToBase64(file) {
            return new Promise((res, rej) => {
                const r = new FileReader();
                r.onload = () => res(r.result.split(',')[1]);
                r.onerror = rej;
                r.readAsDataURL(file);
            });
        }


        // Comprime imagen a máx 1400px y calidad 0.8 — reduce fotos de 5MB a ~300KB
        async function comprimirImagen(file, maxPx=1400, quality=0.8) {
            if (!file.type.startsWith('image/')) return file; // solo imágenes
            return new Promise((resolve) => {
                const img = new Image();
                const url = URL.createObjectURL(file);
                img.onload = () => {
                    let w = img.width, h = img.height;
                    if (w > maxPx || h > maxPx) {
                        if (w > h) { h = Math.round(h * maxPx / w); w = maxPx; }
                        else       { w = Math.round(w * maxPx / h); h = maxPx; }
                    }
                    const canvas = document.createElement('canvas');
                    canvas.width = w; canvas.height = h;
                    canvas.getContext('2d').drawImage(img, 0, 0, w, h);
                    canvas.toBlob(blob => {
                        URL.revokeObjectURL(url);
                        resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' }));
                    }, 'image/jpeg', quality);
                };
                img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
                img.src = url;
            });
        }

        async function subirEvidenciaProyecto() {
            const files = document.getElementById('evidencia-file').files;
            if (!files.length) return mostrarNotificacion('info', 'Selecciona al menos un archivo.');

            const joven = personasJovenes.find(j => j.id === currentJovenIdForProject);
            if (!joven) return;

            // Determinar carpeta Drive según rama del joven
            const ramaMap = {
                'Bandada': 'rama_bandada', 'Manada': 'rama_manada',
                'Tropa': 'rama_tropa', 'Compañía': 'rama_compania',
                'Avanzada': 'rama_avanzada', 'Clan': 'rama_clan'
            };
            const claveCarpeta = ramaMap[joven.rama] || 'raiz';
            const carpetas = await window.DriveHelper.cargarCarpetas(supabaseClient);
            const folderId = carpetas[claveCarpeta] || carpetas['raiz'];
            if (!folderId) return mostrarNotificacion('error', 'No se encontró la carpeta de Drive para esta rama.');

            // Crear subcarpeta "Evidencias - Proyectos" dentro de la rama
            let subFolderId = folderId;
            try {
                // Nivel 1: Evidencias - Proyectos
                const subRes = await fetch('/.netlify/functions/subir-drive', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ accion: 'crear_carpeta', nombre: 'Evidencias - Proyectos', folder_id: folderId })
                });
                const subData = await subRes.json();
                if (subData.ok) {
                    subFolderId = subData.id;
                    // Nivel 2: subcarpeta por proyecto
                    const proyecto = personasJovenes.find(j=>j.id===currentJovenIdForProject)
                        ?.camino?.proyectos_colectivos?.find(p=>p.id===currentEditProjectId);
                    const nombreProy = (proyecto?.nombre || 'Sin nombre').trim().slice(0, 60);
                    const subRes2 = await fetch('/.netlify/functions/subir-drive', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ accion: 'crear_carpeta', nombre: nombreProy, folder_id: subFolderId })
                    });
                    const subData2 = await subRes2.json();
                    if (subData2.ok) subFolderId = subData2.id;
                }
            } catch(e) { /* usar carpeta raíz de rama si falla */ }

            mostrarNotificacion('info', `Subiendo ${files.length} archivo(s) a Drive...`);
            const subidos = [];

            for (const file of files) {
                try {
                    const fileProc = await comprimirImagen(file);
                    const base64 = await fileToBase64(fileProc);
                    const ext = fileProc.name.split('.').pop().toLowerCase();
                    const mimeMap = { jpg:'image/jpeg', jpeg:'image/jpeg', png:'image/png', gif:'image/gif',
                        webp:'image/webp', pdf:'application/pdf', mp4:'video/mp4', mov:'video/quicktime',
                        mp3:'audio/mpeg', m4a:'audio/mp4', wav:'audio/wav', doc:'application/msword',
                        docx:'application/vnd.openxmlformats-officedocument.wordprocessingml.document' };
                    const mime = mimeMap[ext] || 'application/octet-stream';
                    const nombre = `${(joven.nombre_completo || joven.nombres || 'joven').replace(/\s+/g,'_')}_${Date.now()}.${ext}`;

                    const res = await fetch('/.netlify/functions/subir-drive', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ folder_id: subFolderId, nombre, contenido_base64: base64, mime_type: mime })
                    });
                    const data = await res.json();
                    if (!data.ok) throw new Error(data.error || 'Error Drive');
                    subidos.push({ url: data.link, nombre: file.name, driveId: data.id });
                } catch(e) {
                    mostrarNotificacion('error', `Error subiendo ${file.name}: ${e.message}`);
                }
            }

            if (subidos.length) {
                currentEvidencias.push(...subidos);
                renderEvidenciasList();
                mostrarNotificacion('exito', `${subidos.length} archivo(s) subido(s) a Drive.`);
                document.getElementById('evidencia-file').value = '';
            }
        }

        function renderEvidenciasList() {
            const container = document.getElementById('evidencias-list');
            if (!container) return;
            container.innerHTML = '';
            if (!currentEvidencias || !currentEvidencias.length) {
                container.innerHTML = '<span class="text-sm text-gray-400 italic">No hay evidencias cargadas.</span>';
                return;
            }
            // Normalizar: el portal guarda {url,nombre}, el ERP guarda strings
            const normalized = currentEvidencias.map(e =>
                typeof e === 'string' ? { url: e, nombre: e.split('/').pop() } : e
            );
            const isImg = url => /\.(jpe?g|png|gif|webp|bmp|svg)(\?|$)/i.test(url);
            container.innerHTML = '<div class="flex flex-wrap gap-3 mt-1">' +
                normalized.map((ev, idx) => {
                    const url = ev.url || ev;
                    const nombre = ev.nombre || `Evidencia ${idx+1}`;
                    if (isImg(url)) {
                        return `<div class="relative group border border-indigo-200 rounded-xl overflow-hidden shadow-sm" style="width:110px;">
                            <a href="${url}" target="_blank">
                                <img src="${/drive\.google\.com/.test(url) ? driveThumbnailUrl(url) : url}" alt="${nombre}" style="width:110px;height:90px;object-fit:cover;display:block;" onerror="this.src='${url}'">
                                <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                    <i class="fas fa-search-plus text-white text-xl"></i>
                                </div>
                            </a>
                            <div class="p-1 bg-white text-center">
                                <span class="text-xs text-gray-500 truncate block" title="${nombre}">${nombre.length>14?nombre.slice(0,12)+'…':nombre}</span>
                            </div>
                            <button onclick="eliminarEvidenciaProyecto(${idx})" class="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"><i class="fas fa-times"></i></button>
                        </div>`;
                    } else {
                        const ico = /\.pdf/i.test(url) ? 'fa-file-pdf text-red-500' :
                                    /\.(doc|docx)/i.test(url) ? 'fa-file-word text-blue-600' :
                                    /\.(mp4|mov|avi)/i.test(url) ? 'fa-file-video text-purple-500' :
                                    /\.(mp3|m4a|wav)/i.test(url) ? 'fa-file-audio text-green-600' : 'fa-file-alt text-indigo-500';
                        return `<div class="relative group bg-indigo-50 border border-indigo-200 rounded-xl p-3 flex flex-col items-center gap-1 shadow-sm" style="width:110px;">
                            <i class="fas ${ico} text-3xl"></i>
                            <a href="${url}" target="_blank" class="text-xs text-indigo-700 font-semibold text-center underline truncate w-full block" title="${nombre}">${nombre.length>14?nombre.slice(0,12)+'…':nombre}</a>
                            <button onclick="eliminarEvidenciaProyecto(${idx})" class="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"><i class="fas fa-times"></i></button>
                        </div>`;
                    }
                }).join('') + '</div>';
        }

        function eliminarEvidenciaProyecto(idx) {
            currentEvidencias.splice(idx, 1);
            renderEvidenciasList();
            mostrarNotificacion('info', 'Evidencia eliminada (solo localmente, el archivo seguirá en el storage)');
        }

        // ================= EDICIÓN INSTITUCIONAL =================
        async function subirAdjuntoManifiesto(jovenId, tipo, input) {
            const files = input.files; if (!files.length) return;
            const joven = personasJovenes.find(j => j.id === jovenId);
            if (!joven) return;
            if (!joven.camino.adjuntos_manifiesto) joven.camino.adjuntos_manifiesto = [];
            try {
                mostrarNotificacion('info', 'Subiendo adjunto...');
                for (const file of files) {
                    if (file.size > 10 * 1024 * 1024) { mostrarNotificacion('error', `${file.name} supera 10 MB.`); continue; }
                    const ext = file.name.split('.').pop().toLowerCase();
                    const filePath = `manifiesto/${jovenId}_${Date.now()}_${Math.random().toString(36).slice(2,6)}.${ext}`;
                    const { error: upErr } = await supabaseClient.storage.from('fotos').upload(filePath, file, { upsert: true });
                    if (upErr) throw upErr;
                    const { data: urlData } = supabaseClient.storage.from('fotos').getPublicUrl(filePath);
                    joven.camino.adjuntos_manifiesto.push({ tipo, url: urlData.publicUrl, nombre: file.name });
                }
                const caminoData = joven.progresion_documento || {};
                caminoData.adjuntos_manifiesto = joven.camino.adjuntos_manifiesto;
                await supabaseClient.from('mmbb_registrations').update({ progresion_documento: caminoData }).eq('id', jovenId);
                renderYouthProfile(joven);
                mostrarNotificacion('exito', 'Adjuntos guardados correctamente.');
            } catch (err) { console.error(err); mostrarNotificacion('error', 'Error: ' + err.message); }
            input.value = '';
        }

