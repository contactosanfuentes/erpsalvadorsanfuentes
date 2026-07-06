        window.SUPABASE_URL = 'https://hyixmaxhoxvamoecuars.supabase.co';
        window.SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5aXhtYXhob3h2YW1vZWN1YXJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3OTg1NDMsImV4cCI6MjA4ODM3NDU0M30.ZLeJIWdip2f00h4TqkZH7eqMX4wpwphaqkJpAa0N0X4';
        const _accessToken = new URLSearchParams(window.location.search).get('token');
        const _opts = _accessToken ? { global: { headers: { Authorization: `Bearer ${_accessToken}` } } } : {};
        window.supabaseClient = (window.supabase || supabase).createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY, _opts);
        window.padronAdultos = [];
        const LOGOS_UNIDADES = {
            'Bandada': 'https://hyixmaxhoxvamoecuars.supabase.co/storage/v1/object/public/payment-receipts/insignias/1aGKetX.png',
            'Manada': 'https://hyixmaxhoxvamoecuars.supabase.co/storage/v1/object/public/payment-receipts/insignias/0bZQNJs.png',
            'Tropa': 'https://hyixmaxhoxvamoecuars.supabase.co/storage/v1/object/public/payment-receipts/insignias/2M19fp0.png',
            'Compañía': 'https://hyixmaxhoxvamoecuars.supabase.co/storage/v1/object/public/payment-receipts/insignias/eoG0c2D.png',
            'Avanzada': 'https://hyixmaxhoxvamoecuars.supabase.co/storage/v1/object/public/payment-receipts/insignias/06YpoWy.png',
            'Clan': 'https://hyixmaxhoxvamoecuars.supabase.co/storage/v1/object/public/payment-receipts/insignias/abtMi0i.png'
        };
        function getLogoUnidad(unidadRol) {
            if (!unidadRol) return '';
            const u = unidadRol.toLowerCase();
            if (u.includes('bandada')) return LOGOS_UNIDADES['Bandada'];
            if (u.includes('manada')) return LOGOS_UNIDADES['Manada'];
            if (u.includes('tropa')) return LOGOS_UNIDADES['Tropa'];
            if (u.includes('compañía') || u.includes('compania')) return LOGOS_UNIDADES['Compañía'];
            if (u.includes('avanzada') || u.includes('pionero')) return LOGOS_UNIDADES['Avanzada'];
            if (u.includes('caminante') || u.includes('clan')) return LOGOS_UNIDADES['Clan'];
            return '';
        }
