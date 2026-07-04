        document.getElementById('searchNombre').addEventListener('keyup', renderTabla);
        document.getElementById('filtroTipo').addEventListener('change', renderTabla);
        document.getElementById('filtroUnidad').addEventListener('change', renderTabla);
        document.getElementById('filtroEstado').addEventListener('change', renderTabla);
        document.getElementById('filtroReconocimiento').addEventListener('change', renderTabla);
        document.getElementById('filtroEspecial').addEventListener('change', renderTabla);
        document.addEventListener('DOMContentLoaded', cargarDatos);