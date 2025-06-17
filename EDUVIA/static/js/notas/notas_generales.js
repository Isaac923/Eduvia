// ============================================================================
// NOTAS GENERALES - JAVASCRIPT COMPLETO (VERSIÓN CON AÑOS ACADÉMICOS)
// ============================================================================

// ============================================================================
// FUNCIÓN UTILITARIA PARA COOKIES (CSRF TOKEN) - DEBE IR AL PRINCIPIO
// ============================================================================
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

// Variables globales
let currentAlumnoId = null;
let currentMateria = null;
let currentSemestre = null;                                                                 
let currentAnoAcademicoId = null;
let notasConPorcentaje = {}; // Cache para almacenar porcentajes

// ============================================================================
// FUNCIÓN PARA NORMALIZAR TIPOS NUMÉRICOS
// ============================================================================
function normalizarValoresNumericos(calificacion, porcentaje) {
    // Convertir ambos valores a string con precisión decimal para evitar problemas de tipos
    const calificacionNormalizada = calificacion ? parseFloat(calificacion).toFixed(2) : null;
    const porcentajeNormalizado = porcentaje ? parseFloat(porcentaje).toFixed(2) : null;
    
    return {
        calificacion: calificacionNormalizada,
        porcentaje: porcentajeNormalizado
    };
}

// ============================================================================
// INICIALIZACIÓN
// ============================================================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('Inicializando sistema de notas con años académicos...');
    
    // Configurar auto-submit para filtros
    configurarFiltros();
    
    // Configurar modales
    configurarModales();
    
    // Cargar notas existentes
    cargarNotasExistentes();
    
    // Configurar eventos de notas
    configurarEventosNotas();
    
    // Auto-hide alerts
    configurarAlertas();
    
    console.log('Sistema de notas inicializado correctamente');
});

// ============================================================================
// CONFIGURACIÓN DE FILTROS
// ============================================================================
function configurarFiltros() {
    console.log('Configurando filtros automáticos...');
    
    // Auto-submit para selects (cambio inmediato)
    const selectFilters = [
        'materia-filter',
        'semestre-filter', 
        'nivel-filter',
        'estado-filter'
    ];
    
    selectFilters.forEach(filterId => {
        const filterElement = document.getElementById(filterId);
        if (filterElement) {
            filterElement.addEventListener('change', function() {
                console.log(`Filtro ${filterId} cambió a:`, this.value);
                mostrarIndicadorCarga();
                setTimeout(() => aplicarFiltros(), 300);
            });
        }
    });
    
    // Auto-submit para búsqueda de alumno (con delay)
    const buscarAlumnoInput = document.getElementById('buscar-alumno');
    if (buscarAlumnoInput) {
        let searchTimeout;
        
        buscarAlumnoInput.addEventListener('input', function() {
            const searchTerm = this.value.trim();
            clearTimeout(searchTimeout);
            
            searchTimeout = setTimeout(() => {
                console.log('Buscando alumno:', searchTerm);
                aplicarFiltros();
            }, 800);
        });
        
        buscarAlumnoInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                clearTimeout(searchTimeout);
                aplicarFiltros();
            }
        });
    }
}

function aplicarFiltros() {
    console.log('Aplicando filtros...');
    document.getElementById('filtros-form').submit();
}

function mostrarIndicadorCarga() {
    const loadingIndicator = document.createElement('div');
    loadingIndicator.innerHTML = `
        <div class="d-flex align-items-center text-primary">
            <div class="spinner-border spinner-border-sm me-2" role="status">
                <span class="visually-hidden">Cargando...</span>
            </div>
            <small>Aplicando filtros...</small>
        </div>
    `;
    loadingIndicator.className = 'position-fixed top-50 start-50 translate-middle bg-white p-3 rounded shadow';
    loadingIndicator.style.zIndex = '9999';
    loadingIndicator.id = 'loading-indicator';
    
    // Remover indicador anterior si existe
    const existingIndicator = document.getElementById('loading-indicator');
    if (existingIndicator) {
        existingIndicator.remove();
    }
    
    document.body.appendChild(loadingIndicator);
    
    // Auto-remover después de 5 segundos
    setTimeout(() => {
        if (document.getElementById('loading-indicator')) {
            document.getElementById('loading-indicator').remove();
        }
    }, 5000);
}

// ============================================================================
// SISTEMA DE ALERTAS DE DJANGO (REEMPLAZA SWEETALERT2)
// ============================================================================

// Función para crear alertas de Django dinámicamente
function mostrarAlertaDjango(mensaje, tipo = 'info', duracion = 5000) {
    // Crear el contenedor de alertas si no existe
    let alertContainer = document.querySelector('.django-alerts-container');
    if (!alertContainer) {
        alertContainer = document.createElement('div');
        alertContainer.className = 'django-alerts-container';
        document.body.appendChild(alertContainer);
    }
    
    // Tipos de alerta de Django
    const tiposAlerta = {
        'success': 'alert-success',
        'error': 'alert-danger',
        'warning': 'alert-warning',
        'info': 'alert-info'
    };
    
    // Iconos para cada tipo
    const iconos = {
        'success': 'fas fa-check-circle',
        'error': 'fas fa-exclamation-triangle',
        'warning': 'fas fa-exclamation-circle',
        'info': 'fas fa-info-circle'
    };
    
    const alertaHtml = `
        <div class="alert ${tiposAlerta[tipo] || 'alert-info'} alert-dismissible fade show auto-hide-alert" role="alert">
            <i class="${iconos[tipo] || iconos.info} me-2"></i>
            ${mensaje}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
    `;
    
    alertContainer.insertAdjacentHTML('beforeend', alertaHtml);
    
    // Auto-ocultar si se especifica duración
    if (duracion > 0) {
        setTimeout(() => {
            const alertas = alertContainer.querySelectorAll('.alert');
            if (alertas.length > 0) {
                const ultimaAlerta = alertas[alertas.length - 1];
                if (ultimaAlerta) {
                    ultimaAlerta.classList.remove('show');
                    setTimeout(() => ultimaAlerta.remove(), 150);
                }
            }
        }, duracion);
    }
}

// Función para mostrar loading (reemplaza Swal loading)
function mostrarCargando(mensaje = 'Procesando...') {
    let loadingElement = document.getElementById('django-loading');
    if (loadingElement) {
        loadingElement.remove();
    }
    
    const loadingHtml = `
        <div id="django-loading" class="django-loading-overlay">
            <div class="django-loading-content">
                <div class="spinner-border text-primary mb-3" role="status">
                    <span class="visually-hidden">Cargando...</span>
                </div>
                <p class="mb-0">${mensaje}</p>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', loadingHtml);
}

// Función para ocultar loading
function ocultarCargando() {
    const loadingElement = document.getElementById('django-loading');
    if (loadingElement) {
        loadingElement.remove();
    }
}

// Función para confirmaciones (reemplaza Swal.fire con confirmación)
function mostrarConfirmacion(titulo, mensaje, onConfirm, onCancel = null) {
    const confirmId = 'django-confirm-' + Date.now();
    
    const confirmHtml = `
        <div id="${confirmId}" class="django-confirm-overlay">
            <div class="django-confirm-modal">
                <div class="django-confirm-header">
                    <h5><i class="fas fa-question-circle text-warning me-2"></i>${titulo}</h5>
                </div>
                <div class="django-confirm-body">
                    <p>${mensaje}</p>
                </div>
                <div class="django-confirm-footer">
                    <button type="button" class="btn btn-secondary me-2" data-action="cancel">
                        <i class="fas fa-times me-1"></i>Cancelar
                    </button>
                    <button type="button" class="btn btn-primary" data-action="confirm">
                        <i class="fas fa-check me-1"></i>Confirmar
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', confirmHtml);
    
    const confirmModal = document.getElementById(confirmId);
    
    // Event listeners
    confirmModal.addEventListener('click', function(e) {
        if (e.target.dataset.action === 'confirm') {
            confirmModal.remove();
            if (onConfirm) onConfirm();
        } else if (e.target.dataset.action === 'cancel' || e.target === confirmModal) {
            confirmModal.remove();
            if (onCancel) onCancel();
        }
    });
    
    // Cerrar con ESC
    function handleEsc(e) {
        if (e.key === 'Escape') {
            confirmModal.remove();
            document.removeEventListener('keydown', handleEsc);
            if (onCancel) onCancel();
        }
    }
    document.addEventListener('keydown', handleEsc);
}

// ============================================================================
// ACTUALIZAR FUNCIONES EXISTENTES PARA USAR ALERTAS DE DJANGO
// ============================================================================

function cambiarAnoAcademico() {
    const anoAcademicoSelect = document.getElementById('ano-academico-filter');
    const nuevoAnoAcademicoId = anoAcademicoSelect.value;
    
    mostrarCargando('Cambiando año académico...');
    
    const url = new URL(window.location);
    url.searchParams.set('ano_academico', nuevoAnoAcademicoId);
    
    setTimeout(() => {
        const selectedOption = anoAcademicoSelect.options[anoAcademicoSelect.selectedIndex];
        const anoTexto = selectedOption.textContent;
        
        ocultarCargando();
        mostrarAlertaDjango(`Cambiando a: ${anoTexto}`, 'success', 1500);
        
        setTimeout(() => {
            window.location.href = url.toString();
        }, 1000);
    }, 500);
}

function mostrarModalAgregarAnoAcademico() {
    const anoActual = new Date().getFullYear();
    const proximoAno = anoActual + 1;
    document.getElementById('nuevo-ano-academico').value = proximoAno;
    
    const modal = new bootstrap.Modal(document.getElementById('agregarAnoAcademicoModal'));
    modal.show();
}

function limpiarFiltros() {
    const anoAcademicoActual = document.getElementById('hidden-ano-academico').value;
    
    mostrarConfirmacion(
        '¿Limpiar filtros?',
        'Se mantendrá el año académico seleccionado',
        function() {
            const url = new URL(window.location.origin + window.location.pathname);
            url.searchParams.set('ano_academico', anoAcademicoActual);
            window.location.href = url.toString();
        }
    );
}

function activarAnoAcademico(anoAcademicoId) {
    mostrarConfirmacion(
        '¿Activar Año Académico?',
        'Esto desactivará el año académico actual y activará el seleccionado.',
        function() {
            mostrarCargando('Activando año académico...');
            
            fetch('/notas/cambiar-ano-academico/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value
                },
                body: `ano_academico_id=${anoAcademicoId}`
            })
            .then(response => response.json())
            .then(data => {
                ocultarCargando();
                if (data.success) {
                    mostrarAlertaDjango(data.message, 'success');
                    setTimeout(() => location.reload(), 1500);
                } else {
                    mostrarAlertaDjango(data.message, 'error');
                }
            })
            .catch(error => {
                ocultarCargando();
                mostrarAlertaDjango('Error de conexión', 'error');
            });
        }
    );
}

// ============================================================================
// CONFIGURACIÓN DE MODALES (ACTUALIZADO PARA AÑOS ACADÉMICOS)
// ============================================================================
function configurarModales() {
    const agregarAnoAcademicoForm = document.getElementById('agregarAnoAcademicoForm');
    if (agregarAnoAcademicoForm) {
        agregarAnoAcademicoForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = new FormData(this);
            mostrarCargando('Agregando año académico...');
            
            fetch('/notas/agregar-ano-academico/', {
                method: 'POST',
                body: formData,
                headers: {
                    'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value
                }
            })
            .then(response => response.json())
            .then(data => {
                ocultarCargando();
                if (data.success) {
                    mostrarAlertaDjango(`El año académico ${data.ano} se ha agregado correctamente.`, 'success');
                    setTimeout(() => {
                        window.location.reload();
                    }, 1500);
                    
                    bootstrap.Modal.getInstance(document.getElementById('agregarAnoAcademicoModal')).hide();
                } else {
                    mostrarAlertaDjango(data.message || 'Error al agregar el año académico', 'error');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                ocultarCargando();
                mostrarAlertaDjango('Error de conexión al agregar el año académico', 'error');
            });
        });
    }

    // Modal editar nota
    const editarNotaForm = document.getElementById('editarNotaForm');
    if (editarNotaForm) {
        editarNotaForm.addEventListener('submit', function(e) {
            e.preventDefault();
            if (validarFormularioNota()) {
                guardarNota();
            }
        });
    }

    // Botón eliminar nota
    const btnEliminarNota = document.getElementById('btn-eliminar-nota');
    if (btnEliminarNota) {
        btnEliminarNota.addEventListener('click', function() {
            const alumnoId = document.getElementById('modal-alumno-id').value;
            const numeroNota = document.getElementById('modal-numero-nota').value;
            eliminarNota(alumnoId, numeroNota);
        });
    }
}

// ============================================================================
// GESTIÓN DE NOTAS (ACTUALIZADO PARA AÑOS ACADÉMICOS)
// ============================================================================
function configurarEventosNotas() {
    console.log('Eventos de notas configurados');
}

function abrirModalEditarNota(alumnoId, materia, semestre, numeroNota, valorActual, anoAcademicoId) {
    // Verificar si el año académico está activo
    const anoAcademicoSelect = document.getElementById('ano-academico-filter');
    let esAnoActivo = true;
    
    if (anoAcademicoSelect) {
        const selectedOption = anoAcademicoSelect.options[anoAcademicoSelect.selectedIndex];
        esAnoActivo = selectedOption.text.includes('(Activo)');
    }
    
    if (!esAnoActivo) {
        mostrarAlertaDjango('Solo se pueden editar notas del año académico activo.', 'warning');
        return;
    }
    
    // Resto del código igual...
    console.log('Abriendo modal para:', {alumnoId, materia, semestre, numeroNota, valorActual, anoAcademicoId});
    
    currentAlumnoId = alumnoId;
    currentMateria = materia;
    currentSemestre = semestre;
    currentAnoAcademicoId = anoAcademicoId;
    
    // Configurar modal...
    document.getElementById('modal-alumno-id').value = alumnoId;
    document.getElementById('modal-materia').value = materia;
    document.getElementById('modal-semestre').value = semestre;
    document.getElementById('modal-numero-nota').value = numeroNota;
    document.getElementById('modal-ano-academico-id').value = anoAcademicoId;
    
    // Obtener información del alumno
    const alumnoRow = document.querySelector(`tr[data-alumno-id="${alumnoId}"]`);
    const alumnoNombre = alumnoRow.querySelector('.alumno-details strong').textContent;
    
    document.getElementById('modal-alumno-nombre').textContent = alumnoNombre;
    
    // Formatear nombre de materia
    const materiasNombres = {
        'matematicas': 'Matemáticas',
        'lenguaje': 'Lenguaje y Comunicación',
        'ciencias': 'Ciencias Naturales',
        'historia': 'Historia y Geografía',
        'ingles': 'Inglés',
        'estudios_sociales': 'Estudios Sociales',
        'f_instrumental': 'F. Instrumental'
    };
    
    const materiaFormateada = materiasNombres[materia] || materia;
    
    // Obtener año del año académico desde el DOM o campo oculto
    let anoTexto = anoAcademicoId;
    if (anoAcademicoSelect) {
        const anoAcademicoElement = anoAcademicoSelect.querySelector(`option[value="${anoAcademicoId}"]`);
        anoTexto = anoAcademicoElement ? anoAcademicoElement.textContent.split(' ')[0] : anoAcademicoId;
    } else {
        // Para profesores, obtener el año del contexto
        const yearStat = document.querySelector('.year-stat strong');
        if (yearStat) {
            anoTexto = yearStat.textContent;
        }
    }
    
    document.getElementById('modal-materia-info').textContent = 
        `${materiaFormateada} - ${semestre}° Semestre ${anoTexto} - Nota ${numeroNota}`;
    
    // Obtener datos existentes de la nota (incluyendo porcentaje)
    const cacheKey = `${alumnoId}_${materia}_${semestre}_${numeroNota}`;
    const notaExistente = notasConPorcentaje[cacheKey];
    
    // Configurar valores actuales
    if (valorActual && valorActual !== '--' && valorActual !== '') {
        document.getElementById('modal-calificacion').value = valorActual;
        
        // Si hay porcentaje guardado, mostrarlo
        if (notaExistente && notaExistente.porcentaje) {
            document.getElementById('modal-porcentaje').value = notaExistente.porcentaje;
        } else {
            document.getElementById('modal-porcentaje').value = '';
        }
        
        calcularVistaPrevia();
    } else {
        document.getElementById('modal-calificacion').value = '';
        document.getElementById('modal-porcentaje').value = '';
    }
    
    // Limpiar otros campos
    document.getElementById('modal-fecha').value = new Date().toISOString().split('T')[0];
    document.getElementById('modal-observaciones').value = '';
    
    // Mostrar/ocultar botón eliminar
    const btnEliminar = document.getElementById('btn-eliminar-nota');
    if (valorActual && valorActual !== '--' && valorActual !== '') {
        btnEliminar.style.display = 'inline-block';
    } else {
        btnEliminar.style.display = 'none';
    }
    
    // Mostrar modal
    const modal = new bootstrap.Modal(document.getElementById('editarNotaModal'));
    modal.show();
}

function calcularVistaPrevia() {
    const calificacion = parseFloat(document.getElementById('modal-calificacion').value);
    const porcentaje = parseFloat(document.getElementById('modal-porcentaje').value);
    
    if (calificacion) {
        document.getElementById('nota-original-preview').textContent = calificacion.toFixed(1);
        
        if (porcentaje) {
            const contribucion = (calificacion * porcentaje / 100);
            document.getElementById('contribucion-preview').textContent = contribucion.toFixed(3);
            document.getElementById('detalle-calculo').textContent = 
                `Cálculo: ${calificacion} × ${porcentaje}% = ${contribucion.toFixed(3)} puntos para el promedio`;
        } else {
            document.getElementById('contribucion-preview').textContent = 'Sin porcentaje asignado';
            document.getElementById('detalle-calculo').textContent = 
                'Esta nota se contará normalmente en el promedio (sin porcentaje especial)';
        }
        
        document.getElementById('vista-previa-calculo').style.display = 'block';
    } else {
        document.getElementById('vista-previa-calculo').style.display = 'none';
    }
}

function guardarNota() {
    const formData = new FormData(document.getElementById('editarNotaForm'));
    
    const calificacionOriginal = formData.get('calificacion');
    const porcentajeOriginal = formData.get('porcentaje');
    
    const valoresNormalizados = normalizarValoresNumericos(calificacionOriginal, porcentajeOriginal);
    
    formData.set('calificacion', valoresNormalizados.calificacion);
    if (valoresNormalizados.porcentaje) {
        formData.set('porcentaje', valoresNormalizados.porcentaje);
    }
    
    mostrarCargando('Guardando nota...');
    
    fetch('/notas/guardar-nota/', {
        method: 'POST',
        body: formData,
        headers: {
            'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        ocultarCargando();
        
        if (data.success) {
            mostrarAlertaDjango('La nota se ha guardado correctamente.', 'success');
            
            const modal = bootstrap.Modal.getInstance(document.getElementById('editarNotaModal'));
            if (modal) {
                modal.hide();
            }
            
            actualizarNotaEnTabla(data.alumno_id, data.numero_nota, data.calificacion, data.porcentaje);
            
            const cacheKey = `${data.alumno_id}_${currentMateria}_${currentSemestre}_${data.numero_nota}`;
            notasConPorcentaje[cacheKey] = {
                calificacion: parseFloat(data.calificacion),
                porcentaje: data.porcentaje ? parseFloat(data.porcentaje) : null
            };
            
            setTimeout(() => recalcularPromedio(data.alumno_id), 100);
            
        } else {
            mostrarAlertaDjango(data.message || 'Error al guardar la nota', 'error');
        }
    })
    .catch(error => {
        console.error('Error completo:', error);
        ocultarCargando();
        mostrarAlertaDjango('No se pudo conectar con el servidor. Verifica tu conexión.', 'error');
    });
}

// ============================================================================
// FUNCIÓN MEJORADA PARA ACTUALIZAR NOTA EN TABLA CON PORCENTAJE VISIBLE
// ============================================================================
function actualizarNotaEnTabla(alumnoId, numeroNota, calificacion, porcentaje) {
    console.log('Actualizando nota en tabla:', {alumnoId, numeroNota, calificacion, porcentaje});
    
    const notaInput = document.querySelector(`input[data-alumno-id="${alumnoId}"][data-numero-nota="${numeroNota}"]`);
    if (notaInput) {
        notaInput.value = calificacion;
        
        // Actualizar atributos de datos
        notaInput.setAttribute('data-calificacion', calificacion);
        notaInput.setAttribute('data-porcentaje', porcentaje || '');
        
        // Mostrar indicadores de estado
        const statusContainer = notaInput.parentElement.querySelector('.nota-status');
        if (statusContainer) {
            const iconoPorcentaje = statusContainer.querySelector('.nota-ponderada');
            
            if (porcentaje && parseFloat(porcentaje) > 0) {
                if (iconoPorcentaje) {
                    iconoPorcentaje.style.display = 'inline';
                    iconoPorcentaje.title = `Nota con ${porcentaje}% asignado`;
                    iconoPorcentaje.style.color = '#28a745';
                }
            } else {
                if (iconoPorcentaje) {
                    iconoPorcentaje.style.display = 'none';
                }
            }
            
            // Mostrar indicador de guardado
            const iconoGuardado = statusContainer.querySelector('.nota-saved');
            if (iconoGuardado) {
                iconoGuardado.style.display = 'inline';
                iconoGuardado.style.color = '#28a745';
                setTimeout(() => {
                    iconoGuardado.style.display = 'none';
                }, 3000);
            }
        }
        
        // Mostrar porcentaje visible en la celda
        mostrarPorcentajeEnCelda(alumnoId, numeroNota, calificacion, porcentaje);
        
        // Mostrar detalles de contribución
        mostrarDetallesContribucion(alumnoId, numeroNota, calificacion, porcentaje);
    }
}

// ============================================================================
// FUNCIONES PARA MOSTRAR PORCENTAJES VISIBLES
// ============================================================================
function mostrarPorcentajeEnCelda(alumnoId, numeroNota, calificacion, porcentaje) {
    const porcentajeDisplay = document.querySelector(
        `.porcentaje-display[data-alumno-id="${alumnoId}"][data-numero-nota="${numeroNota}"]`
    );
    
    if (porcentajeDisplay) {
        if (porcentaje && parseFloat(porcentaje) > 0) {
            const porcentajeValue = porcentajeDisplay.querySelector('.porcentaje-value');
            if (porcentajeValue) {
                porcentajeValue.textContent = porcentaje;
            }
            porcentajeDisplay.style.display = 'block';
            
            // Agregar clase para estilo
            porcentajeDisplay.classList.add('porcentaje-activo');
        } else {
            porcentajeDisplay.style.display = 'none';
            porcentajeDisplay.classList.remove('porcentaje-activo');
        }
    }
}

function mostrarDetallesContribucion(alumnoId, numeroNota, calificacion, porcentaje) {
    const notaDetails = document.querySelector(
        `.nota-details[data-alumno-id="${alumnoId}"][data-numero-nota="${numeroNota}"]`
    );
    
    if (notaDetails) {
        const notaOriginal = notaDetails.querySelector('.nota-original span');
        const notaContribucion = notaDetails.querySelector('.nota-contribucion span');
        
        if (notaOriginal && notaContribucion) {
            notaOriginal.textContent = parseFloat(calificacion).toFixed(1);
            
            if (porcentaje && parseFloat(porcentaje) > 0) {
                const contribucion = (parseFloat(calificacion) * parseFloat(porcentaje)) / 100;
                notaContribucion.textContent = contribucion.toFixed(3);
                notaDetails.style.display = 'block';
                notaDetails.classList.add('nota-con-porcentaje');
            } else {
                notaContribucion.textContent = 'Normal';
                notaDetails.style.display = 'none';
                notaDetails.classList.remove('nota-con-porcentaje');
            }
        }
    }
}

function eliminarNota(alumnoId, numeroNota) {
    mostrarConfirmacion(
        '¿Estás seguro?',
        'Esta acción eliminará la nota permanentemente',
        function() {
            const formData = new FormData();
            formData.append('alumno_id', alumnoId);
            formData.append('numero_nota', numeroNota);
            formData.append('materia', document.getElementById('modal-materia').value);
            formData.append('semestre', document.getElementById('modal-semestre').value);
            formData.append('ano_academico_id', document.getElementById('modal-ano-academico-id').value);
            
            mostrarCargando('Eliminando nota...');
            
            fetch('/notas/eliminar-nota/', {
                method: 'POST',
                body: formData,
                headers: {
                    'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value
                }
            })
            .then(response => response.json())
            .then(data => {
                ocultarCargando();
                
                if (data.success) {
                    mostrarAlertaDjango('La nota se ha eliminado correctamente.', 'success');
                    
                    const modal = bootstrap.Modal.getInstance(document.getElementById('editarNotaModal'));
                    if (modal) {
                        modal.hide();
                    }
                    
                    // Limpiar nota en tabla
                    const notaInput = document.querySelector(`input[data-alumno-id="${alumnoId}"][data-numero-nota="${numeroNota}"]`);
                    if (notaInput) {
                        notaInput.value = '';
                        notaInput.setAttribute('data-calificacion', '');
                        notaInput.setAttribute('data-porcentaje', '');
                        
                        // Ocultar indicadores
                        const statusContainer = notaInput.parentElement.querySelector('.nota-status');
                        if (statusContainer) {
                            statusContainer.querySelectorAll('i').forEach(icon => {
                                icon.style.display = 'none';
                            });
                        }
                        
                        // Ocultar porcentaje y detalles
                        ocultarPorcentajeYDetalles(alumnoId, numeroNota);
                    }
                    
                    const cacheKey = `${alumnoId}_${currentMateria}_${currentSemestre}_${numeroNota}`;
                    delete notasConPorcentaje[cacheKey];
                    
                    setTimeout(() => recalcularPromedio(alumnoId), 100);
                    
                } else {
                    mostrarAlertaDjango(data.message || 'Error al eliminar la nota', 'error');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                ocultarCargando();
                mostrarAlertaDjango('Error de conexión al eliminar la nota', 'error');
            });
        }
    );
}

function ocultarPorcentajeYDetalles(alumnoId, numeroNota) {
    // Ocultar porcentaje
    const porcentajeDisplay = document.querySelector(
        `.porcentaje-display[data-alumno-id="${alumnoId}"][data-numero-nota="${numeroNota}"]`
    );
    if (porcentajeDisplay) {
        porcentajeDisplay.style.display = 'none';
        porcentajeDisplay.classList.remove('porcentaje-activo');
    }
    
    // Ocultar detalles
    const notaDetails = document.querySelector(
        `.nota-details[data-alumno-id="${alumnoId}"][data-numero-nota="${numeroNota}"]`
    );
    if (notaDetails) {
        notaDetails.style.display = 'none';
        notaDetails.classList.remove('nota-con-porcentaje');
    }
}

// ============================================================================
// FUNCIÓN PRINCIPAL PARA FORMATEAR PROMEDIO CON 3 DECIMALES
// ============================================================================
function formatearPromedioFinal(promedio) {
    if (!promedio || isNaN(promedio)) return '--';
    
    // Convertir a número con alta precisión y formatear a exactamente 3 decimales
    const numeroPromedio = parseFloat(promedio);
    
    // Usar toFixed(3) para garantizar exactamente 3 decimales
    return numeroPromedio.toFixed(3);
}

// ============================================================================

// CÁLCULO DE PROMEDIOS CON PORCENTAJES (MODIFICADO PARA 3 DECIMALES)
// ============================================================================
function recalcularPromedio(alumnoId) {
    console.log('Recalculando promedio para alumno:', alumnoId);
    
    const alumnoRow = document.querySelector(`tr[data-alumno-id="${alumnoId}"]`);
    if (!alumnoRow) return;
    
    const notasInputs = alumnoRow.querySelectorAll('.nota-input');
    const notasParaPromedio = [];
    let sumaTotal = 0;
    let sumaPorcentajes = 0;
    let hayPorcentajes = false;
    
    notasInputs.forEach((input, index) => {
        const valor = parseFloat(input.value);
        if (!isNaN(valor) && valor > 0) {
            const numeroNota = index + 1;
            const cacheKey = `${alumnoId}_${currentMateria}_${currentSemestre}_${numeroNota}`;
            const notaData = notasConPorcentaje[cacheKey];
            
            if (notaData && notaData.porcentaje && notaData.porcentaje > 0) {
                // Nota con porcentaje - usar mayor precisión en cálculos internos
                const contribucion = (valor * notaData.porcentaje) / 100;
                sumaTotal += contribucion;
                sumaPorcentajes += notaData.porcentaje;
                hayPorcentajes = true;
                
                notasParaPromedio.push({
                    valor: valor,
                    porcentaje: notaData.porcentaje,
                    contribucion: contribucion
                });
            } else {
                // Nota sin porcentaje
                notasParaPromedio.push({
                    valor: valor,
                    porcentaje: null,
                    contribucion: valor
                });
            }
        }
    });
    
    const promedioContainer = document.getElementById(`promedio-container-${alumnoId}`);
    if (!promedioContainer) return;
    
    const promedioNumero = promedioContainer.querySelector('.promedio-numero');
    const promedioDetalle = promedioContainer.querySelector('.promedio-detalle');
    const promedioIcon = promedioContainer.querySelector('.promedio-icon');
    
    if (notasParaPromedio.length > 0) {
        let promedio;
        let detalleTexto;
        
        if (hayPorcentajes && sumaPorcentajes > 0) {
            // Cálculo con porcentajes
            const notasSinPorcentaje = notasParaPromedio.filter(n => !n.porcentaje);
            const notasConPorcentajeArray = notasParaPromedio.filter(n => n.porcentaje);
            
            if (sumaPorcentajes === 100) {
                // Solo porcentajes que suman 100%
                promedio = sumaTotal;
                detalleTexto = `${notasConPorcentajeArray.length} nota${notasConPorcentajeArray.length > 1 ? 's' : ''} ponderada${notasConPorcentajeArray.length > 1 ? 's' : ''}`;
            } else if (notasSinPorcentaje.length > 0) {
                // Mezcla de notas con y sin porcentaje
                const sumaSinPorcentaje = notasSinPorcentaje.reduce((acc, n) => acc + n.valor, 0);
                const porcentajeRestante = Math.max(0, 100 - sumaPorcentajes);
                
                if (porcentajeRestante > 0) {
                    const promedioSinPorcentaje = sumaSinPorcentaje / notasSinPorcentaje.length;
                    const contribucionSinPorcentaje = (promedioSinPorcentaje * porcentajeRestante) / 100;
                    promedio = sumaTotal + contribucionSinPorcentaje;
                } else {
                    promedio = sumaTotal;
                }
                
                detalleTexto = `${notasParaPromedio.length} notas (${notasConPorcentajeArray.length} ponderadas)`;
            } else {
                // Solo notas con porcentaje pero no suman 100%
                promedio = (sumaTotal * 100) / sumaPorcentajes;
                detalleTexto = `${notasConPorcentajeArray.length} nota${notasConPorcentajeArray.length > 1 ? 's' : ''} ponderada${notasConPorcentajeArray.length > 1 ? 's' : ''} (${sumaPorcentajes}%)`;
            }
        } else {
            // Cálculo tradicional (promedio simple)
            const suma = notasParaPromedio.reduce((acc, nota) => acc + nota.valor, 0);
            promedio = suma / notasParaPromedio.length;
            detalleTexto = `${notasParaPromedio.length} nota${notasParaPromedio.length > 1 ? 's' : ''}`;
        }
        
        // USAR LA FUNCIÓN CORRECTA: formatearPromedioFinal
        promedioNumero.textContent = formatearPromedioFinal(promedio);
        promedioDetalle.textContent = detalleTexto;
        
        // Aplicar clases según el promedio
        promedioContainer.className = 'promedio-container';
        promedioContainer.setAttribute('data-alumno-id', alumnoId);
        promedioContainer.id = `promedio-container-${alumnoId}`;
        
        if (promedio >= 6.0) {
            promedioContainer.classList.add('promedio-excelente');
            promedioIcon.className = 'promedio-icon fas fa-star text-success';
        } else if (promedio >= 5.0) {
            promedioContainer.classList.add('promedio-bueno');
            promedioIcon.className = 'promedio-icon fas fa-check-circle text-warning';
        } else if (promedio >= 4.0) {
            promedioContainer.classList.add('promedio-regular');
            promedioIcon.className = 'promedio-icon fas fa-exclamation-circle text-orange';
        } else {
            promedioContainer.classList.add('promedio-insuficiente');
            promedioIcon.className = 'promedio-icon fas fa-times-circle text-danger';
        }
    } else {
        promedioNumero.textContent = '--';
        promedioDetalle.textContent = 'Sin notas';
        promedioIcon.className = 'promedio-icon fas fa-minus text-muted';
        promedioContainer.className = 'promedio-container';
        promedioContainer.setAttribute('data-alumno-id', alumnoId);
        promedioContainer.id = `promedio-container-${alumnoId}`;
    }
}

// ============================================================================

// CARGAR NOTAS EXISTENTES CON PORCENTAJES (ACTUALIZADO PARA AÑOS ACADÉMICOS)
// ============================================================================
function cargarNotasExistentes() {
    console.log('Cargando notas existentes...');
    
    const materia = document.getElementById('materia-filter')?.value;
    const semestre = document.getElementById('semestre-filter')?.value;
    const anoAcademicoId = document.getElementById('hidden-ano-academico')?.value;
    
    if (!materia || !anoAcademicoId) {
        console.log('No hay materia o año académico seleccionado');
        return;
    }
    
    const alumnosRows = document.querySelectorAll('.alumno-row');
    
    alumnosRows.forEach(row => {
        const alumnoId = row.getAttribute('data-alumno-id');
        
        fetch(`/notas/obtener-notas/${alumnoId}/?materia=${materia}&semestre=${semestre}&ano_academico_id=${anoAcademicoId}`)
        .then(response => response.json())
        .then(data => {
            if (data.success && data.notas) {
                // Llenar las notas en los inputs y cache de porcentajes
                for (let i = 1; i <= 6; i++) {
                    const notaData = data.notas[`nota${i}`];
                    if (notaData) {
                        const input = row.querySelector(`input[data-numero-nota="${i}"]`);
                        if (input) {
                            input.value = notaData.calificacion;
                            
                            // Guardar en cache para cálculos
                            const cacheKey = `${alumnoId}_${materia}_${semestre}_${i}`;
                            notasConPorcentaje[cacheKey] = {
                                calificacion: parseFloat(notaData.calificacion),
                                porcentaje: notaData.porcentaje ? parseFloat(notaData.porcentaje) : null
                            };
                            
                            // Mostrar indicador de porcentaje si existe
                            if (notaData.porcentaje && parseFloat(notaData.porcentaje) > 0) {
                                const statusContainer = input.parentElement.querySelector('.nota-status');
                                const iconoPorcentaje = statusContainer?.querySelector('.nota-ponderada');
                                if (iconoPorcentaje) {
                                    iconoPorcentaje.style.display = 'inline';
                                    iconoPorcentaje.title = `Nota con ${notaData.porcentaje}% asignado`;
                                    iconoPorcentaje.style.color = '#28a745';
                                }
                            }
                        }
                    }
                }
                
                // Recalcular promedio con porcentajes
                recalcularPromedio(alumnoId);
            }
        })
        .catch(error => {
            console.error('Error al cargar notas para alumno', alumnoId, ':', error);
        });
    });
}

// ============================================================================
// HISTORIAL DE NOTAS CON CÁLCULO CORRECTO DE PORCENTAJES
// ============================================================================
function verHistorialNotas(alumnoId) {
    console.log('Abriendo historial para alumno:', alumnoId);
    
    // Mostrar modal y loading
    const modal = new bootstrap.Modal(document.getElementById('historialNotasModal'));
    modal.show();
    
    // Mostrar loading
    document.getElementById('historial-loading').style.display = 'block';
    document.getElementById('historial-content').style.display = 'none';
    document.getElementById('historial-error').style.display = 'none';
    
    // Obtener año académico actual
    const anoAcademicoId = document.getElementById('hidden-ano-academico')?.value || 1;
    
    // Hacer petición AJAX
    fetch(`/notas/historial-notas/${alumnoId}/?ano_academico_id=${anoAcademicoId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                mostrarHistorialNotasConPorcentajes(data);
            } else {
                throw new Error(data.message || 'Error al cargar el historial');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            document.getElementById('historial-loading').style.display = 'none';
            document.getElementById('historial-error').style.display = 'block';
            document.getElementById('historial-error-message').textContent = error.message;
        });
}

function mostrarHistorialNotasConPorcentajes(data) {
    // Ocultar loading
    document.getElementById('historial-loading').style.display = 'none';
    document.getElementById('historial-content').style.display = 'block';
    
    // Llenar información del alumno
    document.getElementById('historial-alumno-nombre').textContent = data.alumno.nombre;
    document.getElementById('historial-alumno-info').textContent = `RUT: ${data.alumno.rut} | Nivel: ${data.alumno.nivel}`;
    document.getElementById('historial-ano-badge').textContent = `Año ${data.ano_academico.ano}`;
    
    // Llenar tablas de semestres con cálculo correcto de porcentajes
    const estadisticasS1 = llenarTablaSemestreConPorcentajes('semestre1', data.historial.semestre1, data.es_profesor);
    const estadisticasS2 = llenarTablaSemestreConPorcentajes('semestre2', data.historial.semestre2, data.es_profesor);
    
    // Actualizar badges de conteo
    const countS1 = Object.keys(data.historial.semestre1).length;
    const countS2 = Object.keys(data.historial.semestre2).length;
    
    document.getElementById('badge-semestre1').textContent = countS1;
    document.getElementById('badge-semestre2').textContent = countS2;
    
    // Mostrar estadísticas calculadas
    mostrarEstadisticasSemestreConPorcentajes(1, estadisticasS1);
    mostrarEstadisticasSemestreConPorcentajes(2, estadisticasS2);
    
    console.log('📊 Historial cargado con cálculo de porcentajes:', {
        semestre1: estadisticasS1,
        semestre2: estadisticasS2
    });
}

function llenarTablaSemestreConPorcentajes(semestreId, materias, esProfesor) {
    const tbody = document.getElementById(`notas-${semestreId}`);
    tbody.innerHTML = '';
    
    const estadisticas = {
        materiasConNotas: 0,
        totalNotas: 0,
        sumaPromedios: 0,
        materiasConPromedio: 0,
        promedios: [],
        promediosRecalculados: []
    };
    
    if (Object.keys(materias).length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" class="text-center text-muted py-4">
                    <i class="fas fa-info-circle me-2"></i>
                    ${esProfesor ? 'No hay notas registradas en tu materia para este semestre' : 'No hay notas registradas para este semestre'}
                </td>
            </tr>
        `;
        return estadisticas;
    }
    
    Object.entries(materias).forEach(([materia, datos]) => {
        const row = document.createElement('tr');
        
        // Nombre de la materia
        let html = `<td><strong>${datos.nombre}</strong></td>`;
        
        let notasEnMateria = 0;
        let notasParaPromedio = [];
        
        // Notas 1-6 con información de porcentaje
        for (let i = 1; i <= 6; i++) {
            const nota = datos.notas[`nota${i}`];
            if (nota) {
                let notaHtml = `<span class="nota-valor">${parseFloat(nota.calificacion).toFixed(1)}</span>`;
                
                // Mostrar porcentaje si existe
                if (nota.porcentaje && parseFloat(nota.porcentaje) > 0) {
                    notaHtml += `<br><small class="text-info porcentaje-historial">
                        <i class="fas fa-percentage fa-xs"></i> ${parseFloat(nota.porcentaje).toFixed(1)}%
                    </small>`;
                    
                    notasParaPromedio.push({
                        valor: parseFloat(nota.calificacion),
                        porcentaje: parseFloat(nota.porcentaje),
                        contribucion: (parseFloat(nota.calificacion) * parseFloat(nota.porcentaje)) / 100
                    });
                } else {
                    // Nota sin porcentaje
                    notasParaPromedio.push({
                        valor: parseFloat(nota.calificacion),
                        porcentaje: null,
                        contribucion: parseFloat(nota.calificacion)
                    });
                }
                
                html += `<td class="nota-cell-historial">${notaHtml}</td>`;
                notasEnMateria++;
                estadisticas.totalNotas++;
            } else {
                html += `<td class="text-muted">--</td>`;
            }
        }
        
        // Calcular promedio reconsiderando porcentajes
        const promedioRecalculado = calcularPromedioConPorcentajes(notasParaPromedio);
        const promedioOriginal = parseFloat(datos.promedio);
        
        // Usar el promedio recalculado si es diferente al original
        const promedioFinal = promedioRecalculado > 0 ? promedioRecalculado : promedioOriginal;
        
        const clasePromedio = promedioFinal >= 4.0 ? 'text-success' : 'text-danger';
        const promedioFormateado = promedioFinal > 0 ? formatearPromedioFinal(promedioFinal) : '--';
        
        // Mostrar promedio con indicador si fue recalculado
        let promedioHtml = `<strong class="${clasePromedio}">${promedioFormateado}</strong>`;
        if (promedioRecalculado > 0 && Math.abs(promedioRecalculado - promedioOriginal) > 0.001) {
            promedioHtml += `<br><small class="text-muted">
                <i class="fas fa-calculator fa-xs" title="Promedio recalculado con porcentajes"></i>
            </small>`;
        }
        
        html += `<td class="promedio-cell-historial">${promedioHtml}</td>`;
        
        // Estado
        const estado = promedioFinal >= 4.0 ? 'Aprobado' : (promedioFinal > 0 ? 'Reprobado' : 'Sin notas');
        const claseEstado = promedioFinal >= 4.0 ? 'badge bg-success' : (promedioFinal > 0 ? 'badge bg-danger' : 'badge bg-secondary');
        html += `<td><span class="${claseEstado}">${estado}</span></td>`;
        
        row.innerHTML = html;
        tbody.appendChild(row);
        
        // Actualizar estadísticas
        if (notasEnMateria > 0) {
            estadisticas.materiasConNotas++;
        }
        
        if (promedioFinal > 0) {
            estadisticas.sumaPromedios += promedioFinal;
            estadisticas.materiasConPromedio++;
            estadisticas.promedios.push(promedioOriginal);
            estadisticas.promediosRecalculados.push(promedioFinal);
        }
    });
    
    return estadisticas;
}

function calcularPromedioConPorcentajes(notasParaPromedio) {
    if (notasParaPromedio.length === 0) return 0;
    
    let sumaTotal = 0;
    let sumaPorcentajes = 0;
    let hayPorcentajes = false;
    
    const notasConPorcentaje = notasParaPromedio.filter(n => n.porcentaje && n.porcentaje > 0);
    const notasSinPorcentaje = notasParaPromedio.filter(n => !n.porcentaje || n.porcentaje <= 0);
    
    // Sumar contribuciones de notas con porcentaje
    notasConPorcentaje.forEach(nota => {
        sumaTotal += nota.contribucion;
        sumaPorcentajes += nota.porcentaje;
        hayPorcentajes = true;
    });
    
    if (hayPorcentajes && sumaPorcentajes > 0) {
        if (sumaPorcentajes === 100 && notasSinPorcentaje.length === 0) {
            // Solo porcentajes que suman 100%
            return sumaTotal;
        } else if (notasSinPorcentaje.length > 0) {
            // Mezcla de notas con y sin porcentaje
            const sumaSinPorcentaje = notasSinPorcentaje.reduce((acc, n) => acc + n.valor, 0);
            const porcentajeRestante = Math.max(0, 100 - sumaPorcentajes);
            
            if (porcentajeRestante > 0 && notasSinPorcentaje.length > 0) {
                const promedioSinPorcentaje = sumaSinPorcentaje / notasSinPorcentaje.length;
                const contribucionSinPorcentaje = (promedioSinPorcentaje * porcentajeRestante) / 100;
                return sumaTotal + contribucionSinPorcentaje;
            }
            
            return sumaTotal;
        } else {
            // Solo notas con porcentaje pero no suman 100%
            return (sumaTotal * 100) / sumaPorcentajes;
        }
    } else {
        // Cálculo tradicional (promedio simple)
        const suma = notasParaPromedio.reduce((acc, nota) => acc + nota.valor, 0);
        return suma / notasParaPromedio.length;
    }
}

function mostrarEstadisticasSemestreConPorcentajes(numeroSemestre, estadisticas) {
    // Actualizar contadores básicos
    document.getElementById(`materias-con-notas-s${numeroSemestre}`).textContent = estadisticas.materiasConNotas;
    document.getElementById(`total-notas-s${numeroSemestre}`).textContent = estadisticas.totalNotas;
    
    // Calcular y mostrar promedio general usando los promedios recalculados
    let promedioGeneral = '--';
    let estadoGeneral = 'Sin datos';
    let claseEstado = 'bg-secondary';
    
    if (estadisticas.materiasConPromedio > 0) {
        // Usar promedios recalculados si están disponibles
        const promediosParaCalculo = estadisticas.promediosRecalculados.length > 0 
            ? estadisticas.promediosRecalculados 
            : estadisticas.promedios;
            
        const sumaPromedios = promediosParaCalculo.reduce((acc, promedio) => acc + promedio, 0);
        const promedioCalculado = sumaPromedios / promediosParaCalculo.length;
        
        promedioGeneral = formatearPromedioFinal(promedioCalculado);
        
        if (promedioCalculado >= 4.0) {
            estadoGeneral = 'Aprobado';
            claseEstado = 'bg-success';
        } else {
            estadoGeneral = 'Reprobado';
            claseEstado = 'bg-danger';
        }
    }
    
    // Actualizar elementos del DOM
    const promedioElement = document.getElementById(`promedio-general-s${numeroSemestre}`);
    const estadoElement = document.getElementById(`estado-general-s${numeroSemestre}`);
    
    if (promedioElement) {
        promedioElement.textContent = promedioGeneral;
        
        // Agregar clase de color al promedio
        promedioElement.className = 'fw-bold';
        if (promedioGeneral !== '--') {
            const promedio = parseFloat(promedioGeneral);
            if (promedio >= 4.0) {
                promedioElement.classList.add('text-success');
            } else {
                promedioElement.classList.add('text-danger');
            }
        }
    }
    
    if (estadoElement) {
        estadoElement.textContent = estadoGeneral;
        estadoElement.className = `badge ${claseEstado}`;
    }
    
    console.log(`📊 Estadísticas Semestre ${numeroSemestre} (con porcentajes):`, {
        materiasConNotas: estadisticas.materiasConNotas,
        totalNotas: estadisticas.totalNotas,
        promedioGeneral: promedioGeneral,
        materiasConPromedio: estadisticas.materiasConPromedio,
        promediosOriginales: estadisticas.promedios,
        promediosRecalculados: estadisticas.promediosRecalculados
    });
}

function exportarHistorialAlumno() {
    // Obtener datos del modal
    const alumnoNombre = document.getElementById('historial-alumno-nombre').textContent;
    const alumnoInfo = document.getElementById('historial-alumno-info').textContent;
    const ano = document.getElementById('historial-ano-badge').textContent;
    
    // Crear contenido para exportar
    let contenido = `HISTORIAL DE NOTAS CON PORCENTAJES\n`;
    contenido += `=====================================\n\n`;
    contenido += `Alumno: ${alumnoNombre}\n`;
    contenido += `${alumnoInfo}\n`;
    contenido += `${ano}\n\n`;
    
    // Agregar datos de ambos semestres
    for (let semestre = 1; semestre <= 2; semestre++) {
        contenido += `${semestre}° SEMESTRE\n`;
        contenido += `${'='.repeat(15)}\n`;
        
        const tabla = document.getElementById(`notas-semestre${semestre}`);
        if (tabla) {
            const filas = tabla.querySelectorAll('tr');
            filas.forEach(fila => {
                const celdas = fila.querySelectorAll('td');
                if (celdas.length > 1) {
                    const materia = celdas[0].textContent.trim();
                    const notas = [];
                    
                    // Extraer notas con porcentajes si los tienen
                    for (let i = 1; i <= 6; i++) {
                        const celdaNota = celdas[i];
                        const notaTexto = celdaNota.textContent.trim();
                        
                        if (notaTexto !== '--') {
                            const porcentajeElement = celdaNota.querySelector('.porcentaje-historial');
                            if (porcentajeElement) {
                                const porcentajeTexto = porcentajeElement.textContent.trim();
                                notas.push(`${notaTexto.split('\n')[0]} (${porcentajeTexto})`);
                            } else {
                                notas.push(notaTexto.split('\n')[0]);
                            }
                        } else {
                            notas.push('--');
                        }
                    }
                    
                    const promedio = celdas[7].textContent.trim().split('\n')[0];
                    const estado = celdas[8].textContent.trim();
                    
                    contenido += `${materia}:\n`;
                    contenido += `  Notas: ${notas.join(' | ')}\n`;
                    contenido += `  Promedio: ${promedio}\n`;
                    contenido += `  Estado: ${estado}\n\n`;
                }
            });
        }
        
        // Agregar estadísticas del semestre
        const promedioGeneralElement = document.getElementById(`promedio-general-s${semestre}`);
        const materiasConNotasElement = document.getElementById(`materias-con-notas-s${semestre}`);
        const totalNotasElement = document.getElementById(`total-notas-s${semestre}`);
        const estadoGeneralElement = document.getElementById(`estado-general-s${semestre}`);
        
        contenido += `RESUMEN DEL SEMESTRE:\n`;
        if (materiasConNotasElement) contenido += `- Materias con notas: ${materiasConNotasElement.textContent}\n`;
        if (totalNotasElement) contenido += `- Total de notas: ${totalNotasElement.textContent}\n`;
        if (promedioGeneralElement) contenido += `- Promedio general: ${promedioGeneralElement.textContent}\n`;
        if (estadoGeneralElement) contenido += `- Estado general: ${estadoGeneralElement.textContent}\n`;
        contenido += '\n';
    }
    
    // Crear y descargar archivo
    const blob = new Blob([contenido], { type: 'text/plain;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `historial_completo_${alumnoNombre.replace(/\s+/g, '_')}_${new Date().getFullYear()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    // POR ESTA:
    mostrarAlertaDjango('✅ Historial exportado - El archivo completo con porcentajes se ha descargado correctamente', 'success', 2000);
}


// Agregar función de debugging específica para el historial
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    window.debugNotas.probarCalculoHistorial = function(semestreData) {
        console.log('Probando cálculo de historial:', semestreData);
        const estadisticas = {
            materiasConNotas: 0,
            totalNotas: 0,
            sumaPromedios: 0,
            materiasConPromedio: 0,
            promedios: []
        };
        
        Object.entries(semestreData).forEach(([materia, datos]) => {
            let notasEnMateria = 0;
            
            for (let i = 1; i <= 6; i++) {
                const nota = datos.notas[`nota${i}`];
                if (nota) {
                    notasEnMateria++;
                    estadisticas.totalNotas++;
                }
            }
            
            if (notasEnMateria > 0) {
                estadisticas.materiasConNotas++;
            }
            
            const promedio = parseFloat(datos.promedio);
            if (promedio > 0) {
                estadisticas.sumaPromedios += promedio;
                estadisticas.materiasConPromedio++;
                estadisticas.promedios.push(promedio);
            }
        });
        
        const promedioGeneral = estadisticas.materiasConPromedio > 0 
            ? estadisticas.sumaPromedios / estadisticas.materiasConPromedio 
            : 0;
        
        console.log('Estadísticas calculadas:', {
            ...estadisticas,
            promedioGeneral: formatearPromedioFinal(promedioGeneral)
        });
        
        return estadisticas;
    };
    
    console.log('🔧 Función de debugging para historial agregada: debugNotas.probarCalculoHistorial()');
}

// Exponer las nuevas funciones globalmente
window.mostrarEstadisticasSemestre = mostrarEstadisticasSemestre;

// Actualizar el mensaje de confirmación en consola
console.log('%c✅ EDUVIA - Sistema de Historial de Notas con Promedios Generales Actualizado', 'color: #28a745; font-weight: bold; font-size: 14px;');
console.log('%c📊 Los promedios generales por semestre ahora se calculan correctamente', 'color: #17a2b8; font-weight: bold;');

// ============================================================================
// CONFIGURACIÓN DE ALERTAS
// ============================================================================
function configurarAlertas() {
    // Auto-hide para alertas
    const alerts = document.querySelectorAll('.auto-hide-alert');
    alerts.forEach(alert => {
        setTimeout(() => {
            if (alert && alert.parentNode) {
                const bsAlert = new bootstrap.Alert(alert);
                bsAlert.close();
            }
        }, 5000);
    });
}

// ============================================================================
// VALIDACIONES DEL FORMULARIO
// ============================================================================
function validarFormularioNota() {
    const calificacion = document.getElementById('modal-calificacion').value;
    const porcentaje = document.getElementById('modal-porcentaje').value;
    const fecha = document.getElementById('modal-fecha').value;
    
    // Validar calificación (obligatoria)
    if (!calificacion || !validarNota(calificacion)) {
        Swal.fire({
            icon: 'error',
            title: 'Error de validación',
            text: 'La calificación debe estar entre 1.0 y 7.0'
        });
        return false;
    }
    
    // Validar porcentaje (opcional)
    if (porcentaje && !validarPorcentaje(porcentaje)) {
        Swal.fire({
            icon: 'error',
            title: 'Error de validación',
            text: 'El porcentaje debe estar entre 0 y 100'
        });
        return false;
    }
    
    // Validar fecha (obligatoria)
    if (!fecha) {
        Swal.fire({
            icon: 'error',
            title: 'Error de validación',
            text: 'La fecha de evaluación es obligatoria'
        });
        return false;
    }
    
    return true;
}

// ============================================================================
// UTILIDADES PARA FORMATEO
// ============================================================================
function formatearNota(nota) {
    if (!nota || nota === '--' || nota === '') return '--';
    const num = parseFloat(nota);
    return isNaN(num) ? '--' : num.toFixed(1);
}

function formatearPromedio(promedio) {
    if (!promedio || isNaN(promedio)) return '--';
    return parseFloat(promedio).toFixed(3);
}

function validarNota(nota) {
    if (!nota || nota === '') return false;
    const num = parseFloat(nota);
    return !isNaN(num) && num >= 1.0 && num <= 7.0;
}

function validarPorcentaje(porcentaje) {
    if (!porcentaje || porcentaje === '') return true; // Porcentaje es opcional
    const num = parseFloat(porcentaje);
    return !isNaN(num) && num >= 0 && num <= 100;
}

function obtenerColorPromedio(promedio) {
    if (promedio >= 6.0) return '#28a745'; // Verde
    if (promedio >= 5.0) return '#ffc107'; // Amarillo
    if (promedio >= 4.0) return '#fd7e14'; // Naranja
    return '#dc3545'; // Rojo
}

// ============================================================================
// MANEJO DE ERRORES Y EVENTOS GLOBALES
// ============================================================================
window.addEventListener('beforeunload', function() {
    // Limpiar indicadores de carga si existen
    const loadingIndicator = document.getElementById('loading-indicator');
    if (loadingIndicator) {
        loadingIndicator.remove();
    }
});

// Manejar errores globales de JavaScript
window.addEventListener('error', function(e) {
    console.error('Error JavaScript:', e.error);
    
    // Solo mostrar alerta en desarrollo
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        Swal.fire({
            icon: 'error',
            title: 'Error JavaScript',
            text: 'Se ha producido un error. Revisa la consola para más detalles.',
            footer: e.error?.message || 'Error desconocido'
        });
    }
});

// Manejar problemas con modales de Bootstrap
document.addEventListener('hidden.bs.modal', function (event) {
    // Remover backdrop si queda colgado
    const backdrops = document.querySelectorAll('.modal-backdrop');
    backdrops.forEach(backdrop => {
        if (backdrop.parentNode) {
            backdrop.parentNode.removeChild(backdrop);
        }
    });
    
    // Restaurar scroll del body
    document.body.classList.remove('modal-open');
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';
    
    // Remover aria-hidden del contenedor principal
    const appContainer = document.querySelector('.app-container');
    if (appContainer) {
        appContainer.removeAttribute('aria-hidden');
    }
});

// ============================================================================
// FUNCIONES EXPUESTAS GLOBALMENTE (ACTUALIZADAS)
// ============================================================================
// Estas funciones deben estar disponibles globalmente para el HTML
window.cambiarAnoAcademico = cambiarAnoAcademico;
window.mostrarModalAgregarAnoAcademico = mostrarModalAgregarAnoAcademico;
window.limpiarFiltros = limpiarFiltros;
window.abrirModalEditarNota = abrirModalEditarNota;
window.calcularVistaPrevia = calcularVistaPrevia;
window.verHistorialNotas = verHistorialNotas;
window.exportarHistorialAlumno = exportarHistorialAlumno;
window.recalcularPromedio = recalcularPromedio;
window.guardarNota = guardarNota;
window.eliminarNota = eliminarNota;
window.validarFormularioNota = validarFormularioNota;
window.formatearPromedioFinal = formatearPromedioFinal;
window.formatearPromedio = formatearPromedio;

// ============================================================================
// EVENTOS ADICIONALES PARA VALIDACIÓN EN TIEMPO REAL
// ============================================================================
document.addEventListener('DOMContentLoaded', function() {
    // Validación en tiempo real para el modal de editar nota
    const modalCalificacion = document.getElementById('modal-calificacion');
    const modalPorcentaje = document.getElementById('modal-porcentaje');
    
    if (modalCalificacion) {
        modalCalificacion.addEventListener('input', function() {
            const valor = parseFloat(this.value);
            if (this.value && (!isNaN(valor) && (valor < 1.0 || valor > 7.0))) {
                this.classList.add('is-invalid');
            } else {
                this.classList.remove('is-invalid');
            }
            calcularVistaPrevia();
        });
    }
    
    if (modalPorcentaje) {
        modalPorcentaje.addEventListener('input', function() {
            const valor = parseFloat(this.value);
            if (this.value && (!isNaN(valor) && (valor < 0 || valor > 100))) {
                this.classList.add('is-invalid');
            } else {
                this.classList.remove('is-invalid');
            }
            calcularVistaPrevia();
        });
    }
    
    // Modificar el evento submit del formulario para incluir validación
    const editarNotaForm = document.getElementById('editarNotaForm');
    if (editarNotaForm) {
        editarNotaForm.addEventListener('submit', function(e) {
            e.preventDefault();
            if (validarFormularioNota()) {
                guardarNota();
            }
        });
    }
});

// ============================================================================
// INICIALIZACIÓN FINAL
// ============================================================================
console.log('Sistema de notas cargado completamente');

// Verificar dependencias
if (typeof Swal === 'undefined') {
    console.error('SweetAlert2 no está cargado');
}

if (typeof bootstrap === 'undefined') {
    console.error('Bootstrap no está cargado');
}

// Mensaje de confirmación en consola
console.log('%c✅ EDUVIA - Sistema de Notas con Años Académicos y Precisión de 3 Decimales Inicializado', 'color: #28a745; font-weight: bold; font-size: 14px;');
console.log('%c📊 Los promedios ahora se muestran con exactamente 3 decimales (ej: 3.850)', 'color: #17a2b8; font-weight: bold;');
console.log('%c📅 Sistema actualizado para manejar años académicos independientes', 'color: #6f42c1; font-weight: bold;');

// ============================================================================
// DEBUGGING - SOLO PARA DESARROLLO
// ============================================================================
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    // Funciones de debugging disponibles en consola
    window.debugNotas = {
        mostrarEstadoActual: function() {
            console.log('Estado actual del sistema:', {
                currentAlumnoId,
                currentMateria,
                currentSemestre,
                currentAnoAcademicoId,
                notasConPorcentaje,
                filtros: {
                    materia: document.getElementById('materia-filter')?.value,
                    semestre: document.getElementById('semestre-filter')?.value,
                    anoAcademico: document.getElementById('hidden-ano-academico')?.value
                }
            });
        },
        
        simularGuardadoNota: function(alumnoId, numeroNota, calificacion, porcentaje = null) {
            console.log('Simulando guardado de nota...');
            actualizarNotaEnTabla(alumnoId, numeroNota, calificacion, porcentaje);
            
            // Actualizar cache
            const cacheKey = `${alumnoId}_${currentMateria}_${currentSemestre}_${numeroNota}`;
            notasConPorcentaje[cacheKey] = {
                calificacion: parseFloat(calificacion),
                porcentaje: porcentaje ? parseFloat(porcentaje) : null
            };
            
            recalcularPromedio(alumnoId);
        },
        
        mostrarCachePorcentajes: function() {
            console.log('Cache de porcentajes:', notasConPorcentaje);
        },
        
        probarFormateoPromedio: function(valor) {
            console.log(`Valor original: ${valor}`);
            console.log(`Formateado a 3 decimales: ${formatearPromedioFinal(valor)}`);
            return formatearPromedioFinal(valor);
        },
        
        limpiarConsola: function() {
            console.clear();
            console.log('%c🧹 Consola limpiada', 'color: #17a2b8;');
        }
    };
    
    console.log('%c🔧 Funciones de debugging disponibles en window.debugNotas', 'color: #ffc107;');
    console.log('%c📊 Ejemplo de uso: debugNotas.probarFormateoPromedio(3.8567)', 'color: #17a2b8;');
}

// Funciones de debugging actualizadas
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    window.debugNotas.probarCalculoHistorialConPorcentajes = function(notasParaPromedio) {
        console.log('Probando cálculo de historial con porcentajes:', notasParaPromedio);
        const resultado = calcularPromedioConPorcentajes(notasParaPromedio);
        console.log('Resultado del cálculo:', formatearPromedioFinal(resultado));
        return resultado;
    };
    
    window.debugNotas.simularNotasConPorcentaje = function() {
        const notasEjemplo = [
            { valor: 6.5, porcentaje: 40, contribucion: 2.6 },
            { valor: 5.8, porcentaje: 30, contribucion: 1.74 },
            { valor: 6.2, porcentaje: null, contribucion: 6.2 }
        ];
        
        console.log('Ejemplo de notas mixtas:', notasEjemplo);
        const promedio = calcularPromedioConPorcentajes(notasEjemplo);
        console.log('Promedio calculado:', formatearPromedioFinal(promedio));
        return promedio;
    };
    
    console.log('🔧 Funciones de debugging para historial con porcentajes agregadas');
}

// Exponer las funciones globalmente
window.mostrarHistorialNotasConPorcentajes = mostrarHistorialNotasConPorcentajes;
window.llenarTablaSemestreConPorcentajes = llenarTablaSemestreConPorcentajes;
window.calcularPromedioConPorcentajes = calcularPromedioConPorcentajes;
window.mostrarEstadisticasSemestreConPorcentajes = mostrarEstadisticasSemestreConPorcentajes;


// This is a standalone pagination script that will fix your issue
document.addEventListener("DOMContentLoaded", () => {
  console.log("🔄 Initializing pagination fix...")

  // Wait for the page to fully load
  setTimeout(() => {
    // Get all student rows
    const tableBody = document.querySelector(".notas-table tbody")
    if (!tableBody) {
      console.error("❌ Table body not found")
      return
    }

    // Get all student rows
    const allRows = Array.from(tableBody.querySelectorAll(".alumno-row"))
    const totalStudents = allRows.length

    console.log(`📊 Found ${totalStudents} students`)

    // Set page size to 5
    const pageSize = 5

    // If we have more than 5 students, enable pagination
    if (totalStudents > pageSize) {
      console.log("✅ Enabling pagination")

      // Show only first 5 students
      allRows.forEach((row, index) => {
        if (index < pageSize) {
          row.style.display = "table-row"
        } else {
          row.style.display = "none"
        }
      })

      // Update pagination info
      const pageInfo = document.getElementById("page-info")
      if (pageInfo) {
        pageInfo.textContent = `Mostrando 1-5 de ${totalStudents} alumnos`
      }

      // Enable next button
      const nextBtn = document.getElementById("next-btn")
      if (nextBtn) {
        nextBtn.disabled = false
      }

      // Add page numbers
      const paginationNumbers = document.getElementById("pagination-numbers")
      if (paginationNumbers) {
        paginationNumbers.innerHTML = ""

        // Create page 1 button (active)
        const page1 = document.createElement("button")
        page1.className = "pagination-number active"
        page1.textContent = "1"
        page1.onclick = () => goToPage(1)
        paginationNumbers.appendChild(page1)

        // Create page 2 button
        const page2 = document.createElement("button")
        page2.className = "pagination-number"
        page2.textContent = "2"
        page2.onclick = () => goToPage(2)
        paginationNumbers.appendChild(page2)
      }

      // Make pagination container visible
      const paginationContainer = document.getElementById("pagination-container")
      if (paginationContainer) {
        paginationContainer.style.display = "flex"
      }
    }
  }, 1500) // Wait 1.5 seconds for everything to load
})

// Function to go to a specific page
function goToPage(pageNumber) {
  console.log(`🔄 Going to page ${pageNumber}`)

  const tableBody = document.querySelector(".notas-table tbody")
  if (!tableBody) return

  const allRows = Array.from(tableBody.querySelectorAll(".alumno-row"))
  const totalStudents = allRows.length
  const pageSize = 5

  // Calculate start and end indices
  const startIndex = (pageNumber - 1) * pageSize
  const endIndex = Math.min(startIndex + pageSize, totalStudents)

  // Hide all rows
  allRows.forEach((row) => {
    row.style.display = "none"
  })

  // Show rows for current page
  for (let i = startIndex; i < endIndex; i++) {
    if (allRows[i]) {
      allRows[i].style.display = "table-row"
    }
  }

  // Update pagination info
  const pageInfo = document.getElementById("page-info")
  if (pageInfo) {
    pageInfo.textContent = `Mostrando ${startIndex + 1}-${endIndex} de ${totalStudents} alumnos`
  }

  // Update pagination buttons
  const prevBtn = document.getElementById("prev-btn")
  const nextBtn = document.getElementById("next-btn")

  if (prevBtn) {
    prevBtn.disabled = pageNumber <= 1
  }

  if (nextBtn) {
    nextBtn.disabled = pageNumber >= Math.ceil(totalStudents / pageSize)
  }

  // Update page number buttons
  const paginationNumbers = document.getElementById("pagination-numbers")
  if (paginationNumbers) {
    const buttons = paginationNumbers.querySelectorAll(".pagination-number")
    buttons.forEach((button) => {
      if (Number.parseInt(button.textContent) === pageNumber) {
        button.classList.add("active")
      } else {
        button.classList.remove("active")
      }
    })
  }
}

// Expose the function globally
window.goToPage = goToPage

// Add event handlers for prev/next buttons
document.addEventListener("DOMContentLoaded", () => {
  const prevBtn = document.getElementById("prev-btn")
  const nextBtn = document.getElementById("next-btn")

  if (prevBtn) {
    prevBtn.onclick = () => {
      const activeButton = document.querySelector(".pagination-number.active")
      if (activeButton) {
        const currentPage = Number.parseInt(activeButton.textContent)
        if (currentPage > 1) {
          goToPage(currentPage - 1)
        }
      }
    }
  }

  if (nextBtn) {
    nextBtn.onclick = () => {
      const activeButton = document.querySelector(".pagination-number.active")
      if (activeButton) {
        const currentPage = Number.parseInt(activeButton.textContent)
        const totalPages = Math.ceil(document.querySelectorAll(".alumno-row").length / 5)
        if (currentPage < totalPages) {
          goToPage(currentPage + 1)
        }
      }
    }
  }
})
