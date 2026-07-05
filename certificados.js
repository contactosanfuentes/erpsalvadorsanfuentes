// ============================================================
// MOTOR DE CERTIFICADOS ERP SCOUT - certificados.js v2
// Diseño aprobado v7 con logos oficiales AGSCh/SSF
// Genera PDF y PNG, sube a Google Drive automáticamente
// ============================================================
window.Certificados = (function(){

    // ── Logos incrustados (base64) ──
    // Logos e insignias: se cargan bajo demanda desde certificados-assets.js
    let LOGOS = null;

    let FLOR_DE_LIS = null;

    // ── Datos por unidad ──
    const LEMAS = {
        Bandada:  '¡Siempre Mejor!',
        Manada:   '¡Siempre lo Mejor! / ¡Buena Caza!',
        Compania: '¡Siempre Listas!',
        'Compañía':'¡Siempre Listas!',
        Tropa:    '¡Siempre Listos!',
        Avanzada: '¡Siempre Adelante!',
        Clan:     '¡Siempre Listos para Servir!',
        Adulto:   '¡Siempre Listos!',
    };

    const NOMBRES_UNIDAD = {
        Bandada:  'Bandada — Pilmaikén Kalfü',
        Manada:   'Manada — Kupëlwe Kadü',
        Compania: 'Compañía — Antuwenüy',
        'Compañía':'Compañía — Antuwenüy',
        Tropa:    'Tropa — Manke Pillán',
        Avanzada: 'Avanzada',
        Clan:     'Clan — Kutral Raigüen',
        Adulto:   'Equipo de Adultos Voluntarios',
    };

    const COLORES = {
        Bandada:  { p:'#1d4ed8', l:'rgba(29,78,216,0.2)' },
        Manada:   { p:'#b45309', l:'rgba(180,83,9,0.2)' },
        Compania: { p:'#0284c7', l:'rgba(2,132,199,0.2)' },
        'Compañía':{ p:'#0284c7', l:'rgba(2,132,199,0.2)' },
        Tropa:    { p:'#15803d', l:'rgba(21,128,61,0.2)' },
        Avanzada: { p:'#6d28d9', l:'rgba(109,40,217,0.2)' },
        Clan:     { p:'#0d3b20', l:'rgba(13,59,32,0.2)' },
        Adulto:   { p:'#1e3a5f', l:'rgba(30,58,95,0.2)' },
    };

    const TITULO_DIRIGENTE = {
        Bandada:  'Guiadora de Bandada',
        Manada:   'Guiadora/Dirigente de Manada',
        Compania: 'Guiadora de Compañía',
        'Compañía':'Guiadora de Compañía',
        Tropa:    'Guiadora/Dirigente de Tropa',
        Avanzada: 'Guiadora/Dirigente de Avanzada',
        Clan:     'Guiadora/Dirigente de Clan',
        Adulto:   'Responsable de Formación',
    };

    let _libsLoaded = false;

    // ── Obtener código único de certificado desde Supabase ──
    async function obtenerCodigoCertificado(supabaseClient, tipo) {
        try {
            const { data, error } = await supabaseClient.rpc('generar_codigo_certificado', { p_tipo: tipo });
            if (error) throw error;
            return data;
        } catch(e) {
            console.warn('[CERT] No se pudo generar código:', e.message);
            // Fallback: código local con timestamp
            const prefijos = { 'DE PROGRESIÓN':'PROG','DE ESPECIALIDAD':'ESP','DE COMPETENCIA':'COMP','DE PARTICIPACIÓN':'PART','DE FORMACIÓN':'FORM','DE RECONOCIMIENTO':'REC' };
            const pref = prefijos[tipo] || 'CERT';
            return 'GSS-' + pref + '-' + new Date().toISOString().slice(0,10).replace(/-/g,'') + '-' + Date.now().toString(36).toUpperCase();
        }
    }

    // Registrar certificado emitido en Supabase
    async function registrarCertificado(supabaseClient, registro) {
        try {
            const { error } = await supabaseClient.from('certificados_emitidos').insert(registro);
            if (error) console.warn('[CERT] Error registrando:', error.message);
            else console.log('[CERT] Certificado registrado:', registro.codigo);
        } catch(e) { console.warn('[CERT] No se pudo registrar:', e.message); }
    }

    // ── Normalizar nombre de unidad ──
    function normUnidad(u) {
        if (!u) return 'Tropa';
        const ul = u.toLowerCase();
        if (ul.includes('adulto') || ul.includes('staff') || ul.includes('dirigent') || ul.includes('voluntar')) return 'Adulto';
        if (!u) return 'Tropa';
        if (u.includes('Bandada')) return 'Bandada';
        if (u.includes('Manada')) return 'Manada';
        if (u.includes('Compañ') || u.includes('Compania')) return 'Compañía';
        if (u.includes('Tropa')) return 'Tropa';
        if (u.includes('Avanzada')) return 'Avanzada';
        if (u.includes('Clan')) return 'Clan';
        return u;
    }

    // ── Cargar librerías PDF + QR ──
    async function cargarLibs() {
        if (_libsLoaded) return;
        const cargar = (src) => new Promise((res, rej) => {
            if (document.querySelector(`script[src="${src}"]`)) return res();
            const s = document.createElement('script');
            s.src = src; s.onload = res; s.onerror = rej;
            document.head.appendChild(s);
        });
        // Assets pesados (logos base64) solo cuando de verdad se genera algo
        if (!window.CERT_ASSETS) await cargar('certificados-assets.js');
        LOGOS = window.CERT_ASSETS.LOGOS;
        FLOR_DE_LIS = window.CERT_ASSETS.FLOR_DE_LIS;
        await cargar('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
        await cargar('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js');
        await cargar('https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js');
        _libsLoaded = true;
    }

    // ── Generar imagen QR como data URL ──
    async function generarQR(texto) {
        await cargarLibs();
        if (!texto) return '';
        
        // Pre-cargar la Flor de Lis
        let logoImg = null;
        if (FLOR_DE_LIS) {
            try {
                logoImg = new Image();
                logoImg.src = FLOR_DE_LIS;
                await new Promise((ok, fail) => {
                    logoImg.onload = ok;
                    logoImg.onerror = fail;
                    setTimeout(fail, 4000);
                });
            } catch(e) { logoImg = null; console.warn('[CERT] Logo no cargó para QR'); }
        }

        // Generar QR en div temporal
        const div = document.createElement('div');
        div.style.cssText = 'position:fixed;left:-9999px;top:0;';
        document.body.appendChild(div);
        new QRCode(div, {
            text: texto, width: 300, height: 300,
            colorDark: '#001558', colorLight: '#ffffff',
            correctLevel: QRCode.CorrectLevel.H
        });
        await new Promise(r => setTimeout(r, 600));

        const canvas = div.querySelector('canvas');
        if (!canvas) { document.body.removeChild(div); return ''; }

        // Superponer Flor de Lis AGSCh al centro
        if (logoImg && logoImg.complete && logoImg.naturalWidth > 0) {
            try {
                const ctx = canvas.getContext('2d');
                const sz = canvas.width * 0.24;
                const cx = canvas.width / 2, cy = canvas.height / 2;
                ctx.beginPath();
                ctx.arc(cx, cy, sz / 2 + 8, 0, Math.PI * 2);
                ctx.fillStyle = '#ffffff';
                ctx.fill();
                ctx.drawImage(logoImg, cx - sz/2, cy - sz/2, sz, sz);
                console.log('[CERT] ✅ QR con Flor de Lis AGSCh');
            } catch(e) { console.warn('[CERT] Error dibujando logo en QR:', e); }
        }

        const dataUrl = canvas.toDataURL('image/png');
        document.body.removeChild(div);
        return dataUrl;
    }

    // ── QR de muestra para previsualización ──
    async function generarQRMuestra() {
        return await generarQR('https://drive.google.com/file/d/EJEMPLO-CERTIFICADO-DIGITAL/view');
    }

    // ── Generar gradiente como imagen base64 (evita CSS gradient que rompe html2canvas) ──
    function crearGradiente(w, h, color1, color2, angulo) {
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext('2d');
        const rad = (angulo || 135) * Math.PI / 180;
        const x1 = w/2 - Math.cos(rad) * w/2;
        const y1 = h/2 - Math.sin(rad) * h/2;
        const x2 = w/2 + Math.cos(rad) * w/2;
        const y2 = h/2 + Math.sin(rad) * h/2;
        const grad = ctx.createLinearGradient(x1, y1, x2, y2);
        grad.addColorStop(0, color1);
        grad.addColorStop(1, color2);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);
        return canvas.toDataURL('image/png');
    }

    // Generar separador con gradiente como imagen
    function crearSeparador(w, color) {
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = 2;
        const ctx = canvas.getContext('2d');
        const grad = ctx.createLinearGradient(0, 0, w, 0);
        grad.addColorStop(0, 'transparent');
        grad.addColorStop(0.3, color);
        grad.addColorStop(0.5, color);
        grad.addColorStop(0.7, color);
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, 2);
        return canvas.toDataURL('image/png');
    }

    // Pre-renderizar logo sobre canvas circular blanco (evita fondo negro en html2canvas)
    async function preRenderLogoCircle(src, outerSize, logoSize) {
        try {
            const cv = document.createElement('canvas');
            cv.width = outerSize; cv.height = outerSize;
            const ctx = cv.getContext('2d');
            // Fondo blanco circular
            ctx.beginPath();
            ctx.arc(outerSize/2, outerSize/2, outerSize/2, 0, Math.PI * 2);
            ctx.fillStyle = '#ffffff';
            ctx.fill();
            // Dibujar logo
            await new Promise((ok) => {
                const img = new Image();
                img.onload = () => {
                    const off = (outerSize - logoSize) / 2;
                    ctx.save();
                    ctx.beginPath();
                    ctx.arc(outerSize/2, outerSize/2, outerSize/2 - 1, 0, Math.PI * 2);
                    ctx.clip();
                    ctx.drawImage(img, off, off, logoSize, logoSize);
                    ctx.restore();
                    ok();
                };
                img.onerror = ok; // si falla, queda solo el círculo blanco
                img.src = src;
            });
            return cv.toDataURL('image/png');
        } catch(e) { return src; }
    }

    // ── Construir HTML del certificado ──
    function construirHTML(d, logoGrupoUrl, logoUnidadUrl) {
        const unidad = normUnidad(d.unidad);
        const col = COLORES[unidad] || COLORES.Tropa;
        const logoUnidad = logoUnidadUrl || LOGOS[unidad] || LOGOS.grupo;
        const logoGrupo = logoGrupoUrl || LOGOS.grupo;
        const lema = LEMAS[unidad] || '¡Siempre Listos!';
        const nombreUnidad = NOMBRES_UNIDAD[unidad] || unidad;
        const tituloDirigente = TITULO_DIRIGENTE[unidad] || 'Guiadora/Dirigente de Unidad';
        const fecha = d.fecha || new Date().toLocaleDateString('es-CL', {day:'numeric', month:'long', year:'numeric'});
        const titulo = d.titulo || 'DE PROGRESIÓN';

        // Generar gradientes como imágenes (NO CSS gradient → no rompe html2canvas)
        const gradTop = crearGradiente(1000, 62, '#001558', col.p, 135);
        const gradBottom = crearGradiente(1000, 34, col.p, '#001558', 135);
        const sepLine = crearSeparador(800, col.p);

        // Código en la banda inferior
        let certCodeBand = '';
        if (d.codigoCert) {
            certCodeBand = '<div style="position:absolute;left:30px;display:flex;align-items:center;gap:6px;">'
                + '<div style="font-size:6px;color:rgba(255,255,255,0.5);font-weight:700;">N\u00b0</div>'
                + '<div style="font-size:8px;color:white;font-weight:800;font-family:monospace;letter-spacing:1px;">' + d.codigoCert + '</div>'
                + '</div>';
        }

        // QR debajo de la fecha
        let qrCenterBlock = '';
        if (d.qrDataUrl) {
            qrCenterBlock = '<div style="display:flex;flex-direction:column;align-items:center;margin-top:6px;">'
                + '<img src="' + d.qrDataUrl + '" style="width:100px;height:100px;border:1px solid #e2e8f0;border-radius:4px;">'
                + '<div style="font-size:5.5px;color:#94a3b8;margin-top:2px;font-weight:700;letter-spacing:0.5px;">VERIFICAR CERTIFICADO</div>'
                + '</div>';
        }

        return `
        <div id="_cert_render_" style="
            width:1000px;height:707px;background:#ffffff;position:relative;
            overflow:hidden;font-family:Arial,Helvetica,sans-serif;
        ">
            <!-- Marca de agua: Flor de Lis -->
            <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);pointer-events:none;opacity:0.06;">
                <img src="${FLOR_DE_LIS}" style="width:380px;height:auto;">
            </div>

            <!-- Marco doble -->
            <div style="position:absolute;top:18px;left:18px;right:18px;bottom:18px;border:3px solid ${col.p};border-radius:4px;"></div>
            <div style="position:absolute;top:26px;left:26px;right:26px;bottom:26px;border:1px solid ${col.p};opacity:0.3;border-radius:2px;"></div>

            <!-- Esquinas decorativas -->
            <div style="position:absolute;top:10px;left:10px;width:40px;height:40px;border-top:3px solid #001558;border-left:3px solid #001558;border-radius:4px 0 0 0;"></div>
            <div style="position:absolute;top:10px;right:10px;width:40px;height:40px;border-top:3px solid #001558;border-right:3px solid #001558;border-radius:0 4px 0 0;"></div>
            <div style="position:absolute;bottom:38px;left:10px;width:40px;height:40px;border-bottom:3px solid #001558;border-left:3px solid #001558;border-radius:0 0 0 4px;"></div>
            <div style="position:absolute;bottom:38px;right:10px;width:40px;height:40px;border-bottom:3px solid #001558;border-right:3px solid #001558;border-radius:0 0 4px 0;"></div>

            <!-- Banda superior con GRADIENTE (como imagen) -->
            <div style="position:absolute;top:0;left:0;right:0;height:62px;
                background-image:url(${gradTop});background-size:cover;
                display:flex;align-items:center;justify-content:center;gap:18px;padding:0 40px;">
                <img src="${logoGrupo}" style="width:50px;height:50px;flex-shrink:0;border-radius:50%;">
                <span style="color:white;font-size:13px;font-weight:800;letter-spacing:2.5px;text-transform:uppercase;text-align:center;">
                    Grupo Guías y Scouts Salvador Sanfuentes
                </span>
                <img src="${logoUnidad}" style="width:50px;height:50px;flex-shrink:0;border-radius:50%;">
            </div>

            <!-- Cuerpo -->
            <div style="position:absolute;top:72px;left:60px;right:60px;bottom:40px;
                display:flex;flex-direction:column;align-items:center;
                justify-content:center;gap:10px;text-align:center;padding:14px 0 8px;">

                <div>
                    <div style="font-size:9px;color:#64748b;letter-spacing:2.5px;text-transform:uppercase;font-weight:700;">
                        Asociación de Guías y Scouts de Chile
                    </div>
                    <div style="font-size:11px;color:${col.p};letter-spacing:2px;text-transform:uppercase;font-weight:800;margin-top:2px;">
                        ${nombreUnidad}
                    </div>
                </div>

                <!-- Separador con gradiente (como imagen) -->
                <div style="width:80%;height:2px;background-image:url(${sepLine});background-size:cover;"></div>

                <div>
                    <div style="font-size:42px;color:#001558;font-weight:900;letter-spacing:3px;line-height:1;">CERTIFICADO</div>
                    <div style="font-size:18px;color:${col.p};letter-spacing:4px;font-weight:800;text-transform:uppercase;margin-top:10px;">
                        ${titulo}
                    </div>
                </div>

                <div style="font-size:10px;color:${col.p};opacity:0.3;letter-spacing:6px;">&#9900; &#9900; &#9900;</div>

                <div>
                    <div style="font-size:12px;color:#94a3b8;font-style:italic;margin-bottom:3px;">Otorgado con orgullo a</div>
                    <div style="font-size:36px;color:#0f172a;font-weight:900;line-height:1.05;">${d.nombre || ''}</div>
                </div>

                <div>
                    <div style="font-size:17px;color:#1e3a5f;font-weight:700;line-height:1.5;max-width:760px;">${d.detalle || ''}</div>
                    ${d.subdetalle ? '<div style="font-size:12px;color:#64748b;font-style:italic;margin-top:3px;">' + d.subdetalle + '</div>' : ''}
                </div>

                <!-- Separador con gradiente -->
                <div style="width:80%;height:2px;background-image:url(${sepLine});background-size:cover;"></div>

                <!-- Firmas + QR -->
                <div style="width:100%;display:flex;justify-content:space-between;align-items:flex-end;padding:0 16px;">
                    <div style="text-align:center;width:210px;">
                        <div style="border-top:1.5px solid #cbd5e1;padding-top:6px;font-size:11px;color:#475569;font-weight:700;text-transform:uppercase;">
                            Responsable de Grupo
                        </div>
                    </div>
                    <div style="text-align:center;display:flex;flex-direction:column;align-items:center;">
                        <div style="font-size:10px;color:#94a3b8;letter-spacing:1.5px;text-transform:uppercase;">Santiago de Chile</div>
                        <div style="font-size:13px;color:#001558;font-weight:800;">${fecha}</div>
                        ${qrCenterBlock}
                    </div>
                    <div style="text-align:center;width:210px;">
                        <div style="border-top:1.5px solid #cbd5e1;padding-top:6px;font-size:11px;color:#475569;font-weight:700;text-transform:uppercase;">
                            ${tituloDirigente}
                        </div>
                    </div>
                </div>
            </div>

            <!-- Banda inferior con GRADIENTE (como imagen) -->
            <div style="position:absolute;bottom:0;left:0;right:0;height:34px;
                background-image:url(${gradBottom});background-size:cover;
                display:flex;align-items:center;justify-content:center;padding:0 30px;">
                ${certCodeBand}
                <span style="color:rgba(255,255,255,0.88);font-size:10px;font-weight:700;letter-spacing:2.5px;">
                    &#9884;  ${lema}  &#9884;
                </span>
            </div>
        </div>`;
    }

    // ── Generar: devuelve pngBase64 y pdfBase64 ──
    async function generar(datos) {
        await cargarLibs();

        // Inyectar Nunito Sans si no está
        if (!document.querySelector('link[href*="Nunito+Sans"]')) {
            const l = document.createElement('link');
            l.rel = 'stylesheet';
            l.href = 'https://fonts.googleapis.com/css2?family=Nunito+Sans:wght@300;400;600;700;800;900&display=swap';
            document.head.appendChild(l);
            await new Promise(r => setTimeout(r, 600));
        }

        const cont = document.createElement('div');
        cont.style.cssText = 'position:fixed;left:-9999px;top:0;z-index:-1;';
        // Pre-renderizar logos con fondo blanco circular (evita negro en html2canvas)
        const _logoUnidadSrc = (() => {
            const u = datos.unidad ? (datos.unidad.toLowerCase()) : '';
            for (const k of Object.keys(LOGOS)) { if (u.includes(k.toLowerCase())) return LOGOS[k]; }
            return LOGOS.grupo;
        })();
        const [_logoGrupoCircle, _logoUnidadCircle] = await Promise.all([
            preRenderLogoCircle(LOGOS.grupo, 50, 42),
            preRenderLogoCircle(_logoUnidadSrc, 50, 42)
        ]);
        cont.innerHTML = construirHTML(datos, _logoGrupoCircle, _logoUnidadCircle);
        document.body.appendChild(cont);
        const elemento = cont.querySelector('#_cert_render_');

        // Esperar que TODAS las imágenes del certificado carguen realmente
        const imagenes = elemento.querySelectorAll('img');
        if (imagenes.length > 0) {
            await Promise.all(Array.from(imagenes).map(img => {
                if (img.complete && img.naturalWidth > 0) return Promise.resolve();
                return new Promise(resolve => {
                    img.onload = resolve;
                    img.onerror = () => {
                        console.warn('[CERT] Imagen no cargó:', img.src?.substring(0, 60));
                        img.style.display = 'none'; // Ocultar imagen rota
                        resolve();
                    };
                    setTimeout(resolve, 5000); // Máximo 5 seg por imagen
                });
            }));
        }
        // Espera extra para fuentes y renderizado
        await new Promise(r => setTimeout(r, 300));

        let canvas;
        try {
            canvas = await html2canvas(elemento, {
                scale: 3.5, useCORS: true, backgroundColor: '#ffffff',
                logging: false, allowTaint: true,
                onclone: (doc) => {
                    // Eliminar imágenes que no cargaron (0x0) para evitar error createPattern
                    doc.querySelectorAll('img').forEach(img => {
                        if (!img.complete || img.naturalWidth === 0 || img.naturalHeight === 0) {
                            img.style.display = 'none';
                        }
                    });
                }
            });
        } catch(renderErr) {
            console.error('[CERT] Error html2canvas:', renderErr);
            // Reintentar sin imágenes problemáticas
            elemento.querySelectorAll('img').forEach(img => {
                if (!img.complete || img.naturalWidth === 0) img.style.display = 'none';
            });
            canvas = await html2canvas(elemento, {
                scale: 3.5, useCORS: true, backgroundColor: '#ffffff',
                logging: false, allowTaint: true
            });
        }
        console.log('[CERT] Canvas:', canvas.width, 'x', canvas.height);
        // Calidad de imprenta: JPEG 0.95 sobre canvas a ~300 DPI (scale 3.5)
        const pngBase64 = canvas.toDataURL('image/jpeg', 0.95);
        console.log('[CERT] Imagen:', Math.round(pngBase64.length/1024), 'KB');

        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({ orientation:'landscape', unit:'mm', format:'a4', compress: true });
        pdf.addImage(pngBase64, 'JPEG', 0, 0, 297, 210, undefined, 'FAST'); // A4 apaisado en mm
        const pdfBase64 = pdf.output('datauristring').split(',')[1];
        const pdfBlob = pdf.output('blob');

        document.body.removeChild(cont);
        console.log('Certificado generado OK | PNG:', pngBase64?.length, 'chars | PDF:', pdfBase64?.length, 'chars');
        if (!pdfBase64 || pdfBase64.length < 100) {
            throw new Error('El PDF generado está vacío o es inválido');
        }
        return { pngBase64, pdfBase64, pdfBlob };
    }

    // ── Generar y descargar como PDF ──
    async function generarYDescargar(datos) {
        const { pdfBlob } = await generar(datos);
        const nombre = (datos.nombreArchivo || `Cert_${datos.nombre}`).replace(/[^a-zA-Z0-9_]/g,'_');
        const url = URL.createObjectURL(pdfBlob);
        const a = document.createElement('a');
        a.href = url; a.download = nombre + '.pdf'; a.click();
        URL.revokeObjectURL(url);
    }

    // ── Generar y subir a Drive (PDF + PNG) ──
    // datos.nombre se usa como nombre de la subcarpeta individual en Drive
    async function generarYSubir(datos, supabaseClient, claveCarpeta) {
        let nombreBase = (datos.nombreArchivo || 'Cert_' + (datos.nombre||'')).replace(/[^a-zA-Z0-9_]/g,'_');
        const nombrePersona = datos.nombre || null;
        let codigoCert = null;
        let pdfFinal = null;

        // ── PASO 1: Código único ──
        try {
            codigoCert = await obtenerCodigoCertificado(supabaseClient, datos.titulo || 'CERT');
            datos.codigoCert = codigoCert;
            nombreBase = codigoCert.replace(/[^a-zA-Z0-9_-]/g,'_') + '_' + nombreBase;
            console.log('[CERT] Paso 1 OK - Código:', codigoCert);
        } catch(e) { console.warn('[CERT] Paso 1 falló (código):', e.message); }

        // ── PASO 2: Generar PDF con código (sin QR) ──
        try {
            const res1 = await generar(datos);
            pdfFinal = res1.pdfBase64;
            console.log('[CERT] Paso 2 OK - PDF:', Math.round((pdfFinal||'').length/1024), 'KB');
        } catch(e) {
            console.error('[CERT] Paso 2 FALLÓ (generar PDF):', e.message);
            return { pdf: { ok: false, error: e.message }, codigo: codigoCert, pdfBase64: null };
        }

        // ── PASO 3: Subir a Drive ──
        let resPdf = { ok: false };
        try {
            resPdf = await window.DriveHelper.subir({
                supabaseClient, nombre: nombreBase + '.pdf',
                base64: pdfFinal, mimeType: 'application/pdf',
                claveCarpeta, rama: datos.unidad, nombrePersona
            });
            console.log('[CERT] Paso 3 OK - Drive:', resPdf?.ok, resPdf?.link?.substring(0,60));
        } catch(e) { console.error('[CERT] Paso 3 FALLÓ (Drive):', e.message); }

        // ── PASO 4: Generar QR con link de Drive y re-generar PDF ──
        const incluirQR = datos._incluirQR !== false; // Por defecto SÍ incluir QR
        if (incluirQR && resPdf?.ok && resPdf?.link) {
            try {
                const qrDataUrl = await generarQR(resPdf.link);
                if (qrDataUrl && qrDataUrl.length > 200) {
                    datos.qrDataUrl = qrDataUrl;
                    const res2 = await generar(datos);
                    pdfFinal = res2.pdfBase64;
                    console.log('[CERT] Paso 4 OK - PDF con QR:', Math.round((pdfFinal||'').length/1024), 'KB');
                    // Actualizar archivo en Drive
                    try {
                        await window.DriveHelper.actualizar({ fileId: resPdf.id, base64: pdfFinal, mimeType: 'application/pdf' });
                        console.log('[CERT] Paso 4 OK - Drive actualizado con QR');
                    } catch(e) { console.warn('[CERT] Drive no actualizado con QR:', e.message); }
                }
            } catch(e) { console.warn('[CERT] Paso 4 falló (QR):', e.message, '— certificado sin QR'); }
        }

        // ── PASO 5: Registrar en BD ──
        try {
            await registrarCertificado(supabaseClient, {
                codigo: codigoCert || 'SIN-CODIGO',
                tipo: datos.titulo || 'CERTIFICADO',
                nombre_beneficiario: datos.nombre || '',
                unidad: datos.unidad || '',
                detalle: datos.detalle || '',
                drive_file_id: resPdf?.id || null,
                drive_link: resPdf?.link || null
            });
        } catch(e) { console.warn('[CERT] Paso 5 falló (registro):', e.message); }

        // SIEMPRE devolver pdfBase64 para que el correo lo use como adjunto
        return { pdf: resPdf, codigo: codigoCert, pdfBase64: pdfFinal };
    }

    // ── Generar, subir a Drive Y enviar por correo con el PDF adjunto ──
    async function generarYEnviar(datos, supabaseClient, claveCarpeta, destinatarios, asunto) {
        // Paso 1: Usar generarYSubir (incluye código, QR, Drive, registro)
        const resultado = await generarYSubir(datos, supabaseClient, claveCarpeta);
        const pdfBase64 = resultado?.pdfBase64;
        const resDrive = resultado?.pdf || { ok: false };

        // Paso 2: Enviar correo con adjunto
        let resCorreo = { ok: false, error: 'No ejecutado' };
        if (destinatarios && pdfBase64 && pdfBase64.length > 500) {
            try {
                const unidad = normUnidad(datos.unidad);
                const lema = LEMAS[unidad] || '¡Siempre Listos!';
                const nombreBase = (resultado?.codigo || '') + '_' + (datos.nombreArchivo || 'Certificado');
                const htmlCorreo = '<html><body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,sans-serif;">'
                    + '<div style="max-width:620px;margin:0 auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.1);">'
                    + '<div style="background:#001558;padding:30px;text-align:center;">'
                    + '<h1 style="color:white;margin:0;font-size:1.4rem;font-weight:800;">Grupo Guías y Scouts<br>Salvador Sanfuentes</h1>'
                    + '<p style="color:rgba(255,255,255,0.85);font-size:0.85rem;margin:10px 0 0;">Asociación de Guías y Scouts de Chile</p></div>'
                    + '<div style="padding:30px;">'
                    + '<h2 style="color:#001558;font-size:1.1rem;margin-top:0;">🏆 ' + (asunto || 'Certificado Scout') + '</h2>'
                    + '<p style="color:#374151;line-height:1.6;">' + (datos.detalle || '') + '</p>'
                    + '<div style="background:#f0f9ff;border:2px solid #001558;border-radius:12px;padding:20px;margin:20px 0;text-align:center;">'
                    + '<p style="margin:0;font-size:1rem;color:#001558;font-weight:700;">Adjunto el certificado oficial en formato PDF.</p></div>'
                    + '<p style="color:#001558;font-weight:700;margin:0;">⚜ ' + lema + '</p></div>'
                    + '<div style="background:#001558;color:white;text-align:center;padding:14px;">'
                    + '<p style="margin:0;font-size:0.72rem;opacity:0.7;">Correo automático — Sistema ERP Scout</p></div></div></body></html>';

                const SUPA_EMAIL = 'https://hyixmaxhoxvamoecuars.supabase.co/functions/v1/send-email';
                const SUPA_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5aXhtYXhob3h2YW1vZWN1YXJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3OTg1NDMsImV4cCI6MjA4ODM3NDU0M30.ZLeJIWdip2f00h4TqkZH7eqMX4wpwphaqkJpAa0N0X4';
                const emailResp = await fetch(SUPA_EMAIL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'apikey': SUPA_KEY },
                    body: JSON.stringify({
                        to_email: destinatarios,
                        subject: asunto || 'Certificado Scout — ' + (datos.nombre || ''),
                        html_content: htmlCorreo,
                        attachments: [{ filename: nombreBase.replace(/[^a-zA-Z0-9._-]/g,'_') + '.pdf', content: pdfBase64, type: 'application/pdf' }]
                    })
                });
                resCorreo = await emailResp.json();
                console.log('[CERT] Correo enviado:', JSON.stringify(resCorreo));
            } catch(emailErr) {
                resCorreo = { ok: false, error: emailErr.message };
                console.error('[CERT] Error correo:', emailErr);
            }
        }

        return { drive: resDrive, correo: resCorreo };
    }

    return { generar, generarYDescargar, generarYSubir, generarYEnviar, generarQRMuestra, normUnidad };
})();
