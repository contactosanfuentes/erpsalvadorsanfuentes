const CLIENT_ID     = process.env.GDRIVE_CLIENT_ID;
const CLIENT_SECRET = process.env.GDRIVE_CLIENT_SECRET;
const REFRESH_TOKEN = process.env.GDRIVE_REFRESH_TOKEN;

const cors = {
    'Access-Control-Allow-Origin':  '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
};

const DRIVE_BASE = 'https://www.googleapis.com/drive/v3';
const SD = 'supportsAllDrives=true&includeItemsFromAllDrives=true';

async function getAccessToken() {
    const res = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            client_id: CLIENT_ID, client_secret: CLIENT_SECRET,
            refresh_token: REFRESH_TOKEN, grant_type: 'refresh_token'
        })
    });
    const data = await res.json();
    if (!data.access_token) throw new Error('No access_token: ' + JSON.stringify(data));
    return data.access_token;
}

async function buscarCarpeta(nombre, parentId, token) {
    const q = encodeURIComponent(`name="${nombre}" and mimeType="application/vnd.google-apps.folder" and "${parentId}" in parents and trashed=false`);
    const res = await fetch(`${DRIVE_BASE}/files?q=${q}&fields=files(id,name)&${SD}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    return (data.files && data.files.length > 0) ? data.files[0].id : null;
}

async function crearCarpeta(nombre, parentId, token) {
    const existente = await buscarCarpeta(nombre, parentId, token);
    if (existente) return existente;
    const res = await fetch(`${DRIVE_BASE}/files?${SD}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: nombre, mimeType: 'application/vnd.google-apps.folder', parents: [parentId] })
    });
    const data = await res.json();
    if (!data.id) throw new Error('Error creando carpeta: ' + JSON.stringify(data));
    return data.id;
}

exports.handler = async (event) => {
    if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: cors, body: 'ok' };
    if (event.httpMethod !== 'POST') return { statusCode: 405, headers: cors, body: JSON.stringify({ error: 'Método no permitido' }) };
    if (!CLIENT_ID || !CLIENT_SECRET || !REFRESH_TOKEN)
        return { statusCode: 500, headers: cors, body: JSON.stringify({ ok: false, error: 'Faltan variables GDRIVE_*' }) };

    let body;
    try { body = JSON.parse(event.body || '{}'); }
    catch(e) { return { statusCode: 400, headers: cors, body: JSON.stringify({ ok: false, error: 'JSON inválido' }) }; }

    try {
        const token = await getAccessToken();

        if (body.accion === 'listar_drives') {
            const res = await fetch(`${DRIVE_BASE}/drives?pageSize=20`, { headers: { Authorization: `Bearer ${token}` } });
            const data = await res.json();
            return { statusCode: 200, headers: cors, body: JSON.stringify({ ok: true, drives: data.drives || [] }) };
        }

        if (body.accion === 'buscar_carpeta') {
            const q = encodeURIComponent(`name="${body.nombre||''}" and mimeType="application/vnd.google-apps.folder" and trashed=false`);
            const res = await fetch(`${DRIVE_BASE}/files?q=${q}&fields=files(id,name,driveId,parents)&${SD}`, { headers: { Authorization: `Bearer ${token}` } });
            const data = await res.json();
            return { statusCode: 200, headers: cors, body: JSON.stringify({ ok: true, carpetas: data.files || [] }) };
        }

        if (body.accion === 'crear_carpeta') {
            const { nombre, folder_id } = body;
            if (!nombre || !folder_id)
                return { statusCode: 400, headers: cors, body: JSON.stringify({ ok: false, error: 'Faltan: nombre, folder_id' }) };
            const id = await crearCarpeta(nombre, folder_id, token);
            return { statusCode: 200, headers: cors, body: JSON.stringify({ ok: true, id }) };
        }

        if (body.accion === 'actualizar') {
            const { file_id, contenido_base64, mime_type } = body;
            if (!file_id || !contenido_base64)
                return { statusCode: 400, headers: cors, body: JSON.stringify({ ok: false, error: 'Faltan: file_id, contenido_base64' }) };
            const mimeType = mime_type || 'application/pdf';
            const boundary = '-------erp_scout_upd_' + Date.now();
            const multipartBody =
                `\r\n--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n{}` +
                `\r\n--${boundary}\r\nContent-Type: ${mimeType}\r\nContent-Transfer-Encoding: base64\r\n\r\n` +
                contenido_base64 + `\r\n--${boundary}--`;
            const updRes = await fetch(
                `https://www.googleapis.com/upload/drive/v3/files/${file_id}?uploadType=multipart&fields=id,name,webViewLink&${SD}`,
                { method: 'PATCH', headers: { Authorization: `Bearer ${token}`, 'Content-Type': `multipart/related; boundary=${boundary}` }, body: multipartBody }
            );
            const updData = await updRes.json();
            if (!updRes.ok) return { statusCode: 400, headers: cors, body: JSON.stringify({ ok: false, error: updData.error?.message || 'Error al actualizar' }) };
            return { statusCode: 200, headers: cors, body: JSON.stringify({ ok: true, id: updData.id, link: `https://drive.google.com/file/d/${updData.id}/view?usp=sharing` }) };
        }

        // Subir archivo
        const { folder_id, nombre, contenido_base64, mime_type } = body;
        if (!folder_id || !nombre || !contenido_base64)
            return { statusCode: 400, headers: cors, body: JSON.stringify({ ok: false, error: 'Faltan: folder_id, nombre, contenido_base64' }) };

        const mimeType   = mime_type || 'application/octet-stream';
        const metadata   = JSON.stringify({ name: nombre, parents: [folder_id] });
        const boundary   = '-------erp_scout_' + Date.now();
        const multipartBody =
            `\r\n--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n` +
            metadata +
            `\r\n--${boundary}\r\nContent-Type: ${mimeType}\r\nContent-Transfer-Encoding: base64\r\n\r\n` +
            contenido_base64 + `\r\n--${boundary}--`;

        const uploadRes = await fetch(
            `https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink&${SD}`,
            { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': `multipart/related; boundary=${boundary}` }, body: multipartBody }
        );
        const result = await uploadRes.json();
        if (!uploadRes.ok)
            return { statusCode: 400, headers: cors, body: JSON.stringify({ ok: false, error: result.error?.message || 'Error al subir', detalle: result }) };

        // Hacer público
        await fetch(`${DRIVE_BASE}/files/${result.id}/permissions?${SD}`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ role: 'reader', type: 'anyone' })
        });

        return { statusCode: 200, headers: cors, body: JSON.stringify({ ok: true, id: result.id, nombre: result.name, link: `https://drive.google.com/file/d/${result.id}/view?usp=sharing` }) };

    } catch(err) {
        return { statusCode: 500, headers: cors, body: JSON.stringify({ ok: false, error: err.message }) };
    }
};
