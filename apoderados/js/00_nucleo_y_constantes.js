
    const SUPABASE_URL = 'https://hyixmaxhoxvamoecuars.supabase.co';
    const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5aXhtYXhob3h2YW1vZWN1YXJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3OTg1NDMsImV4cCI6MjA4ODM3NDU0M30.ZLeJIWdip2f00h4TqkZH7eqMX4wpwphaqkJpAa0N0X4';
    const db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

    const COLORES = { Manada:'#FFD100', Tropa:'#2ecc71', 'Compañía':'#2ecc71', Avanzada:'#3498db', Clan:'#E31837', Caminantes:'#E31837', Bandada:'#f39c12' };
    const AREAS = [
        {k:'corporalidad',n:'Corporalidad',ic:'fa-running',c:'#3498db'},
        {k:'creatividad',n:'Creatividad',ic:'fa-palette',c:'#f39c12'},
        {k:'caracter',n:'Carácter',ic:'fa-shield-alt',c:'#E31837'},
        {k:'afectividad',n:'Afectividad',ic:'fa-heart',c:'#e91e63'},
        {k:'sociabilidad',n:'Sociabilidad',ic:'fa-users',c:'#2ecc71'},
        {k:'espiritualidad',n:'Espiritualidad',ic:'fa-dove',c:'#8b5cf6'}
    ];

