    async function init() {
        await cargarGrupos();
        await cargarUnidades();
        await cargarEventos();
        await cargarObjetivosCatalogo();

        if (document.getElementById('selector-evento').options.length > 1) {
            document.getElementById('selector-evento').selectedIndex = 1;
            await cambiarEvento();
        } else {
            await cargarTodosLosDatos();
        }

        const tituloInput = document.getElementById('evento-titulo');
        tituloInput.addEventListener('change', async function() {
            if (eventoActual) {
                eventoActual.nombre = this.value;
                try{ await supabaseClient.from('eventos').update({ nombre: this.value }).eq('id', eventoActual.id); }catch(e){}
            }
        });

        cambiarPestanaPorHash();
    }

    init();