    async function comprimirImagen(file, opts = {}) {
        const {
            maxWidth = 1200,
            maxHeight = 1200,
            quality = 0.7,
            mimeOut = 'image/jpeg'
        } = opts;

        // Cargar imagen en memoria (FileReader primero, más compatible)
        const dataUrl = await new Promise((res, rej) => {
            const reader = new FileReader();
            reader.onload = () => res(reader.result);
            reader.onerror = () => rej(new Error('No se pudo leer el archivo'));
            reader.readAsDataURL(file);
        });
        const img = await new Promise((res, rej) => {
            const i = new Image();
            i.onload = () => res(i);
            i.onerror = () => rej(new Error('No se pudo cargar la imagen'));
            i.src = dataUrl;
        });

        // Calcular nuevas dimensiones respetando proporción
        let { width, height } = img;
        if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
        }

        // Dibujar en canvas y exportar
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (mimeOut === 'image/jpeg') {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, width, height);
        }
        ctx.drawImage(img, 0, 0, width, height);
        // FileReader no requiere revoke

        const blob = await new Promise(res => canvas.toBlob(res, mimeOut, quality));
        if (!blob) throw new Error('Fallo al comprimir la imagen');
        return { blob, width, height };
    }

    // ── INSERTAR IMÁGENES ──
    // Email tiene límite de ~50KB por payload. Para evitar error 413,
    // las imágenes SIEMPRE se suben al bucket y se insertan como URL pública.
    window.insertarImagenes = async function(e){
        const files = Array.from(e.target.files || []);
        for(const file of files){
            if(!file.type.startsWith('image/')) continue;
            const sizeOriginal = file.size;

            try{
                // Comprimir
                const { blob } = await comprimirImagen(file, {
                    maxWidth: 1200,
                    maxHeight: 1200,
                    quality: 0.7
                });
                const sizeFinal = blob.size;
                const reduccion = Math.round((1 - sizeFinal/sizeOriginal) * 100);

                // SIEMPRE subir al bucket (evita error 413 de EmailJS)
                const fileOptimizado = new File(
                    [blob],
                    file.name.replace(/\.[^.]+$/, '') + '.jpg',
                    { type: 'image/jpeg' }
                );
                const urlPublica = await subirArchivoABucket(fileOptimizado);

                const img = `<img src="${urlPublica}" alt="${file.name}" style="max-width:100%;height:auto;border-radius:8px;margin:8px 0">`;
                document.getElementById('editor').focus();
                document.execCommand('insertHTML', false, img);
                upPreview();

                const fmtKB = (n) => n < 1024*1024 ? (n/1024).toFixed(0)+' KB' : (n/1024/1024).toFixed(1)+' MB';
                alerta(`📷 "${file.name}": ${fmtKB(sizeOriginal)} → ${fmtKB(sizeFinal)} (−${reduccion}%) · subida al bucket`, 'ok');
            } catch(err){
                alerta('Error con imagen ' + file.name + ': ' + err.message, 'err');
            }
        }
        e.target.value = '';
    };

    // ── ADJUNTAR ARCHIVOS: se suben al bucket y se agregan como enlaces al final del correo ──
    window.adjuntarArchivos = async function(e){
        const files = Array.from(e.target.files || []);
        for(const file of files){
            if(file.size > 25 * 1024 * 1024){ // 25 MB límite razonable
                alerta(`"${file.name}" supera los 25 MB y no se adjuntará.`, 'err');
                continue;
            }
            try{
                const url = await subirArchivoABucket(file);
                archivosAdjuntos.push({nombre: file.name, url, size: file.size, mime: file.type});
                renderAdjuntosLista();
            } catch(err){
                alerta('Error al subir "' + file.name + '": ' + err.message, 'err');
            }
        }
        e.target.value = '';
    };

    async function subirArchivoABucket(file){
        // Sube al bucket "comunicaciones" — fallback al bucket "fotos"
        const ext = file.name.split('.').pop();
        const nombreLimpio = file.name.replace(/\.[^.]+$/,'').replace(/[^\w-]/g,'_').slice(0,40);
        const path = `comunicaciones/${Date.now()}_${nombreLimpio}.${ext}`;
        let resp = await db.storage.from('comunicaciones').upload(path, file, {upsert: true});
        let bucket = 'comunicaciones';
        if(resp.error){
            resp = await db.storage.from('fotos').upload(path, file, {upsert: true});
            bucket = 'fotos';
            if(resp.error) throw resp.error;
        }
        const {data: urlData} = db.storage.from(bucket).getPublicUrl(path);

        // Copia del archivo a Google Drive (carpeta Documentos del Grupo) — sin bloquear
        (async()=>{
            try {
                const reader = new FileReader();
                const b64 = await new Promise((res,rej)=>{
                    reader.onload = ()=>res(reader.result.split(',')[1]);
                    reader.onerror = rej;
                    reader.readAsDataURL(file);
                });
                await window.DriveHelper.subir({
                    supabaseClient: db,
                    nombre: file.name,
                    base64: b64,
                    mimeType: file.type || 'application/octet-stream',
                    claveCarpeta: 'admin_documentos'
                });
                console.log('✅ Adjunto copiado a Drive:', file.name);
            } catch(e){ console.warn('Drive comunicaciones:', e.message); }
        })();

        return urlData.publicUrl;
    }

    function renderAdjuntosLista(){
        const cont = document.getElementById('adjuntosLista');
        if(!archivosAdjuntos.length){ cont.innerHTML = ''; return; }
        const formatSize = (b) => b < 1024*1024 ? (b/1024).toFixed(0)+' KB' : (b/1024/1024).toFixed(1)+' MB';
        cont.innerHTML = archivosAdjuntos.map((f,i) => {
            const icono = f.mime?.includes('pdf') ? 'fa-file-pdf' : f.mime?.includes('word')||f.mime?.includes('document') ? 'fa-file-word' : f.mime?.includes('sheet')||f.mime?.includes('excel') ? 'fa-file-excel' : f.mime?.includes('image') ? 'fa-file-image' : 'fa-file';
            return `<div style="background:#f1f5f9;border:1px solid var(--gris-claro);padding:5px 10px;border-radius:8px;font-size:0.78rem;display:flex;align-items:center;gap:6px">
                <i class="fas ${icono}" style="color:var(--azul-claro)"></i>
                <a href="${f.url}" target="_blank" style="color:var(--texto-oscuro);text-decoration:none;max-width:160px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${f.nombre}</a>
                <span style="color:var(--texto-claro);font-size:0.7rem">${formatSize(f.size)}</span>
                <i class="fas fa-times" style="cursor:pointer;color:#64748b;margin-left:4px" onclick="quitarAdjunto(${i})"></i>
            </div>`;
        }).join('');
    }

    window.quitarAdjunto = function(i){
        archivosAdjuntos.splice(i, 1);
        renderAdjuntosLista();
    };

