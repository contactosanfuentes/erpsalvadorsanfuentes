// ══════════ TABS Y NAVEGACIÓN ══════════
function activarTab(tab, btn) {
    if (window.innerWidth < 1024) return;
    document.querySelectorAll('.portal-tab').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active-panel'));
    if (btn) btn.classList.add('active');
    else {
        document.querySelectorAll('.portal-tab').forEach(b => {
            if (b.getAttribute('onclick') && b.getAttribute('onclick').includes("'"+tab+"'")) b.classList.add('active');
        });
    }
    const panel = document.getElementById('tab-' + tab);
    if (panel) panel.classList.add('active-panel');
    const main = document.querySelector('.portal-main');
    if (main) main.scrollTop = 0;
    document.querySelectorAll('.portal-nav-link').forEach(a => { a.style.background=''; a.style.color=''; });
    const navEl = document.querySelector('.portal-nav-link[onclick*="'+tab+'"]');
    if (navEl) { navEl.style.background='#fef2f2'; navEl.style.color='#E31837'; }
}

function scrollMain(secId) {
    if (window.innerWidth < 1024) return;
    const tabMap = {'sec-vida':'vida','sec-proyectos':'proyectos','sec-explorar':'explorar','sec-cal':'cal'};
    const tabId = tabMap[secId];
    if (tabId) {
        const btn = Array.from(document.querySelectorAll('.portal-tab')).find(b=>b.getAttribute('onclick')&&b.getAttribute('onclick').includes(tabId));
        activarTab(tabId, btn);
    }
}

let _todosVigentes = [];
function filtrarExplorar() {
    const q = (document.getElementById('explorar-search')?.value || '').toLowerCase().trim();
    const rama = document.getElementById('explorar-rama')?.value || '';
    const cont = document.getElementById('portal-proyectos-vigentes');
    if (!cont || !_todosVigentes.length) return;
    const filtrados = _todosVigentes.filter(p => {
        const matchQ = !q || (p.nombre||'').toLowerCase().includes(q) || (p.campoAccion||'').toLowerCase().includes(q);
        const matchR = !rama || p.rama === rama;
        return matchQ && matchR;
    });
    cont.innerHTML = filtrados.length
        ? filtrados.map(p => renderTarjetaVigentePV(p)).join('')
        : '<p class="text-center text-gray-400 py-6 text-sm">Sin proyectos que coincidan.</p>';
}

