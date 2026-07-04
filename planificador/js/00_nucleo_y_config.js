
    const SURL='https://hyixmaxhoxvamoecuars.supabase.co';
    const SKEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5aXhtYXhob3h2YW1vZWN1YXJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3OTg1NDMsImV4cCI6MjA4ODM3NDU0M30.ZLeJIWdip2f00h4TqkZH7eqMX4wpwphaqkJpAa0N0X4';
    const _accessToken = new URLSearchParams(window.location.search).get('token');
    const _opts = _accessToken ? { global: { headers: { Authorization: `Bearer ${_accessToken}` } } } : {};
    const db=supabase.createClient(SURL,SKEY,_opts);
    let reunionActiva=null;

    document.getElementById('nFecha').value=new Date().toISOString().split('T')[0];

    // Colores por unidad (alineados con paleta institucional)
    const COLOR_UNIDAD={
        Manada:'#FFD100',
        Tropa:'#00853F',
        'Compañía':'#00853F',
        Avanzada:'#0055A5',
        Clan:'#E31837',
        Dirigentes:'#E31837',
        Grupo:'#0E2586'
    };

