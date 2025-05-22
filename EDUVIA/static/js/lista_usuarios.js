// Función para resetear los filtros
    function resetFilters() {
        document.querySelector('.search-input').value = '';
        document.querySelector('.filter-rol').value = '';
        document.querySelector('.filter-estado').value = '';
        
        // Disparar el evento para actualizar la tabla
        document.querySelector('.search-input').dispatchEvent(new Event('input'));
    }
    
    // Función para mostrar el modal de eliminación (estilo alerta mejorado)
    function showDeleteModal(userId, userName) {
        // Verificar si ya existe un modal en el DOM y eliminarlo
        let existingModal = document.getElementById('deleteModal');
        if (existingModal) {
            existingModal.remove();
        }
        
        // Obtener el token CSRF - Método mejorado
        let csrfToken = '';
        
        // Intentar obtener el token de una meta tag (método recomendado por Django)
        const csrfTokenMeta = document.querySelector('meta[name="csrf-token"]');
        if (csrfTokenMeta) {
            csrfToken = csrfTokenMeta.getAttribute('content');
        } 
        // Si no hay meta tag, intentar obtener de una cookie
        else {
            const cookies = document.cookie.split(';');
            for (let cookie of cookies) {
                const [name, value] = cookie.trim().split('=');
                if (name === 'csrftoken') {
                    csrfToken = value;
                    break;
                }
            }
        }
        
        // Crear el modal de alerta dinámicamente con animación y estilos mejorados
        const modalHTML = `
        <div class="delete-alert-modal" id="deleteModal">
            <div class="delete-alert-content">
                <div class="delete-alert-header">
                    <h5><i class="fas fa-exclamation-triangle me-2"></i>Confirmar eliminación</h5>
                    <button type="button" class="delete-alert-close" onclick="closeDeleteModal()">×</button>
                </div>
                <div class="delete-alert-body">
                    <div class="text-center mb-3">
                        <div class="modal-icon-container">
                            <i class="fas fa-user-times"></i>
                        </div>
                        <p>¿Está seguro que desea eliminar al usuario?</p>
                        <p class="fw-bold" id="userName">${userName}</p>
                    </div>
                    <div class="delete-alert-warning">
                        <i class="fas fa-exclamation-circle me-2"></i>
                        <span>Esta acción no se puede deshacer y eliminará todos los datos asociados al usuario.</span>
                    </div>
                </div>
                <div class="delete-alert-footer">
                    <button type="button" class="btn-cancel" onclick="closeDeleteModal()">
                        <i class="fas fa-times me-1"></i>Cancelar
                    </button>
                    <form id="deleteForm" method="POST" action="/eliminar/${userId}/">
                        <input type="hidden" name="csrfmiddlewaretoken" value="${csrfToken}">
                        <button type="submit" class="btn-delete-confirm">
                            <i class="fas fa-trash-alt me-1"></i>Eliminar
                        </button>
                    </form>
                </div>
            </div>
        </div>
        `;
        
        // Añadir el modal al final del body
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Mostrar el modal con animación
        const modal = document.getElementById('deleteModal');
        
        // Forzar un reflow para que la animación funcione correctamente
        void modal.offsetWidth;
        
        // Mostrar el modal
        modal.style.display = 'flex';
        
        // Añadir evento para cerrar el modal al hacer clic fuera de él
        modal.addEventListener('click', function(event) {
            if (event.target === this) {
                closeDeleteModal();
            }
        });
        
        // Añadir evento para cerrar el modal con la tecla ESC
        document.addEventListener('keydown', function(event) {
            if (event.key === 'Escape') {
                closeDeleteModal();
            }
        });
    }

    // Función para cerrar el modal con animación
    function closeDeleteModal() {
        const modal = document.getElementById('deleteModal');
        if (modal) {
            // Añadir clase para animación de salida
            modal.style.opacity = '0';
            
            // Eliminar el modal después de la animación
            setTimeout(() => {
                modal.style.display = 'none';
                modal.remove();
            }, 300);
        }
    }

    // Función para validar RUT chileno
    function validarRut(rut) {
        // Eliminar puntos y guiones
        rut = rut.replace(/\./g, '').replace(/-/g, '');
        
        // Verificar que el RUT tenga exactamente 9 caracteres (8 dígitos + dígito verificador)
        if (rut.length !== 9) return false;
        
        // Obtener dígito verificador
        const dv = rut.slice(-1).toUpperCase();
        // Obtener cuerpo del RUT
        const rutCuerpo = rut.slice(0, -1);
        
        // Verificar que el cuerpo del RUT sea un número
        if (!/^\d+$/.test(rutCuerpo)) return false;
        
        // Calcular dígito verificador
        let suma = 0;
        let multiplicador = 2;
        
        // Recorrer el RUT de derecha a izquierda
        for (let i = rutCuerpo.length - 1; i >= 0; i--) {
            suma += parseInt(rutCuerpo.charAt(i)) * multiplicador;
            multiplicador = multiplicador === 7 ? 2 : multiplicador + 1;
        }
        
        const resto = suma % 11;
        const dvCalculado = resto === 0 ? '0' : resto === 1 ? 'K' : (11 - resto).toString();
        
        // Comparar dígito verificador calculado con el proporcionado
        return dvCalculado === dv;
    }

    // Configuración de los elementos del formulario cuando el DOM esté listo
    document.addEventListener('DOMContentLoaded', function() {
        // Configurar los botones de eliminar
        const deleteButtons = document.querySelectorAll('.btn-delete');
        deleteButtons.forEach(button => {
            button.addEventListener('click', function() {
                const userId = this.getAttribute('data-id');
                const userName = this.getAttribute('data-nombre');
                showDeleteModal(userId, userName);
            });
        });
        
        // Configurar validación de RUT
        const rutInput = document.getElementById('rut');
        if (rutInput) {
            rutInput.addEventListener('input', function(e) {
                // Obtener el valor actual y la posición del cursor
                let cursorPos = this.selectionStart;
                let originalLength = this.value.length;
                
                // Eliminar caracteres no válidos (solo permitir números, K/k, puntos y guiones)
                let value = this.value.replace(/[^0-9kK\.-]/g, '');
                
                // Eliminar puntos y guiones para trabajar con el valor limpio
                let cleanValue = value.replace(/\./g, '').replace(/-/g, '');
                
                // Limitar estrictamente a 9 caracteres (8 dígitos + dígito verificador)
                if (cleanValue.length > 9) {
                    cleanValue = cleanValue.substring(0, 9);
                }
                
                // Formatear el RUT con puntos y guión
                let formattedValue = '';
                if (cleanValue.length > 1) {
                    // Separar cuerpo y dígito verificador
                    let cuerpo = cleanValue.slice(0, -1);
                    let dv = cleanValue.slice(-1).toUpperCase();
                    
                    // Formatear con puntos cada 3 dígitos desde la derecha
                    if (cuerpo.length > 3) {
                        cuerpo = cuerpo.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
                    }
                    
                    formattedValue = cuerpo + '-' + dv;
                } else {
                    formattedValue = cleanValue;
                }
                
                // Actualizar el valor del input
                this.value = formattedValue;
                
                // Ajustar la posición del cursor si se agregaron o quitaron caracteres
                const lengthDiff = this.value.length - originalLength;
                this.setSelectionRange(cursorPos + lengthDiff, cursorPos + lengthDiff);
                
                // Validar RUT si tiene la longitud correcta
                const rutError = document.getElementById('rut-error');
                if (cleanValue.length === 9) {
                    if (validarRut(cleanValue)) {
                        this.classList.remove('is-invalid');
                        this.classList.add('is-valid');
                        if (rutError) rutError.style.display = 'none';
                    } else {
                        this.classList.remove('is-valid');
                        this.classList.add('is-invalid');
                        if (rutError) rutError.style.display = 'block';
                    }
                } else if (cleanValue.length > 0) {
                    this.classList.remove('is-valid');
                    this.classList.add('is-invalid');
                    if (rutError) rutError.style.display = 'block';
                } else {
                    this.classList.remove('is-valid', 'is-invalid');
                    if (rutError) rutError.style.display = 'none';
                }
            });
            
            // Validar al perder el foco
            rutInput.addEventListener('blur', function() {
                if (this.value.trim() !== '') {
                    const rutSinFormato = this.value.replace(/\./g, '').replace(/-/g, '');
                    const rutError = document.getElementById('rut-error');
                    
                    if (rutSinFormato.length === 9 && validarRut(rutSinFormato)) {
                        this.classList.remove('is-invalid');
                        this.classList.add('is-valid');
                        if (rutError) rutError.style.display = 'none';
                    } else {
                        this.classList.remove('is-valid');
                        this.classList.add('is-invalid');
                        if (rutError) rutError.style.display = 'block';
                    }
                }
            });
        }
        
        // Configurar teléfono con prefijo +56 9
        const telefonoInput = document.getElementById('telefono');
        if (telefonoInput) {
            // Asegurarse de que exista el elemento de error
            let telefonoError = document.createElement('div');
            telefonoError.id = 'telefono-error';
            telefonoError.className = 'invalid-feedback';
            telefonoError.textContent = 'Número inválido. Debe tener 8 dígitos después de +56 9.';
            telefonoInput.parentNode.appendChild(telefonoError);
            
            // Limitar la entrada a un máximo de 16 caracteres (formato +56 9 1234 5678)
            telefonoInput.setAttribute('maxlength', '16');
            
            // Asegurar que el valor inicial sea "+56 9 "
            if (!telefonoInput.value || telefonoInput.value.trim() === '') {
                telefonoInput.value = '+56 9 ';
            }
            
            telefonoInput.addEventListener('input', function(e) {
                // Obtener el valor actual y la posición del cursor
                let cursorPos = this.selectionStart;
                let originalLength = this.value.length;
                
                // Obtener solo los dígitos
                let allDigits = this.value.replace(/[^0-9]/g, '');
                
                // Asegurar que siempre comience con 569
                if (!allDigits.startsWith('569')) {
                    allDigits = '569' + allDigits.substring(allDigits.startsWith('56') ? 2 : (allDigits.startsWith('9') ? 1 : 0));
                }
                
                // Limitar a 11 dígitos en total (56 + 9 + 8 dígitos)
                if (allDigits.length > 11) {
                    allDigits = allDigits.substring(0, 11);
                }
                
                // Formatear el número de teléfono
                let formattedValue = '';
                if (allDigits.length <= 3) {
                    formattedValue = '+56 9 ';
                } else if (allDigits.length <= 7) {
                    formattedValue = '+56 9 ' + allDigits.substring(3);
                } else {
                    formattedValue = '+56 9 ' + allDigits.substring(3, 7) + ' ' + allDigits.substring(7);
                }
                
                // Actualizar el valor del input
                this.value = formattedValue;
                
                // Ajustar la posición del cursor si se agregaron o quitaron caracteres
                const lengthDiff = this.value.length - originalLength;
                this.setSelectionRange(cursorPos + lengthDiff, cursorPos + lengthDiff);
                
                // Validar número de teléfono (debe tener 8 dígitos después del prefijo)
                const phoneDigits = allDigits.substring(3);
                if (phoneDigits.length > 0) {
                    if (phoneDigits.length === 8) {
                        this.classList.remove('is-invalid');
                        this.classList.add('is-valid');
                        telefonoError.style.display = 'none';
                    } else {
                        this.classList.remove('is-valid');
                        this.classList.add('is-invalid');
                        telefonoError.style.display = 'block';
                    }
                } else {
                    this.classList.remove('is-valid', 'is-invalid');
                    telefonoError.style.display = 'none';
                }
            });
            
            // Prevenir que se borre el prefijo +56 9
            telefonoInput.addEventListener('keydown', function(e) {
                const cursorPos = this.selectionStart;
                if ((e.key === 'Backspace' || e.key === 'Delete') && cursorPos <= 6) {
                    e.preventDefault();
                }
            });
            
            // Asegurar que el cursor no se posicione antes del prefijo
            telefonoInput.addEventListener('click', function() {
                if (this.selectionStart < 6) {
                    this.setSelectionRange(6, 6);
                }
            });
        }
        
        // Validación del formulario antes de enviar
        const userForm = document.getElementById('userForm');
        if (userForm) {
            userForm.addEventListener('submit', function(e) {
                // Validar RUT si existe el campo
                if (rutInput && rutInput.value) {
                    const rutSinFormato = rutInput.value.replace(/\./g, '').replace(/-/g, '');
                    if (rutSinFormato.length !== 9 || !validarRut(rutInput.value)) {
                        e.preventDefault();
                        rutInput.classList.add('is-invalid');
                        document.getElementById('rut-error').style.display = 'block';
                        rutInput.focus();
                        return false;
                    }
                }
                
                // Verificar que se haya seleccionado un rol
                const rolSeleccionado = document.querySelector('input[name="rol"]:checked');
                if (rolSeleccionado === null) {
                    e.preventDefault();
                    alert('Por favor, seleccione un rol para el usuario.');
                    return false;
                }
            });
        }
    });

    document.addEventListener('DOMContentLoaded', function() {
        // Ocultar los mensajes de Django que se muestran en la parte superior
        const djangoMessages = document.querySelector('.messages');
        if (djangoMessages) {
            djangoMessages.style.display = 'none';
        }
        
        // Configuración de las opciones de rol
        const roleOptions = document.querySelectorAll('.role-option');
        
        roleOptions.forEach(option => {
            // Verificar si la opción debe estar seleccionada inicialmente
            const radioInput = option.querySelector('input[type="radio"]');
            if (radioInput.checked) {
                option.classList.add('selected');
            }
            
            // Añadir evento de clic a cada opción
            option.addEventListener('click', function() {
                // Desmarcar todas las opciones
                roleOptions.forEach(opt => {
                    opt.classList.remove('selected');
                    opt.querySelector('input[type="radio"]').checked = false;
                });
                
                // Marcar la opción seleccionada
                this.classList.add('selected');
                this.querySelector('input[type="radio"]').checked = true;
                
                // Ocultar mensaje de error si estaba visible
                document.getElementById('rol-error').style.display = 'none';
            });
        });
        
        // Validación del formulario antes de enviar
        const userForm = document.getElementById('userForm');
        if (userForm) {
            userForm.addEventListener('submit', function(e) {
                // Verificar que se haya seleccionado un rol
                const rolSeleccionado = document.querySelector('input[name="rol"]:checked');
                if (!rolSeleccionado) {
                    e.preventDefault();
                    document.getElementById('rol-error').style.display = 'block';
                    // Hacer scroll hasta el error
                    document.querySelector('.role-checklist').scrollIntoView({ behavior: 'smooth', block: 'center' });
                    return false;
                }
            });
        }
    });