
    const SURL='https://hyixmaxhoxvamoecuars.supabase.co';
    const SKEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5aXhtYXhob3h2YW1vZWN1YXJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3OTg1NDMsImV4cCI6MjA4ODM3NDU0M30.ZLeJIWdip2f00h4TqkZH7eqMX4wpwphaqkJpAa0N0X4';
    const _accessToken = new URLSearchParams(window.location.search).get('token');
    const _opts = _accessToken ? { global: { headers: { Authorization: `Bearer ${_accessToken}` } } } : {};
    const db=supabase.createClient(SURL,SKEY,_opts);

    // ── Constantes AGSCh correctas (sincronizadas con programa_jovenes.html) ──
    const COLORES={
        Bandada:'#f97316', Manada:'#eab308', Tropa:'#16a34a',
        'Compañía':'#0284c7', Compania:'#0284c7',
        Avanzada:'#6d28d9', Clan:'#dc2626'
    };
    const ETAPAS_POR_RAMA={
        Bandada:  ['Pichón','Aprendiz','Viajera','Guía de Vuelo'],
        Manada:   ['Lobezno','Saltador','Diestro','Cazador'],
        Tropa:    ['Cernícalo','Halcón','Águila','Cóndor'],
        'Compañía':['Alba','Amanecer','Luz','Resplandor'],
        Compania: ['Alba','Amanecer','Luz','Resplandor'],
        Avanzada: ['Sendero','Cumbre'],
        Clan:     ['Bienvenida','Fuego','Antorcha']
    };
    const ICONOS_ETAPA={
        'Pichón':'fa-egg','Aprendiz':'fa-seedling','Viajera':'fa-route','Guía de Vuelo':'fa-dove',
        'Lobezno':'fa-paw','Saltador':'fa-frog','Diestro':'fa-crown','Cazador':'fa-spider',
        'Cernícalo':'fa-feather','Halcón':'fa-feather-alt','Águila':'fa-dove','Cóndor':'fa-dragon',
        'Alba':'fa-sun','Amanecer':'fa-cloud-sun','Luz':'fa-lightbulb','Resplandor':'fa-star',
        'Sendero':'fa-hiking','Cumbre':'fa-mountain',
        'Bienvenida':'fa-hand-sparkles','Fuego':'fa-fire','Antorcha':'fa-fire-alt'
    };
    const AREAS=[
        {k:'corporalidad',n:'Corporalidad',ic:'fa-running',c:'#3498db'},
        {k:'creatividad',n:'Creatividad',ic:'fa-palette',c:'#f39c12'},
        {k:'caracter',n:'Carácter',ic:'fa-shield-alt',c:'#E31837'},
        {k:'afectividad',n:'Afectividad',ic:'fa-heart',c:'#e91e63'},
        {k:'sociabilidad',n:'Sociabilidad',ic:'fa-users',c:'#2ecc71'},
        {k:'espiritualidad',n:'Espiritualidad',ic:'fa-dove',c:'#8b5cf6'}
    ];

