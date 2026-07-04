function driveIdDesdeUrl(url){const m=(url||'').match(/\/d\/([a-zA-Z0-9_-]+)/);return m?m[1]:null}
function driveThumbnailUrl(url){const id=driveIdDesdeUrl(url);return id?`https://drive.google.com/thumbnail?id=${id}&sz=w300`:url}
async function fileToBase64(file){return new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result.split(',')[1]);r.onerror=rej;r.readAsDataURL(file)})}

// Comprime imagen a máx 1400px y calidad 0.8 — reduce fotos de 5MB a ~300KB
async function comprimirImagen(file, maxPx=1400, quality=0.8) {
    if (!file.type.startsWith('image/')) return file;
    return new Promise((resolve) => {
        const timeout = setTimeout(() => resolve(file), 8000); // fallback si canvas no responde
        try {
            const img = new Image();
            const url = URL.createObjectURL(file);
            img.onload = () => {
                try {
                    let w = img.width, h = img.height;
                    if (w > maxPx || h > maxPx) {
                        if (w > h) { h = Math.round(h * maxPx / w); w = maxPx; }
                        else { w = Math.round(w * maxPx / h); h = maxPx; }
                    }
                    const canvas = document.createElement('canvas');
                    canvas.width = w; canvas.height = h;
                    canvas.getContext('2d').drawImage(img, 0, 0, w, h);
                    canvas.toBlob(blob => {
                        clearTimeout(timeout);
                        URL.revokeObjectURL(url);
                        if (!blob) { resolve(file); return; }
                        try { resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' })); }
                        catch(e) { resolve(file); }
                    }, 'image/jpeg', quality);
                } catch(e) { clearTimeout(timeout); URL.revokeObjectURL(url); resolve(file); }
            };
            img.onerror = () => { clearTimeout(timeout); URL.revokeObjectURL(url); resolve(file); };
            img.src = url;
        } catch(e) { clearTimeout(timeout); resolve(file); }
    });
}
async function mpSubirEvidencia(){
    const allFiles=document.getElementById('mp-evidencia-file').files;
    if(allFiles.length>10){mostrarError('Selecciona máximo 10 archivos por vez. Tienes '+allFiles.length+'.');return;}
    const files=allFiles;
    if(!files.length)return;
    const errBox=document.getElementById('mp-evidencia-error');
    if(errBox)errBox.innerHTML='';
    const mostrarError=msg=>{if(errBox){errBox.innerHTML='<div style="background:#fee2e2;border:1px solid #fca5a5;color:#991b1b;padding:8px 12px;border-radius:8px;font-size:13px;margin-top:6px;">⚠️ '+msg+'</div>';}toast(msg,'err');};
    toast('Subiendo a Drive...','info');
    const FOLDER_ID='1YRTHTvFHQ6U6CPWMfwVvfEUdNKBfmR9q';
    let subFolder=FOLDER_ID;
    try{
        // Nivel 1: carpeta "Evidencias - Proyectos" dentro del Clan
        const sr=await fetch('/.netlify/functions/subir-drive',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({accion:'crear_carpeta',nombre:'Evidencias - Proyectos',folder_id:FOLDER_ID})});
        const sd=JSON.parse(await sr.text());
        if(sd.ok){
            subFolder=sd.id;
            // Nivel 2: subcarpeta por nombre del proyecto
            const nombreProy=(document.getElementById('mp-nombre')?.value||'Sin nombre').trim().slice(0,60);
            const sr2=await fetch('/.netlify/functions/subir-drive',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({accion:'crear_carpeta',nombre:nombreProy,folder_id:subFolder})});
            const sd2=JSON.parse(await sr2.text());
            if(sd2.ok)subFolder=sd2.id;
        }
    }catch(e){mostrarError('Conexión con Drive falló: '+e.message);}
    const errores=[];let subidos=0;
    const MAX_B64_BYTES=4*1024*1024; // 3MB de archivo real → ~4MB base64, seguro bajo límite 6MB
    for(const f of files){
        try{
            const fProc=await comprimirImagen(f);
            const b64=await fileToBase64(fProc);
            if(b64.length>MAX_B64_BYTES){
                // Recomprimir más agresivamente si sigue muy grande
                const fProc2=await comprimirImagen(f,800,0.6);
                const b642=await fileToBase64(fProc2);
                if(b642.length>MAX_B64_BYTES){errores.push(f.name+' (demasiado grande)');continue;}
                var b64final=b642;var fFinal=fProc2;
            } else { var b64final=b64;var fFinal=fProc; }
            const ext=fFinal.name.split('.').pop().toLowerCase();
            const mimeMap={jpg:'image/jpeg',jpeg:'image/jpeg',png:'image/png',gif:'image/gif',webp:'image/webp',pdf:'application/pdf',mp4:'video/mp4',mov:'video/quicktime',mp3:'audio/mpeg',m4a:'audio/mp4',wav:'audio/wav'};
            const mime=mimeMap[ext]||'application/octet-stream';
            const nombre=(currentJoven.nombres||'joven').replace(/\s+/g,'_')+'_'+Date.now()+'.'+ext;
            const res=await fetch('/.netlify/functions/subir-drive',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({folder_id:subFolder,nombre,contenido_base64:b64final,mime_type:mime})});
            const text=await res.text();
            let data;
            try{data=JSON.parse(text);}catch(pe){errores.push(f.name+' (error servidor)');continue;}
            if(!data.ok){errores.push(f.name+': '+(data.error||'Drive rechazó'));continue;}
            mpEvidencias.push({url:data.link,nombre:f.name,driveId:data.id});
            subidos++;
        }catch(e){errores.push(f.name+': '+e.message);}
    }
    renderMpEvidencias();
    document.getElementById('mp-evidencia-file').value='';
    document.getElementById('mp-file-label').textContent='Elegir imágenes o archivos';
    // Mostrar resumen
    let resumen='';
    if(subidos>0) resumen+='✓ '+subidos+' archivo(s) subido(s) a Drive.\n';
    if(errores.length>0) resumen+='⚠ '+errores.length+' fallaron:\n- '+errores.join('\n- ');
    if(errores.length>0 && errBox) errBox.innerHTML='<div style="background:#fee2e2;border:1px solid #fca5a5;color:#991b1b;padding:8px 12px;border-radius:8px;font-size:12px;margin-top:6px;white-space:pre-wrap">'+resumen+'</div>';
    if(subidos===0)return;
    const editId=document.getElementById('mp-edit-id')?.value;
    if(editId){
        const idx=camino.proyectos_colectivos.findIndex(p=>p.id===Number(editId));
        if(idx!==-1){
            camino.proyectos_colectivos[idx].evidencias=[...mpEvidencias];
            if(await guardarCamino()){if(errBox)errBox.innerHTML='';toast('✓ Guardado en Drive y en el proyecto','ok');}
            else mostrarError('Drive OK, pero falló el guardado en BD. Haz clic en Guardar.');
        }
    }
}

function renderMpEvidencias(){
    const isImg=url=>/\.(jpe?g|png|gif|webp|bmp)(\?|$)/i.test(url);
    document.getElementById('mp-evidencias-list').innerHTML='<div class="flex flex-wrap gap-2 mt-1">'+mpEvidencias.map((e,i)=>{
        const url=e.url||e;const nombre=e.nombre||'Archivo';
        const isDrive=url.includes('drive.google.com');
        if(isDrive||isImg(url)){
            return `<div class="relative group border border-indigo-200 rounded-xl overflow-hidden" style="width:90px;">
                <a href="${esc(url)}" target="_blank">
                    <img src="${isDrive?driveThumbnailUrl(url):url}" style="width:90px;height:70px;object-fit:cover;display:block;" onerror="this.parentElement.parentElement.querySelector('.fb').style.display='flex';this.style.display='none'">
                    <div class="fb" style="display:none;width:90px;height:70px;align-items:center;justify-content:center;background:#eff6ff;"><i class="fas fa-file-image text-2xl text-indigo-400"></i></div>
                </a>
                <div class="p-1 bg-white text-center"><span class="text-xs text-gray-500 truncate block" title="${esc(nombre)}">${nombre.length>10?nombre.slice(0,8)+'…':nombre}</span></div>
                <button onclick="mpEvidencias.splice(${i},1);renderMpEvidencias()" class="absolute top-1 right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100"><i class="fas fa-times"></i></button>
            </div>`;
        }
        return `<a href="${esc(url)}" target="_blank" class="bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg text-xs font-bold border border-indigo-200 flex items-center gap-1"><i class="fas fa-file mr-1"></i>${esc(nombre)}</a>`;
    }).join('')+'</div>';
}

// ══════════ GUARDAR PROYECTO ══════════
