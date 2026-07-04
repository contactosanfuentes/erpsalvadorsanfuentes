    async function comprimirImagenFoto(file) {
        // Si el navegador no soporta createImageBitmap (raro), subir original
        if (!window.createImageBitmap && !window.FileReader) return file;

        const dataUrl = await new Promise((res, rej) => {
            const reader = new FileReader();
            reader.onload = () => res(reader.result);
            reader.onerror = () => rej(new Error('No se pudo leer el archivo'));
            reader.readAsDataURL(file);
        });

        const img = await new Promise((res, rej) => {
            const i = new Image();
            i.onload = () => res(i);
            i.onerror = () => rej(new Error('Formato de imagen no soportado (HEIC debe convertirse automáticamente en iPhone; si no, usa JPG o PNG).'));
            i.src = dataUrl;
        });

        const maxDim = 1200;
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
            const ratio = Math.min(maxDim / width, maxDim / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const blob = await new Promise(res => canvas.toBlob(res, 'image/jpeg', 0.82));
        if (!blob) return file;
        return new File([blob], 'compressed.jpg', { type: 'image/jpeg' });
    }

    // ── SUBIR FOTO al bucket "fotos" de Supabase Storage ──
    async function subirFoto(file, prefijo) {
        if (!file) return null;
        if (file.size > 10 * 1024 * 1024) throw new Error('La imagen supera 10 MB.');

        // Comprimir antes de subir (reduce significativamente tamaño)
        const fileComprimido = await comprimirImagenFoto(file);

        const fileName = `${prefijo}_${Date.now()}.jpg`;
        const filePath = `inscripciones_publicas/${fileName}`;
        const { error: uploadErr } = await db.storage.from(BUCKET_FOTOS).upload(filePath, fileComprimido, { upsert: true, contentType: 'image/jpeg' });
        if (uploadErr) throw uploadErr;
        const { data: urlData } = db.storage.from(BUCKET_FOTOS).getPublicUrl(filePath);
        return urlData.publicUrl;
    }


    // ── Selector de foto: Cámara (getUserMedia) o Galería ──

    // Foto: los botones son labels directos sobre inputs file — sin JS intermediario

    function abrirCamara() { /* no se usa */ }
    function cerrarCamara() { /* no se usa */ }
    function capturarFoto() { /* no se usa */ }
    // ── HANDLERS DE FOTO JOVEN ──
    window.seleccionarFotoJoven = async function(e) {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 10 * 1024 * 1024) { alertaJov('La imagen supera el tamaño máximo (10 MB).'); return; }
        // Mostrar preview inmediato
        const reader = new FileReader();
        reader.onload = ev => {
            document.getElementById('j_foto_preview').src = ev.target.result;
            document.getElementById('j_foto_preview').style.display = 'block';
            document.getElementById('j_foto_placeholder').style.display = 'none';
        };
        reader.readAsDataURL(file);
        // Subir a Supabase Storage en background
        showLoading('Subiendo foto...');
        try {
            fotoJovenURL = await subirFoto(file, 'joven');
            document.getElementById('j_foto_status').style.display = 'inline-flex';
            document.getElementById('j_foto_remove').style.display = 'inline-flex';
        } catch(err) {
            alertaJov('Error al subir la foto: ' + err.message + '. Verifica que el bucket "fotos" existe en Supabase Storage.');
            quitarFotoJoven();
        } finally {
            hideLoading();
        }
    };

    window.quitarFotoJoven = function() {
        fotoJovenURL = null;
        document.getElementById('j_foto_input').value = '';
        document.getElementById('j_foto_preview').src = '';
        document.getElementById('j_foto_preview').style.display = 'none';
        document.getElementById('j_foto_placeholder').style.display = 'block';
        document.getElementById('j_foto_status').style.display = 'none';
        document.getElementById('j_foto_remove').style.display = 'none';
    };

    // ── HANDLERS DE FOTO ADULTO ──
    window.seleccionarFotoAdulto = async function(e) {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 10 * 1024 * 1024) { alertaAdu('La imagen supera el tamaño máximo (10 MB).'); return; }
        const reader = new FileReader();
        reader.onload = ev => {
            document.getElementById('a_foto_preview').src = ev.target.result;
            document.getElementById('a_foto_preview').style.display = 'block';
            document.getElementById('a_foto_placeholder').style.display = 'none';
        };
        reader.readAsDataURL(file);
        showLoading('Subiendo foto...');
        try {
            fotoAdultoURL = await subirFoto(file, 'adulto');
            document.getElementById('a_foto_status').style.display = 'inline-flex';
            document.getElementById('a_foto_remove').style.display = 'inline-flex';
        } catch(err) {
            alertaAdu('Error al subir la foto: ' + err.message);
            quitarFotoAdulto();
        } finally {
            hideLoading();
        }
    };

    window.quitarFotoAdulto = function() {
        fotoAdultoURL = null;
        document.getElementById('a_foto_input').value = '';
        document.getElementById('a_foto_preview').src = '';
        document.getElementById('a_foto_preview').style.display = 'none';
        document.getElementById('a_foto_placeholder').style.display = 'block';
        document.getElementById('a_foto_status').style.display = 'none';
        document.getElementById('a_foto_remove').style.display = 'none';
    };

    // ── SUBIR FICHA MÉDICA (PDF o imagen) al bucket "fotos", carpeta "fichas_medicas" ──
