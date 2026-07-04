    let eventoActual = null;
    let unidades = [];
    let unidadActiva = null;
    let gruposScout = [];
    let jovenes = [];
    let adultos = [];
    let ingresos = [];
    let gastos = [];
    let postasData = [];
    let inventario = [];
    let seccionesPresupuesto = [];
    let itemsPresupuesto = [];
    let configuracionPresupuesto = { participantes:20, staff:7, dias:2, cuota:180, nota:'' };
    let menuItems = [];
    let objetivosCatalogo = [];
    let metas = [];

    // Variables Croquis
    let puntosCroquis = [];
    let canvas = document.getElementById('croquisCanvas');
    let ctx = canvas.getContext('2d');
    let imgFondo = new Image();
    let croquisUrl = '';

    let currentHeaderType = 'tropa';
    let customHeadersVarios = ['Nombre de la patrulla', 'Grupo Scout', 'N° Integrantes', 'Teléfono', 'Correo', 'Cuota', 'Total', 'Observaciones'];
    let customHeadersClan = ['Nombre del equipo', 'Grupo Scout', 'N° Rovers', 'Teléfono', 'Correo', 'Cuota', 'Total', 'Observaciones'];

    const headerConfig = {
        tropa: ['Nombre de patrulla', 'Grupo Scout', 'N° Patrulleros', 'Teléfono', 'Correo', 'Cuota', 'Total', 'Observaciones'],
        manada: ['Nombre de seisena/manada', 'Grupo Scout', 'N° de Lobezn@s', 'Teléfono', 'Correo', 'Cuota', 'Total', 'Observaciones'],
        bandada: ['Nombre de bandada', 'Grupo Scout', 'N° Golondrinas', 'Teléfono', 'Correo', 'Cuota', 'Total', 'Observaciones'],
        compania: ['Nombre de patrulla', 'Grupo Scout', 'N° Guías', 'Teléfono', 'Correo', 'Cuota', 'Total', 'Observaciones'],
        caminantes: ['Nombre de la comunidad', 'Grupo Scout', 'N° Caminantes', 'Teléfono', 'Correo', 'Cuota', 'Total', 'Observaciones'],
        clan: customHeadersClan,
        varios: customHeadersVarios
    };

    // ========== FUNCIONES DE GRUPOS ==========
