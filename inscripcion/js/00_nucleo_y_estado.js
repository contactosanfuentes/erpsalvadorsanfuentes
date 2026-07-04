
    // ── Mismas credenciales del sistema ──
    const SUPABASE_URL = 'https://hyixmaxhoxvamoecuars.supabase.co';
    const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5aXhtYXhob3h2YW1vZWN1YXJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3OTg1NDMsImV4cCI6MjA4ODM3NDU0M30.ZLeJIWdip2f00h4TqkZH7eqMX4wpwphaqkJpAa0N0X4';

    const db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

    let eventoSel = null;
    let tipoSel = null;
    let unidades = [];
    let fotoJovenURL = null;  // URL pública de la foto del joven/patrulla subida a bucket "fotos"
    let fotoAdultoURL = null; // URL pública de la foto del adulto
    let fichaJovenURL = null; // URL pública de la ficha médica del joven
    let fichaAdultoURL = null;// URL pública de la ficha médica del adulto

    // ── BUCKET DE STORAGE ── ya existe en el sistema (lo usa eventos_iframe.html)
    const BUCKET_FOTOS = 'fotos';

    // ── Comprimir imagen antes de subir (reduce a ~400KB máx, max 1200px) ──
