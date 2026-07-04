// ============================================================
// HELPER DE GOOGLE DRIVE - drive-helper.js v2
// Sube documentos a la carpeta correcta según la rama,
// creando subcarpetas individuales por joven/adulto si no existen.
// ============================================================
window.DriveHelper = (function(){
    const ENDPOINT = '/.netlify/functions/subir-drive';

    const CARPETAS_RAMA = {
        'Bandada':   'rama_bandada',
        'Manada':    'rama_manada',
        'Compania':  'rama_compania',
        'Compañía':  'rama_compania',
        'Tropa':     'rama_tropa',
        'Avanzada':  'rama_avanzada',
        'Clan':      'rama_clan',
        'adultos':   'adultos',
        'admin':     'admin_documentos',
    };

    let _carpetasCache = null;
    // Cache de subcarpetas creadas en esta sesión (evita crear duplicados)
    const _subcarpetasCache = {};

    // Carga IDs de carpetas base desde Supabase
    async function cargarCarpetas(supabaseClient){
        if (_carpetasCache) return _carpetasCache;
        const { data } = await supabaseClient.from('drive_carpetas').select('clave, folder_id');
        _carpetasCache = {};
        (data || []).forEach(c => _carpetasCache[c.clave] = c.folder_id);
        return _carpetasCache;
    }

    // Crear subcarpeta en Drive si no existe (vía función serverless)
    async function crearSubcarpeta(nombreCarpeta, parentFolderId){
        const cacheKey = `${parentFolderId}/${nombreCarpeta}`;
        if (_subcarpetasCache[cacheKey]) return _subcarpetasCache[cacheKey];

        const res = await fetch(ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                accion: 'crear_carpeta',
                nombre: nombreCarpeta,
                folder_id: parentFolderId
            })
        });
        const resultado = await res.json();
        if (resultado.ok && resultado.id) {
            _subcarpetasCache[cacheKey] = resultado.id;
            return resultado.id;
        }
        // Si falla la creación, usar la carpeta padre como fallback
        console.warn('No se pudo crear subcarpeta, usando carpeta padre:', resultado.error);
        return parentFolderId;
    }

    // Sube un documento a Drive en la carpeta correcta
    // opciones: { supabaseClient, nombre, base64, mimeType, rama, claveCarpeta, nombrePersona }
    // nombrePersona: si se proporciona, crea/usa subcarpeta con ese nombre
    async function subir(opciones){
        const { supabaseClient, nombre, base64, mimeType, rama, claveCarpeta, nombrePersona } = opciones;

        const carpetas = await cargarCarpetas(supabaseClient);

        // Determinar carpeta base según rama o clave
        let claveBase = claveCarpeta;
        if (!claveBase && rama) {
            // Normalizar la unidad al nombre corto
            const ramaCorta = rama.includes('Bandada') ? 'Bandada'
                : rama.includes('Manada') ? 'Manada'
                : rama.includes('Compañ') || rama.includes('Compania') ? 'Compañía'
                : rama.includes('Tropa') ? 'Tropa'
                : rama.includes('Avanzada') ? 'Avanzada'
                : rama.includes('Clan') ? 'Clan'
                : null;
            claveBase = ramaCorta ? CARPETAS_RAMA[ramaCorta] : null;
        }

        let folderId = claveBase ? carpetas[claveBase] : carpetas['raiz'];
        if (!folderId) folderId = carpetas['raiz'];
        if (!folderId) throw new Error('No se encontró la carpeta base en Drive. Verifica la configuración.');
        console.log('[DRIVE] Carpeta destino:', folderId);

        // Si se proporciona nombre de persona, crear/usar subcarpeta individual
        if (nombrePersona && nombrePersona.trim()) {
            const nombreLimpio = nombrePersona.trim()
                .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // quitar tildes
                .replace(/[^a-zA-Z0-9 ]/g, '').trim();
            if (nombreLimpio) {
                folderId = await crearSubcarpeta(nombreLimpio, folderId);
            }
        }

        // Limpiar prefijo data: si viene incluido
        const contenidoLimpio = base64.includes(',') ? base64.split(',')[1] : base64;

        const res = await fetch(ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                folder_id: folderId,
                nombre: nombre,
                contenido_base64: contenidoLimpio,
                mime_type: mimeType || 'application/pdf'
            })
        });

        const resultado = await res.json();
        console.log('[DRIVE] Respuesta:', JSON.stringify(resultado));
        if (!resultado.ok) throw new Error(resultado.error || 'Error al subir a Drive');
        return resultado;
    }

    // Actualizar un archivo existente en Drive (reemplazar contenido)
    async function actualizar(opciones) {
        const { fileId, base64, mimeType } = opciones;
        if (!fileId || !base64) throw new Error('Faltan fileId o base64');
        const contenidoLimpio = base64.includes(',') ? base64.split(',')[1] : base64;
        const res = await fetch(ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                accion: 'actualizar',
                file_id: fileId,
                contenido_base64: contenidoLimpio,
                mime_type: mimeType || 'application/pdf'
            })
        });
        return await res.json();
    }

    return { subir, actualizar, cargarCarpetas };
})();
