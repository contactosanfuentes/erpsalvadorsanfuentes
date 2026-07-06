        // ============================================================
        // SINCRONIZACIÓN BIDIRECCIONAL TESORERÍA ↔ GOOGLE SHEETS
        // Planilla del tesorero: "TESORERIA 2026". El ERP NUNCA toca
        // las pestañas humanas (CONSOLIDADO, BANDADA, etc.); trabaja
        // en tres pestañas propias:
        //   ERP_MOVIMIENTOS  (push: volcado completo, sobrescrito)
        //   ERP_SALDOS       (push: saldo por cuenta, sobrescrito)
        //   ERP_IMPORTAR     (pull: filas anotadas a mano → ERP, con
        //                     marca de estado anti-duplicados)
        // ============================================================
        const SHEETS_FN = SUPABASE_URL + '/functions/v1/google-sheets';
        const SHEET_ID_DEFAULT = '1IX7982q7HakLr-5QVPLCnZtHaxV3eI4JZZMYvgtjbNg';
        const sheetId = () => localStorage.getItem('tesoreria_sheet_id') || SHEET_ID_DEFAULT;

        async function sheetsFn(accion, params) {
            const r = await fetch(SHEETS_FN, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + SUPABASE_KEY },
                body: JSON.stringify({ accion, ...params })
            });
            const d = await r.json();
            if (d.error) {
                if (/permission/i.test(d.error)) throw new Error('La cuenta del sistema (admin@salvadorsanfuentes.org) no tiene permiso de EDICIÓN en la planilla. En Google Sheets: Compartir → agregar admin@salvadorsanfuentes.org como Editor, y reintenta.');
                throw new Error(d.error);
            }
            return d.resultado;
        }

        function renderSheetsSync() {
            const container = document.getElementById('tesoreriaContent');
            const url = `https://docs.google.com/spreadsheets/d/${sheetId()}/edit`;
            container.innerHTML = `
            <div class="grid md:grid-cols-2 gap-4">
                <div class="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
                    <h3 class="font-bold text-slate-700 mb-1"><i class="fas fa-arrow-up text-emerald-500"></i> Enviar a Google Sheets</h3>
                    <p class="text-xs text-slate-400 mb-4">Vuelca todos los movimientos y saldos del ERP a las pestañas <code>ERP_MOVIMIENTOS</code> y <code>ERP_SALDOS</code> de la planilla. Se sobrescriben completas (sin duplicados). Las pestañas del tesorero no se tocan.</p>
                    <button onclick="exportarASheets()" id="btn-push-sheets" class="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold w-full"><i class="fas fa-cloud-arrow-up"></i> Sincronizar ERP → Sheets</button>
                </div>
                <div class="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
                    <h3 class="font-bold text-slate-700 mb-1"><i class="fas fa-arrow-down text-indigo-500"></i> Importar desde Google Sheets</h3>
                    <p class="text-xs text-slate-400 mb-4">Lee la pestaña <code>ERP_IMPORTAR</code>: cada fila con FECHA, CÓDIGO CUENTA, CONCEPTO y MONTO (negativo = gasto) se crea como movimiento. Las filas importadas quedan marcadas en la planilla y no se repiten.</p>
                    <button onclick="importarDesdeSheets()" id="btn-pull-sheets" class="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold w-full"><i class="fas fa-cloud-arrow-down"></i> Importar Sheets → ERP</button>
                </div>
            </div>
            <div class="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 mt-4">
                <div class="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h3 class="font-bold text-slate-700 text-sm"><i class="fas fa-table text-green-600"></i> Planilla conectada</h3>
                        <a href="${url}" target="_blank" class="text-xs text-indigo-600 hover:underline break-all">${url}</a>
                    </div>
                    <div class="flex gap-2">
                        <button onclick="prepararPestanasERP()" class="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-600"><i class="fas fa-table-columns"></i> Preparar pestañas ERP</button>
                        <button onclick="cambiarSheetId()" class="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-600"><i class="fas fa-link"></i> Cambiar planilla</button>
                    </div>
                </div>
                <div id="sheets-log" class="mt-4 text-xs font-mono bg-slate-50 rounded-xl p-3 max-h-52 overflow-y-auto hidden"></div>
            </div>`;
        }

        const slog = (m, esError) => {
            const el = document.getElementById('sheets-log');
            if (!el) return;
            el.classList.remove('hidden');
            el.innerHTML += `<div class="${esError ? 'text-rose-600' : 'text-slate-600'}">${m}</div>`;
            el.scrollTop = el.scrollHeight;
        };

        function cambiarSheetId() {
            const actual = sheetId();
            const nuevo = prompt('ID de la planilla de Google Sheets (el tramo largo de la URL):', actual);
            if (nuevo === null) return;
            if (nuevo.trim()) localStorage.setItem('tesoreria_sheet_id', nuevo.trim());
            renderSheetsSync();
        }

        // ── Preparar pestañas ERP (idempotente) ──
        async function prepararPestanasERP() {
            try {
                slog('Verificando pestañas ERP en la planilla...');
                const r = await sheetsFn('asegurar_hojas', { spreadsheet_id: sheetId(), nombres: ['ERP_MOVIMIENTOS', 'ERP_SALDOS', 'ERP_IMPORTAR'] });
                if (r.creadas.length) {
                    slog('✓ Pestañas creadas: ' + r.creadas.join(', '));
                    // Encabezados de ERP_IMPORTAR con instrucciones
                    await sheetsFn('actualizar_hoja', { spreadsheet_id: sheetId(), rango: 'ERP_IMPORTAR!A1:H2', datos: [
                        ['FECHA (DD-MM-AAAA)', 'CODIGO CUENTA', 'CONCEPTO', 'MONTO (negativo = gasto)', 'RUN (opcional)', 'NOMBRE (opcional)', 'REFERENCIA (opcional)', 'ESTADO (no tocar)'],
                        ['Ej: 15-07-2026', 'Ej: CTA-0016 o EV-2026-0004', 'Ej: Cuota campamento Juan Pérez', 'Ej: 15000 o -8000', '', '', '', '']
                    ]});
                    slog('✓ Encabezados de ERP_IMPORTAR escritos');
                } else {
                    slog('✓ Las 3 pestañas ERP ya existen');
                }
            } catch (e) { slog('✗ ' + e.message, true); }
        }

        // ── PUSH: ERP → Sheets ──
        async function exportarASheets() {
            const btn = document.getElementById('btn-push-sheets');
            btn.disabled = true; btn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Sincronizando...';
            try {
                await prepararPestanasERP();
                slog('Leyendo movimientos del ERP...');
                const { data: movs, error } = await supabaseClient.from('tesoreria_movimientos')
                    .select('fecha, concepto, monto, referencia, persona_run, persona_nombre, cuenta_id')
                    .order('fecha', { ascending: false }).limit(2000);
                if (error) throw error;
                const cuentaDe = (id) => accounts.find(a => a.id === id) || {};

                // ERP_MOVIMIENTOS
                const filasMov = [['FECHA','CODIGO','CUENTA','CONCEPTO','PERSONA','RUN','MONTO','REFERENCIA']];
                (movs || []).forEach(m => {
                    const c = cuentaDe(m.cuenta_id);
                    filasMov.push([m.fecha || '', c.codigo || '', c.nombre || '', m.concepto || '', m.persona_nombre || '', m.persona_run || '', m.monto || 0, m.referencia || '']);
                });
                await sheetsFn('limpiar_rango', { spreadsheet_id: sheetId(), rango: 'ERP_MOVIMIENTOS!A:Z' });
                await sheetsFn('actualizar_hoja', { spreadsheet_id: sheetId(), rango: `ERP_MOVIMIENTOS!A1:H${filasMov.length}`, datos: filasMov });
                slog(`✓ ERP_MOVIMIENTOS: ${filasMov.length - 1} movimientos`);

                // ERP_SALDOS
                const filasSaldo = [['CODIGO','CUENTA','TIPO','INGRESOS','EGRESOS','SALDO']];
                let totIn = 0, totEg = 0;
                accounts.forEach(a => {
                    const ms = (movs || []).filter(m => m.cuenta_id === a.id);
                    const ing = ms.filter(m => m.monto > 0).reduce((s, m) => s + m.monto, 0);
                    const eg = ms.filter(m => m.monto < 0).reduce((s, m) => s + m.monto, 0);
                    totIn += ing; totEg += eg;
                    filasSaldo.push([a.codigo || '', a.nombre, a.tipo, ing, eg, ing + eg]);
                });
                filasSaldo.push(['', 'TOTAL', '', totIn, totEg, totIn + totEg]);
                filasSaldo.push([]);
                filasSaldo.push(['Última sincronización desde el ERP:', new Date().toLocaleString('es-CL')]);
                await sheetsFn('limpiar_rango', { spreadsheet_id: sheetId(), rango: 'ERP_SALDOS!A:Z' });
                await sheetsFn('actualizar_hoja', { spreadsheet_id: sheetId(), rango: `ERP_SALDOS!A1:F${filasSaldo.length}`, datos: filasSaldo });
                slog(`✓ ERP_SALDOS: ${accounts.length} cuentas + total`);
                slog('🎉 Sincronización ERP → Sheets completa');
                showToast('Sheets actualizado', 'success');
            } catch (e) { slog('✗ ' + e.message, true); showToast('Error: ' + e.message, 'error'); }
            btn.disabled = false; btn.innerHTML = '<i class="fas fa-cloud-arrow-up"></i> Sincronizar ERP → Sheets';
        }

        // ── PULL: Sheets → ERP ──
        function parseMontoCL(v) {
            // Acepta 15000, -8000, "$15.000", "-$8.000", "15.000"
            const s = String(v ?? '').replace(/\$/g, '').replace(/\./g, '').replace(/,/g, '.').trim();
            const n = parseFloat(s);
            return isNaN(n) ? null : n;
        }
        function parseFechaCL(v) {
            const s = String(v ?? '').trim();
            let m = s.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/) || s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
            if (m) return `${m[3]}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`;
            if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
            return null;
        }

        async function importarDesdeSheets() {
            const btn = document.getElementById('btn-pull-sheets');
            btn.disabled = true; btn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Importando...';
            try {
                await prepararPestanasERP();
                slog('Leyendo ERP_IMPORTAR...');
                const filas = await sheetsFn('leer_hoja', { spreadsheet_id: sheetId(), rango: 'ERP_IMPORTAR!A1:H500' });
                let importadas = 0, errores = 0, saltadas = 0;
                const marcas = [];   // [filaIndex(1-based), texto estado]

                for (let i = 2; i < filas.length; i++) {   // fila 1 encabezado, fila 2 ejemplo
                    const f = filas[i] || [];
                    const [fechaRaw, codigoRaw, concepto, montoRaw, run, nombre, referencia, estado] = [f[0], f[1], f[2], f[3], f[4], f[5], f[6], f[7]];
                    const vacia = ![fechaRaw, codigoRaw, concepto, montoRaw].some(x => String(x ?? '').trim());
                    if (vacia) continue;
                    if (String(estado || '').trim()) { saltadas++; continue; }   // ya procesada

                    const fecha = parseFechaCL(fechaRaw);
                    const monto = parseMontoCL(montoRaw);
                    const codigo = String(codigoRaw || '').trim().toUpperCase();
                    const cuenta = accounts.find(a => (a.codigo || '').toUpperCase() === codigo);
                    let marca;
                    if (!fecha) marca = 'ERROR: fecha inválida (usar DD-MM-AAAA)';
                    else if (monto === null || monto === 0) marca = 'ERROR: monto inválido';
                    else if (!cuenta) marca = `ERROR: cuenta "${codigo}" no existe (ver ERP_SALDOS)`;
                    else if (!String(concepto || '').trim()) marca = 'ERROR: falta concepto';
                    else {
                        const { error } = await supabaseClient.from('tesoreria_movimientos').insert({
                            cuenta_id: cuenta.id, fecha, monto, moneda: 'CLP',
                            concepto: String(concepto).trim(),
                            referencia: String(referencia || '').trim() || 'Importado desde Sheets',
                            persona_run: String(run || '').trim() || null,
                            persona_nombre: String(nombre || '').trim() || null
                        });
                        marca = error ? 'ERROR: ' + error.message : `IMPORTADO ✓ ${new Date().toLocaleString('es-CL')}`;
                        if (!error) importadas++; else errores++;
                    }
                    if (marca.startsWith('ERROR')) errores++;
                    marcas.push([i + 1, marca]);
                }
                // Escribir marcas de vuelta (columna H)
                for (const [fila, texto] of marcas) {
                    await sheetsFn('actualizar_hoja', { spreadsheet_id: sheetId(), rango: `ERP_IMPORTAR!H${fila}`, datos: [[texto]] });
                }
                slog(`✓ Importación: ${importadas} creadas · ${saltadas} ya procesadas · ${errores} con error (ver columna ESTADO en la planilla)`);
                if (importadas) { showToast(`${importadas} movimientos importados`, 'success'); await cargarDatos(); }
                else showToast('Sin filas nuevas para importar', 'info');
            } catch (e) { slog('✗ ' + e.message, true); showToast('Error: ' + e.message, 'error'); }
            btn.disabled = false; btn.innerHTML = '<i class="fas fa-cloud-arrow-down"></i> Importar Sheets → ERP';
        }
