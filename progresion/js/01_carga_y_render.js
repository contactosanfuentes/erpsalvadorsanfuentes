    let todosJovenes=[], progresiones={}, jovenActivo=null;

    async function cargar(){
        // Lee mmbb_registrations (tabla real de jóvenes)
        const{data:jov}=await db.from('mmbb_registrations').select('id,nombres,apellidos,run,unidad,foto_url').order('apellidos');
        // Lee progresion_jovenes (tabla real de progresión)
        const{data:prog}=await db.from('progresion_jovenes').select('*');
        todosJovenes=jov||[];
        progresiones={};
        (prog||[]).forEach(p=>progresiones[p.joven_id]=p);
        document.getElementById('topbarSub').textContent=`${todosJovenes.length} jóvenes · ${Object.keys(progresiones).length} con progresión registrada`;
        actualizarStats();
        renderGrid(todosJovenes);
    }

    function actualizarStats(){
        const t=todosJovenes.length;
        const cp=Object.keys(progresiones).length;
        const esp=Object.values(progresiones).reduce((s,p)=>s+((p.especialidades||[]).length),0);
        const pcts=todosJovenes.map(j=>{const p=progresiones[j.id];return calcPct(p);});
        const prom=pcts.length?Math.round(pcts.reduce((a,b)=>a+b,0)/pcts.length):0;
        document.getElementById('stTotal').textContent=t;
        document.getElementById('stConProg').textContent=cp;
        document.getElementById('stEsp').textContent=esp;
        document.getElementById('stSinProg').textContent=t-cp;
        document.getElementById('stPromedio').textContent=prom+'%';
    }

    function calcPct(prog){
        if(!prog)return 0;
        const obj=getObjetivos(prog);
        let total=0,done=0;
        AREAS.forEach(a=>{
            const arr=obj[a.k]||[];
            total+=arr.length;
            // Compatibilidad: programa_jovenes usa estado==='aprobado', progresion_insignias usaba logrado
            done+=arr.filter(o=>o.estado==='aprobado'||o.logrado===true).length;
        });
        return total?Math.round(done/total*100):0;
    }

    function getObjetivos(prog){
        if(!prog)return {};
        return (prog.territorios?.objetivos) || prog.semillero?.objetivos || {corporalidad:[],creatividad:[],caracter:[],afectividad:[],sociabilidad:[],espiritualidad:[]};
    }

    function renderGrid(lista){
        const grid=document.getElementById('gridJovenes');
        if(!lista.length){grid.innerHTML='<div class="empty" style="grid-column:1/-1"><i class="fas fa-users-slash"></i>No se encontraron jóvenes.</div>';return;}
        grid.innerHTML=lista.map(j=>{
            const prog=progresiones[j.id];
            const pct=calcPct(prog);
            const etapa=prog?.etapa_actual||'Sin etapa';
            const color=COLORES[j.unidad]||'#3498db';
            const inic=[(j.nombres||'')[0],(j.apellidos||'')[0]].join('').toUpperCase();
            const areasHTML=AREAS.map(a=>{
                const obj=getObjetivos(prog);
                const arr=obj[a.k]||[];
                const done=arr.filter(o=>o.estado==='aprobado'||o.logrado===true).length;
                const total=arr.length;
                const apct=total?Math.round(done/total*100):0;
                return`<div class="area-bar"><div class="lbl"><span>${a.n}</span><span>${apct}%</span></div><div class="bar-track"><div class="bar-fill" style="width:${apct}%;background:${a.c}"></div></div></div>`;
            }).join('');
            return`<div class="jcard" id="card-${j.id}" onclick="seleccionarJoven('${j.id}')">
                <div class="jh">
                    <div class="av" style="background:${color}">${j.foto_url?`<img src="${j.foto_url}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`:`${inic}`}</div>
                    <div class="jh-info">
                        <h3>${j.nombres} ${j.apellidos}</h3>
                        <p>${j.unidad||'—'} · ${j.run||'—'}</p>
                        <span class="etapa-badge" style="background:${color}22;color:${color}">${etapa}</span>
                    </div>
                </div>
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
                    <span style="font-size:0.78rem;color:var(--texto-claro)">Progreso general</span>
                    <span style="font-size:0.82rem;font-weight:700;color:${pct>=60?'var(--verde)':pct>=30?'var(--naranja)':'var(--rojo)'}">${pct}%</span>
                </div>
                <div class="areas-grid">${areasHTML}</div>
            </div>`;
        }).join('');
    }

