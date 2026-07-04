        window.SUPABASE_URL = 'https://hyixmaxhoxvamoecuars.supabase.co';
        window.SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5aXhtYXhob3h2YW1vZWN1YXJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3OTg1NDMsImV4cCI6MjA4ODM3NDU0M30.ZLeJIWdip2f00h4TqkZH7eqMX4wpwphaqkJpAa0N0X4';
        const _accessToken = new URLSearchParams(window.location.search).get('token');
        const _opts = _accessToken ? { global: { headers: { Authorization: `Bearer ${_accessToken}` } } } : {};
        window.supabaseClient = (window.supabase || supabase).createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY, _opts);
        window.padronAdultos = [];
        const LOGOS_UNIDADES = {
            'Bandada': 'https://i.imgur.com/1aGKetX.png',
            'Manada': 'https://i.imgur.com/0bZQNJs.png',
            'Tropa': 'https://i.imgur.com/2M19fp0.png',
            'Compañía': 'https://i.imgur.com/eoG0c2D.png',
            'Avanzada': 'https://i.imgur.com/06YpoWy.png',
            'Clan': 'https://i.imgur.com/abtMi0i.png'
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
