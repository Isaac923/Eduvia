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

    // Función para formatear RUT automáticamente
    function formatRUT(input) {
        let value = input.value.replace(/[^\dkK]/g, '');
        
        if (value.length > 1) {
            const body = value.slice(0, -1);
            const dv = value.slice(-1);
            
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

    // Función para validar RUT chileno
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
        
        if (value.length >= 2 && value.substring(0, 2) === '56') {
            value = value.substring(2);
        }
        
        if (value.length >= 1 && value.substring(0, 1) === '9') {
            value = value.substring(1);
        }
        
        if (value.length > 8) {
            value = value.substring(0, 8);
        }
        
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
        
        if (value.length === 0) {
            input.classList.remove('is-invalid', 'is-valid');
            if (errorElement) errorElement.style.display = 'none';
            return false;
        }

        if (!nameRegex.test(value)) {
            input.classList.add('is-invalid');
            input.classList.remove('is-valid');
            if (errorElement) {
                errorElement.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${fieldName} solo puede contener letras y espacios`;
                errorElement.style.display = 'block';
            }
            return false;
        }

        if (value.length < 2) {
            input.classList.add('is-invalid');
            input.classList.remove('is-valid');
            if (errorElement) {
                errorElement.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${fieldName} debe tener al menos 2 caracteres`;
                errorElement.style.display = 'block';
            }
            return false;
        }

        input.classList.remove('is-invalid');
        input.classList.add('is-valid');
        if (errorElement) errorElement.style.display = 'none';
        return true;
    }

    // Función para validar rol con checkbox
    function validateRole() {
        const rolCheckboxes = document.querySelectorAll('input[name="rol"]');
        const rolError = document.getElementById('rol-error');
        
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
        
        if (!validateRUT(rutInput)) isValid = false;
        if (!validateEmail(correoInput)) isValid = false;
        if (!validateRole()) isValid = false;
        
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
        
        if (!selectedRoleInput) {
            showAlert('error', 'Error', 'Debe seleccionar un rol para el usuario.');
            return;
        }
        
        const rol = selectedRoleInput.value;
        const rolText = rol === 'admin' ? 'Administrador' : 'Usuario';
        const asignaturaSelect = document.getElementById('asignatura');
        const asignatura = asignaturaSelect ? asignaturaSelect.value || 'No especificada' : 'No especificada';

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
                            <p><strong><i class="fas fa-briefcase"></i> Asignatura:</strong> ${asignatura}</p>
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

    // Función para enviar el formulario
    function submitForm() {
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

        const formData = new FormData(form);
        const selectedRoleInput = document.querySelector('input[name="rol"]:checked');
        if (selectedRoleInput) {
            formData.append('rol', selectedRoleInput.value);
        }

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
                Swal.fire({
                    icon: 'success',
                    title: '¡Usuario creado exitosamente!',
                    text: data.message,
                    confirmButtonColor: '#28a745',
                    confirmButtonText: 'Continuar'
                }).then(() => {
                    window.location.href = '/usuarios/lista/';
                });
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Error al crear usuario',
                    text: data.message,
                    confirmButtonColor: '#dc3545',
                    confirmButtonText: 'Entendido'
                });
            }
        })
        .catch(error => {
            console.error('Error:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error de conexión',
                text: 'Hubo un problema al comunicarse con el servidor. Intente nuevamente.',
                confirmButtonColor: '#dc3545',
                confirmButtonText: 'Entendido'
            });
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
                window.location.href = '/usuarios/';
            }
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
            html: `<div class="alert-content">${errorMessages}</div>`,
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

// Función para resetear los filtros (simplificada)
function resetFilters() {
    document.querySelector('.search-input').value = '';
    document.querySelector('.filter-rol').value = '';
    document.querySelector('.filter-estado').value = '';
    
    // Mostrar todas las filas
    const rows = document.querySelectorAll('.user-table tbody tr');
    rows.forEach(row => {
        row.style.display = '';
    });
    
    // Ocultar mensaje de no resultados
    document.getElementById('empty-results').style.display = 'none';
    document.querySelector('.user-table').style.display = 'table';
}

// Función de filtrado simplificada
function filterTable() {
    const searchInput = document.querySelector('.search-input');
    const filterRol = document.querySelector('.filter-rol');
    const filterEstado = document.querySelector('.filter-estado');
    const emptyResults = document.getElementById('empty-results');
    const userTable = document.querySelector('.user-table tbody');

    const searchTerm = searchInput.value.toLowerCase().trim();
    const selectedRol = filterRol.value;
    const selectedEstado = filterEstado.value;
    const rows = userTable.querySelectorAll('tr');
    let visibleRows = 0;

    rows.forEach(row => {
        // Saltar la fila de "empty state"
        if (row.querySelector('.empty-state')) {
            return;
        }

        const rut = row.cells[0].textContent.toLowerCase();
        const nombres = row.cells[1].textContent.toLowerCase();
        const apellidos = row.cells[2].textContent.toLowerCase();
        const rol = row.cells[3].getAttribute('data-rol');
        const estado = row.cells[5].getAttribute('data-estado');

        // Buscar en RUT, nombres y apellidos
        const matchesSearch = searchTerm === '' || 
                            rut.includes(searchTerm) || 
                            nombres.includes(searchTerm) || 
                            apellidos.includes(searchTerm) ||
                            (nombres + ' ' + apellidos).includes(searchTerm);

        // Filtrar por rol
        let matchesRol = selectedRol === '';
        if (selectedRol !== '') {
            if (selectedRol === 'usuario' && (rol === 'usuario' || rol === 'student' || rol === 'staff')) {
                matchesRol = true;
            } else if (selectedRol === rol) {
                matchesRol = true;
            }
        }

        // Filtrar por estado
        const matchesEstado = selectedEstado === '' || estado === selectedEstado;

        if (matchesSearch && matchesRol && matchesEstado) {
            row.style.display = '';
            visibleRows++;
        } else {
            row.style.display = 'none';
        }
    });

    // Mostrar/ocultar mensaje de "no hay resultados"
    if (visibleRows === 0 && (searchTerm !== '' || selectedRol !== '' || selectedEstado !== '')) {
        emptyResults.style.display = 'block';
        userTable.parentElement.style.display = 'none';
    } else {
        emptyResults.style.display = 'none';
        userTable.parentElement.style.display = 'table';
    }
}

// Event listeners simplificados
document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.querySelector('.search-input');
    const filterRol = document.querySelector('.filter-rol');
    const filterEstado = document.querySelector('.filter-estado');

    if (searchInput) {
        searchInput.addEventListener('input', filterTable);
        searchInput.addEventListener('keyup', filterTable);
    }

    if (filterRol) {
        filterRol.addEventListener('change', filterTable);
    }

    if (filterEstado) {
        filterEstado.addEventListener('change', filterTable);
    }
});

// Función para mostrar el modal de detalles
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
    
    // Llenar los datos en el modal
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
    
    if (userData.rol === 'admin') {
        roleElement.className = 'role-badge role-admin';
        roleElement.innerHTML = '<i class="fas fa-user-shield"></i> Administrador';
    } else if (userData.rol === 'usuario') {
        roleElement.className = 'role-badge role-staff';
        roleElement.innerHTML = '<i class="fas fa-user"></i> Usuario';
    }
    
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
    
    // Mostrar modal
    const modal = document.getElementById('detailModal');
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    
    setTimeout(() => {
        modal.classList.add('show');
    }, 10);
}

// Función para cerrar el modal de detalles
function closeDetailModal() {
    const modal = document.getElementById('detailModal');
    
    modal.classList.remove('show');
    
    setTimeout(() => {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }, 300);
}

// Función para editar usuario
function editUser() {
    alert('Función de edición por implementar');
}

function showPermissionsModal(button) {
    const userId = button.getAttribute('data-id');
    const userName = button.getAttribute('data-nombre');
    const userRole = button.getAttribute('data-rol');
    
    alert(`Asignar permisos a: ${userName} (ID: ${userId}, Rol: ${userRole})`);
    // Aquí puedes implementar la lógica del modal de permisos
}

// Función para inicializar la lista de usuarios
function initializeUserList() {
    console.log('Inicializando lista de usuarios...');
    
    // Event listeners para filtros y búsqueda
    const searchInput = document.querySelector('.search-input');
    const filterRol = document.querySelector('.filter-rol');
    const filterEstado = document.querySelector('.filter-estado');

    if (searchInput) {
        searchInput.addEventListener('input', filterTable);
        searchInput.addEventListener('keyup', filterTable);
    }

    if (filterRol) {
        filterRol.addEventListener('change', filterTable);
    }

    if (filterEstado) {
        filterEstado.addEventListener('change', filterTable);
    }
    
    console.log('Lista de usuarios inicializada correctamente');
}