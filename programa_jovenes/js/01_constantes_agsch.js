        const EMAILS_POR_UNIDAD = {
            'Bandada Pilmaikén Kalfü': ['Bandada@salvadorsanfuentes.org'],

            'Manada Kupëlwue Kadü': ['Manada@salvadorsanfuentes.org'],
            'Compañía Antuwenüy': ['Compania@salvadorsanfuentes.org'],
            'Avanzada Toki Pillan': ['Avanzada@salvadorsanfuentes.org'],
            'Tropa Manke Pillán': ['tropa@salvadorsanfuentes.org'],
            'Clan Kutral Raigüen': ['Clan@salvadorsanfuentes.org']
        };
        const CC_EMAILS = [
            'responsable@salvadorsanfuentes.org',
            'asistente@salvadorsanfuentes.org',
            'guiasyscouts@salvadorsanfuentes.org',
            'Contacto@salvadorsanfuentes.org'
        ];

        // MAPEO DE IMÁGENES PARA LOGOS DE UNIDADES
        const LOGOS_UNIDADES = {
            'Bandada': 'https://i.imgur.com/1aGKetX.png',
            'Manada': 'https://i.imgur.com/0bZQNJs.png',
            'Tropa': 'https://i.imgur.com/2M19fp0.png',
            'Compañía': 'https://i.imgur.com/eoG0c2D.png',
            'Avanzada': 'https://hyixmaxhoxvamoecuars.supabase.co/storage/v1/object/public/logos/avanzada_toki_pillan.png',
            'Clan': 'https://i.imgur.com/abtMi0i.png'
        };

        // MAPEO DE IMÁGENES PARA ETAPAS DE PROGRESIÓN
        const IMAGENES_ETAPAS = {
            // Bandada
            'Pichón': 'https://i.imgur.com/FV5CyzO.png',
            'Aprendiz': 'https://i.imgur.com/w25teqR.png',
            'Viajera': 'https://i.imgur.com/a9xgrWU.png',
            'Guía de Vuelo': 'https://i.imgur.com/XGGnl9N.png',
            // Manada
            'Lobezno': 'https://i.imgur.com/lSrmFXz.png',
            'Saltador': 'https://i.imgur.com/AXcwr5h.png',
            'Diestro': 'https://i.imgur.com/VBD3nDy.png',
            'Cazador': 'https://i.imgur.com/QrsX3NY.png',
            // Compañía
            'Alba': 'https://i.imgur.com/CyEFpPL.png',
            'Amanecer': 'https://i.imgur.com/JQqcy0X.png',
            'Luz': 'https://i.imgur.com/9ZheqTf.png',
            'Resplandor': 'https://i.imgur.com/vkJj0bK.png',
            // Tropa
            'Cernícalo': 'https://i.imgur.com/yJyps57.png',
            'Halcón': 'https://i.imgur.com/AAZdzEG.png',
            'Águila': 'https://i.imgur.com/j2OYdiD.png',
            'Cóndor': 'https://i.imgur.com/GQNxp25.png',
            // Avanzada
            'Cruz del Sur': 'https://drive.google.com/thumbnail?id=15qw2SRnIb_vUM0-MKnnhaHXK-OafyOek&sz=w300',
            'Sendero': 'https://i.imgur.com/VHZrlFN.png',
            'Cumbre': 'https://i.imgur.com/3MeclHS.png',
            // Clan
            'Bienvenida': 'https://i.imgur.com/dYr6dIU.png',
            'Fuego': 'https://i.imgur.com/IEr3Kms.png',
            'Antorcha': 'https://i.imgur.com/qTTibWH.png'
        };

        // Constantes Metodológicas
        const etapasPorRama = {
            'Bandada': ['Pichón', 'Aprendiz', 'Viajera', 'Guía de Vuelo'],
            'Manada': ['Lobezno', 'Saltador', 'Diestro', 'Cazador'],
            'Tropa': ['Cernícalo', 'Halcón', 'Águila', 'Cóndor'],
            'Compañía': ['Alba', 'Amanecer', 'Luz', 'Resplandor'],
            'Avanzada': ['Cruz del Sur', 'Sendero', 'Cumbre'],
            'Clan': ['Bienvenida', 'Fuego', 'Antorcha']
        };

        const iconoEtapa = (etapa) => {
            const iconos = {
                'Pichón': 'fa-egg', 'Aprendiz': 'fa-seedling', 'Viajera': 'fa-route', 'Guía de Vuelo': 'fa-dove',
                'Lobezno': 'fa-paw', 'Saltador': 'fa-frog', 'Diestro': 'fa-crown', 'Cazador': 'fa-claw-marks',
                'Cernícalo': 'fa-feather', 'Halcón': 'fa-crow', 'Águila': 'fa-eagle', 'Cóndor': 'fa-dragon',
                'Alba': 'fa-sun', 'Amanecer': 'fa-cloud-sun', 'Luz': 'fa-lightbulb', 'Resplandor': 'fa-star',
                'Cruz del Sur': 'fa-star', 'Sendero': 'fa-hiking', 'Cumbre': 'fa-mountain',
                'Bienvenida': 'fa-hand-sparkles', 'Fuego': 'fa-fire', 'Antorcha': 'fa-fire-flame-curved'
            };
            return iconos[etapa] || 'fa-circle';
        };

        const colorEtapaManada = { 'Lobezno': 'text-amber-500', 'Saltador': 'text-green-500', 'Diestro': 'text-blue-500', 'Cazador': 'text-red-500' };
        const colorEtapaBandada = { 'Pichón': 'text-gray-400', 'Aprendiz': 'text-yellow-500', 'Viajera': 'text-orange-500', 'Guía de Vuelo': 'text-red-500' };
        const colorEtapaTropa = { 'Cernícalo': 'text-yellow-500', 'Halcón': 'text-green-500', 'Águila': 'text-blue-500', 'Cóndor': 'text-red-500' };
        const colorEtapaCia = { 'Alba': 'text-yellow-500', 'Amanecer': 'text-green-500', 'Luz': 'text-blue-500', 'Resplandor': 'text-red-500' };

        const objetivosAgrupados = {
            'Iniciales': {
                'corporalidad': ['Conozco y cuido mi cuerpo', 'Me alimento sanamente', 'Mantengo mi higiene personal', 'Participo activamente en los juegos', 'Conozco la importancia del aseo', 'Evito situaciones de riesgo'],
                'creatividad': ['Expreso mis ideas y sentimientos', 'Soluciono problemas sencillos', 'Propongo juegos nuevos', 'Hago trabajos manuales', 'Observo la naturaleza'],
                'caracter': ['Digo la verdad', 'Asumo mis responsabilidades', 'Conozco la Ley y Promesa', 'Escucho a los Viejos Lobos/Guiadoras', 'Cumplo mis tareas asignadas'],
                'afectividad': ['Reconozco mis emociones', 'Trato con respeto a los demás', 'Soy buen amigo', 'Ayudo a los nuevos integrantes'],
                'sociabilidad': ['Comparto con mi unidad', 'Respeto las reglas del juego', 'Hago mi Buena Acción', 'Conozco mi barrio y país'],
                'espiritualidad': ['Agradezco lo que tengo', 'Cuido la naturaleza', 'Participo en oraciones', 'Respeto las creencias de otros']
            },
            'Medios': {
                'corporalidad': ['Mantengo mi estado físico armónico', 'Conozco los cambios biológicos de mi cuerpo', 'Asumo responsabilidades en campamentos', 'Cuido mi salud integral (física y mental)'],
                'creatividad': ['Diseño y ejecuto construcciones de pionerismo', 'Reparo mis propios equipos', 'Tomo decisiones divergentes en patrulla', 'Desarrollo proyectos innovadores personales'],
                'caracter': ['Defiendo mis opiniones con respeto', 'Asumo mi cargo en la patrulla con lealtad', 'Vivo coherentemente la Ley Scout', 'Me levanto tras el fracaso'],
                'afectividad': ['Mantengo amistades sanas y equitativas', 'Controlo mis impulsos en situaciones de estrés', 'Me comunico asertivamente con mi familia', 'Vivo una afectividad sana y respetuosa'],
                'sociabilidad': ['Respeto las votaciones del Consejo de Patrulla', 'Participo activamente en servicios comunitarios', 'Conozco la institucionalidad democrática', 'Trabajo cooperativamente y sin egoísmos'],
                'espiritualidad': ['Vivo mi fe mediante la contemplación de la naturaleza', 'Defiendo el respeto hacia otras creencias', 'Me doy tiempos de reflexión y silencio', 'Cuestiono y fortalezco mis convicciones']
            },
            'Medios-Terminales': {
                'corporalidad': ['Asumo la responsabilidad de mi salud', 'Conozco los procesos biológicos', 'Valora su aspecto', 'Administra su tiempo'],
                'creatividad': ['Incrementa continuamente sus conocimientos', 'Actúa con agilidad mental', 'Elige su vocación', 'Valora la ciencia y la técnica'],
                'caracter': ['Conoce sus posibilidades y limitaciones', 'Construye su proyecto de vida', 'Actúa consecuentemente', 'Enfrenta la vida con alegría'],
                'afectividad': ['Logra un estado interior de libertad', 'Practica una conducta asertiva', 'Construye su felicidad personal', 'Conoce y respeta su sexualidad'],
                'sociabilidad': ['Vive su libertad solidariamente', 'Cumple las normas', 'Sirve activamente en su comunidad', 'Contribuye a preservar la vida'],
                'espiritualidad': ['Busca a Dios/Trascendencia', 'Adhiere a principios espirituales', 'Práctica la reflexión', 'Dialoga con todas las personas']
            },
            'Terminales': {
                'corporalidad': ['Integra hábitos de vida sana de forma autónoma', 'Conoce sus límites físicos', 'Asume su sexualidad de forma responsable'],
                'creatividad': ['Desarrolla proyectos de impacto real', 'Aplica conocimientos técnicos en soluciones', 'Posee pensamiento crítico y divergente'],
                'caracter': ['Posee un Proyecto de Vida estructurado', 'Ejerce liderazgo ético', 'Resiliencia comprobada ante la adversidad'],
                'afectividad': ['Mantiene relaciones interpersonales maduras', 'Empatía activa con su entorno', 'Estabilidad emocional y asertividad'],
                'sociabilidad': ['Ejerce una ciudadanía activa', 'Lidera intervenciones comunitarias', 'Compromiso con el desarrollo sostenible (ODS)'],
                'espiritualidad': ['Testimonia su fe o valores en su actuar diario', 'Promueve la paz y la tolerancia', 'Posee un sentido de trascendencia claro']
            }
        };

        const areasDesarrollo = [
            { nombre: 'Corporalidad', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', icon: 'fa-running', valKey: 'corporalidad' },
            { nombre: 'Creatividad', color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-200', icon: 'fa-lightbulb', valKey: 'creatividad' },
            { nombre: 'Carácter', color: 'text-gray-700', bg: 'bg-gray-100', border: 'border-gray-300', icon: 'fa-user-shield', valKey: 'caracter' },
            { nombre: 'Sociabilidad', color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-200', icon: 'fa-users', valKey: 'sociabilidad' },
            { nombre: 'Afectividad', color: 'text-pink-500', bg: 'bg-pink-50', border: 'border-pink-200', icon: 'fa-heart', valKey: 'afectividad' },
            { nombre: 'Espiritualidad', color: 'text-purple-500', bg: 'bg-purple-50', border: 'border-purple-200', icon: 'fa-pray', valKey: 'espiritualidad' }
        ];

        const areasResponsabilidad = ['Coordinador General', 'Finanzas / Tesorería', 'Logística y Equipos', 'Comunicaciones y RRPP', 'Programa y Actividades', 'Gestión de Riesgos', 'Salud y Primeros Auxilios', 'Operaciones'];
        function areaKey(a){return a.replace(/[^a-zA-Z0-9]/g,'');}
        
