    document.addEventListener('DOMContentLoaded', function() {
        // Obtener referencias a los elementos del DOM
        const alumnosSelect = document.getElementById('id_alumnos');
        const seleccionadosLista = document.getElementById('seleccionados-lista');
        const selectAllBtn = document.getElementById('selectAllBtn');
        const deselectAllBtn = document.getElementById('deselectAllBtn');
        const invertSelectionBtn = document.getElementById('invertSelectionBtn');
    
        // Verificar que los elementos existen
        if (!alumnosSelect || !seleccionadosLista) {
            console.error('No se encontraron los elementos necesarios');
            return;
        }
    
        // Mejorar el estilo del título
        const tituloSeleccionados = seleccionadosLista.previousElementSibling;
        if (tituloSeleccionados && tituloSeleccionados.tagName === 'H2') {
            tituloSeleccionados.className = 'h6 mb-2 text-primary';
            tituloSeleccionados.innerHTML = '<i class="fas fa-check-circle me-1"></i>Alumnos Seleccionados';
        }
    
        // Función para actualizar la lista de seleccionados
        function actualizarSeleccionados() {
            // Limpiar la lista actual
            seleccionadosLista.innerHTML = '';
        
            // Obtener todas las opciones seleccionadas
            const seleccionados = Array.from(alumnosSelect.selectedOptions);
        
            if (seleccionados.length === 0) {
                // Si no hay seleccionados, mostrar un mensaje
                const noSeleccionados = document.createElement('div');
                noSeleccionados.className = 'alert alert-info py-2';
                noSeleccionados.textContent = 'No hay alumnos seleccionados';
                seleccionadosLista.appendChild(noSeleccionados);
            } else {
                // Crear un contenedor de tarjetas más compacto y atractivo
                const container = document.createElement('div');
                container.className = 'row g-2'; // Espaciado reducido entre elementos
            
                seleccionados.forEach(option => {
                    const col = document.createElement('div');
                    col.className = 'col-md-4 col-sm-6'; // Diseño responsivo
                
                    const badge = document.createElement('span');
                    badge.className = 'badge bg-primary d-flex align-items-center p-2 mb-2';
                    badge.style.fontSize = '0.9rem';
                    badge.style.fontWeight = 'normal';
                    badge.innerHTML = `
                        <i class="fas fa-user-graduate me-1"></i>
                        <span class="text-truncate">${option.text}</span>
                    `;
                
                    col.appendChild(badge);
                    container.appendChild(col);
                });
            
                seleccionadosLista.appendChild(container);
            
                // Actualizar contador
                const contador = document.createElement('div');
                contador.className = 'mt-2 text-muted small';
                contador.textContent = `Total: ${seleccionados.length} alumno(s) seleccionado(s)`;
                seleccionadosLista.appendChild(contador);
            }
        }
    
        // Modificar los botones para garantizar que actualicen la lista
        if (selectAllBtn) {
            selectAllBtn.addEventListener('click', function() {
                // Seleccionar todas las opciones visibles
                Array.from(alumnosSelect.options).forEach(option => {
                    if (option.style.display !== 'none') {
                        option.selected = true;
                    }
                });
                // Forzar actualización
                actualizarSeleccionados();
            });
        }
    
        if (deselectAllBtn) {
            deselectAllBtn.addEventListener('click', function() {
                // Deseleccionar todas las opciones
                Array.from(alumnosSelect.options).forEach(option => {
                    option.selected = false;
                });
                // Forzar actualización
                actualizarSeleccionados();
            });
        }
    
        if (invertSelectionBtn) {
            invertSelectionBtn.addEventListener('click', function() {
                // Invertir selección
                Array.from(alumnosSelect.options).forEach(option => {
                    if (option.style.display !== 'none') {
                        option.selected = !option.selected;
                    }
                });
                // Forzar actualización
                actualizarSeleccionados();
            });
        }
    
        // Manejar cambios en el select
        alumnosSelect.addEventListener('change', function() {
            actualizarSeleccionados();
        });
    
        // Manejar clics en opciones (para el comportamiento personalizado)
        alumnosSelect.addEventListener('mouseup', function() {
            // Usar un retraso para asegurar que la selección se ha completado
            setTimeout(actualizarSeleccionados, 100);
        });
    
        // También actualizar cuando se use el teclado
        alumnosSelect.addEventListener('keyup', function(e) {
            // Solo para teclas relevantes (espacio, enter, flechas)
            if ([13, 32, 37, 38, 39, 40].includes(e.keyCode)) {
                setTimeout(actualizarSeleccionados, 100);
            }
        });
    
        // Inicializar la lista al cargar
        actualizarSeleccionados();
    
        // Observador de mutaciones para detectar cambios en el select
        // Esto ayuda cuando el contenido del select cambia dinámicamente
        const observer = new MutationObserver(function(mutations) {
            actualizarSeleccionados();
        });
    
        observer.observe(alumnosSelect, { 
            childList: true,       // Observar cambios en los hijos (opciones)
            attributes: true,      // Observar cambios en atributos
            attributeFilter: ['selected'] // Solo observar cambios en el atributo selected
        });
    });

    document.addEventListener('DOMContentLoaded', function() {
        const nivelSelect = document.getElementById('id_nivel');
        const letraSelect = document.getElementById('id_letra');
        const alumnosSelect = document.getElementById('id_alumnos');
        const container = document.querySelector('.container');

        function actualizarAlumnos() {
            const nivel = nivelSelect.value;
            const letra = letraSelect.value;
            const filtroUrl = container.dataset.filtroUrl; // Obtener la URL del atributo de datos

            if (nivel && letra && filtroUrl) {
                fetch(`${filtroUrl}?nivel=${nivel}&letra=${letra}`)
                    .then(response => response.json())
                    .then(data => {
                        alumnosSelect.innerHTML = ''; // Limpiar opciones

                        data.alumnos.forEach(alumno => {
                            const option = document.createElement('option');
                            option.value = alumno.id;
                            option.textContent = alumno.nombre;
                            alumnosSelect.appendChild(option);
                        });
                    })
                    .catch(error => {
                        console.error('Error al cargar alumnos:', error);
                    });
            }
        }

        if (nivelSelect && letraSelect) {
            nivelSelect.addEventListener('change', actualizarAlumnos);
            letraSelect.addEventListener('change', actualizarAlumnos);
        }
    });

    document.addEventListener('DOMContentLoaded', function() {
        // Búsqueda de alumnos en tiempo real
        const searchInput = document.getElementById('alumnoSearch');
        const selectElement = document.getElementById('id_alumnos');
    
        if (searchInput && selectElement) {
            searchInput.addEventListener('keyup', function() {
                const searchTerm = this.value.toLowerCase();
                const options = selectElement.options;
            
                for (let i = 0; i < options.length; i++) {
                    const option = options[i];
                    const text = option.text.toLowerCase();
                
                    if (text.includes(searchTerm)) {
                        option.style.display = '';
                    } else {
                        option.style.display = 'none';
                    }
                }
            });
        }
    
        // Validación del formulario
        const forms = document.querySelectorAll('.needs-validation');
    
        Array.from(forms).forEach(form => {
            form.addEventListener('submit', event => {
                if (!form.checkValidity()) {
                    event.preventDefault();
                    event.stopPropagation();
                }
            
                form.classList.add('was-validated');
            }, false);
        });
    });