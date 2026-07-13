// ══════════ PORTAFOLIO DE RUTA ══════════
async function cargarPortafolio() {
    const cont = document.getElementById('portal-portafolio');
    if (!cont || !currentJoven) return;
    try {
        const { data: prog } = await sb.from('progresion_jovenes')
            .select('etapa_actual, camino, territorios')
            .eq('joven_id', currentJoven.id).maybeSingle();
        if (!prog) { cont.innerHTML = '<p class="text-center text-gray-400 py-4">Sin registro de progresión aún.</p>'; return; }
        const ETAPAS = [
            { nombre: 'Cruz del Sur', img: 'https://i.imgur.com/IStoscc.png', color: '#3949AB' },
            { nombre: 'Sendero',      img: 'https://i.imgur.com/VHZrlFN.png', color: '#7C3AED' },
            { nombre: 'Cumbre',       img: 'https://i.imgur.com/3MeclHS.png', color: '#10B981' }
        ];
        // En la Avanzada el ERP registra la etapa en mmbb_registrations.adelanto
        const etapa = prog.etapa_actual || currentJoven?.adelanto || null;
        const idxAct = ETAPAS.findIndex(e => e.nombre === etapa);
        const competencias = (prog.territorios?.competencias_mayores || []);
        const lineaEtapas = ETAPAS.map((e, i) => {
            const activa = i === idxAct, pasada = i < idxAct;
            const op = activa ? '1' : pasada ? '0.75' : '0.2';
            return `<div class="flex flex-col items-center" style="flex:1">
                <div style="${activa?`box-shadow:0 0 0 3px ${e.color}40;border-radius:50%;`:''}margin-bottom:6px">
                    <img src="${e.img}" style="width:48px;height:48px;object-fit:contain;opacity:${op}">
                </div>
                <span style="font-size:0.68rem;font-weight:800;text-align:center;color:${activa?e.color:pasada?'#6B7280':'#D1D5DB'}">${e.nombre}${pasada?' ✓':''}</span>
            </div>${i<ETAPAS.length-1?`<div style="width:16px;height:2px;background:${i<idxAct?'#9CA3AF':'#E5E7EB'};margin-top:18px;flex-shrink:0"></div>`:''}`;
        }).join('');
        const nivelColor = { 'Exploración': '#3B82F6', 'Desarrollo': '#F59E0B', 'Maestría': '#10B981' };
        const compCards = competencias.length > 0
            ? competencias.map(comp => `<div style="display:flex;align-items:flex-start;gap:10px;padding:8px 0;border-bottom:1px solid #f1f5f9">
                    <div style="font-size:18px;flex-shrink:0">🎓</div>
                    <div style="flex:1;min-width:0">
                        <div style="font-size:13px;font-weight:700;color:#1e293b">${esc(comp.nombre||'')}</div>
                        <div style="font-size:11px;color:#64748b">${esc(comp.area||'')}</div>
                        ${comp.proyecto?`<div style="font-size:11px;color:#94a3b8;margin-top:2px;font-style:italic">${esc(comp.proyecto)}</div>`:''}
                    </div>
                    <span style="font-size:10px;font-weight:700;padding:2px 8px;border-radius:99px;color:white;flex-shrink:0;background:${nivelColor[comp.nivel]||'#6B7280'}">${esc(comp.nivel||'')}</span>
                </div>`).join('')
            : '<p style="font-size:12px;color:#94a3b8;text-align:center;padding:8px 0">Aún sin competencias acreditadas</p>';
        // ① Etapas
        const secEtapas = `<div style="margin-bottom:16px">
            <p style="font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:10px">① Etapas de Progresión</p>
            <div style="display:flex;align-items:flex-start">${lineaEtapas}</div>
            ${!etapa?'<p style="font-size:11px;color:#94a3b8;text-align:center;margin-top:6px">Etapa aún no asignada por tu equipo de dirigentes</p>':''}
        </div>`;
        // ② Competencias
        const secComp = `<div style="margin-bottom:16px;padding-top:14px;border-top:1px solid #f1f5f9">
            <p style="font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:8px">② Competencias Acreditadas</p>
            ${compCards}
        </div>`;
        // (El Compromiso anual es estrategia del Clan; no aplica en la Avanzada)
        const secCompromiso = '';
        cont.innerHTML = secEtapas + secComp + secCompromiso;
    } catch(e) { cont.innerHTML = '<p class="text-red-500 text-sm text-center">Error: '+e.message+'</p>'; }
}
async function cargarCalendario(){
    const ids=['portal-calendario','portal-calendario-sidebar'];
    const els=ids.map(id=>document.getElementById(id)).filter(Boolean);
    els.forEach(el=>el.innerHTML='<p class="text-center text-gray-400 py-4 text-xs"><i class="fas fa-spinner fa-spin"></i> Cargando...</p>');
    try{
        const{data:progs}=await sb.from('progresion_jovenes').select('joven_id,camino');
        // Cargar notas de la Avanzada (solo esta unidad)
        const{data:notasClan}=await sb.from('notas_calendario_clan').select('*').eq('unidad','Avanzada').order('fecha');
        _calNotasClan={};
        (notasClan||[]).forEach(n=>{
            const k=n.fecha; // "YYYY-MM-DD"
            if(!_calNotasClan[k])_calNotasClan[k]=[];
            _calNotasClan[k].push(n);
        });
        _calEventos=[];
        (progs||[]).forEach(p=>{
            (p.camino?.proyectos_colectivos||[]).forEach(proy=>{
                if(proy.estado==='Finalizado'||proy.privado)return;
                if(!proy.inicio&&!proy.termino)return;
                _calEventos.push({
                    nombre:proy.nombre||'Sin nombre',
                    campo:proy.campoAccion||'',
                    inicio:proy.inicio?new Date(proy.inicio+'T12:00'):null,
                    termino:proy.termino?new Date(proy.termino+'T12:00'):null,
                    estado:proy.estado||'Planificación',
                    esMio:proy.creadorRun===currentJoven?.run
                });
            });
        });
        // Ir al mes con el próximo proyecto
        if(_calEventos.length){
            const hoy=new Date();
            const fechas=_calEventos.flatMap(e=>[e.inicio,e.termino].filter(Boolean));
            const futuras=fechas.filter(f=>f>=hoy).sort((a,b)=>a-b);
            const ref=futuras.length?futuras[0]:fechas.sort((a,b)=>b-a)[0];
            if(ref)_calMes=new Date(ref.getFullYear(),ref.getMonth(),1);
        }
        renderCalMensual();
    }catch(e){
        els.forEach(el=>el.innerHTML='<p class="text-red-500 text-xs text-center">Error: '+e.message+'</p>');
    }
}

function navegarCal(dir){_calMes=new Date(_calMes.getFullYear(),_calMes.getMonth()+dir,1);renderCalMensual();}

function abrirNotaCal(clave){
    const notas=(camino?.cal_notas)||{};
    const nota=notas[clave]||'';
    // Modal de nota
    let modal=document.getElementById('modal-nota-cal');
    if(!modal){
        modal=document.createElement('div');
        modal.id='modal-nota-cal';
        modal.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,0.45);z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px';
        modal.innerHTML=`<div style="background:white;border-radius:16px;padding:24px;width:100%;max-width:380px;box-shadow:0 20px 60px rgba(0,0,0,0.25)">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
                <h3 id="modal-nota-titulo" style="font-size:14px;font-weight:800;color:#1e293b;margin:0">Nota del día</h3>
                <button onclick="document.getElementById('modal-nota-cal').remove()" style="border:none;background:none;font-size:20px;color:#94a3b8;cursor:pointer">✕</button>
            </div>
            <!-- Tipo de nota -->
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:14px">
                <button id="btn-tipo-personal" onclick="selTipoNota('personal')" style="border:2px solid #f59e0b;border-radius:10px;padding:8px;font-size:12px;font-weight:700;background:#fefce8;color:#92400e;cursor:pointer">
                    🟡 Personal<div style="font-size:10px;font-weight:400;color:#78716c;margin-top:2px">Solo la veo yo</div>
                </button>
                <button id="btn-tipo-clan" onclick="selTipoNota('clan')" style="border:2px solid #e2e8f0;border-radius:10px;padding:8px;font-size:12px;font-weight:700;background:#EEF2FF;color:#3949AB;cursor:pointer;opacity:0.5">
                    🟣 De la Avanzada<div style="font-size:10px;font-weight:400;color:#78716c;margin-top:2px">La ven todos</div>
                </button>
            </div>
            <textarea id="modal-nota-texto" rows="3" placeholder="Escribe una nota para este día..." style="width:100%;border:1.5px solid #e2e8f0;border-radius:10px;padding:10px;font-size:13px;outline:none;resize:vertical;box-sizing:border-box;margin-bottom:14px"></textarea>
            <!-- Notas del Clan existentes -->
            <div id="modal-notas-clan-lista" style="margin-bottom:12px"></div>
            <div style="display:flex;gap:8px">
                <button id="modal-nota-borrar" style="flex:1;border:1.5px solid #fca5a5;border-radius:8px;padding:9px;font-size:13px;font-weight:600;background:#fef2f2;color:#ef4444;cursor:pointer">🗑 Borrar</button>
                <button onclick="guardarNotaCal()" style="flex:2;border:none;border-radius:8px;padding:9px;font-size:13px;font-weight:700;background:linear-gradient(135deg,#3949AB,#7C3AED);color:white;cursor:pointer">Guardar</button>
            </div>
        </div>`;
        document.body.appendChild(modal);
    }
    const d=new Date(clave+'T12:00');
    document.getElementById('modal-nota-titulo').textContent='📅 '+d.toLocaleDateString('es-CL',{weekday:'long',day:'numeric',month:'long'});
    document.getElementById('modal-nota-texto').value=nota;
    modal._clave=clave;
    modal._tipo='personal'; // por defecto
    selTipoNota('personal');
    // Mostrar notas clan existentes del día
    const listaClan=document.getElementById('modal-notas-clan-lista');
    const notasClanDia=(_calNotasClan[clave]||[]);
    if(listaClan){
        if(notasClanDia.length){
            listaClan.innerHTML='<p style="font-size:10px;font-weight:700;color:#3949AB;text-transform:uppercase;margin-bottom:6px">Notas de la Avanzada este día</p>'+
                notasClanDia.map(n=>`<div style="background:#EEF2FF;border:1px solid #C7D2FE;border-radius:8px;padding:8px;margin-bottom:6px;display:flex;justify-content:space-between;align-items:start;gap:8px">
                    <div><p style="font-size:12px;color:#283593;margin:0">${esc(n.nota)}</p><p style="font-size:10px;color:#94a3b8;margin:2px 0 0">${esc(n.autor_nombre||'')}</p></div>
                    <button onclick="borrarNotaClanById(${n.id},'${clave}')" style="border:none;background:none;color:#ef4444;cursor:pointer;font-size:14px;flex-shrink:0">✕</button>
                </div>`).join('');
        } else {
            listaClan.innerHTML='';
        }
    }
    document.getElementById('modal-nota-borrar').onclick=()=>borrarNotaCal(clave);
    document.getElementById('modal-nota-borrar').style.display=nota?'block':'none';
}

function selTipoNota(tipo){
    const modal=document.getElementById('modal-nota-cal');
    if(!modal)return;
    modal._tipo=tipo;
    const btnP=document.getElementById('btn-tipo-personal');
    const btnC=document.getElementById('btn-tipo-clan');
    if(btnP) btnP.style.opacity=tipo==='personal'?'1':'0.5';
    if(btnC) btnC.style.opacity=tipo==='clan'?'1':'0.5';
    if(btnP) btnP.style.borderColor=tipo==='personal'?'#f59e0b':'#e2e8f0';
    if(btnC) btnC.style.borderColor=tipo==='clan'?'#3949AB':'#e2e8f0';
    // Actualizar borrar según tipo
    const notas=(camino?.cal_notas)||{};
    const clave=modal._clave;
    const btnBorrar=document.getElementById('modal-nota-borrar');
    if(btnBorrar){
        if(tipo==='personal') btnBorrar.style.display=notas[clave]?'block':'none';
        else btnBorrar.style.display='none';
    }
}

async function guardarNotaCal(){
    const modal=document.getElementById('modal-nota-cal');
    if(!modal)return;
    const clave=modal._clave;
    const texto=document.getElementById('modal-nota-texto').value.trim();
    if(!texto){toast('Escribe algo primero','err');return;}
    if(modal._tipo==='clan'){
        // Guardar en tabla compartida
        const{error}=await sb.from('notas_calendario_clan').insert({
            unidad:'Avanzada',
            fecha:clave,
            nota:texto,
            autor_run:currentJoven.run,
            autor_nombre:`${currentJoven.nombres} ${currentJoven.apellidos||''}`
        });
        if(error){toast('Error: '+error.message,'err');return;}
        // Recargar notas clan
        const{data:nc}=await sb.from('notas_calendario_clan').select('*').eq('unidad','Avanzada').order('fecha');
        _calNotasClan={};
        (nc||[]).forEach(n=>{if(!_calNotasClan[n.fecha])_calNotasClan[n.fecha]=[];_calNotasClan[n.fecha].push(n);});
    } else {
        if(!camino.cal_notas)camino.cal_notas={};
        camino.cal_notas[clave]=texto;
        if(!await guardarCamino()){toast('Error al guardar','err');return;}
    }
    modal.remove();
    renderCalMensual();
    toast('Nota guardada','ok');
}

async function borrarNotaClanById(id, clave){
    const{error}=await sb.from('notas_calendario_clan').delete().eq('id',id);
    if(error){toast('Error: '+error.message,'err');return;}
    if(_calNotasClan[clave]) _calNotasClan[clave]=_calNotasClan[clave].filter(n=>n.id!==id);
    document.getElementById('modal-nota-cal')?.remove();
    renderCalMensual();
    toast('Nota de la Avanzada eliminada','ok');
}

async function borrarNotaCal(clave){
    if(!camino.cal_notas)return;
    delete camino.cal_notas[clave];
    if(await guardarCamino()){
        document.getElementById('modal-nota-cal')?.remove();
        renderCalMensual();
        toast('Nota eliminada','ok');
    }
}


function renderCalMensual(){
    const ids=['portal-calendario']; // sidebar mantiene lista
    const els=ids.map(id=>document.getElementById(id)).filter(Boolean);
    if(!els.length)return;
    const año=_calMes.getFullYear(), mes=_calMes.getMonth();
    const MESES=['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
    const DIAS=['L','M','X','J','V','S','D'];
    const COL={'En curso':'#3b82f6','Planificación':'#f59e0b','Evaluación':'#8b5cf6'};
    const primerDia=new Date(año,mes,1), ultimoDia=new Date(año,mes+1,0);
    const hoy=new Date(); hoy.setHours(0,0,0,0);
    const notas=(camino?.cal_notas)||{};
    const evMes=_calEventos.filter(e=>{
        const i=e.inicio,t=e.termino;
        return (i&&i<=ultimoDia&&(!t||t>=primerDia))||(t&&t>=primerDia&&t<=ultimoDia);
    });
    let html=`<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
        <button onclick="navegarCal(-1)" style="border:none;background:#f1f5f9;border-radius:8px;width:36px;height:36px;cursor:pointer;font-size:20px;color:#475569;display:flex;align-items:center;justify-content:center;flex-shrink:0">‹</button>
        <div style="text-align:center">
            <div style="font-size:20px;font-weight:900;color:#1e293b">${MESES[mes]} ${año}</div>
            <div style="font-size:14px;color:#64748b;font-weight:500">${evMes.length} proyecto(s) este mes</div>
        </div>
        <button onclick="navegarCal(1)" style="border:none;background:#f1f5f9;border-radius:8px;width:36px;height:36px;cursor:pointer;font-size:20px;color:#475569;display:flex;align-items:center;justify-content:center;flex-shrink:0">›</button>
    </div>`;
    // Cabecera días — fuerza 7 columnas iguales
    html+=`<div style="display:grid;grid-template-columns:repeat(7,1fr);gap:3px;margin-bottom:3px">`;
    DIAS.forEach(d=>html+=`<div style="text-align:center;font-size:15px;font-weight:800;color:#475569;padding:8px 0">${d}</div>`);
    html+=`</div>`;
    // Grilla con celdas cuadradas usando padding-top hack
    html+=`<div style="display:grid;grid-template-columns:repeat(7,1fr);gap:4px">`;
    const primerDiaSem=(primerDia.getDay()+6)%7;
    // Celdas vacías
    for(let i=0;i<primerDiaSem;i++){
        html+=`<div style="width:100%;height:120px;background:#f8fafc;border-radius:8px"></div>`;
    }
    for(let d=1;d<=ultimoDia.getDate();d++){
        const fecha=new Date(año,mes,d); fecha.setHours(0,0,0,0);
        const esHoy=fecha.getTime()===hoy.getTime();
        const clave=`${año}-${String(mes+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
        const tienaNota=!!(notas[clave]);
        const notasClanDia=(_calNotasClan[clave]||[]);
        const tieneNotaClan=notasClanDia.length>0;
        const evDia=evMes.filter(e=>{
            const ei=e.inicio?new Date(e.inicio.getFullYear(),e.inicio.getMonth(),e.inicio.getDate()):null;
            const et=e.termino?new Date(e.termino.getFullYear(),e.termino.getMonth(),e.termino.getDate()):null;
            return (ei&&ei.getTime()===fecha.getTime())||(et&&et.getTime()===fecha.getTime());
        });
        const enProg=evMes.filter(e=>{
            const ei=e.inicio?new Date(e.inicio.getFullYear(),e.inicio.getMonth(),e.inicio.getDate()):null;
            const et=e.termino?new Date(e.termino.getFullYear(),e.termino.getMonth(),e.termino.getDate()):null;
            return ei&&et&&ei<fecha&&et>fecha;
        });
        const bg=esHoy?'#EEF2FF':tieneNotaClan?'#E0E7FF':evDia.length?'#dbeafe':enProg.length?'#dcfce7':'#f8fafc';
        const border=esHoy?'2px solid #E31837':tieneNotaClan?'1.5px solid #E31837':evDia.length?'1.5px solid #93c5fd':enProg.length?'1.5px solid #86efac':'1.5px solid #e2e8f0';
        const numColor=esHoy?'#E31837':evDia.length?'#1e40af':'#64748b';
        // Tooltip con eventos del día
        const tooltip=evDia.map(e=>e.nombre).concat(tienaNota?['📝 '+notas[clave].slice(0,40)]:[]). join(' | ');
        html+=`<div onclick="abrirNotaCal('${clave}')" title="${esc(tooltip)}"
            style="width:100%;height:120px;background:${bg};border:${border};border-radius:8px;overflow:hidden;cursor:pointer;transition:box-shadow .15s"
            onmouseover="this.style.boxShadow='0 2px 8px rgba(0,0,0,0.12)'" onmouseout="this.style.boxShadow=''">
            <div style="padding:6px 7px;display:flex;flex-direction:column;overflow:hidden;height:100%;box-sizing:border-box">
                <div style="font-size:18px;font-weight:${esHoy?900:700};color:${numColor};text-align:right;line-height:1;flex-shrink:0;flex-shrink:0">${d}</div>`;
        // Punto de nota
        if(tienaNota){
            // Barra de nota personal (amarilla, con texto)
            html+='<div style="background:#fef9c3;border-left:3px solid #f59e0b;padding:3px 6px;border-radius:4px;font-size:12px;font-weight:700;color:#92400e;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;margin-top:2px">📝 '+esc(notas[clave])+'</div>';
        }
        
        // Barras de eventos
        evDia.slice(0,2).forEach(e=>{
            const col=COL[e.estado]||'#f59e0b';
            const esI=e.inicio&&new Date(e.inicio.getFullYear(),e.inicio.getMonth(),e.inicio.getDate()).getTime()===fecha.getTime();
            html+=`<div style="background:${col};border-radius:4px;padding:3px 7px;font-size:13px;font-weight:700;color:white;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;margin-top:2px;letter-spacing:-0.2px">${esI?'▶':'⏹'} ${esc(e.nombre)}</div>`;
        });
        if(evDia.length>2) html+=`<div style="font-size:12px;color:#475569;margin-top:2px;font-weight:700">+${evDia.length-2}</div>`;
        if(enProg.length&&!evDia.length) html+=`<div style="height:3px;background:linear-gradient(90deg,#86efac,#34d399);border-radius:2px;margin-top:auto"></div>`;
        notasClanDia.slice(0,1).forEach(n=>{
            html+=`<div style="background:#fee2e2;border-left:3px solid #E31837;padding:3px 6px;border-radius:4px;font-size:12px;font-weight:700;color:#991b1b;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;margin-top:2px;letter-spacing:-0.2px">📌 ${esc(n.nota)}</div>`;
        });
        html+=`</div></div>`;
    }
    // Celdas vacías al final
    const total=primerDiaSem+ultimoDia.getDate();
    for(let i=0;i<(7-total%7)%7;i++) html+=`<div style="width:100%;height:120px;background:#f8fafc;border-radius:8px"></div>`;
    html+=`</div>`;
    // Leyenda
    html+=`<div style="display:flex;gap:12px;flex-wrap:wrap;margin-top:12px;padding-top:8px;border-top:1px solid #f1f5f9;font-size:13px;color:#475569;align-items:center;font-weight:500">
        <span>▶ Inicio &nbsp; ⏹ Término</span>
        <span style="display:flex;align-items:center;gap:3px"><span style="display:inline-block;width:8px;height:8px;background:#d1fae5;border-radius:2px"></span>En progreso</span>
        <span style="display:flex;align-items:center;gap:3px"><span style="display:inline-block;width:7px;height:7px;background:#f59e0b;border-radius:50%"></span>Mi nota</span>
        <span style="display:flex;align-items:center;gap:3px"><span style="display:inline-block;width:7px;height:7px;background:#E31837;border-radius:50%;border:1px solid #b91c1c"></span>Nota del Clan</span>
        <span style="margin-left:auto;color:#94a3b8;font-style:italic">Clic en un día para agregar nota</span>
    </div>`;
    els.forEach(el=>el.innerHTML=html);

    // Sidebar: lista de próximos proyectos
    const sbCal = document.getElementById('portal-calendario-sidebar');
    if (sbCal) {
        const hoy2 = new Date(); hoy2.setHours(0,0,0,0);
        const proximos = _calEventos
            .filter(e => (e.termino && e.termino >= hoy2) || (e.inicio && e.inicio >= hoy2))
            .sort((a,b) => (a.inicio||a.termino) - (b.inicio||b.termino))
            .slice(0, 8);
        const fmtD = d => d ? d.toLocaleDateString('es-CL',{day:'numeric',month:'short'}) : '—';
        if (!proximos.length) {
            sbCal.innerHTML = '<p style="font-size:11px;color:#94a3b8;text-align:center;padding:12px 0">Sin proyectos próximos</p>';
        } else {
            const COL2 = {'En curso':'#3b82f6','Planificación':'#f59e0b','Evaluación':'#8b5cf6'};
            sbCal.innerHTML = proximos.map(function(e) {
                var col = COL2[e.estado] || '#f59e0b';
                var enCurso = e.inicio && e.termino && e.inicio <= hoy2 && e.termino >= hoy2;
                return '<div style="border-left:3px solid '+col+';padding:6px 8px;margin-bottom:7px;background:'+col+'18;border-radius:0 6px 6px 0">'
                    + '<p style="font-size:11px;font-weight:700;color:#1e293b;margin:0;overflow:hidden;white-space:nowrap;text-overflow:ellipsis">'+esc(e.nombre)+'</p>'
                    + '<p style="font-size:10px;color:#64748b;margin:2px 0 0">'+(enCurso?'🟢 ':'📅 ')+(e.inicio?fmtD(e.inicio):'')+(e.termino?' → '+fmtD(e.termino):'')+'</p>'
                    + '</div>';
            }).join('');
        }
    }
}



