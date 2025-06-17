document.addEventListener('DOMContentLoaded', function() {
    // Obtener todos los campos del formulario
    const form = document.querySelector('form');
    const requiredFields = form.querySelectorAll('input[required], select[required], textarea[required]');
    
    // Función para limpiar mensajes de error
    function clearErrorMessage(field) {
        const errorElement = field.parentNode.querySelector('.error-message');
        if (errorElement) {
            errorElement.remove();
        }
        field.classList.remove('error');
    }
    
    // Función para mostrar mensaje de error
    function showErrorMessage(field, message) {
        clearErrorMessage(field);
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        errorDiv.style.color = 'red';
        errorDiv.style.fontSize = '12px';
        errorDiv.style.marginTop = '5px';
        
        field.classList.add('error');
        field.parentNode.appendChild(errorDiv);
    }
    
    // Validar campo individual
    function validateField(field) {
        const value = field.value.trim();
        
        if (field.hasAttribute('required') && !value) {
            showErrorMessage(field, 'Este campo es obligatorio.');
            return false;
        } else {
            clearErrorMessage(field);
            return true;
        }
    }
    
    // Agregar event listeners a cada campo
    requiredFields.forEach(field => {
        // Validar cuando el usuario escribe
        field.addEventListener('input', function() {
            if (this.value.trim()) {
                clearErrorMessage(this);
            }
        });
        
        // Validar cuando el campo pierde el foco
        field.addEventListener('blur', function() {
            validateField(this);
        });
        
        // Para campos select
        if (field.tagName === 'SELECT') {
            field.addEventListener('change', function() {
                if (this.value) {
                    clearErrorMessage(this);
                }
            });
        }
    });
    
    // Validar formulario completo al enviar
    form.addEventListener('submit', function(e) {
        let isValid = true;
        
        requiredFields.forEach(field => {
            if (!validateField(field)) {
                isValid = false;
            }
        });
        
        if (!isValid) {
            e.preventDefault();
            // Hacer scroll al primer campo con error
            const firstError = form.querySelector('.error');
            if (firstError) {
                firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
                firstError.focus();
            }
        }
    });
});