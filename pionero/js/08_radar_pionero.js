// ══════════ MI RADAR (SONAR PIONERO) ══════════
// Autoevaluación por áreas de crecimiento, escala 1–7. Edita el MISMO dato que
// el ERP de dirigentes visualiza (progresion_jovenes.sonar), cerrando el ciclo
// educativo: el pionero se autoevalúa, el equipo de dirigentes acompaña.

const AREAS_RADAR = [
  { k:'corporalidad',  n:'Corporalidad',  ic:'fa-running',     c:'#dc2626' },
  { k:'creatividad',   n:'Creatividad',   ic:'fa-lightbulb',   c:'#f59e0b' },
  { k:'caracter',      n:'Carácter',      ic:'fa-user-shield', c:'#475569' },
  { k:'sociabilidad',  n:'Sociabilidad',  ic:'fa-users',       c:'#3b82f6' },
  { k:'afectividad',   n:'Afectividad',   ic:'fa-heart',       c:'#ec4899' },
  { k:'espiritualidad',n:'Espiritualidad',ic:'fa-dove',        c:'#8b5cf6' }
];
let sonarData = null; // se llena al iniciar sesión (00_nucleo)

function _radPunto(cx, cy, r, i, total){
  const ang = (Math.PI * 2 * i / total) - Math.PI / 2;
  return [cx + r * Math.cos(ang), cy + r * Math.sin(ang)];
}

function renderRadarPionero(){
  const cont = document.getElementById('pio-radar'); if(!cont) return;
  if(!sonarData) sonarData = {};
  AREAS_RADAR.forEach(a => { if(!sonarData[a.k]) sonarData[a.k] = 1; });

  const cx=150, cy=140, R=100, N=AREAS_RADAR.length, MAX=7;
  // anillos de la grilla (1..7)
  let grid='';
  for(let nivel=1; nivel<=MAX; nivel++){
    const r=R*nivel/MAX;
    const pts=AREAS_RADAR.map((_,i)=>_radPunto(cx,cy,r,i,N).map(v=>v.toFixed(1)).join(',')).join(' ');
    grid+=`<polygon points="${pts}" fill="none" stroke="${nivel===MAX?'#cbd5e1':'#e2e8f0'}" stroke-width="1"/>`;
  }
  // ejes y etiquetas
  let ejes='', labels='';
  AREAS_RADAR.forEach((a,i)=>{
    const [x,y]=_radPunto(cx,cy,R,i,N);
    ejes+=`<line x1="${cx}" y1="${cy}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="#e2e8f0" stroke-width="1"/>`;
    const [lx,ly]=_radPunto(cx,cy,R+24,i,N);
    labels+=`<text x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" text-anchor="middle" dominant-baseline="middle" font-size="10" font-weight="800" fill="${a.c}">${a.n}</text>
             <text x="${lx.toFixed(1)}" y="${(ly+12).toFixed(1)}" text-anchor="middle" font-size="9" font-weight="800" fill="#94a3b8">${sonarData[a.k]}/7</text>`;
  });
  // polígono de valores
  const valPts=AREAS_RADAR.map((a,i)=>_radPunto(cx,cy,R*sonarData[a.k]/MAX,i,N).map(v=>v.toFixed(1)).join(',')).join(' ');
  const dots=AREAS_RADAR.map((a,i)=>{const[x,y]=_radPunto(cx,cy,R*sonarData[a.k]/MAX,i,N);return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4" fill="#fff" stroke="${a.c}" stroke-width="2.5"/>`}).join('');

  const svg=`<svg viewBox="0 0 300 290" style="width:100%;max-width:340px;margin:0 auto;display:block;">
    ${grid}${ejes}
    <polygon points="${valPts}" fill="rgba(194,65,12,0.22)" stroke="#C2410C" stroke-width="2.5" stroke-linejoin="round"/>
    ${dots}${labels}
  </svg>`;

  const sliders=AREAS_RADAR.map(a=>`
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:7px;">
      <i class="fas ${a.ic}" style="color:${a.c};width:16px;text-align:center;font-size:12px;"></i>
      <span style="font-size:11px;font-weight:800;color:#334155;width:92px;">${a.n}</span>
      <input type="range" min="1" max="7" step="1" value="${sonarData[a.k]}" style="flex:1;accent-color:${a.c};"
        oninput="sonarData['${a.k}']=parseInt(this.value);renderRadarPionero()">
      <span style="font-size:12px;font-weight:900;color:${a.c};width:30px;text-align:center;">${sonarData[a.k]}/7</span>
    </div>`).join('');

  cont.innerHTML=`
    <div style="display:grid;grid-template-columns:1fr;gap:12px;">
      ${svg}
      <div>${sliders}</div>
      <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;">
        <p style="font-size:10px;color:#94a3b8;margin:0;">Tu autoevaluación la ve también tu equipo de dirigentes para acompañarte mejor.</p>
        <button class="btn-primary-portal" onclick="guardarRadarPionero()" style="white-space:nowrap;"><i class="fas fa-save"></i> Guardar radar</button>
      </div>
    </div>`;
}

async function guardarRadarPionero(){
  try{
    const { error } = await sb.from('progresion_jovenes').upsert({ joven_id: currentJoven.id, sonar: sonarData }, { onConflict: 'joven_id' });
    if(error) throw error;
    toast('📡 Radar guardado. ¡Sigue creciendo en todas tus áreas!');
  }catch(e){ toast('Error al guardar el radar: '+e.message,'err'); }
}
