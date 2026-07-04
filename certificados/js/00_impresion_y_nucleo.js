// Función de impresión
async function imprimirCertificado() {
    const l = document.getElementById('loading');
    const preview = document.getElementById('preview');
    l.style.display = 'block';
    try {
        const datos = recolectar();
        const conQR = document.getElementById('conQR').checked;
        let pngBase64;
        if (conQR) {
            // Subir a Drive → QR real → imprimir con QR
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
            // Re-generar como PNG para imprimir (el pdfBase64 ya tiene QR)
            if (res?.pdfBase64) {
                // Generar vista con el QR que ya tiene datos.qrDataUrl
                const { pngBase64: png } = await Certificados.generar(datos);
                pngBase64 = png;
            } else {
                const { pngBase64: png } = await Certificados.generar(datos);
                pngBase64 = png;
            }
        } else {
            const result = await Certificados.generar(datos);
            pngBase64 = result.pngBase64;
        }
        // Crear ventana de impresión con orientación horizontal
        const printWin = window.open('', '_blank');
        printWin.document.write(`
            <!DOCTYPE html>
            <html><head>
            <title>Certificado Scout</title>
            <style>
                @page { size: landscape; margin: 0; }
                * { margin: 0; padding: 0; }
                body { display: flex; align-items: center; justify-content: center; min-height: 100vh; background: white; }
                img { width: 100%; max-width: 100%; height: auto; }
            </style>
            
<style>
/* Override mobile.css para tema oscuro de certificados */
@media (max-width: 768px) {
    body.cert-dark {
        background: #0f172a !important;
    }
    body.cert-dark input,
    body.cert-dark textarea {
        background: #334155 !important;
        color: #e2e8f0 !important;
        border-color: #475569 !important;
        -webkit-text-fill-color: #e2e8f0 !important;
    }
    body.cert-dark input::placeholder,
    body.cert-dark textarea::placeholder {
        color: #94a3b8 !important;
        -webkit-text-fill-color: #94a3b8 !important;
    }
    body.cert-dark select {
        background: #334155 !important;
        color: #e2e8f0 !important;
    }
    body.cert-dark .card {
        background: #1e293b !important;
        border-color: #334155 !important;
        color: #e2e8f0 !important;
    }
    body.cert-dark label,
    body.cert-dark p,
    body.cert-dark h1,
    body.cert-dark h2,
    body.cert-dark h3 {
        color: #e2e8f0 !important;
    }
}
</style>
</head><body class="cert-dark">
            <img src="${pngBase64}" onload="setTimeout(function(){window.print();},500);">
            </body></html>
        `);
        printWin.document.close();
        // También actualizar la vista previa
        preview.innerHTML = '<img src="' + pngBase64 + '" alt="Certificado">';
        toast('Ventana de impresión abierta', 'ok');
    } catch(e) {
        toast('Error: ' + e.message, 'err');
        console.error(e);
    }
    l.style.display = 'none';
}

const SUPA_URL='https://hyixmaxhoxvamoecuars.supabase.co';
const SUPA_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5aXhtYXhob3h2YW1vZWN1YXJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3OTg1NDMsImV4cCI6MjA4ODM3NDU0M30.ZLeJIWdip2f00h4TqkZH7eqMX4wpwphaqkJpAa0N0X4';
window.supabaseClient = supabase.createClient(SUPA_URL, SUPA_KEY);
const db = window.supabaseClient;

let personaSeleccionada = null;
let timeoutBuscar = null;

const ETAPAS = {
    Bandada:  ['Pichón','Aprendiz','Viajera','Guía de Vuelo'],
    Manada:   ['Lobezno','Saltador','Diestro','Cazador'],
    Compania: ['Alba','Amanecer','Luz','Resplandor'],
    Tropa:    ['Cernícalo','Halcón','Águila','Cóndor'],
    Avanzada: ['Sendero','Cumbre'],
    Clan:     ['Bienvenida','Fuego','Antorcha'],
    Adulto:   ['Nivel Básico','Nivel Intermedio','Nivel Avanzado'],
};

// ── Buscar personas en Supabase ──
