// auth-guard.js — verifica sesión E inicializa Permisos
(function(){
    const SUPA_URL = 'https://hyixmaxhoxvamoecuars.supabase.co';
    const SUPA_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5aXhtYXhob3h2YW1vZWN1YXJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3OTg1NDMsImV4cCI6MjA4ODM3NDU0M30.ZLeJIWdip2f00h4TqkZH7eqMX4wpwphaqkJpAa0N0X4';

    const publicas = ['login.html','inscripcion_publica.html','portal_apoderados.html','portal_caminante.html','portal_pionero.html','ver_perfil.html','privacidad.html'];
    const pagina = window.location.pathname.split('/').pop() || 'index.html';
    if (publicas.includes(pagina)) return;

    const enIframe = window.self !== window.top;

    function irALogin(){
        if (enIframe) window.top.location.href = 'login.html';
        else window.location.href = 'login.html';
    }

    async function cargarScript(src){
        return new Promise((res,rej)=>{
            if(document.querySelector('script[src="'+src+'"]')){res();return;}
            const s=document.createElement('script');
            s.src=src; s.onload=res; s.onerror=rej;
            document.head.appendChild(s);
        });
    }

    async function init(){
        try{
            // 1. Asegurar Supabase cargado
            if(typeof supabase==='undefined')
                await cargarScript('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2');

            const sb = supabase.createClient(SUPA_URL, SUPA_KEY);
            const {data:{session}} = await sb.auth.getSession();
            if(!session){ irALogin(); return; }

            // 2. Exponer cliente globalmente para que los módulos no tengan que re-crearlo
            window._sbClient = sb;

            // 3. Inicializar Permisos si está cargado; si no, esperar a que cargue
            async function tryInitPermisos(){
                if(window.Permisos && !Permisos.listo()){
                    await Permisos.init(sb);
                }
            }

            // Intentar ahora
            await tryInitPermisos();

            // Si permisos.js todavía no está en el DOM, observar cuándo carga
            if(!window.Permisos){
                const obs = new MutationObserver(async ()=>{
                    if(window.Permisos && !Permisos.listo()){
                        obs.disconnect();
                        await Permisos.init(sb);
                    }
                });
                obs.observe(document, {childList:true, subtree:true});
                // También intentar al DOMContentLoaded
                document.addEventListener('DOMContentLoaded', tryInitPermisos, {once:true});
                window.addEventListener('load', tryInitPermisos, {once:true});
            }

        }catch(e){
            console.error('[auth-guard]',e);
            irALogin();
        }
    }

    init();
})();
