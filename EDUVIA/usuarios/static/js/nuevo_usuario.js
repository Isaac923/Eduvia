document.addEventListener('DOMContentLoaded', function() {
    // Elementos del formulario
    const form = document.getElementById('userForm');
    const rutInput = document.getElementById('rut');
    const passwordInput = document.getElementById('password');
    const nombresInput = document.getElementById('nombres');
    const apellidosInput = document.getElementById('apellidos');
    const telefonoInput = document.getElementById('telefono');
    const correoInput = document.getElementById('correo');
    const rolInput = document.getElementById('rol');
    const tipoUsuarioSelect = document.getElementById('tipo-usuario');
    const asignaturaSelect = document.getElementById('asignatura');
    
    // Botones de selección de rol
    const btnRolUsuario = document.getElementById('btn-rol-usuario');
    const btnRolProfesor = document.getElementById('btn-rol-profesor');
    
    // Dropdowns condicionales
    const dropdownUsuario = document.getElementById('dropdown-usuario');
    const dropdownProfesor = document.getElementById('dropdown-profesor');
    
    // Error de rol
    const errorRol = document.getElementById('error-rol');

    // ===== VALIDACIONES =====
    
    // Validar RUT chileno
    function validarRUT(rut) {
        // Limpiar el RUT
        rut = rut.replace(/\./g, '').replace(/\-/g, '').trim();
        
        if (rut.length < 8 || rut.length > 9) {
            return false;
        }
        
        // Separar número y dígito verificador
        const numero = rut.slice(0, -1);
        const dv = rut.slice(-1).toUpperCase();
        
        // Validar que el número sea numérico
        if (!/^\d+$/.test(numero)) {
            return false;
        }
        
        // Calcular dígito verificador
        let suma = 0;
        let multiplicador = 2;
        
        for (let i = numero.length - 1; i >= 0; i--) {
            suma += parseInt(numero[i]) * multiplicador;
            multiplicador = multiplicador === 7 ? 2 : multiplicador + 1;
        }
        
        const resto = suma % 11;
        const dvCalculado = resto === 0 ? '0' : resto === 1 ? 'K' : (11 - resto).toString();
        
        return dv === dvCalculado;
    }

    // Formatear RUT mientras se escribe
    function formatearRUT(rut) {
        // Eliminar todo lo que no sea número o K
        rut = rut.replace(/[^0-9K]/gi, '');
        
        // Separar número y dígito verificador
        if (rut.length > 1) {
            const numero = rut.slice(0, -1);
            const dv = rut.slice(-1);
            
            // Formatear número con puntos
            const numeroFormateado = numero.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
            
            return `${numeroFormateado}-${dv}`;
        }
        
        return rut;
    }

    // Validar teléfono chileno
    function validarTelefono(telefono) {
        // Formato: +56 9 1234 5678
        const regex = /^\+56 9 \d{4} \d{4}$/;
        return regex.test(telefono);
    }

    // Formatear teléfono mientras se escribe
    function formatearTelefono(telefono) {
        // Mantener solo números después del prefijo
        let numeros = telefono.replace(/^\+56 9 /, '').replace(/\D/g, '');
        
        if (numeros.length >= 4) {
            return `+56 9 ${numeros.slice(0, 4)} ${numeros.slice(4, 8)}`;
        } else if (numeros.length > 0) {
            return `+56 9 ${numeros}`;
        }
        
        return '+56 9 ';
    }

    // Validar email
    function validarEmail(email) {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    }

    // Aplicar validación visual
    function aplicarValidacion(input, esValido, mostrarFeedback = true) {
        const grupo = input.closest('.form-group');
        const validFeedback = grupo.querySelector('.valid-feedback');
        const invalidFeedback = grupo.querySelector('.invalid-feedback');
        
        if (esValido) {
            input.classList.remove('is-invalid');
            input.classList.add('is-valid');
            if (mostrarFeedback && validFeedback) validFeedback.style.display = 'block';
            if (invalidFeedback) invalidFeedback.style.display = 'none';
        } else {
            input.classList.remove('is-valid');
            input.classList.add('is-invalid');
            if (validFeedback) validFeedback.style.display = 'none';
            if (mostrarFeedback && invalidFeedback) invalidFeedback.style.display = 'block';
        }
    }

    // ===== EVENT LISTENERS =====

    // Validación de RUT en tiempo real
    rutInput.addEventListener('input', function() {
        let valor = this.value;
        
        // Formatear mientras escribe
        this.value = formatearRUT(valor);
        
        // Validar si tiene longitud suficiente
        if (valor.length >= 8) {
            const esValido = validarRUT(valor);
            aplicarValidacion(this, esValido);
        } else {
            aplicarValidacion(this, false, false);
        }
    });

    // Validación de contraseña
    passwordInput.addEventListener('input', function() {
        const esValida = this.value.length >= 6;
        aplicarValidacion(this, esValida);
    });

    // Validación de nombres
    nombresInput.addEventListener('input', function() {
        const esValido = this.value.trim().length > 0;
        aplicarValidacion(this, esValido);
    });

    // Validación de apellidos
    apellidosInput.addEventListener('input', function() {
        const esValido = this.value.trim().length > 0;
        aplicarValidacion(this, esValido);
    });

    // Validación y formateo de teléfono
    telefonoInput.addEventListener('input', function() {
        this.value = formatearTelefono(this.value);
        
        if (this.value.length > 7) { // Más que solo "+56 9 "
            const esValido = validarTelefono(this.value);
            aplicarValidacion(this, esValido);
        } else {
            aplicarValidacion(this, false, false);
        }
    });

    // Validación de correo
    correoInput.addEventListener('input', function() {
        if (this.value.length > 0) {
            const esValido = validarEmail(this.value);
            aplicarValidacion(this, esValido);
        } else {
            aplicarValidacion(this, false, false);
        }
    });

    // ===== SELECCIÓN DE ROL =====

    // Función para mostrar/ocultar dropdowns
    function mostrarDropdown(tipo) {
        dropdownUsuario.style.display = 'none';
        dropdownProfesor.style.display = 'none';
        errorRol.style.display = 'none';
        
        if (tipo === 'usuario') {
            dropdownUsuario.style.display = 'block';
            // Limpiar selección de profesor
            asignaturaSelect.value = '';
        } else if (tipo === 'profesor') {
            dropdownProfesor.style.display = 'block';
            // Limpiar selección de usuario
            tipoUsuarioSelect.value = '';
        }
    }

    // Función para activar botón de rol
    function activarBotonRol(boton, rol) {
        // Remover clase activa de ambos botones
        btnRolUsuario.classList.remove('active');
        btnRolProfesor.classList.remove('active');
        
        // Activar el botón seleccionado
        boton.classList.add('active');
        
        // Establecer valor del rol
        rolInput.value = rol;
        
        // Mostrar dropdown correspondiente
        mostrarDropdown(rol);
    }

    // Event listeners para botones de rol
    btnRolUsuario.addEventListener('click', function() {
        activarBotonRol(this, 'usuario');
    });

    btnRolProfesor.addEventListener('click', function() {
        activarBotonRol(this, 'profesor');
    });

    // ===== VALIDACIÓN DEL FORMULARIO =====

    form.addEventListener('submit', function(e) {
        let formularioValido = true;
        
        // Validar RUT
        if (!rutInput.value || !validarRUT(rutInput.value)) {
            aplicarValidacion(rutInput, false);
            formularioValido = false;
        }
        
        // Validar contraseña
        if (!passwordInput.value || passwordInput.value.length < 6) {
            aplicarValidacion(passwordInput, false);
            formularioValido = false;
        }
        
        // Validar nombres
        if (!nombresInput.value.trim()) {
            aplicarValidacion(nombresInput, false);
            formularioValido = false;
        }
        
        // Validar apellidos
        if (!apellidosInput.value.trim()) {
            aplicarValidacion(apellidosInput, false);
            formularioValido = false;
        }
        
        // Validar correo
        if (!correoInput.value || !validarEmail(correoInput.value)) {
            aplicarValidacion(correoInput, false);
            formularioValido = false;
        }
        
        // Validar teléfono (si tiene contenido)
        if (telefonoInput.value.length > 7 && !validarTelefono(telefonoInput.value)) {
            aplicarValidacion(telefonoInput, false);
            formularioValido = false;
        }
        
        // Validar selección de rol
        if (!rolInput.value) {
            errorRol.style.display = 'block';
            formularioValido = false;
        }
        
        // Validar dropdown específico según el rol
        if (rolInput.value === 'usuario' && !tipoUsuarioSelect.value) {
            tipoUsuarioSelect.classList.add('is-invalid');
            formularioValido = false;
        }
        
        if (rolInput.value === 'profesor' && !asignaturaSelect.value) {
            asignaturaSelect.classList.add('is-invalid');
            formularioValido = false;
        }
        
        // Prevenir envío si hay errores
        if (!formularioValido) {
            e.preventDefault();
            
            // Scroll al primer error
            const primerError = form.querySelector('.is-invalid');
            if (primerError) {
                primerError.scrollIntoView({ behavior: 'smooth', block: 'center' });
                primerError.focus();
            }
        }
    });

    // Limpiar validación en dropdowns cuando se selecciona una opción
    tipoUsuarioSelect.addEventListener('change', function() {
        if (this.value) {
            this.classList.remove('is-invalid');
        }
    });

    asignaturaSelect.addEventListener('change', function() {
        if (this.value) {
            this.classList.remove('is-invalid');
        }
    });

    // ===== INICIALIZACIÓN =====
    
    // Ocultar dropdowns al inicio
    dropdownUsuario.style.display = 'none';
    dropdownProfesor.style.display = 'none';
    errorRol.style.display = 'none';
    
    // Establecer cursor en el primer campo
    rutInput.focus();
});