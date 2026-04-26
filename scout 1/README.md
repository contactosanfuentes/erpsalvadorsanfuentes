# ERP Scout — Grupo Guías y Scouts Salvador Sanfuentes
## Versión con WhatsApp Business API integrada

---

## 🚀 Despliegue en Netlify (3 pasos)

1. Ve a https://app.netlify.com/drop
2. Arrastra ESTA carpeta completa al navegador
3. Listo — el sitio queda en línea

Si ya tienes el sitio `salvadorsanfuentes-erp.netlify.app`:
- Panel Netlify → Deploys → "Drag and drop" la carpeta

---

## 📱 Activar WhatsApp Business API

### Primer uso
Al abrir cualquier módulo que envíe WhatsApp por primera vez,
el sistema pedirá el token de acceso. Solo se pide una vez —
queda guardado en el navegador.

**Dónde obtener el token permanente:**
Meta for Developers → tu app (1505551574580367) → WhatsApp → Configuración API → "Generar token"
O mejor: Meta Business Suite → Configuración → Usuarios del sistema → token permanente

### Datos configurados en wa_api.js
- Phone Number ID : 1152721121253729
- WABA ID         : 3507365259439446
- Número          : +56 9 3533 0101
- Plantilla       : mensaje_grupo (idioma: es)

### Cuando Meta apruebe tu plantilla
Edita `wa_api.js` línea 22:
```js
const TEMPLATE_NAME = 'mensaje_grupo'; // ← cambia por el nombre exacto aprobado
```

---

## 📋 Mapa de módulos y WhatsApp

| Módulo | WhatsApp | Tipo |
|--------|----------|------|
| comunicaciones.html | ✅ Opcional | Botón "Enviar por WhatsApp" |
| inscripcion_publica.html | ✅ Automático | Confirmación al inscribirse |
| progresion_insignias.html | ✅ Automático | Avance de etapa + especialidades |
| portal_apoderados.html | — | Solo consulta |
| checkin_qr.html | — | Solo escaneo |
| eventos_iframe.html | — | Gestión interna |
| planificador_reuniones.html | — | Google Calendar |
| directorio.html | — | Directorio |
| inventario_grupo.html | — | Inventario |
| tesoreria.html | — | Finanzas |
| adulto_voluntario.html | — | Registro adultos |
| programa_jovenes.html | — | Programa |
| dashboard.html | — | Dashboard |

---

## 🗄️ Supabase
URL: https://hyixmaxhoxvamoecuars.supabase.co

Bucket storage necesario: `fotos` (ya existe)
Bucket opcional: `comunicaciones` (para adjuntos de correos)

---

## 🔐 Política de privacidad
Disponible en: /privacidad.html
URL para Meta: https://TU-SITIO.netlify.app/privacidad.html

---

## 📝 Plantilla WhatsApp (mensaje_grupo)

Cuerpo:
```
Hola {{1}} 👋

{{2}}

Si tienes dudas, responde este mensaje o contáctanos directamente.

Grupo Guías y Scouts Salvador Sanfuentes 🔵🟡
```

Muestras para Meta:
- {{1}}: María
- {{2}}: Tu inscripción ha sido recibida exitosamente. En los próximos días un dirigente se contactará contigo.
