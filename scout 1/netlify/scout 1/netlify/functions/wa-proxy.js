exports.handler = async (event) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey, x-client-info',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: corsHeaders, body: '' };

  try {
    const { to, nombre, cuerpo } = JSON.parse(event.body || '{}');
    const TOKEN = process.env.WA_TOKEN || 'EAAVZASorLPI8BRbY8i4rWZBpvGBhCmdNU0ikYVFMhQc1CDRnxACGoE1MmZCVr6HxJtLQiAx3EkzwgqBdL4vlmZBI6u1ZAtuLpT5EWMKIS6EZB0rHlCGoPDyZC4ZBBHUCTT8OnN1J9cs3wb6TGdis5faP88jobY2gGx2pewzvcyTG5mjL9EbohNNmapxNVevxUCteJAZDZD';

    // Meta no permite \n, \t ni más de 4 espacios en parámetros
    const limpiar = (s) => String(s || '').replace(/[\n\r\t]/g, ' ').replace(/ {5,}/g, '    ').trim();

    const resp = await fetch('https://graph.facebook.com/v20.0/1152721121253729/messages', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'template',
        template: {
          name: 'mensaje_grupo',
          language: { code: 'es' },
          components: [
            {
              type: 'header',
              parameters: [{ type: 'image', image: { link: 'https://i.imgur.com/11u9rUD.png' } }]
            },
            {
              type: 'body',
              parameters: [
                { type: 'text', text: limpiar(nombre).slice(0, 60) },
                { type: 'text', text: limpiar(cuerpo).slice(0, 900) }
              ]
            }
          ]
        }
      })
    });

    const data = await resp.json();
    return {
      statusCode: resp.status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    };
  } catch (e) {
    return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: e.message }) };
  }
};
