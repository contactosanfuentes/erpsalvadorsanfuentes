const WA = (() => {
  const SUPABASE_URL = 'https://hyixmaxhoxvamoecuars.supabase.co/functions/v1/wa-proxy';
  const SUPABASE_KEY = 'sb_publishable_JW9Y4kz_Wiy6e1E1KdzAyQ_PBbWUf6t';

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

  async function enviar(telefono, nombre, cuerpo) {
    const tel = normalizar(telefono);
    if (!tel) return { ok: false, error: 'Teléfono inválido: ' + telefono };
    try {
      const resp = await fetch(SUPABASE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`
        },
        body: JSON.stringify({ to: tel, nombre, cuerpo })
      });
      const json = await resp.json();
      if (!resp.ok) return { ok: false, error: json?.error?.message || json?.error || 'HTTP ' + resp.status };
      return { ok: true, wamid: json?.messages?.[0]?.id };
    } catch (e) {
      return { ok: false, error: e.message };
    }
  }

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

  return { enviar, enviarMasivo, normalizar };
})();
