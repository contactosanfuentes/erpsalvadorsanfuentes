        let tempAvatarBase64 = null;

        async function fetchUserData() {
            try {
                const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
                
                if (userError) throw userError;
                
                if (user) {
                    let nombreCompleto = user.user_metadata?.full_name || user.email?.split('@')[0] || "Usuario Scout";
                    let cargo = user.user_metadata?.role || "Miembro del Grupo";
                    
                    try {
                        const { data: perfil, error: perfilError } = await supabaseClient
                            .from('perfiles')
                            .select('nombre_completo, cargo')
                            .eq('id', user.id)
                            .single();
                        
                        if (!perfilError && perfil) {
                            if (perfil.nombre_completo) nombreCompleto = perfil.nombre_completo;
                            if (perfil.cargo) cargo = perfil.cargo;
                        }
                    } catch (e) {
                        console.log("Tabla perfiles no disponible, usando metadata");
                    }
                    
                    const initials = nombreCompleto.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
                    
                    document.getElementById('display-name').innerText = nombreCompleto;
                    document.getElementById('display-role').innerText = cargo;
                    document.getElementById('dropdown-name').innerText = nombreCompleto;
                    document.getElementById('dropdown-email').innerText = user.email;
                    document.getElementById('dropdown-role-badge').innerText = cargo;
                    document.getElementById('prof-name').value = nombreCompleto;
                    document.getElementById('prof-email').value = user.email;
                    document.getElementById('prof-role').value = cargo;
                    
                    const savedAvatar = localStorage.getItem(`avatar_${user.id}`);
                    if (savedAvatar) {
                        applyAvatarUI(savedAvatar, initials);
                    } else {
                        applyAvatarUI(null, initials);
                    }
                }
            } catch (error) {
                console.error("Error cargando datos:", error);
                showToast("Error al cargar el perfil", "error");
            }
        }

        function applyAvatarUI(base64Data, initials) {
            const elements = [
                { img: 'avatar-img', text: 'avatar-initials' },
                { img: 'dropdown-img', text: 'dropdown-initials' },
                { img: 'modal-avatar-preview', text: 'modal-avatar-initials' }
            ];
            
            elements.forEach(el => {
                const imgElement = document.getElementById(el.img);
                const textElement = document.getElementById(el.text);
                
                if (imgElement && textElement) {
                    if (base64Data) {
                        imgElement.src = base64Data;
                        imgElement.style.display = 'block';
                        textElement.style.display = 'none';
                    } else {
                        imgElement.style.display = 'none';
                        textElement.style.display = 'flex';
                        textElement.innerText = initials;
                    }
                }
            });
        }

        async function saveProfile() {
            const newRole = document.getElementById('prof-role').value;
            const newName = document.getElementById('prof-name').value;
            
            if (!newName.trim()) {
                showToast("Por favor ingresa tu nombre", "error");
                return;
            }
            
            const btn = event.target;
            const originalText = btn.innerHTML;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
            btn.disabled = true;
            
            try {
                const { data: { user } } = await supabaseClient.auth.getUser();
                
                if (!user) {
                    showToast("No se encontró usuario", "error");
                    return;
                }
                
                let updateSuccess = false;
                
                const { error: authError } = await supabaseClient.auth.updateUser({
                    data: { 
                        role: newRole,
                        full_name: newName
                    }
                });
                
                if (!authError) updateSuccess = true;
                
                try {
                    const { error: perfilError } = await supabaseClient
                        .from('perfiles')
                        .upsert({
                            id: user.id,
                            nombre_completo: newName,
                            cargo: newRole,
                            email: user.email,
                            updated_at: new Date().toISOString()
                        });
                    
                    if (!perfilError) updateSuccess = true;
                } catch (e) {
                    console.log("Tabla perfiles no disponible");
                }
                
                if (tempAvatarBase64) {
                    localStorage.setItem(`avatar_${user.id}`, tempAvatarBase64);
                    showToast("Foto de perfil guardada", "success");
                }
                
                if (updateSuccess) {
                    showToast("Perfil actualizado correctamente", "success");
                    await fetchUserData();
                    closeModal('profileModal');
                    tempAvatarBase64 = null;
                } else {
                    showToast("No se pudieron guardar los cambios", "error");
                }
                
            } catch (error) {
                console.error("Error:", error);
                showToast("Error al guardar el perfil", "error");
            } finally {
                btn.innerHTML = originalText;
                btn.disabled = false;
            }
        }

        function handleAvatarSelect(event) {
            const file = event.target.files[0];
            if (!file) return;
            
            if (!file.type.startsWith('image/')) {
                showToast("Solo se permiten imágenes", "error");
                return;
            }
            
            if (file.size > 2 * 1024 * 1024) {
                showToast("La imagen es muy pesada. Máximo 2MB.", "error");
                return;
            }
            
            const reader = new FileReader();
            reader.onload = (e) => {
                tempAvatarBase64 = e.target.result;
                
                const previewImg = document.getElementById('modal-avatar-preview');
                const initialsSpan = document.getElementById('modal-avatar-initials');
                
                previewImg.src = tempAvatarBase64;
                previewImg.style.display = 'block';
                initialsSpan.style.display = 'none';
                
                showToast("Foto cargada, guarda los cambios para aplicar", "success");
            };
            
            reader.onerror = () => {
                showToast("Error al cargar la imagen", "error");
            };
            
            reader.readAsDataURL(file);
        }

        async function updatePassword() {
            const p1 = document.getElementById('new-password').value;
            const p2 = document.getElementById('confirm-password').value;
            
            if (p1.length < 6) {
                showToast("La contraseña debe tener mínimo 6 caracteres.", "error");
                return;
            }
            
            if (p1 !== p2) {
                showToast("Las contraseñas no coinciden.", "error");
                return;
            }
            
            const btn = document.querySelector('#passwordModal .btn-primary');
            const originalText = btn.innerHTML;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Actualizando...';
            btn.disabled = true;
            
            try {
                const { error } = await supabaseClient.auth.updateUser({ password: p1 });
                
                if (error) {
                    showToast("Error: " + error.message, "error");
                } else { 
                    showToast("Contraseña actualizada correctamente", "success"); 
                    closeModal('passwordModal'); 
                    document.getElementById('new-password').value = '';
                    document.getElementById('confirm-password').value = '';
                }
            } catch (error) {
                showToast("Error de conexión", "error");
            } finally {
                btn.innerHTML = originalText;
                btn.disabled = false;
            }
        }

        function openPasswordModal() { 
            const modal = document.getElementById('passwordModal');
            if (modal) modal.style.display = 'flex';
        }

        function openProfileModal() { 
            const modal = document.getElementById('profileModal');
            if (modal) modal.style.display = 'flex';
            fetchUserData();
        }

        function closeModal(id) { 
            const modal = document.getElementById(id);
            if (modal) modal.style.display = 'none';
        }

        async function handleLogout() {
            await supabaseClient.auth.signOut();
            window.location.href = 'login.html';
        }

        // ========== NOTIFICACIONES ==========
