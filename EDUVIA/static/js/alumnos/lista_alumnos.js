
    // Variables globales
    let currentAlumnoId = null;
    let currentAlumnoNombre = null;
    let currentAlumnoEstado = null;

    // Función simple para auto-ocultar alertas en 5 segundos
    function autoHideAlerts() {
        const alerts = document.querySelectorAll('.auto-hide-alert');
        
        alerts.forEach(alert => {
            setTimeout(() => {
                if (alert && alert.parentNode) {
                    alert.remove();
                }
            }, 5000); // 5 segundos
        });
    }

    // Función para limpiar filtros
    function clearFilters() {
        document.getElementById('nombre-busqueda').value = '';
        document.getElementById('courseFilter').value = 'todos';
        document.getElementById('statusFilter').value = 'todos';
        document.getElementById('filtro-form').submit();
    }

    // Función para abrir modal de estado
    function openEstadoModal(button) {
        currentAlumnoId = button.getAttribute('data-id');
        currentAlumnoNombre = button.getAttribute('data-nombre');
        currentAlumnoEstado = button.getAttribute('data-estado');
        
        // Actualizar el modal con los datos
        document.getElementById('estado-modal-nombre').textContent = currentAlumnoNombre;
        
        // Configurar el formulario
        document.getElementById('estadoForm').action = `/alumnos/${currentAlumnoId}/cambiar-estado/`;
        
        // Seleccionar el radio button correspondiente al estado actual
        if (currentAlumnoEstado === 'Inactivo') {
            document.getElementById('estadoInactivo').checked = true;
        } else {
            document.getElementById('estadoActivo').checked = true;
        }
        
        // Mostrar el modal
        document.getElementById('estadoModal').style.display = 'flex';
    }

    // Función para cerrar modal de estado
    function closeEstadoModal() {
        document.getElementById('estadoModal').style.display = 'none';
        currentAlumnoId = null;
        currentAlumnoNombre = null;
        currentAlumnoEstado = null;
    }

    document.addEventListener('DOMContentLoaded', function() {
        // Inicializar auto-ocultamiento de alertas
        autoHideAlerts();
        
        // Coordinar filtros
        const courseFilter = document.getElementById('courseFilter');
        const statusFilter = document.getElementById('statusFilter');
        const filtroForm = document.getElementById('filtro-form');
        
        if (courseFilter && statusFilter && filtroForm) {
            courseFilter.addEventListener('change', function() {
                if (this.value !== 'todos' && statusFilter.value !== 'inactivo') {
                    statusFilter.value = 'activo';
                }
                filtroForm.submit();
            });
            
            statusFilter.addEventListener('change', function() {
                filtroForm.submit();
            });
        }

        // Modal de detalles del alumno
        document.querySelectorAll('.ver-alumno-detallado').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                const alumnoId = this.closest('tr').dataset.id;
                cargarDetallesAlumno(alumnoId);
            });
        });

        // Botón para eliminar alumno
        const eliminarAlumnoBtn = document.getElementById('eliminar-alumno-btn');
        if (eliminarAlumnoBtn) {
            eliminarAlumnoBtn.addEventListener('click', function() {
                const alumnoId = document.querySelector('#alumnoDetallesModal').getAttribute('data-alumno-id');
                const alumnoNombre = document.getElementById('alumno-nombre').textContent;
                
                // Configurar el modal de confirmación
                document.getElementById('alumno-a-eliminar').textContent = alumnoNombre;
                document.getElementById('form-eliminar-alumno').action = `/alumnos/${alumnoId}/eliminar/`;
                
                // Cerrar el modal de detalles
                const detallesModal = bootstrap.Modal.getInstance(document.getElementById('alumnoDetallesModal'));
                if (detallesModal) {
                    detallesModal.hide();
                }
                
                // Mostrar el modal de confirmación
                const confirmarModal = new bootstrap.Modal(document.getElementById('confirmarEliminarAlumnoModal'));
                confirmarModal.show();
            });
        }

        // Función para cargar los detalles del alumno
        function cargarDetallesAlumno(alumnoId) {
            const alumnoModal = document.getElementById('alumnoDetallesModal');
            alumnoModal.setAttribute('data-alumno-id', alumnoId);
            const alumnoModalInstance = new bootstrap.Modal(alumnoModal);
            alumnoModalInstance.show();
            
            // Mostrar loading y ocultar contenido y errores
            document.getElementById('alumno-modal-loading').style.display = 'block';
            document.getElementById('alumno-modal-content').style.display = 'none';
            document.getElementById('alumno-modal-error').style.display = 'none';
            
            try {
                // Buscar la fila del alumno
                const alumnoRow = document.querySelector(`.alumno-row[data-id="${alumnoId}"]`);
                
                if (!alumnoRow) {
                    throw new Error('No se encontró información del alumno');
                }
                
                // Actualizar enlaces
                document.getElementById('editar-alumno-link').href = alumnoRow.dataset.editUrl;
                
                // Mostrar los detalles
                mostrarDetallesAlumno(alumnoRow);
            } catch (error) {
                console.error('Error:', error);
                mostrarErrorAlumno('Error al cargar los detalles del alumno: ' + error.message);
            } finally {
                document.getElementById('alumno-modal-loading').style.display = 'none';
            }
        }

        // Función para mostrar los detalles del alumno en el modal
        function mostrarDetallesAlumno(alumnoRow) {
            // Función auxiliar para establecer texto de forma segura
            function setTextSafely(id, text) {
                const element = document.getElementById(id);
                if (element) {
                    element.textContent = (text && text !== 'undefined' && text !== 'null') ? text : 'No disponible';
                } else {
                    console.warn(`Elemento con ID '${id}' no encontrado`);
                }
            }

            // Función auxiliar para establecer HTML de forma segura
            function setHtmlSafely(id, html) {
                const element = document.getElementById(id);
                if (element) {
                    element.innerHTML = html;
                } else {
                    console.warn(`Elemento con ID '${id}' no encontrado`);
                }
            }

            try {
                // Información personal
                setTextSafely('alumno-nombre', alumnoRow.dataset.nombre);
                setTextSafely('alumno-rut', alumnoRow.dataset.rut);
                setTextSafely('alumno-fecha-nacimiento', alumnoRow.dataset.fechaNacimiento);
                setTextSafely('alumno-edad', alumnoRow.dataset.edad ? `${alumnoRow.dataset.edad} años` : null);
                setTextSafely('alumno-sexo', alumnoRow.dataset.sexo);
                setTextSafely('alumno-estado-civil', alumnoRow.dataset.estadoCivil);
                
                // Información académica
                setTextSafely('alumno-nivel', alumnoRow.dataset.nivel);
                setTextSafely('alumno-jornada', alumnoRow.dataset.jornada);
                setTextSafely('alumno-fecha-ingreso', alumnoRow.dataset.fechaIngreso);
                setTextSafely('alumno-ultimo-curso', alumnoRow.dataset.ultimoCurso);
                setTextSafely('alumno-curso-repetido', alumnoRow.dataset.cursoRepetido);
                
                // Estado del alumno
                const estadoHtml = alumnoRow.dataset.estado === 'activo' ? 
                    '<span class="status-badge status-active"><i class="fas fa-check-circle me-1"></i> Activo</span>' : 
                    '<span class="status-badge status-inactive"><i class="fas fa-times-circle me-1"></i> Inactivo</span>';
                setHtmlSafely('alumno-estado', estadoHtml);
                
                // Información de contacto
                setTextSafely('alumno-direccion', alumnoRow.dataset.direccion);
                setTextSafely('alumno-telefono', alumnoRow.dataset.telefono);
                setTextSafely('alumno-email', alumnoRow.dataset.email);
                setTextSafely('alumno-religion', alumnoRow.dataset.religion);
                setTextSafely('alumno-situacion-laboral', alumnoRow.dataset.situacionLaboral);
                
                // Información PIE
                setTextSafely('alumno-programa-pie', alumnoRow.dataset.programaPie);
                setTextSafely('alumno-profesional-apoyo', alumnoRow.dataset.profesionalApoyo);
                setTextSafely('alumno-informe-psicosocial', alumnoRow.dataset.informePsicosocial);
                
                // Contacto de emergencia
                setTextSafely('alumno-contacto-emergencia-nombre', alumnoRow.dataset.contactoEmergenciaNombre);
                setTextSafely('alumno-contacto-emergencia-parentezco', alumnoRow.dataset.contactoEmergenciaParentezco);
                setTextSafely('alumno-contacto-emergencia-telefono', alumnoRow.dataset.contactoEmergenciaTelefono);
                
                // Mostrar el contenido
                document.getElementById('alumno-modal-content').style.display = 'block';
                
                // Actualizar el título del modal
                const modalTitle = document.getElementById('alumnoDetallesModalLabel');
                if (modalTitle) {
                    modalTitle.textContent = `Detalles del Alumno: ${alumnoRow.dataset.nombre}`;
                }
            } catch (error) {
                console.error('Error al mostrar detalles del alumno:', error);
                mostrarErrorAlumno('Error al mostrar los detalles del alumno: ' + error.message);
            }
        }

        // Función para mostrar errores en el modal de alumno
        function mostrarErrorAlumno(mensaje) {
            const errorElement = document.getElementById('alumno-modal-error');
            const errorMessage = document.getElementById('alumno-error-message');
            if (errorMessage) {
                errorMessage.textContent = mensaje;
            }
            if (errorElement) {
                errorElement.style.display = 'block';
            }
        }

        // Funcionalidad de búsqueda en tiempo real
        const searchInput = document.querySelector('.search-input');
        if (searchInput) {
            searchInput.addEventListener('input', function() {
                const searchTerm = this.value.toLowerCase();
                const rows = document.querySelectorAll('.alumno-row');
                const noResultsRow = document.getElementById('no-results-row');
                let hasResults = false;

                rows.forEach(row => {
                    const nombre = row.dataset.nombre.toLowerCase();
                    const nivel = row.dataset.nivel.toLowerCase();
                    const jornada = row.dataset.jornada.toLowerCase();
                    
                    if (nombre.includes(searchTerm) || nivel.includes(searchTerm) || jornada.includes(searchTerm)) {
                        row.style.display = '';
                        hasResults = true;
                    } else {
                        row.style.display = 'none';
                    }
                });

                if (noResultsRow) {
                    noResultsRow.style.display = hasResults ? 'none' : '';
                }
            });
        }

        // Cerrar modal al hacer clic fuera de él
        document.getElementById('estadoModal').addEventListener('click', function(e) {
            if (e.target === this) {
                closeEstadoModal();
            }
        });

        // Manejar envío del formulario de estado
        document.getElementById('estadoForm').addEventListener('submit', function(e) {
            e.preventDefault();
            
            const selectedEstado = document.querySelector('input[name="nuevo_estado"]:checked');
            if (selectedEstado) {
                // Crear un formulario temporal para enviar
                const form = document.createElement('form');
                form.method = 'POST';
                form.action = this.action;
                
                // Agregar CSRF token
                const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;
                const csrfInput = document.createElement('input');
                csrfInput.type = 'hidden';
                csrfInput.name = 'csrfmiddlewaretoken';
                csrfInput.value = csrfToken;
                form.appendChild(csrfInput);
                
                // Agregar el nuevo estado
                const estadoInput = document.createElement('input');
                estadoInput.type = 'hidden';
                estadoInput.name = 'nuevo_estado';
                estadoInput.value = selectedEstado.value;
                form.appendChild(estadoInput);
                
                // Enviar formulario
                document.body.appendChild(form);
                form.submit();
            }
        });
    });
