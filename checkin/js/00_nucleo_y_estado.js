
    const SUPABASE_URL = 'https://hyixmaxhoxvamoecuars.supabase.co';
    const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5aXhtYXhob3h2YW1vZWN1YXJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3OTg1NDMsImV4cCI6MjA4ODM3NDU0M30.ZLeJIWdip2f00h4TqkZH7eqMX4wpwphaqkJpAa0N0X4';
    const _accessToken = new URLSearchParams(window.location.search).get('token');
    const _opts = _accessToken ? { global: { headers: { Authorization: `Bearer ${_accessToken}` } } } : {};
    const db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY, _opts);

    let ev = null;
    let jovenes = [], adultos = [];
    let scanner = null, activo = false;

    // ── Sonido de escaneo exitoso ──
    function beepExito() {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            // Primer tono: agudo corto
            const o1 = ctx.createOscillator();
            const g1 = ctx.createGain();
            o1.connect(g1); g1.connect(ctx.destination);
            o1.type = 'sine'; o1.frequency.value = 1200;
            g1.gain.setValueAtTime(0.35, ctx.currentTime);
            g1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);
            o1.start(ctx.currentTime); o1.stop(ctx.currentTime + 0.12);
            // Segundo tono: más agudo (confirmación)
            const o2 = ctx.createOscillator();
            const g2 = ctx.createGain();
            o2.connect(g2); g2.connect(ctx.destination);
            o2.type = 'sine'; o2.frequency.value = 1600;
            g2.gain.setValueAtTime(0.35, ctx.currentTime + 0.1);
            g2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
            o2.start(ctx.currentTime + 0.1); o2.stop(ctx.currentTime + 0.25);
            setTimeout(() => ctx.close(), 400);
        } catch(e) { /* dispositivo sin audio */ }
    }
    function beepError() {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const o = ctx.createOscillator();
            const g = ctx.createGain();
            o.connect(g); g.connect(ctx.destination);
            o.type = 'square'; o.frequency.value = 300;
            g.gain.setValueAtTime(0.25, ctx.currentTime);
            g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
            o.start(ctx.currentTime); o.stop(ctx.currentTime + 0.35);
            setTimeout(() => ctx.close(), 500);
        } catch(e) {}
    }
    let subTab = 'jovenes';

    // ── Cargar tabla "eventos" del sistema ──
