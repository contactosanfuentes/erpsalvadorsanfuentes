    // ========== CONFIGURACIÓN DE SUPABASE Y RESEND ==========
    const SUPABASE_URL = 'https://hyixmaxhoxvamoecuars.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5aXhtYXhob3h2YW1vZWN1YXJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3OTg1NDMsImV4cCI6MjA4ODM3NDU0M30.ZLeJIWdip2f00h4TqkZH7eqMX4wpwphaqkJpAa0N0X4';
    const _accessToken = new URLSearchParams(window.location.search).get('token');
    const _opts = _accessToken ? { global: { headers: { Authorization: `Bearer ${_accessToken}` } } } : {};
    const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, _opts);
    

    (function(){ 
    })();

    // ========== Modales Personalizados ==========
