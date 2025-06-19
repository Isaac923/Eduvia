document.addEventListener('DOMContentLoaded', function() {
    // Obtener todos los campos del formulario
    const form = document.querySelector('form');
    if (!form) return;
    
    const requiredFields = form.querySelectorAll('input[required], select[required], textarea[required]');
    
    // Función para limpiar mensajes de error
    function clearErrorMessage(field) {
        const errorElement = field.parentNode.querySelector('.error-message');
        if (errorElement) {
            errorElement.remove();
        }
        field.classList.remove('error', 'is-invalid');
        field.classList.add('is-valid');
    }
    
    // Función para mostrar mensaje de error
    function showErrorMessage(field, message) {
        clearErrorMessage(field);
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message invalid-feedback';
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        
        field.classList.add('error', 'is-invalid');
        field.classList.remove('is-valid');
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
            
            // Mostrar mensaje general
            const alertDiv = document.createElement('div');
            alertDiv.className = 'alert alert-danger alert-dismissible fade show';
            alertDiv.innerHTML = `
                <i class="fas fa-exclamation-triangle me-2"></i>
                <strong>Error:</strong> Por favor complete todos los campos obligatorios marcados con <span class="text-danger">*</span>
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            `;
            
            // Insertar al inicio del formulario
            const cardBody = form.querySelector('.card-body');
            if (cardBody) {
                cardBody.insertBefore(alertDiv, cardBody.firstChild);
                
                // Auto-ocultar después de 5 segundos
                setTimeout(() => {
                    if (alertDiv.parentNode) {
                        alertDiv.remove();
                    }
                }, 5000);
            }
        }
    });
    
    // Funcionalidad específica para campos condicionales
    
    // Manejar año de repitencia
    const cursoRepetidoSelect = document.querySelector('[name="curso_repetido"]');
    const anioRepitenciaGroup = document.getElementById('anio-repitencia-group');
    
    if (cursoRepetidoSelect && anioRepitenciaGroup) {
        function toggleAnioRepitencia() {
            if (cursoRepetidoSelect.value === 'Ninguno') {
                anioRepitenciaGroup.style.display = 'none';
                // Limpiar validación si se oculta
                const anioInput = anioRepitenciaGroup.querySelector('input');
                if (anioInput) {
                    anioInput.value = '';
                    clearErrorMessage(anioInput);
                }
            } else {
                anioRepitenciaGroup.style.display = 'block';
            }
        }
        
        toggleAnioRepitencia();
        cursoRepetidoSelect.addEventListener('change', toggleAnioRepitencia);
    }
    
    // Manejar profesional de apoyo
    const programaPieSelect = document.querySelector('[name="programa_pie"]');
    const profesionalApoyoGroup = document.getElementById('profesional-apoyo-group');
    
    if (programaPieSelect && profesionalApoyoGroup) {
        function toggleProfesionalApoyo() {
            if (programaPieSelect.value === 'No') {
                profesionalApoyoGroup.style.display = 'none';
                // Resetear a "Ninguno" si se oculta
                const profesionalSelect = profesionalApoyoGroup.querySelector('select');
                if (profesionalSelect) {
                    profesionalSelect.value = 'Ninguno';
                    clearErrorMessage(profesionalSelect);
                }
            } else {
                profesionalApoyoGroup.style.display = 'block';
            }
        }
        
        toggleProfesionalApoyo();
        programaPieSelect.addEventListener('change', toggleProfesionalApoyo);
    }
    
    // Mejorar el select de diagnóstico
    const diagnosticoSelect = document.querySelector('[name="diagnostico"]');
    if (diagnosticoSelect) {
        diagnosticoSelect.addEventListener('change', function() {
            // Remover clases anteriores
            this.classList.remove('diagnostico-no', 'diagnostico-ok');
            
            // Agregar clase según la selección
            if (this.value === 'No') {
                this.classList.add('diagnostico-no');
            } else if (this.value === 'OK') {
                this.classList.add('diagnostico-ok');
            }
        });
        
        // Aplicar estilo inicial
        if (diagnosticoSelect.value) {
            diagnosticoSelect.dispatchEvent(new Event('change'));
        }
    }
    
    // Contador para observaciones
    const observacionesTextarea = document.querySelector('[name="observaciones"]');
    if (observacionesTextarea) {
        const maxLength = 500;
        
        // Crear contador si no existe
        let contador = observacionesTextarea.parentNode.querySelector('.character-counter');
        if (!contador) {
            contador = document.createElement('div');
            contador.className = 'character-counter mt-1';
            contador.innerHTML = `
                <small class="text-muted">
                    <span class="counter-text">0/${maxLength}</span> caracteres
                </small>
            `;
            observacionesTextarea.parentNode.appendChild(contador);
        }
        
        function updateCounter() {
            const currentLength = observacionesTextarea.value.length;
            const counterText = contador.querySelector('.counter-text');
            if (counterText) {
                counterText.textContent = `${currentLength}/${maxLength}`;
                
                // Cambiar color según el límite
                if (currentLength > maxLength * 0.9) {
                    counterText.className = 'counter-text text-danger';
                } else if (currentLength > maxLength * 0.8) {
                    counterText.className = 'counter-text text-warning';
                } else {
                    counterText.className = 'counter-text text-muted';
                }
            }
        }
        
        observacionesTextarea.addEventListener('input', updateCounter);
        updateCounter();
    }
});