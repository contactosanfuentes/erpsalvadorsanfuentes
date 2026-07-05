/** Compilación estática que reemplaza el CDN (~300KB de compilador en runtime). */
module.exports = {
  content: [
    './dashboard.html', './directorio.html', './tesoreria.html',
    './adulto_voluntario.html', './programa_jovenes.html',
    './dashboard/**/*.js', './directorio/**/*.js', './tesoreria/**/*.js',
    './adulto_voluntario/**/*.js', './programa_jovenes/**/*.js',
    './permisos.js', './wa_api.js', './drive-helper.js', './google-ui.js'
  ],
  safelist: [
    // Clases construidas dinámicamente (colores condicionales detectados en el código)
    { pattern: /^(bg|text|border)-(emerald|red|purple)-(50|100|200|300|400|500|600|700)$/ }
  ],
  theme: { extend: {} },
  plugins: []
};
