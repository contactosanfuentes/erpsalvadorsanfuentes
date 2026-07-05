
    const SUPABASE_URL = 'https://hyixmaxhoxvamoecuars.supabase.co';
    const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5aXhtYXhob3h2YW1vZWN1YXJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3OTg1NDMsImV4cCI6MjA4ODM3NDU0M30.ZLeJIWdip2f00h4TqkZH7eqMX4wpwphaqkJpAa0N0X4';
    const db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

    const COLORES = { Manada:'#FFD100', Tropa:'#2ecc71', 'Compañía':'#2ecc71', Avanzada:'#3498db', Clan:'#E31837', Caminantes:'#E31837', Bandada:'#f39c12' };
    // Etapas de progresión por rama (metodología AGSCh) con insignias oficiales
    const ETAPAS_RAMA = {
        'Bandada':  ['Pichón','Aprendiz','Viajera','Guía de Vuelo'],
        'Manada':   ['Lobezno','Saltador','Diestro','Cazador'],
        'Tropa':    ['Cernícalo','Halcón','Águila','Cóndor'],
        'Compañía': ['Alba','Amanecer','Luz','Resplandor'],
        'Avanzada': ['Cruz del Sur','Sendero','Cumbre'],
        'Clan':     ['Bienvenida','Fuego','Antorcha']
    };
    const INSIGNIAS_ETAPA = {
        'Pichón':'https://i.imgur.com/FV5CyzO.png','Aprendiz':'https://i.imgur.com/w25teqR.png','Viajera':'https://i.imgur.com/a9xgrWU.png','Guía de Vuelo':'https://i.imgur.com/XGGnl9N.png',
        'Lobezno':'https://i.imgur.com/lSrmFXz.png','Saltador':'https://i.imgur.com/AXcwr5h.png','Diestro':'https://i.imgur.com/VBD3nDy.png','Cazador':'https://i.imgur.com/QrsX3NY.png',
        'Cernícalo':'https://i.imgur.com/yJyps57.png','Halcón':'https://i.imgur.com/AAZdzEG.png','Águila':'https://i.imgur.com/j2OYdiD.png','Cóndor':'https://i.imgur.com/GQNxp25.png',
        'Alba':'https://i.imgur.com/CyEFpPL.png','Amanecer':'https://i.imgur.com/JQqcy0X.png','Luz':'https://i.imgur.com/9ZheqTf.png','Resplandor':'https://i.imgur.com/vkJj0bK.png',
        'Cruz del Sur':'https://drive.google.com/thumbnail?id=15qw2SRnIb_vUM0-MKnnhaHXK-OafyOek&sz=w300','Sendero':'https://i.imgur.com/VHZrlFN.png','Cumbre':'https://i.imgur.com/3MeclHS.png',
        'Bienvenida':'https://i.imgur.com/dYr6dIU.png','Fuego':'https://i.imgur.com/IEr3Kms.png','Antorcha':'https://i.imgur.com/qTTibWH.png'
    };
    const ramaDe = (unidad) => Object.keys(ETAPAS_RAMA).find(r => (unidad||'').includes(r)) || null;

    const AREAS = [
        {k:'corporalidad',n:'Corporalidad',ic:'fa-running',c:'#3498db'},
        {k:'creatividad',n:'Creatividad',ic:'fa-palette',c:'#f39c12'},
        {k:'caracter',n:'Carácter',ic:'fa-shield-alt',c:'#E31837'},
        {k:'afectividad',n:'Afectividad',ic:'fa-heart',c:'#e91e63'},
        {k:'sociabilidad',n:'Sociabilidad',ic:'fa-users',c:'#2ecc71'},
        {k:'espiritualidad',n:'Espiritualidad',ic:'fa-dove',c:'#8b5cf6'}
    ];

