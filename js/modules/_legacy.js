// ============================================================
// modules/_legacy.js — Carga una página original completa
// Garantiza 100% del aspecto y funcionalidad del sistema original.
// La sesión de Supabase se comparte (mismo origen → mismo localStorage),
// y auth-guard.js del original ya maneja el contexto iframe.
// ============================================================
export default async function render(el, ctx) {
  const pagina = ctx.modulo.legacy;
  el.innerHTML = `<iframe
      src="${pagina}"
      class="iframe-legacy"
      title="${ctx.modulo.titulo}"
      allow="camera; geolocation; clipboard-write"
    ></iframe>`;
}
