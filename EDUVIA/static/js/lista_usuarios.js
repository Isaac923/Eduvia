//ALERTAS// 
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('userForm');
    
    // Solo ejecutar si estamos en la página de nuevo usuario
    if (form) {
        initializeNewUserForm();
    }
    
    // Inicializar funcionalidades para lista de usuarios si existe
    initializeUserList();
});

function initializeNewUserForm() {
    const form = document.getElementById('userForm');
    const rutInput = document.getElementById('rut');
    const telefonoInput = document.getElementById('telefono');
    const correoInput = document.getElementById('correo');
    const nombresInput = document.getElementById('nombres');
    const apellidosInput = document.getElementById('apellidos');
    const rolInputs = document.querySelectorAll('input[name="rol"]');

    // Validación en tiempo real del RUT
    if (rutInput) {
        rutInput.addEventListener('input', function() {
            formatRUT(this);
            validateRUT(this);
        });
    }

    // Validación en tiempo real del teléfono
    if (telefonoInput) {
        telefonoInput.addEventListener('input', function() {
            formatPhone(this);
            validatePhone(this);
        });
    }

    // Validación en tiempo real del correo
    if (correoInput) {
        correoInput.addEventListener('input', function() {
            validateEmail(this);
        });
    }

    // Eliminar validación en tiempo real de nombres y apellidos
    // if (nombresInput) {
    //     nombresInput.addEventListener('input', function() {
    //         validateName(this, 'Nombres');
    //     });
    // }

    // if (apellidosInput) {
    //     apellidosInput.addEventListener('input', function() {
    //         validateName(this, 'Apellidos');
    //     });
    // }

    // Validación del rol
    rolInputs.forEach(input => {
        input.addEventListener('change', function() {
            validateRole();
        });
    });

    // Validación del formulario al enviarlo
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Validar nombres y apellidos aquí
            const nombresValid = validateName(nombresInput, 'Nombres');
            const apellidosValid = validateName(apellidosInput, 'Apellidos');
            
            if (validateForm() && nombresValid && apellidosValid) {
                showConfirmationAlert();
            } else {
                showValidationErrorAlert();
            }
        });
    }

    // Función para formatear RUT automáticamente (CORREGIDA)
    function formatRUT(input) {
        let value = input.value.replace(/[^\dkK]/g, '');
        
        if (value.length > 1) {
            // Separar cuerpo y dígito verificador
            const body = value.slice(0, -1);
            const dv = value.slice(-1);
            
            // Formatear el cuerpo con puntos
            let formattedBody = '';
            for (let i = body.length - 1, j = 0; i >= 0; i--, j++) {
                if (j > 0 && j % 3 === 0) {
                    formattedBody = '.' + formattedBody;
                }
                formattedBody = body[i] + formattedBody;
            }
            
            value = formattedBody + '-' + dv;
        }
        
        input.value = value.toUpperCase();
    }

    // Función para validar RUT chileno (CORREGIDA)
    function validateRUT(input) {
        const rutWithFormat = input.value;
        const rut = rutWithFormat.replace(/\./g, '').replace('-', '');
        const rutError = document.getElementById('rut-error');
        
        if (rut.length === 0) {
            hideError(input, rutError);
            return true;
        }

        if (rut.length < 8 || rut.length > 9) {
            showError(input, rutError, 'RUT debe tener entre 8 y 9 caracteres');
            return false;
        }

        // Validar formato y dígito verificador
        const isValid = validateRUTFormat(rut);
        
        if (!isValid) {
            showError(input, rutError, 'RUT inválido. Verifique el formato y dígito verificador');
            return false;
        }

        hideError(input, rutError);
        return true;
    }

    // Función para validar formato de RUT y dígito verificador
    function validateRUTFormat(rut) {
        if (!/^[0-9]+[0-9kK]$/.test(rut)) return false;
        
        const body = rut.slice(0, -1);
        const dv = rut.slice(-1).toUpperCase();
        
        let sum = 0;
        let multiplier = 2;
        
        for (let i = body.length - 1; i >= 0; i--) {
            sum += parseInt(body[i]) * multiplier;
            multiplier = multiplier === 7 ? 2 : multiplier + 1;
        }
        
        const expectedDV = 11 - (sum % 11);
        const calculatedDV = expectedDV === 11 ? '0' : expectedDV === 10 ? 'K' : expectedDV.toString();
        
        return dv === calculatedDV;
    }

    // Función para formatear teléfono automáticamente
    function formatPhone(input) {
        let value = input.value.replace(/[^\d]/g, '');
        
        // Remover prefijo 56 si está presente
        if (value.length >= 2 && value.substring(0, 2) === '56') {
            value = value.substring(2);
        }
        
        // Remover 9 inicial si está presente
        if (value.length >= 1 && value.substring(0, 1) === '9') {
            value = value.substring(1);
        }
        
        // Limitar a 8 dígitos
        if (value.length > 8) {
            value = value.substring(0, 8);
        }
        
        // Formatear con espacio
        if (value.length >= 4) {
            value = value.substring(0, 4) + ' ' + value.substring(4);
        }
        
        input.value = '+56 9 ' + value;
    }

    // Función para validar teléfono
    function validatePhone(input) {
        const phone = input.value;
        const phoneError = document.getElementById('telefono-error');
        
        if (phone.length === 0 || phone === '+56 9 ') {
            hideError(input, phoneError);
            return true;
        }

        const phoneRegex = /^\+56 9 \d{4} \d{4}$/;
        
        if (!phoneRegex.test(phone)) {
            showError(input, phoneError, 'Formato inválido. Use: +56 9 1234 5678');
            return false;
        }

        hideError(input, phoneError);
        return true;
    }

    // Función para validar email
    function validateEmail(input) {
        const email = input.value;
        const emailError = document.getElementById('correo-error');
        
        if (email.length === 0) {
            hideError(input, emailError);
            return false;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        
        if (!emailRegex.test(email)) {
            showError(input, emailError, 'Ingrese un correo electrónico válido');
            return false;
        }

        hideError(input, emailError);
        return true;
    }

    // Función para validar nombres y apellidos
    function validateName(input, fieldName) {
        const value = input.value.trim();
        const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
        const errorElement = document.getElementById(`${input.id}-error`);
        
        // Si el campo está vacío
        if (value.length === 0) {
            input.classList.remove('is-invalid', 'is-valid');
            if (errorElement) errorElement.style.display = 'none';
            return false;
        }

        // Validar solo letras
        if (!nameRegex.test(value)) {
            input.classList.add('is-invalid');
            input.classList.remove('is-valid');
            if (errorElement) {
                errorElement.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${fieldName} solo puede contener letras y espacios`;
                errorElement.style.display = 'block';
            }
            return false;
        }

        // Validar longitud mínima
        if (value.length < 2) {
            input.classList.add('is-invalid');
            input.classList.remove('is-valid');
            if (errorElement) {
                errorElement.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${fieldName} debe tener al menos 2 caracteres`;
                errorElement.style.display = 'block';
            }
            return false;
        }

        // Si pasa todas las validaciones, marcar en verde
        input.classList.remove('is-invalid');
        input.classList.add('is-valid');
        if (errorElement) errorElement.style.display = 'none';
        return true;
    }

    // Función para validar rol con checkbox
    function validateRole() {
        const rolCheckboxes = document.querySelectorAll('input[name="rol"]');
        const rolError = document.getElementById('rol-error');
        
        // Verificar si al menos un checkbox está seleccionado
        const selectedRole = Array.from(rolCheckboxes).some(checkbox => checkbox.checked);
        
        if (!selectedRole) {
            if (rolError) {
                rolError.innerHTML = '<i class="fas fa-exclamation-circle"></i> Debe seleccionar un rol para el usuario';
                rolError.style.display = 'block';
            }
            return false;
        }

        if (rolError) rolError.style.display = 'none';
        return true;
    }

    // Función para mostrar errores
    function showError(input, errorElement, message) {
        input.classList.add('is-invalid');
        input.classList.remove('is-valid');
        if (errorElement) {
            errorElement.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
            errorElement.style.display = 'block';
        }
    }

    // Función para ocultar errores
    function hideError(input, errorElement) {
        input.classList.remove('is-invalid');
        if (input.value.trim() !== '') {
            input.classList.add('is-valid');
        }
        if (errorElement) {
            errorElement.style.display = 'none';
        }
    }

    // Función para validar todo el formulario
    function validateForm() {
        let isValid = true;
        
        // Validar campos requeridos
        if (!validateRUT(rutInput)) isValid = false;
        if (!validateEmail(correoInput)) isValid = false;
        if (!validateRole()) isValid = false;
        
        // Validar teléfono si tiene contenido
        if (telefonoInput && telefonoInput.value.length > 6) {
            if (!validatePhone(telefonoInput)) isValid = false;
        }

        return isValid;
    }

    // Función para mostrar alerta de error de validación
    function showValidationErrorAlert() {
        Swal.fire({
            icon: 'error',
            title: 'Errores en el formulario',
            text: 'Por favor corrija los errores marcados antes de continuar.',
            confirmButtonColor: '#dc3545',
            confirmButtonText: 'Entendido'
        });
    }

    // Función para mostrar alerta de confirmación
    function showConfirmationAlert() {
        const nombres = nombresInput.value.trim();
        const apellidos = apellidosInput.value.trim();
        const rut = rutInput.value;
        const correo = correoInput.value;
        const selectedRoleInput = document.querySelector('input[name="rol"]:checked');
        
        // Verificar que hay un rol seleccionado
        if (!selectedRoleInput) {
            showAlert('error', 'Error', 'Debe seleccionar un rol para el usuario.');
            return;
        }
        
        const rol = selectedRoleInput.value;
        const rolText = rol === 'admin' ? 'Administrador' : 'Usuario';
        const funcion = document.getElementById('funcion').value || 'No especificada';

        Swal.fire({
            title: '¿Confirmar creación de usuario?',
            html: `
                <div class="confirmation-details">
                    <div class="row">
                        <div class="col-12">
                            <p><strong><i class="fas fa-user"></i> Nombre:</strong> ${nombres} ${apellidos}</p>
                            <p><strong><i class="fas fa-id-card"></i> RUT:</strong> ${rut}</p>
                            <p><strong><i class="fas fa-envelope"></i> Correo:</strong> ${correo}</p>
                            <p><strong><i class="fas fa-user-shield"></i> Rol:</strong> ${rolText}</p>
                            <p><strong><i class="fas fa-briefcase"></i> Función:</strong> ${funcion}</p>
                        </div>
                    </div>
                    <div class="alert alert-warning mt-3">
                        <i class="fas fa-info-circle"></i>
                        <strong>Importante:</strong> El usuario se creará con estado "Inactivo" y deberá ser activado posteriormente.
                    </div>
                </div>
            `,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#28a745',
            cancelButtonColor: '#6c757d',
            confirmButtonText: '<i class="fas fa-save"></i> Sí, crear usuario',
            cancelButtonText: '<i class="fas fa-times"></i> Cancelar',
            customClass: {
                popup: 'swal-wide'
            },
            focusConfirm: false
        }).then((result) => {
            if (result.isConfirmed) {
                submitForm();
            }
        });
    }

    // Función para enviar el formulario (CORREGIDA)
    function submitForm() {
        // Mostrar loading
        Swal.fire({
            title: 'Creando usuario...',
            html: '<i class="fas fa-spinner fa-spin"></i> Por favor espere mientras se procesa la información',
            icon: 'info',
            allowOutsideClick: false,
            allowEscapeKey: false,
            showConfirmButton: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        // Crear FormData para enviar
        const formData = new FormData(form);

        // Agregar el valor del rol seleccionado al FormData
        const selectedRoleInput = document.querySelector('input[name="rol"]:checked');
        if (selectedRoleInput) {
            formData.append('rol', selectedRoleInput.value);
        }

        // Enviar formulario con fetch
        fetch(form.action, {
            method: 'POST',
            body: formData,
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value
            }
        })
        .then(response => response.json())
        .then(data => {
            Swal.close();

            if (data.success) {
                // Usuario creado exitosamente
                Swal.fire({
                    icon: 'success',
                    title: '¡Usuario creado!',
                    text: data.message || 'El usuario ha sido creado correctamente.',
                    confirmButtonColor: '#28a745',
                    confirmButtonText: 'Continuar'
                }).then(() => {
                    window.location.href = data.redirect_url || '/usuarios/';
                });
            } else {
                // Manejar errores
                if (data.error_type === 'user_exists') {
                    showUserExistsAlert(data);
                } else if (data.errors) {
                    showFormErrorsAlert(data.errors);
                } else {
                    showGenericErrorAlert(data.message);
                }
            }
        })
        .catch(error => {
            Swal.close();
            console.error('Error:', error);
            showGenericErrorAlert('Error de conexión. Por favor, intente nuevamente.');
        });
    }

    // Función para mostrar alerta de usuario existente
    function showUserExistsAlert(data) {
        const existingField = data.existing_field || 'RUT o correo';
        const existingValue = data.existing_value || '';
        
        Swal.fire({
            icon: 'warning',
            title: 'Usuario ya existe',
            html: `
                <div class="alert-content">
                    <p><strong>Ya existe un usuario registrado con este ${existingField}:</strong></p>
                    <p class="text-primary"><i class="fas fa-user"></i> ${existingValue}</p>
                    <hr>
                    <p class="text-muted">
                        <i class="fas fa-info-circle"></i> 
                        Por favor verifique los datos o contacte al administrador si necesita actualizar la información del usuario existente.
                    </p>
                </div>
            `,
            confirmButtonColor: '#ffc107',
            confirmButtonText: '<i class="fas fa-edit"></i> Corregir datos',
            showCancelButton: true,
            cancelButtonColor: '#6c757d',
            cancelButtonText: '<i class="fas fa-list"></i> Ver usuarios',
            customClass: {
                popup: 'swal-wide'
            }
        }).then((result) => {
            if (result.dismiss === Swal.DismissReason.cancel) {
                // Ir a la lista de usuarios
                window.location.href = '/usuarios/';
            }
            // Si hace clic en "Corregir datos", se queda en el formulario
        });
    }

    // Función para mostrar errores de formulario
    function showFormErrorsAlert(errors) {
        let errorMessages = '';
        for (const [field, messages] of Object.entries(errors)) {
            errorMessages += `<p><strong>${field}:</strong> ${messages.join(', ')}</p>`;
        }
        
        Swal.fire({
            icon: 'error',
            title: 'Errores en el formulario',
            html: `
                <div class="alert-content">
                    ${errorMessages}
                </div>
            `,
            confirmButtonColor: '#dc3545',
            confirmButtonText: 'Corregir'
        });
    }

    // Función para mostrar error genérico
    function showGenericErrorAlert(message) {
        Swal.fire({
            icon: 'error',
            title: 'Error al crear usuario',
            text: message || 'Ha ocurrido un error inesperado. Por favor, intente nuevamente.',
            confirmButtonColor: '#dc3545',
            confirmButtonText: 'Entendido'
        });
    }
}

// Función para mostrar alertas generales
function showAlert(type, title, message) {
    const iconColors = {
        'success': '#28a745',
        'error': '#dc3545',
        'warning': '#ffc107',
        'info': '#17a2b8'
    };

    Swal.fire({
        icon: type,
        title: title,
        text: message,
        confirmButtonColor: iconColors[type] || '#007bff',
        confirmButtonText: 'Entendido'
    });
}

// Función para inicializar funcionalidades de lista de usuarios
function initializeUserList() {
    // Aquí puedes agregar funcionalidades para la lista de usuarios
    // como confirmaciones de eliminación, cambios de estado, etc.
    
    // Ejemplo: Confirmación para eliminar usuarios
    const deleteButtons = document.querySelectorAll('.btn-delete-user');
    deleteButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const userName = this.dataset.userName || 'este usuario';
            const deleteUrl = this.href;
            
            Swal.fire({
                title: '¿Está seguro?',
                html: `¿Desea eliminar a <strong>${userName}</strong>?<br><small class="text-muted">Esta acción no se puede deshacer.</small>`,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#dc3545',
                cancelButtonColor: '#6c757d',
                confirmButtonText: '<i class="fas fa-trash"></i> Sí, eliminar',
                cancelButtonText: '<i class="fas fa-times"></i> Cancelar'
            }).then((result) => {
                if (result.isConfirmed) {
                    window.location.href = deleteUrl;
                }
            });
        });
    });
}
 // Función para mostrar mensajes de estado
    const statusButtons = document.querySelectorAll('.btn-change-status');
    statusButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const userName = this.dataset.userName || 'este usuario';
            const currentStatus = this.dataset.currentStatus;
            const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
            const statusUrl = this.href;
            
            const statusText = {
                'active': 'Activo',
                'inactive': 'Inactivo'
            };
            
            const statusIcon = {
                'active': 'check-circle',
                'inactive': 'times-circle'
            };
            
            const statusColor = {
                'active': '#28a745',
                'inactive': '#dc3545'
            };
            
            Swal.fire({
                title: 'Cambiar estado',
                html: `¿Desea cambiar el estado de <strong>${userName}</strong> de <span class="text-${currentStatus === 'active' ? 'success' : 'danger'}"><i class="fas fa-${statusIcon[currentStatus]}"></i> ${statusText[currentStatus]}</span> a <span class="text-${newStatus === 'active' ? 'success' : 'danger'}"><i class="fas fa-${statusIcon[newStatus]}"></i> ${statusText[newStatus]}</span>?`,
                icon: 'question',
                showCancelButton: true,
                confirmButtonColor: statusColor[newStatus],
                cancelButtonColor: '#6c757d',
                confirmButtonText: `<i class="fas fa-${statusIcon[newStatus]}"></i> Sí, cambiar a ${statusText[newStatus]}`,
                cancelButtonText: '<i class="fas fa-times"></i> Cancelar'
            }).then((result) => {
                if (result.isConfirmed) {
                    window.location.href = statusUrl;
                }
            });
        });
    });
    
    // Inicializar tooltips para botones de acción
    const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    if (tooltipTriggerList.length > 0) {
        const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));
    }
    
    // Inicializar filtros de búsqueda si existen
    const searchInput = document.getElementById('searchUsers');
    if (searchInput) {
        searchInput.addEventListener('keyup', function() {
            const searchTerm = this.value.toLowerCase();
            const userRows = document.querySelectorAll('.user-row');
            
            userRows.forEach(row => {
                const userData = row.textContent.toLowerCase();
                if (userData.includes(searchTerm)) {
                    row.style.display = '';
                } else {
                    row.style.display = 'none';
                }
            });
        });
    }
    
    // Inicializar filtros de rol si existen
    const roleFilters = document.querySelectorAll('.role-filter');
    roleFilters.forEach(filter => {
        filter.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Remover clase activa de todos los filtros
            roleFilters.forEach(f => f.classList.remove('active'));
            
            // Agregar clase activa al filtro seleccionado
            this.classList.add('active');
            
            const roleToFilter = this.dataset.role;
            const userRows = document.querySelectorAll('.user-row');
            
            userRows.forEach(row => {
                if (roleToFilter === 'all') {
                    row.style.display = '';
                } else {
                    const userRole = row.dataset.role;
                    if (userRole === roleToFilter) {
                        row.style.display = '';
                    } else {
                        row.style.display = 'none';
                    }
                }
            });
        });
    });


