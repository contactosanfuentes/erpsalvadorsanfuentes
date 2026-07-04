// wa_api.js — v3: texto, media (imagen/doc/video/audio), contactos
const WA = (() => {
  const ENDPOINT = 'https://hyixmaxhoxvamoecuars.supabase.co/functions/v1/wa-proxy';
  const SKEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5aXhtYXhob3h2YW1vZWN1YXJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3OTg1NDMsImV4cCI6MjA4ODM3NDU0M30.ZLeJIWdip2f00h4TqkZH7eqMX4wpwphaqkJpAa0N0X4';

  function _token() {
    try { return new URLSearchParams(window.location.search).get('token') || null; } catch { return null; }
  }

  function normalizar(tel) {
    if (!tel) return null;
    const d = String(tel).replace(/\D/g, '');
    if (d.startsWith('569') && d.length === 11) return '+' + d;
    if (d.startsWith('56')  && d.length === 11) return '+' + d;
    if (d.startsWith('9')   && d.length === 9)  return '+56' + d;
    if (d.length === 8)                          return '+562' + d;
    if (d.length >= 10)                          return '+' + d;
    return null;
  }

  async function _post(payload) {
    const tok = _token();
    const r = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': SKEY, 'Authorization': `Bearer ${tok || SKEY}` },
      body: JSON.stringify(payload)
    });
    const json = await r.json();
    if (!r.ok) return { ok: false, error: json?.error?.message || json?.error || 'HTTP ' + r.status };
    return { ok: true, wamid: json?.wamid || json?.messages?.[0]?.id, media_id: json?.media_id };
  }

  // Enviar texto por plantilla (modo legacy - envío masivo)
  async function enviar(telefono, nombre, cuerpo) {
    const tel = normalizar(telefono);
    if (!tel) return { ok: false, error: 'Teléfono inválido: ' + telefono };
    return _post({ to: tel, nombre, cuerpo, tipo: 'texto' }); // texto libre (ventana 24h)
  }

  // Enviar texto libre (requiere ventana 24h activa)
  async function enviarTexto(telefono, texto) {
    const tel = normalizar(telefono);
    if (!tel) return { ok: false, error: 'Teléfono inválido: ' + telefono };
    return _post({ to: tel, cuerpo: texto, tipo: 'texto' });
  }

  // Enviar media (imagen, documento, video, audio)
  // mediaData: { tipo:'imagen'|'documento'|'video'|'audio', b64: string, mimeType: string, filename: string, caption?: string }
  async function enviarMedia(telefono, nombre, mediaData) {
    const tel = normalizar(telefono);
    if (!tel) return { ok: false, error: 'Teléfono inválido: ' + telefono };
    return _post({
      to: tel, nombre,
      tipo: mediaData.tipo,
      media_b64: mediaData.b64,
      mime_type: mediaData.mimeType,
      filename: mediaData.filename || 'archivo',
      caption: mediaData.caption || ''
    });
  }

  // Enviar tarjeta(s) de contacto
  // contactos: [{nombre, telefono, email, cargo}]
  async function enviarContactos(telefono, nombre, contactos) {
    const tel = normalizar(telefono);
    if (!tel) return { ok: false, error: 'Teléfono inválido: ' + telefono };
    return _post({ to: tel, nombre, tipo: 'contacto', contactos });
  }

  // Envío masivo (plantilla)
  async function enviarMasivo(lista, onProgreso) {
    const resultados = [];
    for (let i = 0; i < lista.length; i++) {
      const { telefono, nombre, cuerpo } = lista[i];
      const res = await enviar(telefono, nombre, cuerpo);
      resultados.push({ ...lista[i], ...res });
      if (onProgreso) onProgreso(i + 1, lista.length, res);
      await new Promise(r => setTimeout(r, 220));
    }
    return resultados;
  }

  // Leer archivo como base64
  function fileToBase64(file) {
    return new Promise((res, rej) => {
      const reader = new FileReader();
      reader.onload = e => res(e.target.result.split(',')[1]);
      reader.onerror = rej;
      reader.readAsDataURL(file);
    });
  }

  // Determinar tipo WA desde MIME
  function tipoDesdeFile(file) {
    const mime = file.type || '';
    if (mime.startsWith('image/')) return 'imagen';
    if (mime.startsWith('video/')) return 'video';
    if (mime.startsWith('audio/')) return 'audio';
    // Fallback por extensión si el MIME está vacío (común en Android)
    const ext = (file.name || '').split('.').pop().toLowerCase();
    const imgExts = ['jpg','jpeg','png','gif','webp','heic','heif'];
    const vidExts = ['mp4','mov','avi','mkv','webm','3gp'];
    const audExts = ['mp3','m4a','ogg','aac','opus','wav'];
    if (imgExts.includes(ext)) return 'imagen';
    if (vidExts.includes(ext)) return 'video';
    if (audExts.includes(ext)) return 'audio';
    return 'documento';
  }

  return { enviar, enviarTexto, enviarMedia, enviarContactos, enviarMasivo, normalizar, fileToBase64, tipoDesdeFile };
})();
