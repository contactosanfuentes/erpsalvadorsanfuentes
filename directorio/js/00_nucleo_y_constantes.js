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
            'Bandada': 'https://hyixmaxhoxvamoecuars.supabase.co/storage/v1/object/public/payment-receipts/insignias/1aGKetX.png',
            'Manada': 'https://hyixmaxhoxvamoecuars.supabase.co/storage/v1/object/public/payment-receipts/insignias/0bZQNJs.png',
            'Compañía': 'https://hyixmaxhoxvamoecuars.supabase.co/storage/v1/object/public/payment-receipts/insignias/eoG0c2D.png',
            'Tropa': 'https://hyixmaxhoxvamoecuars.supabase.co/storage/v1/object/public/payment-receipts/insignias/2M19fp0.png',
            'Avanzada': 'https://hyixmaxhoxvamoecuars.supabase.co/storage/v1/object/public/payment-receipts/insignias/06YpoWy.png',
            'Clan': 'https://hyixmaxhoxvamoecuars.supabase.co/storage/v1/object/public/payment-receipts/insignias/abtMi0i.png'
        };

        const IMAGENES_ETAPAS = {
            'Pichón': 'https://hyixmaxhoxvamoecuars.supabase.co/storage/v1/object/public/payment-receipts/insignias/FV5CyzO.png', 'Aprendiz': 'https://hyixmaxhoxvamoecuars.supabase.co/storage/v1/object/public/payment-receipts/insignias/w25teqR.png', 'Viajera': 'https://hyixmaxhoxvamoecuars.supabase.co/storage/v1/object/public/payment-receipts/insignias/a9xgrWU.png', 'Guía de Vuelo': 'https://hyixmaxhoxvamoecuars.supabase.co/storage/v1/object/public/payment-receipts/insignias/XGGnl9N.png',
            'Lobezno': 'https://hyixmaxhoxvamoecuars.supabase.co/storage/v1/object/public/payment-receipts/insignias/lSrmFXz.png', 'Saltador': 'https://hyixmaxhoxvamoecuars.supabase.co/storage/v1/object/public/payment-receipts/insignias/AXcwr5h.png', 'Diestro': 'https://hyixmaxhoxvamoecuars.supabase.co/storage/v1/object/public/payment-receipts/insignias/VBD3nDy.png', 'Cazador': 'https://hyixmaxhoxvamoecuars.supabase.co/storage/v1/object/public/payment-receipts/insignias/QrsX3NY.png',
            'Alba': 'https://hyixmaxhoxvamoecuars.supabase.co/storage/v1/object/public/payment-receipts/insignias/CyEFpPL.png', 'Amanecer': 'https://hyixmaxhoxvamoecuars.supabase.co/storage/v1/object/public/payment-receipts/insignias/JQqcy0X.png', 'Luz': 'https://hyixmaxhoxvamoecuars.supabase.co/storage/v1/object/public/payment-receipts/insignias/9ZheqTf.png', 'Resplandor': 'https://hyixmaxhoxvamoecuars.supabase.co/storage/v1/object/public/payment-receipts/insignias/vkJj0bK.png',
            'Cernícalo': 'https://hyixmaxhoxvamoecuars.supabase.co/storage/v1/object/public/payment-receipts/insignias/yJyps57.png', 'Halcón': 'https://hyixmaxhoxvamoecuars.supabase.co/storage/v1/object/public/payment-receipts/insignias/AAZdzEG.png', 'Águila': 'https://hyixmaxhoxvamoecuars.supabase.co/storage/v1/object/public/payment-receipts/insignias/j2OYdiD.png', 'Cóndor': 'https://hyixmaxhoxvamoecuars.supabase.co/storage/v1/object/public/payment-receipts/insignias/GQNxp25.png',
            'Cruz del Sur': 'https://hyixmaxhoxvamoecuars.supabase.co/storage/v1/object/public/payment-receipts/insignias/IStoscc.png', 'Sendero': 'https://hyixmaxhoxvamoecuars.supabase.co/storage/v1/object/public/payment-receipts/insignias/VHZrlFN.png', 'Cumbre': 'https://hyixmaxhoxvamoecuars.supabase.co/storage/v1/object/public/payment-receipts/insignias/3MeclHS.png',
            'Fuego': 'https://hyixmaxhoxvamoecuars.supabase.co/storage/v1/object/public/payment-receipts/insignias/IEr3Kms.png', 'Antorcha': 'https://hyixmaxhoxvamoecuars.supabase.co/storage/v1/object/public/payment-receipts/insignias/qTTibWH.png'
        };

        const etapasPorRama = {
            'Bandada': ['Pichón', 'Aprendiz', 'Viajera', 'Guía de Vuelo'],
            'Manada': ['Lobezno', 'Saltador', 'Diestro', 'Cazador'],
            'Tropa': ['Cernícalo', 'Halcón', 'Águila', 'Cóndor'],
            'Compañía': ['Alba', 'Amanecer', 'Luz', 'Resplandor'],
            'Avanzada': ['Sendero', 'Cumbre', 'Cruz del Sur'],
            'Clan': ['Fuego', 'Antorcha']
        };

