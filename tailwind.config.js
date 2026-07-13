/** Compilación estática que reemplaza el CDN (~300KB de compilador en runtime). */
module.exports = {
  content: [
    './dashboard.html', './directorio.html', './tesoreria.html',
    './adulto_voluntario.html', './programa_jovenes.html',
    './portal_caminante.html', './portal_pionero.html', './portal_apoderados.html',
    './dashboard/**/*.js', './directorio/**/*.js', './tesoreria/**/*.js',
    './adulto_voluntario/**/*.js', './programa_jovenes/**/*.js',
    './caminante/**/*.js', './apoderados/**/*.js',
    './permisos.js', './wa_api.js'
  ],
  safelist: [
    // Colores condicionales construidos dinámicamente
    { pattern: /^(bg|text|border)-(emerald|red|purple|blue|sky|amber|rose|green|indigo|slate)-(50|100|200|300|400|500|600|700|800|900)$/ },
    // Clases arbitrarias usadas en el dashboard y portal
    'text-[0.6rem]', 'text-[0.65rem]', 'text-[0.7rem]', 'text-[0.72rem]', 'text-[0.75rem]', 'text-[0.78rem]', 'text-[0.8rem]', 'text-[0.82rem]', 'text-[0.85rem]',
    'px-1.5', 'px-2.5', 'px-3.5', 'py-0.5', 'py-1.5',
    'w-full', 'h-full', '-mt-4', '-translate-y-1',
    'gap-1', 'gap-1.5', 'shrink-0',
  ],
  theme: { extend: {} },
  plugins: []
};
