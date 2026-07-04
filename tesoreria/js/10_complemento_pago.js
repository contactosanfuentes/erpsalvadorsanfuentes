        window.abrirComplemento = async function(accId, movId, montoRestante) {
            const account = accounts.find(a => a.id === accId);
            const movimiento = account.movimientos.find(m => m.id === movId);
            if (!movimiento) return;
            let personaData = null;
            if (movimiento.persona_run) {
                personaData = {
                    tipo: movimiento.persona_tipo,
                    run: movimiento.persona_run,
                    nombre: movimiento.persona_nombre,
                    email: movimiento.persona_email,
                    telefono: movimiento.persona_telefono,
                    direccion: movimiento.persona_direccion
                };
            }
            openTxModal(accId, {
                tipoMovimiento: 'cuota',
                tipoCuotaId: movimiento.tipo_cuota_id,
                concepto: `Complemento: ${movimiento.concepto}`,
                monto: montoRestante,
                tipo: 'ingreso',
                moneda: movimiento.moneda || 'CLP',
                referencia: movimiento.referencia,
                personaData: personaData
            });
        };

        // Exponer funciones globales
