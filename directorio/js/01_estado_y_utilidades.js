        let jovenes = []; let adultos = []; let personasFiltradasCache = [];
        let currentSortColumn = 'nombre'; let currentSortAsc = true;

        // ================= LÓGICA DE NEGOCIO =================
        function calcularEdad(fecha) {
            if (!fecha) return 0;
            const hoy = new Date(); const nac = new Date(fecha);
            let edad = hoy.getFullYear() - nac.getFullYear();
            if (hoy.getMonth() < nac.getMonth() || (hoy.getMonth() === nac.getMonth() && hoy.getDate() < nac.getDate())) edad--;
            return edad;
        }

        function esCumpleanosCercano(fecha) {
            if (!fecha) return false;
            const hoy = new Date(); const nac = new Date(fecha);
            const esteAno = new Date(hoy.getFullYear(), nac.getMonth(), nac.getDate());
            const diff = Math.ceil((esteAno - hoy) / (1000 * 60 * 60 * 24));
            return diff >= 0 && diff <= 7;
        }

        function obtenerReconocimiento(anos, rama) {
            if (anos < 2) return null;
            let color = anos >= 8 ? 'text-oro' : (anos >= 6 ? 'text-plata' : 'text-bronce');
            let tipo = anos >= 8 ? 'Oro' : (anos >= 6 ? 'Plata' : 'Bronce');
            const esFemenina = rama === 'Bandada' || rama === 'Compañía';
            let glyph = esFemenina ? '&#x2618;&#xFE0E;' : '&#x269C;&#xFE0E;';
            return { iconHtml: `<span class="${color} ml-1 text-lg font-serif" title="Reconocimiento ${tipo} (${anos} años)">${glyph}</span>` };
        }

        function validarAdelanto(rama, etapa, edad) {
            if (!rama || !etapa || !edad) return '⚠️ S/D';
            const etapas = etapasPorRama[rama]; if (!etapas) return '❓';
            const idx = etapas.indexOf(etapa); if (idx === -1) return '❓';
            let esp = -1;
            if (rama === 'Bandada' || rama === 'Manada') { if (edad <= 8) esp = 0; else if (edad === 9) esp = 1; else if (edad === 10) esp = 2; else esp = 3; }
            else if (rama === 'Tropa' || rama === 'Compañía') { if (edad <= 12) esp = 0; else if (edad === 13) esp = 1; else if (edad === 14) esp = 2; else esp = 3; }
            else if (rama === 'Avanzada') { if (edad <= 16) esp = 0; else esp = 1; }
            else if (rama === 'Clan') { if (edad <= 19) esp = 0; else esp = 1; }
            if (idx === esp) return '✅ Al día';
            return idx < esp ? '⬇️ Atrasado' : '⬆️ Adelantado';
        }

        // ================= FETCH Y RENDER =================
