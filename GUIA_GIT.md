# Guía: conectar el ERP a GitHub + Netlify (deploy automático)

Con esto se acaban los ZIP manuales: cada `git push` despliega solo,
y las Netlify Functions (subir-drive) por fin compilan.

## Paso 1 — Crear el repositorio en GitHub (2 min)
1. Entra a https://github.com/new
2. Nombre sugerido: `erp-scout-salvadorsanfuentes`
3. **Privado** (el código contiene IDs de infraestructura)
4. NO marques "Add README" ni nada — repositorio vacío
5. Crear

## Paso 2 — Subir este código (terminal, en esta carpeta)
```bash
git remote add origin https://github.com/TU_USUARIO/erp-scout-salvadorsanfuentes.git
git push -u origin main
```
(El repo ya viene con git inicializado y el commit hecho.)

## Paso 3 — Conectar en Netlify (3 min)
1. https://app.netlify.com → sitio **resplendent-platypus-bf1289**
2. Site configuration → Build & deploy → **Link repository**
3. Elegir GitHub → autorizar → seleccionar el repo
4. Configuración de build:
   - Build command: (vacío)
   - Publish directory: `.`  (raíz)
   - Functions directory: `netlify/functions` (ya viene en netlify.toml)
5. Deploy

## Variables de entorno
✅ Ya están copiadas al sitio nuevo (las 14 del sitio original,
incluyendo GDRIVE_* para subir-drive). No hay que hacer nada.

## Flujo de trabajo desde ahora
- Cambio pequeño → editar → `git add -A && git commit -m "..." && git push` → deploy automático
- Cada deploy queda versionado: rollback en 1 clic desde Netlify → Deploys

## Nota
El deploy quedará bloqueado igual que los ZIP mientras la cuenta
no tenga créditos — pero una vez resuelto, todo es automático.
