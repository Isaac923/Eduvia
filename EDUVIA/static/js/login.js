document.addEventListener('DOMContentLoaded', function() {
    // Detector de mensajes de cierre de sesión en la URL
    function checkForLogoutMessage() {
        const urlParams = new URLSearchParams(window.location.search);
        const logoutParam = urlParams.get('logout');
        
        if (logoutParam === 'success') {
            Swal.fire({
                title: 'Sesión Cerrada',
                text: 'Has cerrado sesión correctamente.',
                icon: 'success',
                confirmButtonColor: '#1a3a6e'
            });
            
            // Limpiar el parámetro de la URL sin recargar la página
            const newUrl = window.location.pathname;
            window.history.replaceState({}, document.title, newUrl);
        }
    }
    
    // Verificar mensajes de Django
    function checkDjangoMessages() {
        // Esta función será llamada desde el HTML con los mensajes de Django
        if (typeof djangoMessages !== 'undefined' && djangoMessages.length > 0) {
            djangoMessages.forEach(message => {
                // Verificar si es un mensaje de cierre de sesión
                if (message.text.toLowerCase().includes('sesión') && 
                    (message.text.toLowerCase().includes('cerrada') || 
                     message.text.toLowerCase().includes('cerrado'))) {
                    
                    Swal.fire({
                        title: 'Sesión Cerrada',
                        text: 'Has cerrado sesión correctamente.',
                        icon: 'success',
                        confirmButtonColor: '#1a3a6e'
                    });
                } else {
                    // Para otros tipos de mensajes
                    Swal.fire({
                        title: message.title || (message.tags === 'error' ? 'Error' : 
                               message.tags === 'success' ? 'Éxito' : 'Información'),
                        text: message.text,
                        icon: message.tags === 'error' ? 'error' : 
                              message.tags === 'success' ? 'success' : 'info',
                        confirmButtonColor: '#1a3a6e'
                    });
                }
            });
        }
    }
    
    // Ejecutar verificaciones de mensajes
    checkForLogoutMessage();
    checkDjangoMessages();
    
    // Selector de tipo de usuario
    const selectorBtns = document.querySelectorAll('.selector-btn');
    const loginForms = document.querySelectorAll('.login-form');
    
    // Cambiar entre formularios de funcionario y administrador
    selectorBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            // Actualizar botones
            selectorBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            // Mostrar el formulario correspondiente
            const userType = this.getAttribute('data-user-type');
            loginForms.forEach(form => {
                form.classList.remove('active');
                if (form.id === userType + 'Form') {
                    form.classList.add('active');
                }
            });
        });
    });
    
    // Formateo y validación de RUT chileno
    const rutInput = document.getElementById('rut');
    if (rutInput) {
        // Función para formatear RUT con puntos y guión
        function formatRut(rut) {
            // Eliminar puntos y guiones existentes
            rut = rut.replace(/[.-]/g, '');
            
            let result = '';
            
            // Separar cuerpo y dígito verificador
            let cuerpo = rut;
            let dv = '';
            
            if (rut.length > 1) {
                // El último caracter es el DV
                cuerpo = rut.slice(0, -1);
                dv = rut.slice(-1);
            }
            
            // Formatear el cuerpo con puntos
            while (cuerpo.length > 3) {
                result = '.' + cuerpo.slice(-3) + result;
                cuerpo = cuerpo.slice(0, -3);
            }
            
            result = cuerpo + result;
            
            // Añadir el DV con guión si existe
            if (dv) {
                result += '-' + dv;
            }
            
            return result;
        }
        
        // Formatear RUT mientras se escribe
        rutInput.addEventListener('input', function(e) {
            // Guardar la posición del cursor
            const start = this.selectionStart;
            const end = this.selectionEnd;
            const oldLength = this.value.length;
            
            // Eliminar caracteres no permitidos (solo números, K, k, puntos y guión)
            let value = this.value.replace(/[^\dKk.\-]/g, '');
            
            // Formatear el RUT
            this.value = formatRut(value);
            
            // Ajustar la posición del cursor después del formateo
            const newLength = this.value.length;
            const diff = newLength - oldLength;
            
            // Intentar mantener el cursor en una posición lógica
            if (diff > 0 && start === end) {
                // Si se añadió un carácter automáticamente (punto o guión)
                this.setSelectionRange(start + diff, end + diff);
            } else if (diff < 0 && start === end) {
                // Si se eliminó un carácter automáticamente
                this.setSelectionRange(Math.max(0, start + diff), Math.max(0, end + diff));
            } else {
                // Mantener la selección original
                this.setSelectionRange(start, end);
            }
        });
        
        // También formatear cuando el campo pierde el foco
        rutInput.addEventListener('blur', function() {
            if (this.value.trim() !== '') {
                this.value = formatRut(this.value);
            }
        });
        
        // Validar RUT al enviar el formulario
        const funcionarioForm = document.getElementById('funcionarioForm');
        if (funcionarioForm) {
            funcionarioForm.addEventListener('submit', function(e) {
                const rutConFormato = rutInput.value.trim();
                
                // Eliminar puntos para validación
                const rut = rutConFormato.replace(/\./g, '');
                
                // Verificar formato básico: debe tener un guión y al menos 3 caracteres (1-9)
                if (!rut.includes('-') || rut.length < 3) {
                    e.preventDefault();
                    Swal.fire({
                        title: 'RUT inválido',
                        text: 'Por favor ingrese un RUT válido con el formato correcto (ej: 12.345.678-9)',
                        icon: 'error',
                        confirmButtonColor: '#1a3a6e'
                    });
                    return;
                }
                
                // Separar cuerpo y dígito verificador
                const [cuerpo, dv] = rut.split('-');
                
                // Verificar que el cuerpo tenga entre 7 y 8 dígitos y que el DV sea un dígito o 'k'/'K'
                if (!/^\d{7,8}$/.test(cuerpo) || !/^[0-9kK]$/.test(dv)) {
                    e.preventDefault();
                    Swal.fire({
                        title: 'RUT inválido',
                        text: 'El formato del RUT debe ser XX.XXX.XXX-Y donde X son números y Y es un número o la letra K',
                        icon: 'error',
                        confirmButtonColor: '#1a3a6e'
                    });
                    return;
                }
                
                // Validar el dígito verificador
                if (!validarDV(cuerpo, dv)) {
                    e.preventDefault();
                    Swal.fire({
                        title: 'RUT inválido',
                        text: 'El RUT ingresado no es válido. Por favor verifique.',
                        icon: 'error',
                        confirmButtonColor: '#1a3a6e'
                    });
                    return;
                }
            });
        }
    }
    
    // Validar dígito verificador de RUT chileno
    function validarDV(cuerpo, dv) {
        // Convertir a mayúscula para comparar con 'K'
        dv = dv.toUpperCase();
        
        // Calcular dígito verificador
        let suma = 0;
        let multiplo = 2;
        
        // Para cada dígito del cuerpo
        for (let i = cuerpo.length - 1; i >= 0; i--) {
            suma += parseInt(cuerpo.charAt(i)) * multiplo;
            multiplo = multiplo < 7 ? multiplo + 1 : 2;
        }
        
        let dvEsperado = 11 - (suma % 11);
        
        // Convertir dígito verificador a string
        if (dvEsperado === 11) dvEsperado = '0';
        else if (dvEsperado === 10) dvEsperado = 'K';
        else dvEsperado = dvEsperado.toString();
        
        // Comparar con el dígito verificador ingresado
        return dv === dvEsperado;
    }
    
    // Manejar el envío del formulario de administrador
    const adminForm = document.getElementById('administradorForm');
    if (adminForm) {
        adminForm.addEventListener('submit', function(e) {
            const username = document.getElementById('username').value.trim();
            const password = document.getElementById('password-admin').value.trim();
            
            // Validación básica del lado del cliente
            if (!username || !password) {
                e.preventDefault();
                Swal.fire({
                    title: 'Campos requeridos',
                    text: 'Por favor complete todos los campos',
                    icon: 'warning',
                    confirmButtonColor: '#1a3a6e'
                });
                return;
            }
        });
    }
    
    // Mostrar/ocultar contraseña
    const togglePasswordBtns = document.querySelectorAll('.toggle-password');
    togglePasswordBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const passwordField = this.parentElement.querySelector('input');
            const icon = this.querySelector('i');
            
            // Cambiar el tipo de input
            if (passwordField.type === 'password') {
                passwordField.type = 'text';
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            } else {
                passwordField.type = 'password';
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            }
        });
    });
});

