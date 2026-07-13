        // ==================== CONFIGURACIÓN, LOGOS Y LÓGICA ====================
        const LOGOS_RAMAS = {
            'Bandada': 'https://i.imgur.com/1aGKetX.png',
            'Manada': 'https://i.imgur.com/0bZQNJs.png',
            'Compañía': 'https://i.imgur.com/eoG0c2D.png',
            'Tropa': 'https://i.imgur.com/2M19fp0.png',
            'Avanzada': 'https://i.imgur.com/06YpoWy.png',
            'Clan': 'https://i.imgur.com/abtMi0i.png'
        };

        const INSIGNIAS_ETAPAS = {
            'Pichón': 'https://i.imgur.com/FV5CyzO.png', 'Aprendiz': 'https://i.imgur.com/w25teqR.png', 'Viajera': 'https://i.imgur.com/a9xgrWU.png', 'Guía de Vuelo': 'https://i.imgur.com/XGGnl9N.png',
            'Lobezno': 'https://i.imgur.com/lSrmFXz.png', 'Saltador': 'https://i.imgur.com/AXcwr5h.png', 'Diestro': 'https://i.imgur.com/VBD3nDy.png', 'Cazador': 'https://i.imgur.com/QrsX3NY.png',
            'Alba': 'https://i.imgur.com/CyEFpPL.png', 'Amanecer': 'https://i.imgur.com/JQqcy0X.png', 'Luz': 'https://i.imgur.com/9ZheqTf.png', 'Resplandor': 'https://i.imgur.com/vkJj0bK.png',
            'Cernícalo': 'https://i.imgur.com/yJyps57.png', 'Halcón': 'https://i.imgur.com/AAZdzEG.png', 'Águila': 'https://i.imgur.com/j2OYdiD.png', 'Cóndor': 'https://i.imgur.com/GQNxp25.png',
            'Cruz del Sur': 'https://i.imgur.com/IStoscc.png', 'Sendero': 'https://i.imgur.com/VHZrlFN.png', 'Cumbre': 'https://i.imgur.com/3MeclHS.png',
            'Fuego': 'https://i.imgur.com/IEr3Kms.png', 'Antorcha': 'https://i.imgur.com/qTTibWH.png'
        };

        const ETAPAS_POR_RAMA = {
            'Bandada': ['Pichón', 'Aprendiz', 'Viajera', 'Guía de Vuelo'],
            'Manada': ['Lobezno', 'Saltador', 'Diestro', 'Cazador'],
            'Compañía': ['Alba', 'Amanecer', 'Luz', 'Resplandor'],
            'Tropa': ['Cernícalo', 'Halcón', 'Águila', 'Cóndor'],
            'Avanzada': ['Cruz del Sur', 'Sendero', 'Cumbre'],
            'Clan': ['Fuego', 'Antorcha']
        };

        const SUPABASE_URL = 'https://hyixmaxhoxvamoecuars.supabase.co';
        const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5aXhtYXhob3h2YW1vZWN1YXJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3OTg1NDMsImV4cCI6MjA4ODM3NDU0M30.ZLeJIWdip2f00h4TqkZH7eqMX4wpwphaqkJpAa0N0X4';
        const CALENDAR_API_KEY = 'AIzaSyCDoio0ErDpLvAtlM28r2CYSgFdJYG2NIg';
        const CALENDAR_ID = 'c_55638f9d91b7cabb9f93d361daf455b034f197e8cdfed2c8fd79ea5a6e91af2d@group.calendar.google.com';

        const _accessToken = new URLSearchParams(window.location.search).get('token');
        const _opts = _accessToken ? { global: { headers: { Authorization: `Bearer ${_accessToken}` } } } : {};
        const supabaseClient = (window.supabase || supabase).createClient(SUPABASE_URL, SUPABASE_ANON_KEY, _opts);
        
        let chartFondos, chartEvolucion, chartCargos, chartCiclo;
        const currency = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 });

        // === OBJETO GLOBAL PARA ALMACENAR DATOS PARA EL REPORTE IMPRESO ===
        window.reportData = {
            kpi: { jovenes: 0, adultos: 0, cuentas: 0, saldoTotal: 0 },
            finanzas: { cuentasGenerales: [], cuentasUnidades: [], totalGeneral: 0, totalUnidades: 0, negativas: [] },
            adultos: { total: 0, firmados: 0, sinCompromiso: [] },
            jovenes: { censoUnidades: [], alertasProgresion: [], especialidadesTotal: 0 }
        };

        Chart.defaults.font.family = "'Poppins', sans-serif";

