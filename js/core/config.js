// ============================================================
// config.js — Configuración central del ERP Scout
// Grupo Guías y Scouts Salvador Sanfuentes
// ============================================================

export const SUPABASE_URL = 'https://hyixmaxhoxvamoecuars.supabase.co';
export const SUPABASE_ANON_KEY = 'sb_publishable_JW9Y4kz_Wiy6e1E1KdzAyQ_PBbWUf6t';

export const GRUPO = {
  nombre: 'Grupo Guías y Scouts Salvador Sanfuentes',
  logo: `${SUPABASE_URL}/storage/v1/object/public/logos/grupo.png`,
};

// Ramas según metodología AGSCh (nombres reales de unidades del grupo)
export const UNIDADES = [
  { rama: 'Bandada',  nombre: 'Bandada Pilmaikén Kalfü', color: '#0EA5E9' },
  { rama: 'Manada',   nombre: 'Manada Kupëlwue Kadü',    color: '#F59E0B' },
  { rama: 'Compañía', nombre: 'Compañía Antuwenüy',      color: '#10B981' },
  { rama: 'Tropa',    nombre: 'Tropa Manke Pillán',      color: '#EF4444' },
  { rama: 'Avanzada', nombre: 'Avanzada Toki Pillan',    color: '#8B5CF6' },
  { rama: 'Clan',     nombre: 'Clan Kutral Raigüen',     color: '#B91C1C' },
];

export const AREAS_DESARROLLO = [
  'corporalidad', 'creatividad', 'carácter',
  'afectividad', 'sociabilidad', 'espiritualidad',
];

export const ETAPAS_PROGRESION = {
  'Clan': ['Paso', 'Compromiso', 'Partida'],
  'Avanzada': ['Cruz del Sur', 'Rumbo', 'Travesía', 'Cumbre'],
};

// ============================================================
// REGISTRO DE MÓDULOS
// Cada módulo del sistema original se carga completo (campo `legacy`)
// garantizando 100% de aspecto y funcionalidad.
// Migración progresiva: cuando un módulo nativo alcanza paridad,
// se reemplaza `legacy` por `nativo: true` y se crea js/modules/<id>.js.
// Los módulos nativos existentes (dashboard, directorio, programa,
// tesoreria) quedan disponibles como vistas beta con sufijo -beta.
// ============================================================
export const MODULOS = [
  { id: 'dashboard',      titulo: 'Dashboard',             icono: '📊', permiso: null,             legacy: 'dashboard.html' },
  { id: 'directorio',     titulo: 'Directorio',            icono: '👥', permiso: 'directorio',     legacy: 'directorio.html' },
  { id: 'programa',       titulo: 'Programa de Jóvenes',   icono: '🌱', permiso: 'programa',       legacy: 'programa_jovenes.html' },
  { id: 'progresion',     titulo: 'Progresión e Insignias',icono: '🎖️', permiso: 'programa',       legacy: 'progresion_insignias.html' },
  { id: 'tesoreria',      titulo: 'Tesorería',             icono: '💰', permiso: 'tesoreria',      legacy: 'tesoreria.html' },
  { id: 'comunicaciones', titulo: 'Comunicaciones',        icono: '📨', permiso: 'comunicaciones', legacy: 'comunicaciones.html' },
  { id: 'whatsapp',       titulo: 'Bandeja WhatsApp',      icono: '💬', permiso: 'comunicaciones', legacy: 'bandeja_whatsapp.html' },
  { id: 'inventario',     titulo: 'Inventario',            icono: '📦', permiso: 'inventario',     legacy: 'inventario_grupo.html' },
  { id: 'eventos',        titulo: 'Eventos',               icono: '🏕️', permiso: 'eventos',        legacy: 'eventos_iframe.html' },
  { id: 'reuniones',      titulo: 'Planificador Reuniones',icono: '📅', permiso: 'programa',       legacy: 'planificador_reuniones.html' },
  { id: 'adultos',        titulo: 'Adulto Voluntario',     icono: '🧭', permiso: 'adultos',        legacy: 'adulto_voluntario.html' },
  { id: 'checkin',        titulo: 'Check-in QR',           icono: '📱', permiso: 'eventos',        legacy: 'checkin_qr.html' },
  { id: 'usuarios',       titulo: 'Gestión de Usuarios',   icono: '🔐', permiso: 'admin',          legacy: 'gestion_usuarios.html' },
  { id: 'certificados',   titulo: 'Certificados',          icono: '📜', permiso: 'admin',          legacy: 'certificados_demo.html' },
  { id: 'inscripcion',    titulo: 'Inscripción Pública',   icono: '📝', permiso: null,             legacy: 'inscripcion_publica.html' },
  // ---- Vistas nativas beta (migración en curso, no reemplazan a las originales) ----
  { id: 'dashboard-beta',  titulo: 'Dashboard (beta)',  icono: '🧪', permiso: 'admin', beta: true },
  { id: 'directorio-beta', titulo: 'Directorio (beta)', icono: '🧪', permiso: 'admin', beta: true },
  { id: 'programa-beta',   titulo: 'Programa (beta)',   icono: '🧪', permiso: 'admin', beta: true },
  { id: 'tesoreria-beta',  titulo: 'Tesorería (beta)',  icono: '🧪', permiso: 'admin', beta: true },
];
