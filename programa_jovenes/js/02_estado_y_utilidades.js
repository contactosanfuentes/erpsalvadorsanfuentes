        let personasJovenes = [];
        let progresionJovenes = {};
        let activeFilterUnit = 'Todas';
        let activeYouthProfileTab = 'p-desarrollo';
        let datosCargados = false;

        let currentResponsables = {};
        let currentParticipantes = [];
        let currentJovenIdForProject = null;
        let currentEditProjectId = null;
        let currentEditJovenId = null;
        let currentEvidencias = [];

        // ================= NOTIFICACIONES Y UTILIDADES =================
        function mostrarNotificacion(tipo, mensaje) {
            const container = document.getElementById('toast-container');
            const toast = document.createElement('div'); toast.className = 'toast'; 
            toast.style.borderLeftColor = tipo === 'exito' ? '#10b981' : (tipo === 'info' ? '#3b82f6' : '#ef4444');
            let icon = tipo === 'exito' ? 'fa-check-circle' : (tipo === 'info' ? 'fa-info-circle' : 'fa-exclamation-triangle');
            let color = tipo === 'exito' ? '#10b981' : (tipo === 'info' ? '#3b82f6' : '#ef4444');
            toast.innerHTML = `<div class="bg-gray-50 rounded-full p-2"><i class="fas ${icon}" style="color:${color}; font-size:1.5rem;"></i></div><span style="flex:1;">${mensaje}</span><button onclick="this.parentElement.remove()" class="text-gray-400 hover:text-gray-600 transition outline-none"><i class="fas fa-times text-lg"></i></button>`;
            container.appendChild(toast); setTimeout(() => { if(toast.parentElement) toast.remove() }, 6000);
        }
        function escapeHtml(str) { if (!str) return ''; return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
        function calcularEdad(fechaNacimiento) { if (!fechaNacimiento) return 0; const hoy = new Date(), nac = new Date(fechaNacimiento); let edad = hoy.getFullYear() - nac.getFullYear(); const m = hoy.getMonth() - nac.getMonth(); if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--; return edad; }
        
        function toggleView(view) {
            document.getElementById('view-profiles').style.display = view === 'profiles' ? 'flex' : 'none';
            document.getElementById('view-dashboard').classList.toggle('active', view === 'dashboard');
            if (view === 'dashboard') renderDashboardKPIs();
        }

        function getRolUnidad(joven) {
            const unidad = (joven.unidad || '').toLowerCase();
            if (unidad.includes('bandada')) return { articulo: 'La', nombre: 'golondrina' };
            if (unidad.includes('manada')) return { articulo: 'El', nombre: 'lobato' };
            if (unidad.includes('tropa')) return { articulo: 'El', nombre: 'scout' };
            if (unidad.includes('compañía') || unidad.includes('compania')) return { articulo: 'La', nombre: 'guía' };
            if (unidad.includes('avanzada')) return { articulo: joven.genero === 'F' ? 'La' : 'El', nombre: joven.genero === 'F' ? 'pionera' : 'pionero' };
            if (unidad.includes('clan') || unidad.includes('caminante')) return { articulo: joven.genero === 'F' ? 'La' : 'El', nombre: 'caminante' };
            return { articulo: 'El', nombre: 'joven' };
        }

        // ================= SINCRONIZACIÓN CON BASE DE DATOS NACIONAL =================
