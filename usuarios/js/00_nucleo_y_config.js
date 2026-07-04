const SUPA_URL='https://hyixmaxhoxvamoecuars.supabase.co';
const SUPA_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5aXhtYXhob3h2YW1vZWN1YXJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3OTg1NDMsImV4cCI6MjA4ODM3NDU0M30.ZLeJIWdip2f00h4TqkZH7eqMX4wpwphaqkJpAa0N0X4';
const sb=supabase.createClient(SUPA_URL,SUPA_KEY);
const WS_FN=SUPA_URL+'/functions/v1/admin-workspace';

const PLABELS={
  ver_jovenes:'Ver jóvenes',editar_jovenes:'Editar jóvenes',eliminar_jovenes:'Eliminar jóvenes',
  ver_adultos:'Ver adultos',editar_adultos:'Editar adultos',eliminar_adultos:'Eliminar adultos',
  ver_eventos:'Ver eventos',eventos:'Gestionar eventos',crear_eventos_propios:'Crear eventos propios',
  tesoreria:'Tesorería',comunicaciones:'Comunicaciones',inventario:'Inventario',
  reportes:'Reportes',certificados:'Certificados',progresion:'Progresión',
  checkin:'Check-in','configuracion':'Configuración',gestion_usuarios:'Gestión usuarios',
  ver_perfil_propio:'Ver propio perfil',editar_ppf_propio:'Editar PPF propio'
};

let usuarios=[],rolesDef={},miPerfil=null;
let _resetEmail='';

// ═══ WORKSPACE — llamada a Edge Function ═══
