// ── WhatsApp Webhook — recibe mensajes entrantes de Meta ──
// Variables de entorno necesarias:
//   WA_VERIFY_TOKEN   → string que defines tú (ej: scout-ssf-2026)
//   SUPABASE_URL      → https://hyixmaxhoxvamoecuars.supabase.co
//   SUPABASE_SERVICE_KEY → service_role key de Supabase (no la anon)

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://hyixmaxhoxvamoecuars.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;
const VERIFY_TOKEN = process.env.WA_VERIFY_TOKEN || 'scout-ssf-2026';

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json'
  };

  // ── Verificación inicial del webhook por Meta (GET) ──
  if (event.httpMethod === 'GET') {
    const params = new URLSearchParams(event.rawQuery || event.queryStringParameters ? new URLSearchParams(event.queryStringParameters).toString() : '');
    const mode = event.queryStringParameters?.['hub.mode'];
    const token = event.queryStringParameters?.['hub.verify_token'];
    const challenge = event.queryStringParameters?.['hub.challenge'];

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('✅ Webhook verificado por Meta');
      return { statusCode: 200, headers, body: challenge };
    }
    console.warn('❌ Token incorrecto:', token);
    return { statusCode: 403, headers, body: 'Forbidden' };
  }

  // ── Mensajes entrantes de Meta (POST) ──
  if (event.httpMethod === 'POST') {
    let body;
    try { body = JSON.parse(event.body || '{}'); } 
    catch(e) { return { statusCode: 400, headers, body: 'Invalid JSON' }; }

    const changes = body.entry?.[0]?.changes?.[0]?.value;
    if (!changes) return { statusCode: 200, headers, body: 'OK' };

    const messages = changes.messages || [];
    const statuses = changes.statuses || [];
    const contacts = changes.contacts || [];

    // Procesar mensajes entrantes
    for (const msg of messages) {
      const from_number = msg.from;
      const wamid = msg.id;
      const timestamp = parseInt(msg.timestamp);
      const tipo = msg.type || 'texto';

      // Nombre del contacto si viene en el payload
      const contactInfo = contacts.find(c => c.wa_id === from_number);
      const from_name = contactInfo?.profile?.name || null;

      let text = null;
      let media_url = null;

      if (tipo === 'text') text = msg.text?.body;
      else if (tipo === 'image') media_url = msg.image?.id;
      else if (tipo === 'audio') media_url = msg.audio?.id;
      else if (tipo === 'video') media_url = msg.video?.id;
      else if (tipo === 'document') media_url = msg.document?.id;
      else if (tipo === 'sticker') text = '🎨 [Sticker]';
      else if (tipo === 'location') text = `📍 Ubicación: ${msg.location?.latitude}, ${msg.location?.longitude}`;
      else if (tipo === 'interactive') text = msg.interactive?.button_reply?.title || msg.interactive?.list_reply?.title || '[Respuesta interactiva]';
      else text = `[${tipo}]`;

      // Buscar si el número corresponde a un joven o adulto
      let joven_id = null, adulto_id = null;
      try {
        const normalizedNum = from_number.replace(/^\+/, '').replace(/^56/, '');
        const [jovRes, aduRes] = await Promise.all([
          fetch(`${SUPABASE_URL}/rest/v1/mmbb_registrations?or=(apoderado_titular_telefono.ilike.*${normalizedNum}*)&limit=1&select=id`, {
            headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
          }).then(r => r.json()),
          fetch(`${SUPABASE_URL}/rest/v1/adultos_registros?telefono=ilike.*${normalizedNum}*&limit=1&select=id`, {
            headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
          }).then(r => r.json())
        ]);
        if (jovRes?.[0]) joven_id = jovRes[0].id;
        if (aduRes?.[0]) adulto_id = aduRes[0].id;
      } catch(e) { console.warn('Error buscando contacto:', e.message); }

      // Guardar en Supabase
      try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/wa_mensajes`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${SUPABASE_KEY}`,
            Prefer: 'return=minimal'
          },
          body: JSON.stringify({ from_number, from_name, joven_id, adulto_id, text, tipo, media_url, direction: 'entrante', leido: false, timestamp, wamid })
        });
        if (!res.ok) console.error('Error guardando mensaje:', await res.text());
        else console.log(`✅ Mensaje guardado de ${from_number}: ${text?.slice(0, 50)}`);
      } catch(e) { console.error('Error Supabase:', e.message); }
    }

    return { statusCode: 200, headers, body: 'OK' };
  }

  return { statusCode: 405, headers, body: 'Method Not Allowed' };
};
