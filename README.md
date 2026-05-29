# ERP Scout — Sistema de Gestión del Grupo Guías y Scouts Salvador Sanfuentes

Sistema de gestión integral (ERP) de código abierto desarrollado para el **Grupo
Guías y Scouts Salvador Sanfuentes** (Chile), una organización sin fines de
lucro perteneciente a la Asociación de Guías y Scouts de Chile.

Este proyecto es una aplicación web progresiva (PWA) que digitaliza la gestión
educativa, administrativa y comunitaria de un grupo scout: registro de
beneficiarios y dirigentes, progresión personal, gestión de proyectos,
eventos, tesorería y comunicaciones.

> Este sitio está alojado gracias al programa Open Source de Netlify.
> _This site is powered by Netlify._

## Características principales

- **Programa de Jóvenes** — Registro de beneficiarios, seguimiento de progresión
  personal, especialidades, competencias y proyectos por rama (Bandada, Manada,
  Tropa, Compañía, Avanzada, Clan).
- **Voluntariado Adulto** — Gestión de dirigentes, formación PPF, evaluación de
  desempeño y verificación de antecedentes (VCM).
- **Gestión de Proyectos** — Ficha de proyecto extendida con objetivos, plan de
  acción, presupuesto, indicadores y árbol del problema.
- **Eventos** — Planificación, presupuesto e importación desde proyectos.
- **Tesorería** — Control financiero por evento y cuentas del grupo.
- **Comunicaciones** — Envío de correos y mensajes de WhatsApp, con bandeja de
  entrada bidireccional en tiempo real.
- **Portal del Caminante** — Portal externo para que los jóvenes gestionen sus
  proyectos de vida e intervención social.
- **PWA instalable** — Funciona como aplicación nativa en móviles y escritorio.

## Tecnologías

- **Frontend:** HTML, CSS, JavaScript (vanilla), Tailwind CSS
- **Backend:** [Supabase](https://supabase.com) (PostgreSQL, Storage, Edge Functions, Realtime)
- **Hosting:** [Netlify](https://www.netlify.com)
- **Integraciones:** WhatsApp Cloud API (Meta), Resend (correos)

## Estructura del proyecto

```
.
├── index.html              # Panel principal con navegación
├── login.html              # Acceso al sistema
├── programa_jovenes.html   # Módulo de beneficiarios y progresión
├── adulto_voluntario.html  # Módulo de dirigentes
├── eventos_iframe.html     # Gestión de eventos
├── tesoreria.html          # Gestión financiera
├── comunicaciones.html     # Mensajería masiva
├── bandeja_whatsapp.html   # Bandeja de entrada de WhatsApp
├── portal_caminante.html   # Portal externo de proyectos
├── netlify/functions/      # Funciones serverless (webhook, correos)
├── manifest.json           # Configuración PWA
├── sw.js                   # Service Worker
├── LICENSE                 # Licencia Apache 2.0
└── CODE_OF_CONDUCT.md      # Código de Conducta
```

## Licencia

Este proyecto está licenciado bajo la **Licencia Apache 2.0**. Consulta el
archivo [LICENSE](./LICENSE) para más detalles.

## Código de Conducta

Este proyecto se rige por un [Código de Conducta](./CODE_OF_CONDUCT.md). Al
participar, se espera que respetes estos lineamientos.

## Contribuciones

Las contribuciones son bienvenidas. Este es un proyecto sin fines de lucro
desarrollado para apoyar la labor educativa del movimiento scout.

---

_Siempre Listos, Siempre Listas._ ⚜️
