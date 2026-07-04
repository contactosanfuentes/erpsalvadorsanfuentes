// ============================================================
// google-api-helper.js — Puente frontend → funciones Edge de Google
// Reconstruido (el archivo anterior era un HTML corrupto).
// Interfaz verificada contra el código desplegado de las edge
// functions: google-calendar v1, google-docs v2, google-sheets v1.
// Respuestas: { ok: true, accion, resultado } | { error }
// ============================================================
(function () {
  const SUPA_URL = 'https://hyixmaxhoxvamoecuars.supabase.co';
  const SUPA_KEY = 'sb_publishable_JW9Y4kz_Wiy6e1E1KdzAyQ_PBbWUf6t';

  // Llamada genérica a una función Edge: GoogleAPI.call('google-calendar', {accion, ...})
  async function call(fn, payload) {
    const res = await fetch(`${SUPA_URL}/functions/v1/${fn}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPA_KEY,
        'Authorization': `Bearer ${SUPA_KEY}`,
      },
      body: JSON.stringify(payload || {}),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok && !data.error) data.error = `HTTP ${res.status}`;
    return data;
  }

  // ---------- Calendar (edge: google-calendar) ----------
  const Calendar = {
    // Acepta las claves camelCase que usa el planificador y las traduce
    crearEvento(p) {
      return call('google-calendar', {
        accion: 'crear_evento',
        calendar_id: p.calendarId || p.calendar_id || 'primary',
        titulo: p.titulo,
        lugar: p.lugar,
        descripcion: p.descripcion,
        fecha_inicio: p.fechaInicio || p.fecha_inicio,
        fecha_fin: p.fechaFin || p.fecha_fin,
        todo_el_dia: p.todoElDia || p.todo_el_dia || false,
        invitados: p.invitados || [],
        enviar_invitaciones: p.enviarInvitaciones || p.enviar_invitaciones || false,
        color: p.color,
      });
    },
    actualizarEvento(p) {
      return call('google-calendar', {
        accion: 'actualizar_evento',
        calendar_id: p.calendarId || p.calendar_id || 'primary',
        event_id: p.eventId || p.event_id,
        titulo: p.titulo,
        lugar: p.lugar,
        descripcion: p.descripcion,
        fecha_inicio: p.fechaInicio || p.fecha_inicio,
        fecha_fin: p.fechaFin || p.fecha_fin,
        todo_el_dia: p.todoElDia || p.todo_el_dia || false,
      });
    },
    eliminarEvento(calendarId, eventId) {
      return call('google-calendar', { accion: 'eliminar_evento', calendar_id: calendarId, event_id: eventId });
    },
    listarEventos(calendarId, fechaDesde, fechaHasta, max) {
      return call('google-calendar', { accion: 'listar_eventos', calendar_id: calendarId, fecha_desde: fechaDesde, fecha_hasta: fechaHasta, max });
    },
    listarCalendarios() {
      return call('google-calendar', { accion: 'listar_calendarios' });
    },
  };

  // ---------- Docs (edge: google-docs) ----------
  const Docs = {
    // p: {fecha, lugar, convocante, asistentes[], temas[], folder_id?}
    crearActa(p) { return call('google-docs', { accion: 'crear_acta', ...p }); },
    crearCarta(p) { return call('google-docs', { accion: 'crear_carta', ...p }); },
    crearDocumento(p) { return call('google-docs', { accion: 'crear_documento', ...p }); },
  };

  // ---------- Sheets (edge: google-sheets) ----------
  const Sheets = {
    // hojas: [{nombre, datos: any[][]}] — la primera fila de datos es el encabezado
    crearPlanilla(titulo, hojas, folderId) {
      return call('google-sheets', { accion: 'crear_planilla', titulo, hojas, folder_id: folderId });
    },
    // Azúcar: una sola hoja a partir de columnas + filas
    exportar(titulo, columnas, filas, folderId) {
      return Sheets.crearPlanilla(titulo, [{ nombre: 'Datos', datos: [columnas, ...filas] }], folderId);
    },
    agregarFilas(spreadsheetId, hoja, datos) {
      return call('google-sheets', { accion: 'agregar_filas', spreadsheet_id: spreadsheetId, hoja, datos });
    },
    actualizarHoja(spreadsheetId, rango, datos) {
      return call('google-sheets', { accion: 'actualizar_hoja', spreadsheet_id: spreadsheetId, rango, datos });
    },
    leerHoja(spreadsheetId, rango) {
      return call('google-sheets', { accion: 'leer_hoja', spreadsheet_id: spreadsheetId, rango });
    },
  };

  window.GoogleAPI = { call, Calendar, Docs, Sheets };
})();
