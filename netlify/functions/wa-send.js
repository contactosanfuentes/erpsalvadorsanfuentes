// netlify/functions/wa-send.js
// Proxy para WhatsApp Business Cloud API — evita error CORS desde el navegador
// El token se lee desde variable de entorno WA_TOKEN configurada en Netlify

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const { to, nombre, cuerpo } = JSON.parse(event.body || '{}');

    if (!to) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Falta parámetro: to' }) };
    }

    // Token desde variable de entorno — nunca en el código fuente
    const token = process.env.WA_TOKEN;
    if (!token) {
      return { statusCode: 500, body: JSON.stringify({ error: 'WA_TOKEN no configurado en Netlify Environment Variables' }) };
    }

    const PHONE_NUMBER_ID = '1152721121253729';
    const TEMPLATE_NAME   = 'mensaje_grupo';
    const TEMPLATE_LANG   = 'en_US';

    const payload = {
      messaging_product: 'whatsapp',
      to,
      type: 'template',
      template: {
        name: TEMPLATE_NAME,
        language: { code: TEMPLATE_LANG },
        components: cuerpo ? [{
          type: 'body',
          parameters: [
            { type: 'text', text: String(nombre || 'Scout').slice(0, 60) },
            { type: 'text', text: String(cuerpo).slice(0, 900) }
          ]
        }] : []
      }
    };

    const resp = await fetch(
      `https://graph.facebook.com/v20.0/${PHONE_NUMBER_ID}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      }
    );

    const data = await resp.json();

    return {
      statusCode: resp.status,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    };

  } catch (err) {
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: err.message })
    };
  }
};
