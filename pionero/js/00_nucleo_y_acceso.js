const SUPABASE_URL='https://hyixmaxhoxvamoecuars.supabase.co';
const SUPABASE_ANON_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5aXhtYXhob3h2YW1vZWN1YXJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3OTg1NDMsImV4cCI6MjA4ODM3NDU0M30.ZLeJIWdip2f00h4TqkZH7eqMX4wpwphaqkJpAa0N0X4';
const sb=supabase.createClient(SUPABASE_URL,SUPABASE_ANON_KEY);
let currentJoven=null,camino=null;
let mpResponsables={},mpParticipantes=[],mpEvidencias=[];
const AREAS_RESP=['Coordinador General','Finanzas / Tesorería','Logística y Equipos','Comunicaciones y RRPP','Programa y Actividades','Gestión de Riesgos','Salud y Primeros Auxilios','Operaciones'];
function areaKey(a){return a.replace(/[^a-zA-Z0-9]/g,'');}

function toast(m,t='ok'){const el=document.getElementById('toast');el.textContent=m;el.className='toast '+t;el.style.display='block';setTimeout(()=>el.style.display='none',3500)}
function esc(s){const d=document.createElement('div');d.textContent=s||'';return d.innerHTML}
function formatRut(v){return v.replace(/[\.\-\s]/g,'').trim().toUpperCase()}

document.getElementById('input-rut').addEventListener('keyup',e=>{if(e.key==='Enter')document.getElementById('input-clave').focus()});
document.getElementById('input-clave').addEventListener('keyup',e=>{if(e.key==='Enter')verificarAcceso()});

// ══════════ AUTH ══════════
async function verificarAcceso(){
const rut=formatRut(document.getElementById('input-rut').value),clave=document.getElementById('input-clave').value.trim(),err=document.getElementById('error-box');
err.style.display='none';if(!rut||!clave){err.textContent='Ingresa tu RUT y clave.';err.style.display='block';return}
document.getElementById('btn-ingresar').disabled=true;
try{const{data,error}=await sb.from('mmbb_registrations').select('*').ilike('run',rut).limit(1);if(error)throw error;if(!data||!data.length){err.textContent='RUT no encontrado.';err.style.display='block';return}
const j=data[0];const rutD=rut.replace(/[^0-9]/g,'');if(clave!==(j.portal_clave||rutD.slice(-4))){err.textContent='Clave incorrecta.';err.style.display='block';return}
// Portal exclusivo de la rama pionera (Avanzada). Caminantes tienen su propio portal.
if(!String(j.unidad||'').toLowerCase().includes('avanzada')){err.innerHTML='Este portal es para pioneros y pioneras de la <b>Avanzada</b>.<br>Si eres caminante, entra a tu portal: <a href="portal_caminante.html" style="text-decoration:underline;font-weight:700;">Portal Caminante</a>.';err.style.display='block';return}
currentJoven=j;const{data:pg}=await sb.from('progresion_jovenes').select('*').eq('joven_id',j.id).maybeSingle();
if(pg){camino=pg.camino||{};sonarData=pg.sonar||null}else{camino={};sonarData=null;await sb.from('progresion_jovenes').insert({joven_id:j.id,camino})}
if(!camino.aventura_notas)camino.aventura_notas='';if(!camino.adjuntos_aventura)camino.adjuntos_aventura=[];if(!camino.proyectos_colectivos)camino.proyectos_colectivos=[];
mostrarPortal()}catch(e){err.textContent='Error: '+e.message;err.style.display='block'}finally{document.getElementById('btn-ingresar').disabled=false}}

async function guardarCamino(){try{const{error}=await sb.from('progresion_jovenes').upsert({joven_id:currentJoven.id,camino},{onConflict:'joven_id'});if(error)throw error;return true}catch(e){toast('Error: '+e.message,'err');return false}}

// Fix: el botón "Cerrar Sesión" del header llamaba a esta función pero no existía en la versión desplegada.
function cerrarSesion(){currentJoven=null;camino=null;mpResponsables={};mpParticipantes=[];mpEvidencias=[];
document.getElementById('portal-screen').style.display='none';document.getElementById('login-screen').style.display='flex';
document.getElementById('input-rut').value='';document.getElementById('input-clave').value='';document.getElementById('error-box').style.display='none'}

function mostrarPortal(){setTimeout(()=>{if(typeof renderRadarPionero==="function")renderRadarPionero()},0);document.getElementById('login-screen').style.display='none';document.getElementById('portal-screen').style.display='block';
document.getElementById('portal-foto').src=currentJoven.foto_url||'https://ui-avatars.com/api/?name='+encodeURIComponent(currentJoven.nombres)+'&background=E31837&color=fff&bold=true';
document.getElementById('portal-nombre').textContent=currentJoven.nombres+' '+currentJoven.apellidos;
document.getElementById('portal-unidad').textContent=currentJoven.unidad||'Pionero/a';
document.getElementById('portal-manifiesto').value=camino.aventura_notas||'';pvCargarCampoExtra();
[
        ()=>renderAdjuntos(),
        ()=>renderProyectos(),
        ()=>contarSolicitudes(),
        ()=>actualizarStats(),
        ()=>cargarPortafolio(),
        ()=>cargarProyectosVigentes(),
        ()=>cargarCalendario(),
        ()=>{if(window.innerWidth>=1024)activarTab("vida",document.querySelector(".portal-tab"))}
    ].forEach(fn=>{try{fn();}catch(e){console.warn('Portal fn error:',e.message);}})}

