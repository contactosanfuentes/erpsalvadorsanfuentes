        let accounts = [];
        let transferHistory = [];
        let activeAccountId = null;
        let currentTab = 'dashboard';
        let chartInstance = null;
        let evoChartInstance = null;
        let pendingFileData = null;
        let miembrosRegistro = [];
        let firmaTesoreroData = { hasSignature: false };
        let firmaResponsableData = { hasSignature: false };
        let pagoRegistroFileData = null;
        let pagoCuotaFileData = null;
        let currentPlanId = null;
        let currentCuotaId = null;
        let tiposCuotaTemporales = [];
        let tiposCuotaMap = new Map(); // para mostrar info de cuotas en movimientos

        const currencyFormatter = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 });

        // ==================== TOAST ====================
        function showToast(message, type = 'info') {
            const container = document.getElementById('toastContainer');
            const toast = document.createElement('div');
            toast.className = `bg-white border-l-4 ${type === 'success' ? 'border-green-500' : type === 'warning' ? 'border-yellow-500' : type === 'error' ? 'border-red-500' : 'border-blue-500'} rounded-lg shadow-lg p-4 flex items-center gap-3 min-w-[300px] toast`;
            toast.innerHTML = `<i class="fas ${type === 'success' ? 'fa-check-circle text-green-500' : type === 'warning' ? 'fa-exclamation-triangle text-yellow-500' : type === 'error' ? 'fa-times-circle text-red-500' : 'fa-info-circle text-blue-500'}"></i><span class="flex-1">${message}</span><button onclick="this.parentElement.remove()" class="text-slate-400 hover:text-slate-600"><i class="fas fa-times"></i></button>`;
            container.appendChild(toast);
            setTimeout(() => toast.remove(), 5000);
        }

        // ==================== CUENTAS BASE ====================
        const cuentasBase = [
            { nombre: 'DINEROS GRUPO', tipo: 'general' }, { nombre: 'REGISTRO', tipo: 'general' }, { nombre: 'PAXTÚ', tipo: 'general' }, { nombre: 'CAMVER', tipo: 'general' },
            { nombre: 'MANADA', tipo: 'unidad' }, { nombre: 'BANDADA', tipo: 'unidad' }, { nombre: 'COMPAÑÍA', tipo: 'unidad' }, { nombre: 'TROPA', tipo: 'unidad' },
            { nombre: 'LEFTRARU', tipo: 'unidad' }, { nombre: 'JANEKEW', tipo: 'unidad' }, { nombre: 'CLAN', tipo: 'unidad' }, { nombre: 'CAMPINV', tipo: 'general' },
            { nombre: 'CAMPRI', tipo: 'general' }, { nombre: 'BINGO', tipo: 'general' }, { nombre: 'NAVIDAD', tipo: 'general' }, { nombre: 'SALVAFONDA', tipo: 'general' }
        ];

