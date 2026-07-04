    async function init(){
        // Lee tabla "mmbb_registrations" (jóvenes del sistema)
        const{data:j}=await db.from('mmbb_registrations').select('nombres,apellidos,unidad,apoderado_titular_email').order('apellidos');
        // Lee tabla "adultos_registros" (dirigentes del sistema)
        const{data:a}=await db.from('adultos_registros').select('nombres,apellidos,email,unidad_rol').order('apellidos');
        // Lee tabla "eventos" (misma del sistema)
        const{data:e}=await db.from('eventos').select('id,nombre').order('creado_en',{ascending:false});
        jovenes=j||[];adultos=a||[];eventos=e||[];
        document.getElementById('stJ').textContent=jovenes.length;
        document.getElementById('stA').textContent=adultos.length;
        const sel=document.getElementById('selEv');
        eventos.forEach(ev=>{const o=document.createElement('option');o.value=ev.id;o.textContent=ev.nombre;sel.appendChild(o);});
        sel.onchange=calcDest;
        calcDest();cargarHistorial();
    }

    window.calcDest=async function(){
        contactos=[];
        const matchUnidad = (valor) => {
            if(unidad === 'todas') return true;
            return (valor || '').toLowerCase().includes(unidad.toLowerCase());
        };
        if(tipo==='todos'){
            jovenes.forEach(j=>{if(j.apoderado_titular_email)contactos.push({nombre:`${j.nombres} ${j.apellidos}`,email:j.apoderado_titular_email,unidad:j.unidad});});
            adultos.forEach(a=>{if(a.email)contactos.push({nombre:`${a.nombres} ${a.apellidos}`,email:a.email,unidad:a.unidad_rol});});
        }else if(tipo==='jovenes'){
            const p = jovenes.filter(j => matchUnidad(j.unidad));
            p.forEach(j=>{if(j.apoderado_titular_email)contactos.push({nombre:`${j.nombres} ${j.apellidos}`,email:j.apoderado_titular_email,unidad:j.unidad});});
        }else if(tipo==='adultos'){
            adultos.forEach(a=>{if(a.email)contactos.push({nombre:`${a.nombres} ${a.apellidos}`,email:a.email,unidad:a.unidad_rol});});
        }else if(tipo==='evento'){
            const eid=document.getElementById('selEv').value;
            if(eid){
                // Jóvenes inscritos al evento (tabla "jovenes" por evento_id)
                if(subEv === 'ambos' || subEv === 'jovenes'){
                    const{data:jEv}=await db.from('jovenes').select('nombre_patrulla,email').eq('evento_id',eid);
                    (jEv||[]).filter(r=>r.email).forEach(r=>contactos.push({nombre:r.nombre_patrulla||'Patrulla',email:r.email,unidad:'Evento'}));
                }
                // Adultos inscritos al evento (tabla "adultos" por evento_id)
                if(subEv === 'ambos' || subEv === 'adultos'){
                    const{data:aEv}=await db.from('adultos').select('nombre,email,rol').eq('evento_id',eid);
                    (aEv||[]).filter(r=>r.email).forEach(r=>contactos.push({nombre:r.nombre||'Adulto',email:r.email,unidad:r.rol||'Staff'}));
                }
            }
        }
        const v=contactos.filter(c=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email)).length;
        document.getElementById('cnt').textContent=v;
        document.getElementById('stE').textContent=v;
        document.getElementById('pCnt').textContent=v;
    };

    // Handler para chips de subtipo evento
    window.se = function(el, st){
        document.querySelectorAll('#chipsEvento .chip').forEach(c => c.classList.remove('act'));
        el.classList.add('act');
        subEv = st;
        calcDest();
    };

    window.sd=function(el,t){document.querySelectorAll('.ri').forEach(r=>r.classList.remove('sel'));el.classList.add('sel');el.querySelector('input').checked=true;tipo=t;document.getElementById('fuUnidad').style.display=t==='jovenes'?'block':'none';document.getElementById('gEv').style.display=t==='evento'?'block':'none';calcDest();};
    window.sc=function(el,u){document.querySelectorAll('.chips .chip').forEach(c=>c.classList.remove('act'));el.classList.add('act');unidad=u;calcDest();};
    window.f=function(cmd){document.execCommand(cmd,false,null);document.getElementById('editor').focus();};
    window.iv=function(v){document.getElementById('editor').focus();document.execCommand('insertText',false,v);upPreview();};
    window.upPreview=function(){const a=document.getElementById('asunto').value||'Sin asunto';document.getElementById('pAs').textContent=a;const b=document.getElementById('editor').innerHTML;const ej=b.replace(/\{nombre\}/g,'Ejemplo').replace(/\{unidad\}/g,'Tropa').replace(/\{fecha\}/g,new Date().toLocaleDateString('es-CL'));document.getElementById('pBd').innerHTML=ej||'<span style="color:var(--texto-claro)">El mensaje aparecerá aquí...</span>';};

    // ── COMPRESIÓN DE IMÁGENES EN EL NAVEGADOR ──
    // Redimensiona y re-comprime a JPEG para bajar drásticamente el peso
