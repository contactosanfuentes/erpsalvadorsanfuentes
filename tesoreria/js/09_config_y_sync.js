        function renderConfig() {
            let html = `<div class="max-w-2xl mx-auto py-10"><div class="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm"><h3 class="text-xl font-bold mb-6">Configuración</h3><h4 class="font-bold mb-2">Cuentas base</h4><button onclick="crearCuentasBase()" class="w-full py-4 bg-green-600 text-white font-bold rounded-2xl hover:bg-green-700 mb-6">Crear cuentas del grupo</button><hr class="my-6"><h4 class="font-bold mb-2">Webhook</h4><input type="text" id="apiUrlInput" placeholder="URL de Webhook (Google Apps Script)" value="${localStorage.getItem('teso_api') || ''}" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl mb-4"><button onclick="saveApiUrl()" class="w-full py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700">Guardar</button></div></div>`;
            document.getElementById('tesoreriaContent').innerHTML = html;
        }
        function saveApiUrl() { const url = document.getElementById('apiUrlInput').value; localStorage.setItem('teso_api', url); showToast('URL guardada', 'success'); }

        // ==================== AUXILIARES ====================
        function closeModal(id) { document.getElementById(id).classList.add('hidden'); }
        function syncData() { const btn = document.getElementById('syncIcon'); btn.classList.add('fa-spin'); setTimeout(() => { btn.classList.remove('fa-spin'); cargarDatos(); document.getElementById('syncBadge').innerHTML = '<span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Online'; }, 1000); }

        window.onload = () => { cargarDatos(); switchTesoreriaTab('dashboard'); };

        // Función complemento (para pagos parciales de cuotas)
