    window.filtrar=function(){
        const q=document.getElementById('buscar').value.toLowerCase();
        const u=document.getElementById('filtroUnidad').value.toLowerCase();
        const e=document.getElementById('filtroEtapa').value.toLowerCase();
        const lista=todosJovenes.filter(j=>{
            const nombre=`${j.nombres} ${j.apellidos}`.toLowerCase();
            const unidadLower=(j.unidad||'').toLowerCase();
            const matchQ=!q||nombre.includes(q)||(j.run||'').toLowerCase().includes(q);
            const matchU=!u||unidadLower.includes(u);
            const prog=progresiones[j.id];
            const etapaLower=(prog?.etapa_actual||'').toLowerCase();
            const matchE=!e||etapaLower.includes(e);
            return matchQ&&matchU&&matchE;
        });
        renderGrid(lista);
    };

    window.seleccionarJoven=function(id){
        document.querySelectorAll('.jcard').forEach(c=>c.classList.remove('selected'));
        const card=document.getElementById(`card-${id}`);if(card)card.classList.add('selected');
        const j=todosJovenes.find(x=>String(x.id)===String(id));
        if(!j)return;
        jovenActivo=j;
        const prog=progresiones[j.id];
        const color=COLORES[j.unidad]||'#3498db';
        const inic=[(j.nombres||'')[0],(j.apellidos||'')[0]].join('').toUpperCase();
        const panel=document.getElementById('detallePanel');
        document.getElementById('detAv').style.background=color;
        document.getElementById('detAv').innerHTML=j.foto_url?`<img src="${j.foto_url}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`:`${inic}`;
        document.getElementById('detNombre').textContent=`${j.nombres} ${j.apellidos}`;
        document.getElementById('detSub').textContent=`${j.unidad||'—'} · ${j.run||'—'} · Etapa: ${prog?.etapa_actual||'Sin etapa'}`;
        renderStepper(j,prog);
        renderObjetivos(j,prog);
        renderEspecialidades(prog);
        renderEtapaSelector(j,prog);
        panel.classList.add('show');
        panel.scrollIntoView({behavior:'smooth',block:'start'});
    };

    function renderStepper(j,prog){
        const etapas=ETAPAS_POR_RAMA[j.unidad]||['Promesa','Acción','Aventura','Servicio','Especialista'];
        const actual=prog?.etapa_actual||'';
        const idx=etapas.indexOf(actual);
        document.getElementById('etapaStepper').innerHTML=etapas.map((e,i)=>{
            let cls=i<idx?'done':i===idx?'current':'';
            const icon=i<idx?'fa-check':i===idx?(ICONOS_ETAPA[e]||'fa-star'):'fa-circle';
            return`<div class="etapa-step ${cls}"><div class="etapa-circle"><i class="fas ${icon}"></i></div><div class="etapa-lbl">${e}</div></div>`;
        }).join('');
    }

    function renderObjetivos(j,prog){
        const obj=getObjetivos(prog);
        document.getElementById('areasDetalle').innerHTML=AREAS.map(a=>{
            const arr=obj[a.k]||[];
            const done=arr.filter(o=>o.estado==='aprobado'||o.logrado===true).length;
            const objHTML=arr.length?arr.map((o,i)=>`
                <div class="obj-item">
                    <div class="obj-check ${o.logrado?'done':''}" onclick="toggleObjetivo('${j.id}','${a.k}',${i})">
                        ${o.logrado?'<i class="fas fa-check" style="font-size:0.6rem"></i>':''}
                    </div>
                    <div class="obj-txt ${o.logrado?'done':''}">${o.texto||o.descripcion||o}</div>
                </div>`).join(''):`<p style="font-size:0.8rem;color:var(--texto-claro);padding:8px 0">Sin objetivos registrados en esta área.</p>`;
            return`<div class="area-card">
                <h4 style="color:${a.c}"><i class="fas ${a.ic}"></i>${a.n} <span style="font-size:0.72rem;color:var(--texto-claro);font-weight:400;margin-left:auto">${done}/${arr.length}</span></h4>
                ${objHTML}
            </div>`;
        }).join('');
    }

    function renderEspecialidades(prog){
        const esps=prog?.especialidades||[];
        document.getElementById('espGrid').innerHTML=esps.length?esps.map((e,i)=>{
            const nombre=typeof e==='string'?e:(e.nombre||'Especialidad');
            return`<div class="esp-tag"><i class="fas fa-star"></i>${nombre}<span onclick="eliminarEsp(${i})" style="cursor:pointer;margin-left:5px;opacity:0.5;font-size:0.9rem">×</span></div>`;
        }).join(''):`<p style="font-size:0.83rem;color:var(--texto-claro)">Sin especialidades registradas.</p>`;
    }

    function renderEtapaSelector(j,prog){
        const etapas=ETAPAS_POR_RAMA[j.unidad]||['Promesa','Acción','Aventura','Servicio','Especialista'];
        const actual=prog?.etapa_actual||'';
        document.getElementById('etapaSelector').innerHTML=etapas.map(e=>
            `<button class="etapa-btn ${actual===e?'act':''}" onclick="cambiarEtapa('${e}')">${e}</button>`
        ).join('');
    }

    window.cambiarTabDet=function(tab,el){
        document.querySelectorAll('.tab-det').forEach(t=>t.classList.remove('act'));el.classList.add('act');
        ['tpObjetivos','tpEspecialidades','tpEtapa'].forEach(id=>document.getElementById(id).classList.remove('show'));
        document.getElementById('tp'+tab.charAt(0).toUpperCase()+tab.slice(1)).classList.add('show');
    };

