        // ================= UTILIDADES GLOBALES =================
        function escapeHtml(str) {
            if (!str) return '';
            return String(str).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
        }

        // ================= CONFIGURACIÓN =================
        const SUPABASE_URL = 'https://hyixmaxhoxvamoecuars.supabase.co';
        const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5aXhtYXhob3h2YW1vZWN1YXJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3OTg1NDMsImV4cCI6MjA4ODM3NDU0M30.ZLeJIWdip2f00h4TqkZH7eqMX4wpwphaqkJpAa0N0X4';
        const _accessToken = new URLSearchParams(window.location.search).get('token');
        const _opts = _accessToken ? { global: { headers: { Authorization: `Bearer ${_accessToken}` } } } : {};
        const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, _opts);

        const LOGOS_UNIDADES = {
            'Bandada': 'https://i.imgur.com/1aGKetX.png',
            'Manada': 'https://i.imgur.com/0bZQNJs.png',
            'Compañía': 'https://i.imgur.com/eoG0c2D.png',
            'Tropa': 'https://i.imgur.com/2M19fp0.png',
            'Avanzada': 'https://hyixmaxhoxvamoecuars.supabase.co/storage/v1/object/public/logos/avanzada_toki_pillan.png',
            'Clan': 'https://i.imgur.com/abtMi0i.png'
        };

        const IMAGENES_ETAPAS = {
            'Pichón': 'https://i.imgur.com/FV5CyzO.png', 'Aprendiz': 'https://i.imgur.com/w25teqR.png', 'Viajera': 'https://i.imgur.com/a9xgrWU.png', 'Guía de Vuelo': 'https://i.imgur.com/XGGnl9N.png',
            'Lobezno': 'https://i.imgur.com/lSrmFXz.png', 'Saltador': 'https://i.imgur.com/AXcwr5h.png', 'Diestro': 'https://i.imgur.com/VBD3nDy.png', 'Cazador': 'https://i.imgur.com/QrsX3NY.png',
            'Alba': 'https://i.imgur.com/CyEFpPL.png', 'Amanecer': 'https://i.imgur.com/JQqcy0X.png', 'Luz': 'https://i.imgur.com/9ZheqTf.png', 'Resplandor': 'https://i.imgur.com/vkJj0bK.png',
            'Cernícalo': 'https://i.imgur.com/yJyps57.png', 'Halcón': 'https://i.imgur.com/AAZdzEG.png', 'Águila': 'https://i.imgur.com/j2OYdiD.png', 'Cóndor': 'https://i.imgur.com/GQNxp25.png',
            'Cruz del Sur': 'https://i.imgur.com/IStoscc.png', 'Sendero': 'https://i.imgur.com/VHZrlFN.png', 'Cumbre': 'https://i.imgur.com/3MeclHS.png',
            'Fuego': 'https://i.imgur.com/IEr3Kms.png', 'Antorcha': 'https://i.imgur.com/qTTibWH.png'
        };

        const etapasPorRama = {
            'Bandada': ['Pichón', 'Aprendiz', 'Viajera', 'Guía de Vuelo'],
            'Manada': ['Lobezno', 'Saltador', 'Diestro', 'Cazador'],
            'Tropa': ['Cernícalo', 'Halcón', 'Águila', 'Cóndor'],
            'Compañía': ['Alba', 'Amanecer', 'Luz', 'Resplandor'],
            'Avanzada': ['Sendero', 'Cumbre', 'Cruz del Sur'],
            'Clan': ['Fuego', 'Antorcha']
        };

