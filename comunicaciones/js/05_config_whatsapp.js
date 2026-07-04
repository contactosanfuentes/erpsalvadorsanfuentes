    const WA_PHONE_NUMBER_ID = '1152721121253729';
    // ⚠ IMPORTANTE: Este token es temporal (24h). Cuando tengas el token permanente
    // de tu System User de Meta, reemplaza este valor.
    // Obtenerlo: Meta Business Suite → Configuración → System Users → Generar token
    // Permisos necesarios: whatsapp_business_messaging + whatsapp_business_management
    const WA_TOKEN = ''; // El envío real usa WA.enviar() vía Supabase Edge Function

    // Configuración de plantilla (guardada en localStorage)
    let waConfig = {
        tplName: localStorage.getItem('wa_tpl_name') || '',
        tplLang: localStorage.getItem('wa_tpl_lang') || 'es',
        tplVars: localStorage.getItem('wa_tpl_vars') || '{nombre}'
    };

    // Sincronizar campos del panel
    function syncWAFields(){
        if(document.getElementById('waTplName')) document.getElementById('waTplName').value = waConfig.tplName;
        if(document.getElementById('waTplLang')) document.getElementById('waTplLang').value = waConfig.tplLang;
        if(document.getElementById('waTplVars')) document.getElementById('waTplVars').value = waConfig.tplVars;
    }

    window.guardarConfigWA = function(){
        waConfig.tplName = document.getElementById('waTplName').value.trim();
        waConfig.tplLang = document.getElementById('waTplLang').value;
        waConfig.tplVars = document.getElementById('waTplVars').value.trim();
        localStorage.setItem('wa_tpl_name', waConfig.tplName);
        localStorage.setItem('wa_tpl_lang', waConfig.tplLang);
        localStorage.setItem('wa_tpl_vars', waConfig.tplVars);
        document.getElementById('waConfigPanel').style.display = 'none';
        alerta('✅ Configuración de WhatsApp guardada.', 'ok');
        calcDest();
    };

    // Normalizar teléfono a formato E.164 (+56XXXXXXXXX)
