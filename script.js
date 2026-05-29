// ============================================
// script.js - ERP Scout AGSCh - Versión con autenticación separada
// ============================================

// ============================================
// SISTEMA DE NOTIFICACIONES (TOAST)
// ============================================
function mostrarNotificacion(tipo, mensaje, duracion = 4000) {
    let contenedor = document.getElementById('toast-container');
    if (!contenedor) {
        contenedor = document.createElement('div');
        contenedor.id = 'toast-container';
        contenedor.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
            display: flex;
            flex-direction: column;
            gap: 10px;
            max-width: 350px;
            width: auto;
        `;
        document.body.appendChild(contenedor);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${tipo}`;
    toast.style.cssText = `
        min-width: 250px;
        padding: 12px 20px;
        border-radius: 8px;
        background: white;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        display: flex;
        align-items: center;
        gap: 12px;
        animation: slideIn 0.3s ease;
        border-left: 4px solid ${tipo === 'exito' ? '#2ecc71' : tipo === 'error' ? '#e74c3c' : tipo === 'advertencia' ? '#f39c12' : '#3498db'};
        word-break: break-word;
    `;
    
    const iconos = {
        exito: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        advertencia: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };
    
    toast.innerHTML = `
        <i class="fas ${iconos[tipo] || 'fa-info-circle'}" style="color: ${tipo === 'exito' ? '#2ecc71' : tipo === 'error' ? '#e74c3c' : tipo === 'advertencia' ? '#f39c12' : '#3498db'}; font-size: 1.2rem;"></i>
        <span style="flex: 1; color: #2d3748; font-size: 0.95rem;">${mensaje}</span>
    `;
    
    contenedor.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease forwards';
        setTimeout(() => toast.remove(), 300);
    }, duracion);
}

// Añadir animaciones para los toasts
const styleToast = document.createElement('style');
styleToast.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(styleToast);

// ============================================
// MODALES PARA FECHAS Y TEXTOS
// ============================================
let textoCallback = null;
let fechaCallback = null;

function mostrarModalTexto(titulo, callback) {
    textoCallback = callback;
    const modal = document.getElementById('modal-texto');
    if (!modal) return;
    modal.querySelector('h3').innerHTML = `<i class="fas fa-pencil-alt"></i> ${titulo}`;
    modal.querySelector('input').value = '';
    modal.classList.add('active');
}

function cerrarModalTexto() {
    document.getElementById('modal-texto').classList.remove('active');
    textoCallback = null;
}

function confirmarTexto() {
    const valor = document.getElementById('modal-texto-input').value;
    if (textoCallback) {
        textoCallback(valor);
    }
    cerrarModalTexto();
}

function mostrarModalFecha(callback) {
    fechaCallback = callback;
    document.getElementById('modal-fecha-input').value = '';
    document.getElementById('modal-fecha').classList.add('active');
}

function cerrarModalFecha() {
    document.getElementById('modal-fecha').classList.remove('active');
    fechaCallback = null;
}

function confirmarFecha() {
    const fecha = document.getElementById('modal-fecha-input').value;
    if (fechaCallback) {
        fechaCallback(fecha);
    }
    cerrarModalFecha();
}

function pedirTexto(titulo) {
    return new Promise((resolve) => {
        mostrarModalTexto(titulo, resolve);
    });
}

function pedirFecha() {
    return new Promise((resolve) => {
        mostrarModalFecha(resolve);
    });
}

// ============================================
// CONFIGURACIÓN SUPABASE
// ============================================
const SUPABASE_URL = 'https://hyixmaxhoxvamoecuars.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5aXhtYXhob3h2YW1vZWN1YXJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3OTg1NDMsImV4cCI6MjA4ODM3NDU0M30.ZLeJIWdip2f00h4TqkZH7eqMX4wpwphaqkJpAa0N0X4';

let supabaseClient;
try {
    supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('✅ Supabase inicializado correctamente');
} catch (e) {
    console.error('❌ Error al inicializar Supabase:', e);
    mostrarNotificacion('error', 'Error al conectar con Supabase. Recarga la página.');
    throw e;
}

// ============================================
// VARIABLES GLOBALES
// ============================================
let eventoActual = null;
let gruposScout = [];

// ============================================
// FUNCIONES DE GRUPOS (para datalist en eventos)
// ============================================
async function cargarGrupos() {
    try {
        const { data, error } = await supabaseClient
            .from('grupos_scout')
            .select('nombre, activo')
            .order('nombre');
        if (error) throw error;
        gruposScout = data || [];
        actualizarDatalist();
    } catch (error) {
        console.error('Error cargando grupos:', error);
        mostrarNotificacion('error', 'No se pudieron cargar los grupos scout.');
    }
}

function actualizarDatalist() {
    let datalist = document.getElementById('listaGruposDatalist');
    if (!datalist) {
        datalist = document.createElement('datalist');
        datalist.id = 'listaGruposDatalist';
        document.body.appendChild(datalist);
    }
    datalist.innerHTML = '';
    gruposScout.forEach(g => {
        const option = document.createElement('option');
        option.value = g.nombre;
        datalist.appendChild(option);
    });
}

async function agregarNuevoGrupo() {
    const input = document.getElementById('filtroGrupo');
    const nuevo = input.value.trim();
    if (!nuevo) {
        mostrarNotificacion('advertencia', 'Escriba un nombre de grupo válido.');
        return;
    }
    if (gruposScout.some(g => g.nombre.toLowerCase() === nuevo.toLowerCase())) {
        mostrarNotificacion('advertencia', 'El grupo ya existe en la Base de Datos.');
        return;
    }
    try {
        const { error } = await supabaseClient.from('grupos_scout').insert({ nombre: nuevo, activo: true });
        if (error) throw error;
        await cargarGrupos();
        mostrarNotificacion('exito', 'Grupo añadido a BD institucional.');
    } catch (error) {
        mostrarNotificacion('error', 'Error al agregar grupo.');
    }
}

// ============================================
// AUTENTICACIÓN (núcleo)
// ============================================
async function checkAuth() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) {
        // No hay sesión, redirigir a login.html
        window.location.href = 'login.html';
        return;
    }
    // Hay sesión, mostrar la aplicación
    mostrarApp();
}

function mostrarApp() {
    const appContainer = document.getElementById('app-container');
    if (appContainer) {
        appContainer.style.display = 'flex';
    }
    document.getElementById('user-desktop-info').style.display = 'block';
    init();
}

async function logout() {
    try {
        await supabaseClient.auth.signOut();
        window.location.href = 'login.html';
    } catch (error) {
        console.error('Error al cerrar sesión:', error);
        window.location.href = 'login.html';
    }
}

// ============================================
// FUNCIONES DE EVENTOS (básicas, para exportar)
// ============================================
async function cargarEventos() {
    try {
        const { data, error } = await supabaseClient
            .from('eventos')
            .select('*')
            .order('creado_en', { ascending: false });
        if (error) throw error;
        const select = document.getElementById('selector-evento');
        if (select) {
            select.innerHTML = '<option value="">-- Seleccione un Evento --</option>';
            (data || []).forEach(e => {
                const option = document.createElement('option');
                option.value = e.id;
                option.textContent = e.nombre;
                select.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error cargando eventos:', error);
        mostrarNotificacion('error', 'Error al cargar eventos.');
    }
}

function exportarDatos() {
    if (!eventoActual) {
        mostrarNotificacion('advertencia', 'Seleccione un evento para exportar.');
        return;
    }
    const dataDump = {
        metadata: {
            evento: eventoActual,
            fechaExportacion: new Date().toISOString(),
            software: 'ERP Scout AGSCh'
        },
    };
    const blob = new Blob([JSON.stringify(dataDump, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_${eventoActual.nombre.replace(/\s/g, '_')}_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    mostrarNotificacion('exito', 'Backup exportado.');
}

function imprimirSeccion() {
    window.print();
}

// ============================================
// NAVEGACIÓN Y UI
// ============================================
function toggleSidebarMobile() {
    document.getElementById('main-sidebar').classList.toggle('active');
}

function switchView(viewId, navElement) {
    document.querySelectorAll('.view-content').forEach(el => el.style.display = 'none');
    document.getElementById(viewId).style.display = 'block';
    if (navElement && !navElement.classList.contains('submenu-item')) {
        document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
        navElement.classList.add('active');
        if (navElement.id !== 'nav-eventos') {
            const submenu = document.getElementById('submenu-eventos');
            if (submenu) submenu.classList.remove('open');
        }
    }
    if (window.innerWidth <= 768) {
        document.getElementById('main-sidebar').classList.remove('active');
    }
    // Las vistas que usan iframes ya tienen su propia lógica de carga dentro del HTML principal
}

function cargarCalendario() {
    const url = document.getElementById('calendar-src').value;
    document.getElementById('calendar-iframe').src = url;
}

// ============================================
// INICIALIZACIÓN
// ============================================
async function init() {
    const appContainer = document.getElementById('app-container');
    if (appContainer) appContainer.style.display = 'flex';
    await cargarGrupos();
    await cargarEventos();
    // Forzar carga de los iframes iniciales (ya se hará al seleccionar la vista)
    switchView('view-dashboard', document.getElementById('nav-dashboard'));
    if (typeof window.cargarIframeDashboard === 'function') window.cargarIframeDashboard();
    if (typeof window.cargarIframeTesoreria === 'function') window.cargarIframeTesoreria();
    if (typeof window.cargarIframePrograma === 'function') window.cargarIframePrograma();
    if (typeof window.cargarIframeAdultos === 'function') window.cargarIframeAdultos();
    if (typeof window.cargarIframeDirectorio === 'function') window.cargarIframeDirectorio();
}

// ============================================
// INICIO
// ============================================
document.addEventListener('DOMContentLoaded', checkAuth);