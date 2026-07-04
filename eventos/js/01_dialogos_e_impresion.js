    window.customAlert = function(msg) {
        return new Promise(resolve => {
            const overlay = document.createElement('div');
            overlay.className = 'modal-overlay';
            overlay.innerHTML = `
                <div class="modal-box">
                    <p>${msg}</p>
                    <div class="modal-actions">
                        <button class="btn btn-primary" id="btn-ok">Aceptar</button>
                    </div>
                </div>
            `;
            document.body.appendChild(overlay);
            overlay.querySelector('#btn-ok').onclick = () => { overlay.remove(); resolve(); };
        });
    };

    window.customConfirm = function(msg) {
        return new Promise(resolve => {
            const overlay = document.createElement('div');
            overlay.className = 'modal-overlay';
            overlay.innerHTML = `
                <div class="modal-box">
                    <p>${msg}</p>
                    <div class="modal-actions">
                        <button class="btn btn-danger" id="btn-yes">Sí, confirmar</button>
                        <button class="btn btn-secondary" id="btn-no">Cancelar</button>
                    </div>
                </div>
            `;
            document.body.appendChild(overlay);
            overlay.querySelector('#btn-yes').onclick = () => { overlay.remove(); resolve(true); };
            overlay.querySelector('#btn-no').onclick = () => { overlay.remove(); resolve(false); };
        });
    };

    window.customPrompt = function(msg, defaultVal = '') {
        return new Promise(resolve => {
            const overlay = document.createElement('div');
            overlay.className = 'modal-overlay';
            overlay.innerHTML = `
                <div class="modal-box">
                    <p>${msg}</p>
                    <input type="text" id="prompt-input" value="${defaultVal}" style="width:100%; box-sizing:border-box;">
                    <div class="modal-actions">
                        <button class="btn btn-primary" id="btn-ok">Aceptar</button>
                        <button class="btn btn-secondary" id="btn-cancel">Cancelar</button>
                    </div>
                </div>
            `;
            document.body.appendChild(overlay);
            const input = overlay.querySelector('#prompt-input');
            input.focus();
            overlay.querySelector('#btn-ok').onclick = () => { resolve(input.value); overlay.remove(); };
            overlay.querySelector('#btn-cancel').onclick = () => { resolve(null); overlay.remove(); };
        });
    };

    // ========== IMPRESIÓN DINÁMICA ==========
    function prepararEncabezadoImpresion(tituloSeccion) {
        const evtTitulo = document.getElementById('evento-titulo').value || 'Evento Scout';
        document.getElementById('print-evento-titulo').innerText = evtTitulo;
        document.getElementById('print-seccion-titulo').innerText = tituloSeccion;
    }
    
    window.imprimirSeccion = function(tituloSeccion) {
        prepararEncabezadoImpresion(tituloSeccion);
        window.print();
    }

    function getCroquisDataUrl() {
        const canvasEl = document.getElementById('croquisCanvas');
        try { return canvasEl.toDataURL('image/png'); } catch (e) { return null; }
    }

function getCroquisDataUrlCompressed() {
    const canvasEl = document.getElementById('croquisCanvas');
    if (!canvasEl) return null;
    try {
        const originalWidth = canvasEl.width;
        const originalHeight = canvasEl.height;
        const maxWidth = 600;
        let newWidth = originalWidth;
        let newHeight = originalHeight;
        if (originalWidth > maxWidth) {
            newWidth = maxWidth;
            newHeight = (originalHeight * maxWidth) / originalWidth;
        }
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = newWidth;
        tempCanvas.height = newHeight;
        const tempCtx = tempCanvas.getContext('2d');
        tempCtx.drawImage(canvasEl, 0, 0, originalWidth, originalHeight, 0, 0, newWidth, newHeight);
        return tempCanvas.toDataURL('image/jpeg', 0.6);
    } catch (e) {
        console.error("Error al generar croquis comprimido:", e);
        return null;
    }
}

    // ========== VARIABLES GLOBALES ==========
