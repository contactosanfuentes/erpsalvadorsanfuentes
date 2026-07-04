    function armarObservacionesEstructuradas(prefijo, obsBase) {
        const $ = id => document.getElementById(prefijo + id);
        const getValor = id => ($(id)?.value || '').trim();
        const getCheckboxes = cls => Array.from(document.querySelectorAll('.' + cls)).filter(c => c.checked).map(c => c.value);

        const partes = [];
        if (obsBase) partes.push('OBSERVACIONES: ' + obsBase);

        // Ficha médica
        const datosMed = [];
        const sangre = getValor('_sangre'); if (sangre) datosMed.push('Sangre: ' + sangre);
        const prev = getValor('_prevision'); if (prev) datosMed.push('Previsión: ' + prev);
        const aler = getValor('_alergias'); if (aler) datosMed.push('Alergias: ' + aler);
        const meds = getValor('_medicamentos'); if (meds) datosMed.push('Medicamentos: ' + meds);
        const cond = getValor('_condiciones'); if (cond) datosMed.push('Condiciones: ' + cond);
        const emNom = getValor('_emerg_nom');
        const emTel = getValor('_emerg_tel');
        if (emNom || emTel) datosMed.push(`Emergencia: ${emNom} ${emTel ? '(' + emTel + ')' : ''}`.trim());

        const fichaURL = prefijo === 'j' ? fichaJovenURL : fichaAdultoURL;
        if (fichaURL) datosMed.push('Ficha adjunta: ' + fichaURL);

        if (datosMed.length) partes.push('▸ MÉDICO: ' + datosMed.join(' | '));

        // Preferencias alimentarias (checkboxes previos)
        const dietCls = prefijo === 'j' ? 'j_diet' : 'a_diet';
        const diets = getCheckboxes(dietCls);
        const dietOtras = getValor('_diet_otras');
        const dietAll = [...diets];
        if (dietOtras) dietAll.push('Otras: ' + dietOtras);

        // Dieta especial del evento (nueva sección sec-dieta)
        const dietaTipo = getValor('_dieta_tipo');
        const dietaDetalle = getValor('_dieta_detalle');
        if (dietaTipo) dietAll.push('Dieta: ' + dietaTipo);
        if (dietaDetalle) dietAll.push('Detalle: ' + dietaDetalle);

        if (dietAll.length) partes.push('▸ ALIMENTACIÓN: ' + dietAll.join(', '));

        return partes.join('\n');
    }

    // ── Recolectar datos médicos como objeto (para el email) ──
    function recolectarDatosMedicos(prefijo) {
        const $ = id => document.getElementById(prefijo + id);
        const get = id => ($(id)?.value || '').trim();
        const emNom = get('_emerg_nom'), emTel = get('_emerg_tel');
        return {
            sangre:       get('_sangre') || null,
            prevision:    get('_prevision') || null,
            alergias:     get('_alergias') || null,
            medicamentos: get('_medicamentos') || null,
            condiciones:  get('_condiciones') || null,
            emergencia:   (emNom || emTel) ? `${emNom} ${emTel ? '(' + emTel + ')' : ''}`.trim() : null
        };
    }

    // ── Recolectar preferencias alimentarias como array (para el email) ──
    function recolectarDatosAlim(prefijo) {
        const cls = prefijo === 'j' ? 'j_diet' : 'a_diet';
        const checks = Array.from(document.querySelectorAll('.' + cls)).filter(c => c.checked).map(c => c.value);
        const otras = (document.getElementById(prefijo + '_diet_otras')?.value || '').trim();
        if (otras) checks.push('Otras: ' + otras);
        return checks;
    }

    // ── GENERAR QR COMO DATA URL (PNG base64) ── para incrustar en email
    function generarQRDataURL(texto, size = 200) {
        return new Promise(resolve => {
            const tempDiv = document.createElement('div');
            tempDiv.style.display = 'none';
            document.body.appendChild(tempDiv);
            const qr = new QRCode(tempDiv, {
                text: texto, width: size, height: size,
                colorDark: '#0E2586', colorLight: '#ffffff',
                correctLevel: QRCode.CorrectLevel.H
            });
            // qrcodejs renderiza en un canvas/img
            setTimeout(() => {
                const canvas = tempDiv.querySelector('canvas');
                const img = tempDiv.querySelector('img');
                let dataURL = null;
                if (canvas) dataURL = canvas.toDataURL('image/png');
                else if (img) dataURL = img.src;
                document.body.removeChild(tempDiv);
                resolve(dataURL);
            }, 100);
        });
    }

    // ── Cargar eventos disponibles desde tabla "eventos" ──
