    window.enviar=async function(){
        const asunto=document.getElementById('asunto').value.trim();
        const body=document.getElementById('editor').innerHTML.trim();
        const firma=document.getElementById('firma').value.trim();
        const saludo=document.getElementById('saludo').value;
        if(!asunto)return alerta('Escribe un asunto.','err');
        if(!body||body==='<br>')return alerta('Escribe el mensaje.','err');
        const validos=contactos.filter(c=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email));
        if(!validos.length)return alerta('No hay destinatarios con email válido.','err');

        // ── Validar que el cuerpo no tenga imágenes base64 (causan error 413 en EmailJS) ──
        // Si las hay, las sube automáticamente al bucket y reemplaza los src
        const editor = document.getElementById('editor');
        const imgsBase64 = editor.querySelectorAll('img[src^="data:image"]');
        if(imgsBase64.length){
            alerta(`Optimizando ${imgsBase64.length} imagen(es) base64 para evitar error de tamaño...`, 'ok');
            for(const img of imgsBase64){
                try {
                    const resp = await fetch(img.src);
                    const blob = await resp.blob();
                    const file = new File([blob], `img_${Date.now()}.jpg`, { type: blob.type || 'image/jpeg' });
                    // Comprimir si aún es grande
                    let subirBlob = blob;
                    if(blob.size > 80 * 1024){
                        const c = await comprimirImagen(file, { maxWidth: 1000, maxHeight: 1000, quality: 0.65 });
                        subirBlob = c.blob;
                    }
                    const subirFile = new File([subirBlob], `img_${Date.now()}.jpg`, { type: 'image/jpeg' });
                    const urlPublica = await subirArchivoABucket(subirFile);
                    img.src = urlPublica;
                } catch(e){
                    console.warn('No se pudo convertir imagen base64:', e);
                }
            }
        }

        // Re-leer el body ya con imágenes convertidas a URLs
        const bodyFinal = editor.innerHTML.trim();

        // Validación final de tamaño
        const tamEstimado = new Blob([bodyFinal]).size;
        if(tamEstimado > 40 * 1024){
            if(!confirm(`El cuerpo del correo pesa ${(tamEstimado/1024).toFixed(0)} KB. EmailJS permite hasta ~50 KB; puede fallar el envío.\n\n¿Intentar enviar de todos modos?`)) return;
        }

        if(!confirm(`¿Enviar a ${validos.length} destinatarios?`))return;
        const btn=document.getElementById('btnEnv');btn.disabled=true;
        document.getElementById('prog').classList.add('show');
        const log=document.getElementById('plog'),bar=document.getElementById('pb');
        log.innerHTML='';let ok=0,err=0;const total=validos.length;
        for(const c of validos){
            const bp=bodyFinal.replace(/\{nombre\}/g,c.nombre.split(' ')[0]).replace(/\{unidad\}/g,c.unidad||'').replace(/\{fecha\}/g,new Date().toLocaleDateString('es-CL'));
            const sp=saludo.replace('{nombre}',c.nombre.split(' ')[0]);

            // Bloque de adjuntos como enlaces de descarga
            let bloqueAdjuntos = '';
            if(archivosAdjuntos.length){
                bloqueAdjuntos = `<div style="margin-top:24px;padding:14px;background:#f8fafc;border-left:4px solid #0E2586;border-radius:6px">
                    <p style="margin:0 0 10px;font-size:0.82rem;font-weight:700;color:#0E2586;text-transform:uppercase;letter-spacing:0.5px"><i style="margin-right:5px">📎</i>Archivos adjuntos</p>
                    ${archivosAdjuntos.map(f => `<a href="${f.url}" style="display:flex;align-items:center;gap:10px;padding:9px 12px;background:white;border:1px solid #e2e8f0;border-radius:6px;margin-bottom:5px;text-decoration:none;color:#2d3748;font-size:0.84rem"><span style="background:#0E2586;color:white;width:28px;height:28px;border-radius:5px;display:inline-flex;align-items:center;justify-content:center;font-weight:700;font-size:0.7rem">↓</span><span style="flex:1">${f.nombre}</span><span style="color:#718096;font-size:0.74rem">Descargar</span></a>`).join('')}
                </div>`;
            }

            const html=`<!DOCTYPE html><html><body style="margin:0;padding:26px;background:#f4f7f9;font-family:Poppins,sans-serif"><div style="max-width:500px;margin:auto;background:white;border-radius:13px;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,0.08)"><div style="background:linear-gradient(135deg,#0E2586,#1a36a8);padding:20px;text-align:center"><img src="https://i.imgur.com/11u9rUD.png" style="height:42px;margin-bottom:7px"><p style="color:rgba(255,255,255,0.8);font-size:0.8rem;margin:0">Grupo Guías y Scouts Salvador Sanfuentes</p></div><div style="padding:24px;font-size:0.88rem;line-height:1.8;color:#2d3748"><p><strong>${sp}</strong></p><br>${bp}${bloqueAdjuntos}<p style="margin-top:20px;color:#718096;font-size:0.82rem">Saludos,<br><strong style="color:#0E2586">${firma}</strong></p></div><div style="background:#f8fafc;padding:10px 20px;font-size:0.74rem;color:#718096;text-align:center;border-top:1px solid #e2e8f0">Enviado con ERP Scout · Grupo Salvador Sanfuentes</div></div></body></html>`;
            try{await fetch('https://hyixmaxhoxvamoecuars.supabase.co/functions/v1/send-email',{method:'POST',headers:{'Content-Type':'application/json','apikey':'sb_publishable_JW9Y4kz_Wiy6e1E1KdzAyQ_PBbWUf6t'},body:JSON.stringify({to_email:c.email,subject:asunto,html_content:html})});ok++;log.innerHTML+=`<span style="color:var(--verde)">✓ ${c.nombre} (${c.email})</span><br>`;}
            catch(e){err++;log.innerHTML+=`<span style="color:var(--rojo)">✗ ${c.nombre} — ${e.text||'Error'}</span><br>`;}
            bar.style.width=Math.round((ok+err)/total*100)+'%';log.scrollTop=log.scrollHeight;
            await new Promise(r=>setTimeout(r,350));
        }
        btn.disabled=false;alerta(`Completado: ${ok} enviados${err?`, ${err} con error`:'`'}.`,'ok');
        await db.from('comunicaciones').insert({ asunto, canal: 'email', total_enviados: ok, total_errores: err, destinatarios_count: total }).catch(()=>{});
        cargarHistorial();
    };

    async function cargarHistorial(){
        const el=document.getElementById('histList');
        let data = [];
        try {
            const resp = await db.from('comunicaciones').select('*').order('enviado_en',{ascending:false}).limit(5);
            if(!resp.error) data = resp.data || [];
        } catch(e) {
            // Tabla no existe — no mostrar historial
        }
        if(!data?.length){el.innerHTML='<p style="font-size:0.8rem;color:var(--texto-claro);text-align:center;padding:7px">Sin envíos anteriores.</p>';return;}
        el.innerHTML=data.map(c=>{const f=new Date(c.enviado_en).toLocaleDateString('es-CL',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'});return`<div class="hi"><h4>${c.asunto}</h4><div class="meta"><span>${f}</span><span style="color:var(--verde)"><i class="fas fa-check"></i> ${c.total_enviados||0}</span>${c.total_errores?`<span style="color:var(--rojo)"><i class="fas fa-times"></i> ${c.total_errores}</span>`:''}</div></div>`;}).join('');
    }

    function alerta(msg,tipo){const el=document.getElementById('alertR');el.innerHTML=`<div class="alert ${tipo}"><i class="fas fa-${tipo==='err'?'circle-exclamation':'check-circle'}"></i>${msg}</div>`;setTimeout(()=>el.innerHTML='',6000);}
    // ════════════════════════════════════════════════
    // ── WHATSAPP BUSINESS API ──
    // Phone Number ID: 1152721121253729
    // WABA ID: 3507365259439446
    // Número: +56 9 3533 0101
    // ════════════════════════════════════════════════
