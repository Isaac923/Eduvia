// Script para manejar la visibilidad del campo de año de repitencia
document.addEventListener('DOMContentLoaded', function() {
    const cursoRepetidoSelect = document.querySelector('[name="curso_repetido"]');
    const anioRepitenciaInput = document.querySelector('[name="anio_repitencia"]').parentNode;
    
    function toggleAnioRepitencia() {
        if (cursoRepetidoSelect.value === 'Ninguno') {
            anioRepitenciaInput.style.display = 'none';
        } else {
            anioRepitenciaInput.style.display = 'block';
        }
    }
    
    // Ejecutar al cargar la página
    toggleAnioRepitencia();
    
    // Ejecutar cuando cambie la selección
    cursoRepetidoSelect.addEventListener('change', toggleAnioRepitencia);
    
    // Script para manejar la visibilidad del campo de profesional de apoyo
    const programaPieSelect = document.querySelector('[name="programa_pie"]');
    const profesionalApoyoSelect = document.querySelector('[name="profesional_apoyo"]').parentNode;
    
    function toggleProfesionalApoyo() {
        if (programaPieSelect.value === 'No') {
            profesionalApoyoSelect.style.display = 'none';
        } else {
            profesionalApoyoSelect.style.display = 'block';
        }
    }
    
    // Ejecutar al cargar la página
    toggleProfesionalApoyo();
    
    // Ejecutar cuando cambie la selección
    programaPieSelect.addEventListener('change', toggleProfesionalApoyo);
    
    // Mejorar el textarea de observaciones (siempre visible)
    const observacionesTextarea = document.querySelector('[name="observaciones"]');
    if (observacionesTextarea) {
        // Verificar si ya existe un contador para evitar duplicados
        const existingCounter = observacionesTextarea.parentNode.querySelector('.character-counter');
        if (!existingCounter) {
            const maxLength = 500;
            
            // Crear contenedor para el contador
            const counterContainer = document.createElement('div');
            counterContainer.className = 'character-counter';
            
            // Crear elemento contador
            const contador = document.createElement('span');
            contador.className = 'counter-text';
            
            // Crear texto de ayuda
            const helpText = document.createElement('span');
            helpText.className = 'help-text';
            helpText.textContent = 'Observaciones adicionales del alumno';
            
            counterContainer.appendChild(helpText);
            counterContainer.appendChild(contador);
            
            // Insertar contador después del textarea
            observacionesTextarea.parentNode.appendChild(counterContainer);
            
            // Función para actualizar contador
            function updateCounter() {
                const currentLength = observacionesTextarea.value.length;
                contador.textContent = `${currentLength}/${maxLength}`;
                
                // Remover clases anteriores
                contador.classList.remove('warning', 'danger');
                
                // Agregar clase según el límite
                if (currentLength > maxLength * 0.9) {
                    contador.classList.add('danger');
                } else if (currentLength > maxLength * 0.8) {
                    contador.classList.add('warning');
                }
            }
            
            // Actualizar contador en tiempo real
            observacionesTextarea.addEventListener('input', updateCounter);
            observacionesTextarea.addEventListener('paste', () => setTimeout(updateCounter, 10));
            
            // Ejecutar al cargar
            updateCounter();
        }
        
        // Mejorar placeholder (siempre aplicar)
        observacionesTextarea.placeholder = 'Observaciones adicionales...';
    }
    
    // Mejorar el select de diagnóstico (siempre visible)
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
        
        // Aplicar estilo inicial si ya tiene valor
        if (diagnosticoSelect.value) {
            diagnosticoSelect.dispatchEvent(new Event('change'));
        }
    }
    
    // VALIDACIÓN VISUAL EN TIEMPO REAL PARA CREAR
    const form = document.querySelector('form');
    if (form) {
        const inputs = form.querySelectorAll('input, select, textarea');
        
        inputs.forEach(input => {
            // Validar en tiempo real mientras escribe
            input.addEventListener('input', function() {
                validateField(this);
            });
            
            // Validar cuando pierde el foco
            input.addEventListener('blur', function() {
                validateField(this);
            });
            
            // Para selects
            if (input.tagName === 'SELECT') {
                input.addEventListener('change', function() {
                    validateField(this);
                });
            }
        });
        
        // Función de validación
        function validateField(field) {
            const value = field.value.trim();
            const isRequired = field.hasAttribute('required') || field.closest('.form-group').querySelector('label .text-danger');
            
            // Limpiar clases anteriores
            field.classList.remove('valid', 'invalid', 'is-valid', 'is-invalid');
            
            if (isRequired && !value) {
                // Campo requerido vacío
                field.classList.add('invalid', 'is-invalid');
                return false;
            } else if (value) {
                // Campo con contenido válido
                field.classList.add('valid', 'is-valid');
                return true;
            } else {
                // Campo opcional vacío
                return true;
            }
        }
        
        // Validar al enviar formulario
        form.addEventListener('submit', function(e) {
            let isValid = true;
            
            inputs.forEach(input => {
                if (!validateField(input)) {
                    isValid = false;
                }
            });
            
            if (!isValid) {
                e.preventDefault();
                // Scroll al primer campo inválido
                const firstInvalid = form.querySelector('.invalid');
                if (firstInvalid) {
                    firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    firstInvalid.focus();
                }
            }
        });
    }
});