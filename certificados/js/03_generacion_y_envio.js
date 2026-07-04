async function previsualizar(){
    const l = document.getElementById('loading'); const p = document.getElementById('preview');
    l.style.display='block'; p.innerHTML='';
    try {
        const datos = recolectar();
        // Si QR activado, mostrar QR de muestra en la previsualización
        if (document.getElementById('conQR').checked) {
            datos.qrDataUrl = await Certificados.generarQRMuestra();
        }
        const { pngBase64 } = await Certificados.generar(datos);
        p.innerHTML = `<img src="${pngBase64}" alt="Certificado">`;
        toast('Vista previa generada' + (datos.qrDataUrl ? ' (QR de muestra)' : ''), 'ok');
    } catch(e){ toast('Error: '+e.message, 'err'); console.error(e); }
    l.style.display='none';
}

async function descargar(){
    const l = document.getElementById('loading'); l.style.display='block';
    try {
        const datos = recolectar();
        const conQR = document.getElementById('conQR').checked;
        if (conQR) {
            // Subir a Drive primero para obtener link → QR real → PDF con QR → descargar
            datos._incluirQR = true;
            // Mapear unidad/rama → carpeta correcta en Drive
            const _u = (datos.unidad||'').toLowerCase();
            const clave = (datos.titulo||'').toLowerCase().includes('formac') || (datos.titulo||'').toLowerCase().includes('reconoc') || _u.includes('adulto')
                ? 'adultos'
                : _u.includes('bandada') ? 'rama_bandada'
                : _u.includes('manada')  ? 'rama_manada'
                : _u.includes('tropa')   ? 'rama_tropa'
                : _u.includes('compañ')  || _u.includes('compan') ? 'rama_compania'
                : _u.includes('avanzada')? 'rama_avanzada'
                : _u.includes('clan')    ? 'rama_clan'
                : null;
            const res = await Certificados.generarYSubir(datos, db, clave);
            if (res?.pdfBase64) {
                const blob = base64ToBlob(res.pdfBase64, 'application/pdf');
                const nombre = (res.codigo || '') + '_' + (datos.nombreArchivo || 'Certificado') + '.pdf';
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url; a.download = nombre.replace(/[^a-zA-Z0-9._-]/g,'_'); a.click();
                URL.revokeObjectURL(url);
                toast('✅ PDF descargado (con QR) y guardado en Drive', 'ok');
            } else { toast('Error generando PDF', 'err'); }
        } else {
            await Certificados.generarYDescargar(datos);
            toast('PDF descargado (sin QR)', 'ok');
        }
    } catch(e){ toast('Error: '+e.message, 'err'); console.error(e); }
    l.style.display='none';
}

function base64ToBlob(b64, mime) {
    const byteChars = atob(b64);
    const byteArr = new Uint8Array(byteChars.length);
    for (let i = 0; i < byteChars.length; i++) byteArr[i] = byteChars.charCodeAt(i);
    return new Blob([byteArr], { type: mime });
}

async function subirDrive(){
    const l = document.getElementById('loading'); l.style.display='block';
    try {
        const datos = recolectar();
        datos._incluirQR = document.getElementById('conQR').checked;
        const clave = (datos.titulo.includes('FORMACION')||datos.titulo.includes('RECONOCIMIENTO')) ? 'adultos' : null;
        const res = await Certificados.generarYSubir(datos, db, clave);
        if (res.pdf?.ok) toast('✅ Subido a Drive: ' + (res.pdf.link||''), 'ok');
        else toast('Error: ' + (res.pdf?.error||'Revisa la consola'), 'err');
    } catch(e){ toast('Error: '+e.message, 'err'); console.error(e); }
    l.style.display='none';
}

async function enviarCorreo(){
    const email = document.getElementById('email').value.trim();
    if (!email) { toast('Ingresa un correo destino', 'err'); return; }
    const l = document.getElementById('loading'); l.style.display='block';
    try {
        const datos = recolectar();
        datos._incluirQR = document.getElementById('conQR').checked;
        const clave = (datos.titulo.includes('FORMACION')||datos.titulo.includes('RECONOCIMIENTO')) ? 'adultos' : null;
        const res = await Certificados.generarYEnviar(datos, db, clave, email, `📜 Certificado — ${datos.nombre}`);
        const okDrive = res.drive?.ok;
        const okCorreo = res.correo?.ok || res.correo?.id;
        toast(`${okDrive?'✅ Drive':'❌ Drive'} | ${okCorreo?'✅ Correo':'❌ Correo'}`, okDrive||okCorreo?'ok':'err');
    } catch(e){ toast('Error: '+e.message, 'err'); console.error(e); }
    l.style.display='none';
}

// Init
actualizarEtapas();