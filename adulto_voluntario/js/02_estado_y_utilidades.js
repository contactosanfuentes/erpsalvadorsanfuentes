        window.activeFilter = 'Todos';
        window.activeTab = 'p-formacion';
        window.currentEditAdultoId = null;
        const clsInp = "modal-table-input border border-gray-300 rounded focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none bg-white text-sm p-2 w-full";

        window.escapeHtml = function(s) { return s?String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'):''; };
        window.calcularEdad = function(f) { if(!f) return 0; const h=new Date(), n=new Date(f); let e=h.getFullYear()-n.getFullYear(); const m=h.getMonth()-n.getMonth(); if(m<0||(m===0&&h.getDate()<n.getDate())) e--; return e; };
        window.formatWsp = function(phone) { if(!phone) return ''; let cleaned = phone.replace(/\D/g, ''); if(cleaned.startsWith('9') && cleaned.length === 8) cleaned = '9' + cleaned; if(cleaned.length === 9) cleaned = '56' + cleaned; return cleaned; };
        // ── Generar certificado de formación/compromiso del adulto ──
        // ── Certificado de adulto: genera, sube a Drive y envía por correo si tiene email ──
