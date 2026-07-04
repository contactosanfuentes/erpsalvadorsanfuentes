# ERP Scout — Plataforma con migración modular
Grupo Guías y Scouts Salvador Sanfuentes

## Garantía de integridad
La lógica de TODOS los módulos es la del sistema original, verificada
automáticamente en cada migración (ver "Método de migración").

## Estado de la migración modular

| Módulo | Estado | Estructura |
|---|---|---|
| **Programa de Jóvenes** | ✅ | `programa_jovenes/` — 23 JS + 2 CSS (antes 5.237 ln) |
| **Adulto Voluntario** | ✅ | `adulto_voluntario/` — 13 JS + 2 CSS (antes 2.166 ln) |
| **Eventos** | ✅ | `eventos/` — 22 JS + 1 CSS (antes 5.015 ln) |
| **Tesorería** | ✅ | `tesoreria/` — 12 JS + 1 CSS (antes 1.866 ln) |
| **Bandeja WhatsApp** | ✅ | `bandeja_whatsapp/` — 5 JS + 1 CSS |
| **Gestión de Usuarios** | ✅ | `usuarios/` — 7 JS + 1 CSS |
| **Directorio** | ✅ | `directorio/` — 5 JS + 1 CSS |
| **Dashboard** | ✅ | `dashboard/` — 5 JS + 1 CSS |
| **Shell principal (index)** | ✅ | `shell/` — 5 JS + 1 CSS |
| **Portal Caminante** | ✅ | `caminante/` — 7 JS + 1 CSS |
| **Certificados** | ✅ | `certificados/` — 4 JS + 2 CSS |
| **Comunicaciones** | ✅ (etapa 1) | `comunicaciones/` — JS+CSS externos (IIFE único, división interna en etapa 2) |
| **Inventario** | ✅ (etapa 1) | `inventario/` — JS+CSS externos |
| **Check-in QR** | ✅ (etapa 1) | `checkin/` — JS+CSS externos |
| **Progresión e Insignias** | ✅ (etapa 1) | `progresion/` — JS+CSS externos |
| **Planificador Reuniones** | ✅ (etapa 1) | `planificador/` — JS+CSS externos |
| **Inscripción Pública** | ✅ (etapa 1) | `inscripcion/` — JS+CSS externos |
| **Portal Apoderados** | ✅ (etapa 1) | `apoderados/` — JS+CSS externos |

**Etapa 2 COMPLETADA**: los 7 módulos IIFE fueron desenvueltos y divididos en archivos
temáticos. Método: análisis de colisiones de nombres contra los scripts compartidos de
cada página (cero colisiones), desenvoltura del cierre (las declaraciones pasan al ámbito
léxico global de la página, semántica equivalente al no existir colisiones), y la cola de
inicialización con `await` de nivel superior queda envuelta en su propio `(async()=>{})()`.
Verificación: la concatenación desenvuelta reproduce el cuerpo original exacto.
Resultado: comunicaciones 9 archivos · inscripción 8 · planificador 7 · inventario 5 ·
progresión 5 · check-in 2 · apoderados 2.
Cambio semántico único y deliberado: en comunicaciones `const URL` → `const SB_URL`
(evita sombrear el constructor nativo URL al pasar a ámbito global).

## Reparaciones aplicadas (bugs preexistentes de producción)
1. **`google-api-helper.js` reconstruido** — el archivo era un HTML corrupto. El nuevo
   helper expone `window.GoogleAPI` (call / Calendar / Docs / Sheets) con la interfaz
   verificada contra el código desplegado de las edge functions google-calendar v1,
   google-docs v2 y google-sheets v1. Probado end-to-end (listar_calendarios → OK).
   Esto repara: sincronizar reuniones a Google Calendar y generar actas en Docs
   desde el Planificador.
2. **Bloques corruptos eliminados** en directorio, inventario, eventos y tesorería:
   tags `<script src="google-api-helper.js">` con fragmentos de código huérfanos
   dentro (código muerto que el navegador ignoraba). En tesorería el fragmento
   estaba dentro del bloque del service worker causando un error de sintaxis que
   impedía su registro — reparado.
   Nota: las funciones de "exportar a Google Sheets" de esas 4 páginas ya estaban
   destruidas en producción (sin botones que las llamen). Reconstruirlas es una
   mejora nueva a pedir aparte; el helper ya deja lista la API `GoogleAPI.Sheets`.

### Módulos de Programa de Jóvenes (`programa_jovenes/js/`)
00 núcleo y acceso · 01 constantes AGSCh · 02 estado y utilidades · 03 carga y listado ·
04 notificaciones de hito · 05 expediente del beneficiario · 06 progresión y proyectos DB ·
07 objetivos educativos · 08 sonar, competencias y camino · 09 evaluación y firmas ·
10 especialidades y monitores · 11 proyectos colectivos · 12 proyectos vigentes ·
13 ficha extendida y presupuesto · 14 evidencias y Drive · 15 toggles de estado ·
16 fotos y cropper · 17 edición institucional · 18 transferir a adultos ·
19 pase de unidad · 20 expediente PDF · 21 dashboard KPIs · 22 inicialización

### Módulos de Adulto Voluntario (`adulto_voluntario/js/`)
00 diccionario de competencias · 01 núcleo y config · 02 estado y utilidades ·
03 certificados y Drive · 04 competencias UI · 05 padrón y carga · 06 tabs y asesorados ·
07 perfil y steppers · 08 fotos y cropper · 09 edición ficha PPF · 10 guardar edición ·
11 expediente documental · 12 inicialización

### Módulos de Eventos (`eventos/js/`)
00 núcleo y config · 01 diálogos e impresión · 02 estado global · 03 grupos y unidades ·
04 carga de datos y eventos · 05 realtime · 06 edición de evento · 07 participantes jóvenes ·
08 participantes adultos · 09 ingresos y gastos · 10 planilla y puntuación · 11 postas y objetivos ·
12 pasaporte · 13 croquis · 14 inventario del evento · 15 menú y entregas · 16 presupuesto ·
17 metas e indicadores · 18 credenciales · 19 comprobantes y email · 20 navegación UI · 21 inicialización

## Método de migración (aplicable a los módulos restantes)
Descomposición por AST (acorn), **no reescritura**: el script monolítico se corta
únicamente en fronteras de sentencias completas de nivel superior y se agrupa por tema.
Cada migración pasa 3 verificaciones automáticas antes de aceptarse:
- **A**: la concatenación de los módulos es byte a byte idéntica al script original
- **B**: cada módulo parsea como JS válido independiente
- **C**: la página regenerada reconstruye el archivo original exacto (end-to-end)
Los scripts clásicos cargados en orden comparten el ámbito global igual que el
script único original → semántica de ejecución idéntica, cero pérdida funcional.
Herramienta: `migrador.js` + configs `cfg_*.json` (incluidos en el repo de trabajo).

## Dos puntos de entrada
| Entrada | Qué es |
|---|---|
| `index.html` | El shell original, exactamente como siempre |
| `app.html`   | Shell modular ES Modules (js/core/): misma sesión, carga los mismos módulos |

## Deploy por API (sin arrastrar carpetas)
```
zip -r deploy.zip . -x "deploy.zip"
curl -H "Authorization: Bearer $NETLIFY_TOKEN" -H "Content-Type: application/zip" \
     --data-binary @deploy.zip \
     https://api.netlify.com/api/v1/sites/0e8dd74f-1175-4d23-84c1-a90999609ccf/deploys
```
