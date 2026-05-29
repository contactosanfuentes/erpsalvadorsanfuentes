exports.handler = async (event) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: corsHeaders, body: '' };

  try {
    const { to_email, cc_email, subject, html_content } = JSON.parse(event.body || '{}');
    const apiKey = process.env.RESEND_API_KEY || 're_CjQmPV9Q_HUSuUMnfWuZgkNHPjqqu46MS';

    if (!to_email || !subject || !html_content) {
      return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'Faltan campos: to_email, subject, html_content' }) };
    }

    // Normalizar to_email y cc_email — aceptar string con comas o array
    const toArray = Array.isArray(to_email)
      ? to_email
      : String(to_email).split(',').map(e => e.trim()).filter(Boolean);

    const ccArray = cc_email
      ? (Array.isArray(cc_email)
          ? cc_email
          : String(cc_email).split(',').map(e => e.trim()).filter(Boolean))
      : [];

    const payload = {
      from: 'Grupo Scout Salvador Sanfuentes <no-reply@salvadorsanfuentes.org>',
      to: toArray,
      subject,
      html: html_content
    };

    if (ccArray.length > 0) payload.cc = ccArray;

    const resp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await resp.json();
    if (!resp.ok) return { statusCode: resp.status, headers: corsHeaders, body: JSON.stringify({ error: data?.message || 'Error Resend', detail: data }) };
    return { statusCode: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }, body: JSON.stringify({ ok: true, id: data.id }) };
  } catch (e) {
    return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: e.message }) };
  }
};
