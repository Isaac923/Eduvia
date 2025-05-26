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


document.addEventListener('DOMContentLoaded', function() {
    const sectionHeaders = document.querySelectorAll('.section-header');

    // Función para alternar sección
    function toggleSection(header) {
        const targetId = header.getAttribute('data-target');
        const content = document.getElementById(targetId);
        const toggle = header.querySelector('.section-toggle');
        
        if (content.classList.contains('expanded')) {
            // Contraer
            content.classList.remove('expanded');
            toggle.classList.remove('rotated');
        } else {
            // Expandir
            content.classList.add('expanded');
            toggle.classList.add('rotated');
        }
    }

    // Event listeners para cada header de sección
    sectionHeaders.forEach(header => {
        header.addEventListener('click', function() {
            toggleSection(this);
        });
    });

    // Expandir la primera sección por defecto
    const firstSection = document.querySelector('.section-header[data-target="personal-info"]');
    if (firstSection) {
        toggleSection(firstSection);
    }
});

// Función para mostrar el modal de detalles - CORREGIDA
function showDetailModal(button) {
    const userData = {
        id: button.getAttribute('data-id'),
        rut: button.getAttribute('data-rut'),
        nombres: button.getAttribute('data-nombres'),
        apellidos: button.getAttribute('data-apellidos'),
        correo: button.getAttribute('data-correo'),
        telefono: button.getAttribute('data-telefono') || '',
        rol: button.getAttribute('data-rol'),
        estado: button.getAttribute('data-estado'),
        funcion: button.getAttribute('data-funcion') || '',
        fecha: button.getAttribute('data-fecha')
    };
    
    // Guardar datos globalmente para el modal de edición
    window.currentUserData = userData;
    
    // Llenar los datos en el modal de detalles
    document.getElementById('detailUserName').textContent = `${userData.nombres} ${userData.apellidos}`;
    document.getElementById('detailRut').textContent = userData.rut || '-';
    document.getElementById('detailNombres').textContent = userData.nombres || '-';
    document.getElementById('detailApellidos').textContent = userData.apellidos || '-';
    document.getElementById('detailCorreo').textContent = userData.correo || '-';
    document.getElementById('detailTelefono').textContent = userData.telefono || '-';
    document.getElementById('detailFuncion').textContent = userData.funcion || '-';
    document.getElementById('detailFechaRegistro').textContent = userData.fecha || '-';
    
    // Configurar el rol
    const roleElement = document.getElementById('detailUserRole');
    const stateElement = document.getElementById('detailEstado');
    
    // Configurar badge del rol
    if (userData.rol === 'admin') {
        roleElement.className = 'role-badge role-admin';
        roleElement.innerHTML = '<i class="fas fa-user-shield"></i> Administrador';
    } else if (userData.rol === 'usuario') {
        roleElement.className = 'role-badge role-staff';
        roleElement.innerHTML = '<i class="fas fa-user"></i> Usuario';
    }
    
    // Configurar badge del estado
    if (userData.estado === 'active') {
        stateElement.className = 'status-badge status-active';
        stateElement.textContent = 'Activo';
    } else if (userData.estado === 'inactive') {
        stateElement.className = 'status-badge status-inactive';
        stateElement.textContent = 'Inactivo';
    } else {
        stateElement.className = 'status-badge status-pending';
        stateElement.textContent = 'Pendiente';
    }
    
    // Mostrar modal con animación
    const modal = document.getElementById('detailModal');
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    
    // Trigger de la animación de entrada
    setTimeout(() => {
        modal.classList.add('show');
    }, 10);
}

// Función para cerrar el modal de detalles
function closeDetailModal() {
    const modal = document.getElementById('detailModal');
    
    // Remover animación
    modal.classList.remove('show');
    
    // Esperar animación y ocultar
    setTimeout(() => {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
        
        // Limpiar datos
        window.currentUserData = null;
        window.originalUserData = null;
    }, 300);
}

// Función para editar usuario (placeholder)
function editUser() {
    if (window.currentDetailUserId) {
        // Aquí puedes redirigir a la página de edición
        // window.location.href = `/usuarios/editar/${window.currentDetailUserId}/`;
        alert(`Función de edición para usuario ID: ${window.currentDetailUserId} (por implementar)`);
    }
}

// Variables globales para edición
let currentEditUserId = null;
let originalEditData = {};

// Función para abrir el modal de edición
function openEditModal() {
    if (!window.currentUserData) {
        alert('No hay datos de usuario disponibles');
        return;
    }
    
    const userData = window.currentUserData;
    currentEditUserId = userData.id;
    
    // Guardar datos originales
    originalEditData = {...userData};
    
    // Llenar el formulario con los datos actuales
    fillEditForm(userData);
    
    // Cerrar modal de detalles
    closeDetailModal();
    
    // Mostrar modal de edición
    const editModal = document.getElementById('editModal');
    editModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    
    // Animación
    setTimeout(() => {
        editModal.classList.add('show');
    }, 10);
}

// Función para llenar el formulario de edición
function fillEditForm(userData) {
    document.getElementById('editRut').value = userData.rut || '';
    document.getElementById('editNombres').value = userData.nombres || '';
    document.getElementById('editApellidos').value = userData.apellidos || '';
    document.getElementById('editCorreo').value = userData.correo || '';
    
    // Formatear teléfono
    let telefono = userData.telefono || '';
    if (telefono && telefono !== '-' && telefono !== 'null') {
        if (!telefono.startsWith('+56 9')) {
            const cleanPhone = telefono.replace(/[^\d]/g, '');
            if (cleanPhone.length >= 8) {
                telefono = `+56 9 ${cleanPhone.slice(-8, -4)} ${cleanPhone.slice(-4)}`;
            } else {
                telefono = '+56 9 ';
            }
        }
    } else {
        telefono = '+56 9 ';
    }
    document.getElementById('editTelefono').value = telefono;
    
    document.getElementById('editRolSelect').value = userData.rol || 'usuario';
    document.getElementById('editEstadoSelect').value = userData.estado || 'inactive';
    document.getElementById('editFuncionInput').value = userData.funcion || '';
    
    // Configurar la acción del formulario
    const form = document.getElementById('editUserForm');
    form.action = `{% url 'usuarios:editar_usuario' 0 %}`.replace('0', userData.id);
}

// Función para cerrar el modal de edición
function closeEditModal() {
    const editModal = document.getElementById('editModal');
    
    editModal.classList.remove('show');
    
    setTimeout(() => {
        editModal.style.display = 'none';
        document.body.style.overflow = 'auto';
        
        // Limpiar datos
        currentEditUserId = null;
        originalEditData = {};
        
        // Limpiar errores de validación
        clearEditValidationErrors();
    }, 300);
}

// Función para limpiar errores de validación
function clearEditValidationErrors() {
    const errorElements = document.querySelectorAll('#editModal .invalid-feedback');
    const inputElements = document.querySelectorAll('#editModal .form-control-edit');
    
    errorElements.forEach(error => {
        error.style.display = 'none';
    });
    
    inputElements.forEach(input => {
        input.classList.remove('is-invalid', 'is-valid');
    });
}

// Manejar el envío del formulario de edición
document.addEventListener('DOMContentLoaded', function() {
    const editForm = document.getElementById('editUserForm');
    
    if (editForm) {
        editForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Validar formulario
            if (!validateEditForm()) {
                return;
            }
            
            // Mostrar confirmación
            if (confirm('¿Está seguro que desea guardar los cambios?')) {
                submitEditForm();
            }
        });
    }
    
    // Cerrar modal al hacer clic fuera
    const editModal = document.getElementById('editModal');
    if (editModal) {
        editModal.addEventListener('click', function(e) {
            if (e.target === editModal) {
                closeEditModal();
            }
        });
    }
    
    // Cerrar con tecla Escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const editModal = document.getElementById('editModal');
            if (editModal && editModal.style.display === 'flex') {
                closeEditModal();
            }
        }
    });
});

// Función para validar el formulario de edición
function validateEditForm() {
    let isValid = true;
    
    // Validar campos requeridos
    const requiredFields = ['editRut', 'editNombres', 'editApellidos', 'editCorreo'];
    
    requiredFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        const value = field.value.trim();
        
        if (!value) {
            showEditFieldError(fieldId, 'Este campo es requerido');
            isValid = false;
        } else {
            hideEditFieldError(fieldId);
        }
    });
    
    // Validar email
    const email = document.getElementById('editCorreo').value;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email && !emailRegex.test(email)) {
        showEditFieldError('editCorreo', 'Ingrese un correo electrónico válido');
        isValid = false;
    }
    
    return isValid;
}

// Función para mostrar error en campo específico
function showEditFieldError(fieldId, message) {
    const field = document.getElementById(fieldId);
    const errorElement = document.getElementById(fieldId.replace('edit', 'edit-').toLowerCase() + '-error');
    
    field.classList.add('is-invalid');
    field.classList.remove('is-valid');
    
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }
}

// Función para ocultar error en campo específico
function hideEditFieldError(fieldId) {
    const field = document.getElementById(fieldId);
    const errorElement = document.getElementById(fieldId.replace('edit', 'edit-').toLowerCase() + '-error');
    
    field.classList.remove('is-invalid');
    field.classList.add('is-valid');
    
    if (errorElement) {
        errorElement.style.display = 'none';
    }
}

// Función para enviar el formulario de edición
function submitEditForm() {
    const form = document.getElementById('editUserForm');
    const formData = new FormData(form);
    
    // Mostrar loading
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i>Guardando...';
    submitBtn.disabled = true;
    
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
        if (data.success) {
            alert('Usuario actualizado correctamente');
            closeEditModal();
            // Recargar la página para mostrar los cambios
            window.location.reload();
        } else {
            alert('Error al actualizar usuario: ' + (data.message || 'Error desconocido'));
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Error de conexión. Por favor, intente nuevamente.');
    })
    .finally(() => {
        // Restaurar botón
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    });
}