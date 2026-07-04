    async function subirFicha(file, prefijo) {
        if (!file) return null;
        if (file.size > 5 * 1024 * 1024) throw new Error('El archivo supera 5 MB.');
        const ext = file.name.split('.').pop().toLowerCase();
        const fileName = `${prefijo}_ficha_${Date.now()}.${ext}`;
        const filePath = `fichas_medicas/${fileName}`;
        const { error: uploadErr } = await db.storage.from(BUCKET_FOTOS).upload(filePath, file, { upsert: true });
        if (uploadErr) throw uploadErr;
        const { data: urlData } = db.storage.from(BUCKET_FOTOS).getPublicUrl(filePath);
        return urlData.publicUrl;
    }

    window.seleccionarFichaJoven = async function(e) {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) { alertaJov('El archivo supera el tamaño máximo (5 MB).'); return; }
        showLoading('Subiendo ficha médica...');
        try {
            fichaJovenURL = await subirFicha(file, 'joven');
            const lbl = document.getElementById('j_ficha_label');
            lbl.classList.add('uploaded');
            document.getElementById('j_ficha_txt').textContent = `✓ ${file.name}`;
            document.getElementById('j_ficha_sub').innerHTML = `Archivo cargado. <a href="${fichaJovenURL}" target="_blank" style="color:#166534;text-decoration:underline">Ver</a> · <span style="cursor:pointer;text-decoration:underline" onclick="event.stopPropagation();quitarFichaJoven()">Quitar</span>`;
        } catch(err) {
            alertaJov('Error al subir la ficha: ' + err.message);
        } finally {
            hideLoading();
        }
    };

    window.quitarFichaJoven = function() {
        fichaJovenURL = null;
        document.getElementById('j_ficha_input').value = '';
        const lbl = document.getElementById('j_ficha_label');
        lbl.classList.remove('uploaded');
        document.getElementById('j_ficha_txt').textContent = 'Adjuntar ficha médica (PDF o imagen)';
        document.getElementById('j_ficha_sub').textContent = 'Si ya tienes un documento médico, súbelo aquí. Máx 5 MB.';
    };

    window.seleccionarFichaAdulto = async function(e) {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) { alertaAdu('El archivo supera el tamaño máximo (5 MB).'); return; }
        showLoading('Subiendo ficha médica...');
        try {
            fichaAdultoURL = await subirFicha(file, 'adulto');
            const lbl = document.getElementById('a_ficha_label');
            lbl.classList.add('uploaded');
            document.getElementById('a_ficha_txt').textContent = `✓ ${file.name}`;
            document.getElementById('a_ficha_sub').innerHTML = `Archivo cargado. <a href="${fichaAdultoURL}" target="_blank" style="color:#166534;text-decoration:underline">Ver</a> · <span style="cursor:pointer;text-decoration:underline" onclick="event.stopPropagation();quitarFichaAdulto()">Quitar</span>`;
        } catch(err) {
            alertaAdu('Error al subir la ficha: ' + err.message);
        } finally {
            hideLoading();
        }
    };

    window.quitarFichaAdulto = function() {
        fichaAdultoURL = null;
        document.getElementById('a_ficha_input').value = '';
        const lbl = document.getElementById('a_ficha_label');
        lbl.classList.remove('uploaded');
        document.getElementById('a_ficha_txt').textContent = 'Adjuntar ficha médica (PDF o imagen)';
        document.getElementById('a_ficha_sub').textContent = 'Si ya tienes un documento médico, súbelo aquí. Máx 5 MB.';
    };

    // ── Empaquetar datos médicos y alimentarios en un texto estructurado ──
    // Se guarda en el campo "observaciones" existente (evita agregar columnas nuevas)
