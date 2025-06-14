// ============================================================================
// NOTAS GENERALES - JAVASCRIPT COMPLETO (VERSIÓN CON PORCENTAJES VISIBLES)
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
            // Does this cookie string begin with the name we want?
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
let currentAno = null;
let notasConPorcentaje = {}; // Cache para almacenar porcentajes

// ============================================================================
// INICIALIZACIÓN
// ============================================================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('Inicializando sistema de notas...');
    
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
// GESTIÓN DE AÑOS ACADÉMICOS
// ============================================================================
// Función para cambiar año (versión simple)
function cambiarAno() {
    const yearSelect = document.getElementById('year-filter');
    const nuevoAno = yearSelect.value;
    
    console.log('Cambiando año a:', nuevoAno);
    
    // Mostrar indicador de carga
    Swal.fire({
        title: 'Cambiando año académico...',
        text: 'Por favor espera...',
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });
    
    // Simplemente recargar la página con el nuevo año
    const url = new URL(window.location);
    url.searchParams.set('year', nuevoAno);
    
    setTimeout(() => {
        Swal.fire({
            icon: 'success',
            title: '¡Año actualizado!',
            text: `Cambiando al año académico ${nuevoAno}`,
            timer: 1500,
            showConfirmButton: false
        }).then(() => {
            window.location.href = url.toString();
        });
    }, 500);
}

// Función para verificar cambios de año (para profesores)
function verificarCambioAno() {
    const anoActualPagina = parseInt(document.querySelector('[data-ano-actual]')?.dataset.anoActual);
    
    if (!anoActualPagina) return;
    
    fetch('/notas/obtener-ano-sistema/')
        .then(response => response.json())
        .then(data => {
            if (data.success && data.ano !== anoActualPagina) {
                // El año del sistema cambió, mostrar notificación y recargar
                Swal.fire({
                    icon: 'info',
                    title: 'Año académico actualizado',
                    text: `El administrador ha cambiado el año académico a ${data.ano}. La página se actualizará automáticamente.`,
                    timer: 3000,
                    showConfirmButton: false
                }).then(() => {
                    const url = new URL(window.location);
                    url.searchParams.set('year', data.ano);
                    window.location.href = url.toString();
                });
            }
        })
        .catch(error => {
            console.error('Error verificando año del sistema:', error);
        });
}

// Para profesores: verificar cambios cada 30 segundos
document.addEventListener('DOMContentLoaded', function() {
    const esProfesor = document.querySelector('.materia-profesor-badge');
    
    if (esProfesor) {
        console.log('Iniciando verificación automática de año para profesor');
        setInterval(verificarCambioAno, 30000); // Verificar cada 30 segundos
    }
});

function mostrarModalAgregarAno() {
    const anoActual = parseInt(document.getElementById('year-filter').value);
    const proximoAno = anoActual + 1;
    document.getElementById('nuevo-ano').value = proximoAno;
    
    const modal = new bootstrap.Modal(document.getElementById('agregarAnoModal'));
    modal.show();
}

function limpiarFiltros() {
    const anoActual = document.getElementById('year-filter').value;
    
    Swal.fire({
        title: '¿Limpiar filtros?',
        text: 'Se mantendrá el año académico seleccionado',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Sí, limpiar',
        cancelButtonText: 'Cancelar'
    }).then((result) => {
        if (result.isConfirmed) {
            const url = new URL(window.location.origin + window.location.pathname);
            url.searchParams.set('year', anoActual);
            window.location.href = url.toString();
        }
    });
}

// ============================================================================
// CONFIGURACIÓN DE MODALES
// ============================================================================
function configurarModales() {
    // Modal agregar año
    const agregarAnoForm = document.getElementById('agregarAnoForm');
    if (agregarAnoForm) {
        agregarAnoForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = new FormData(this);
            
            fetch('/notas/agregar-ano/', {
                method: 'POST',
                body: formData,
                headers: {
                    'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value
                }
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    Swal.fire({
                        icon: 'success',
                        title: 'Año agregado',
                        text: `El año académico ${data.ano} se ha agregado correctamente.`,
                        timer: 2000,
                        showConfirmButton: false
                    }).then(() => {
                        window.location.reload();
                    });
                    
                    bootstrap.Modal.getInstance(document.getElementById('agregarAnoModal')).hide();
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: data.message || 'Error al agregar el año académico'
                    });
                }
            })
            .catch(error => {
                console.error('Error:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Error de conexión al agregar el año académico'
                });
            });
        });
    }

    // Modal editar nota
    const editarNotaForm = document.getElementById('editarNotaForm');
    if (editarNotaForm) {
        editarNotaForm.addEventListener('submit', function(e) {
            e.preventDefault();
            guardarNota();
        });
    }

    // Botón eliminar nota
    const btnEliminarNota = document.getElementById('btn-eliminar-nota');
    if (btnEliminarNota) {
        btnEliminarNota.addEventListener('click', function() {
            const alumnoId = document.getElementById('modal-alumno-id').value;
            const numeroNota = document.getElementById('modal-numero-nota').value;
            
            Swal.fire({
                title: '¿Estás seguro?',
                text: 'Esta acción eliminará la nota permanentemente',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#d33',
                cancelButtonColor: '#3085d6',
                confirmButtonText: 'Sí, eliminar',
                cancelButtonText: 'Cancelar'
            }).then((result) => {
                if (result.isConfirmed) {
                    eliminarNota(alumnoId, numeroNota);
                }
            });
        });
    }
}

// ============================================================================
// GESTIÓN DE NOTAS
// ============================================================================
function configurarEventosNotas() {
    console.log('Eventos de notas configurados');
}

function abrirModalEditarNota(alumnoId, materia, semestre, numeroNota, valorActual, ano) {
    console.log('Abriendo modal para:', {alumnoId, materia, semestre, numeroNota, valorActual, ano});
    
    // Guardar datos actuales
    currentAlumnoId = alumnoId;
    currentMateria = materia;
    currentSemestre = semestre;
    currentAno = ano;
    
    // Configurar campos del modal
    document.getElementById('modal-alumno-id').value = alumnoId;
    document.getElementById('modal-materia').value = materia;
    document.getElementById('modal-semestre').value = semestre;
    document.getElementById('modal-numero-nota').value = numeroNota;
    document.getElementById('modal-ano').value = ano;
    
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
        'ingles': 'Inglés'
    };
    
    const materiaFormateada = materiasNombres[materia] || materia;
    document.getElementById('modal-materia-info').textContent = 
        `${materiaFormateada} - ${semestre}° Semestre ${ano} - Nota ${numeroNota}`;
    
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
    
    console.log('Guardando nota con datos:', {
        alumno_id: formData.get('alumno_id'),
        materia: formData.get('materia'),
        semestre: formData.get('semestre'),
        ano: formData.get('ano'),
        numero_nota: formData.get('numero_nota'),
        calificacion: formData.get('calificacion'),
        porcentaje: formData.get('porcentaje')
    });
    
    // Mostrar indicador de carga
    Swal.fire({
        title: 'Guardando nota...',
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });
    
    fetch('/notas/guardar-nota/', {
        method: 'POST',
        body: formData,
        headers: {
            'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value
        }
    })
    .then(response => {
        console.log('Status de respuesta:', response.status);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        console.log('Respuesta del servidor:', data);
        
        Swal.close(); // Cerrar el loading
        
        if (data.success) {
            Swal.fire({
                icon: 'success',
                title: 'Nota guardada',
                text: 'La nota se ha guardado correctamente.',
                timer: 2000,
                showConfirmButton: false
            });
            
            // Cerrar modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('editarNotaModal'));
            if (modal) {
                modal.hide();
            }
            
            // Actualizar tabla
            actualizarNotaEnTabla(data.alumno_id, data.numero_nota, data.calificacion, data.porcentaje);
            
            // Guardar porcentaje en cache para cálculos
            const cacheKey = `${data.alumno_id}_${currentMateria}_${currentSemestre}_${data.numero_nota}`;
            notasConPorcentaje[cacheKey] = {
                calificacion: parseFloat(data.calificacion),
                porcentaje: data.porcentaje ? parseFloat(data.porcentaje) : null
            };
            
            // Recalcular promedio
            setTimeout(() => recalcularPromedio(data.alumno_id), 100);
            
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: data.message || 'Error al guardar la nota'
            });
        }
    })
    .catch(error => {
        console.error('Error completo:', error);
        Swal.close(); // Cerrar el loading
        
        Swal.fire({
            icon: 'error',
            title: 'Error de conexión',
            text: 'No se pudo conectar con el servidor. Verifica tu conexión.',
            footer: `Detalles técnicos: ${error.message}`
        });
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
        
        // NUEVO: Mostrar porcentaje visible en la celda
        mostrarPorcentajeEnCelda(alumnoId, numeroNota, calificacion, porcentaje);
        
        // NUEVO: Mostrar detalles de contribución
        mostrarDetallesContribucion(alumnoId, numeroNota, calificacion, porcentaje);
    }
}

// ============================================================================
// NUEVAS FUNCIONES PARA MOSTRAR PORCENTAJES VISIBLES
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
    const formData = new FormData();
    formData.append('alumno_id', alumnoId);
    formData.append('numero_nota', numeroNota);
    formData.append('materia', document.getElementById('modal-materia').value);
    formData.append('semestre', document.getElementById('modal-semestre').value);
    formData.append('ano', document.getElementById('modal-ano').value);
    
    // Mostrar indicador de carga
    Swal.fire({
        title: 'Eliminando nota...',
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });
    
    fetch('/notas/eliminar-nota/', {
        method: 'POST',
        body: formData,
        headers: {
            'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value
        }
    })
    .then(response => response.json())
    .then(data => {
        Swal.close();
        
        if (data.success) {
            Swal.fire({
                icon: 'success',
                title: 'Nota eliminada',
                text: 'La nota se ha eliminado correctamente.',
                timer: 2000,
                showConfirmButton: false
            });
            
            // Cerrar modal
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
            
            // Eliminar del cache
            const cacheKey = `${alumnoId}_${currentMateria}_${currentSemestre}_${numeroNota}`;
            delete notasConPorcentaje[cacheKey];
            
            // Recalcular promedio
            setTimeout(() => recalcularPromedio(alumnoId), 100);
            
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: data.message || 'Error al eliminar la nota'
            });
        }
    })
    .catch(error => {
        console.error('Error:', error);
        Swal.close();
        
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Error de conexión al eliminar la nota'
        });
    });
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
// CARGAR NOTAS EXISTENTES CON PORCENTAJES
// ============================================================================
function cargarNotasExistentes() {
    console.log('Cargando notas existentes...');
    
    const materia = document.getElementById('materia-filter')?.value;
    const semestre = document.getElementById('semestre-filter')?.value;
    const ano = document.getElementById('year-filter')?.value;
    
    if (!materia) {
        console.log('No hay materia seleccionada');
        return;
    }
    
    const alumnosRows = document.querySelectorAll('.alumno-row');
    
    alumnosRows.forEach(row => {
        const alumnoId = row.getAttribute('data-alumno-id');
        
        fetch(`/notas/obtener-notas/${alumnoId}/?materia=${materia}&semestre=${semestre}&ano=${ano}`)
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
// HISTORIAL DE NOTAS CON PORCENTAJES
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
    
    // Obtener año actual
    const anoActual = document.getElementById('hidden-year')?.value || new Date().getFullYear();
    
    // Hacer petición AJAX
    fetch(`/notas/historial-notas/${alumnoId}/?ano=${anoActual}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                mostrarHistorialNotas(data);
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

function mostrarHistorialNotas(data) {
    // Ocultar loading
    document.getElementById('historial-loading').style.display = 'none';
    document.getElementById('historial-content').style.display = 'block';
    
    // Llenar información del alumno
    document.getElementById('historial-alumno-nombre').textContent = data.alumno.nombre;
    document.getElementById('historial-alumno-info').textContent = `RUT: ${data.alumno.rut} | Nivel: ${data.alumno.nivel}`;
    document.getElementById('historial-ano-badge').textContent = `Año ${data.ano}`;
    
    // Llenar tablas de semestres
    llenarTablaSemestre('semestre1', data.historial.semestre1, data.es_profesor);
    llenarTablaSemestre('semestre2', data.historial.semestre2, data.es_profesor);
    
    // Actualizar badges de conteo
    const countS1 = Object.keys(data.historial.semestre1).length;
    const countS2 = Object.keys(data.historial.semestre2).length;
    
    document.getElementById('badge-semestre1').textContent = countS1;
    document.getElementById('badge-semestre2').textContent = countS2;
}

function llenarTablaSemestre(semestreId, materias, esProfesor) {
    const tbody = document.getElementById(`notas-${semestreId}`);
    tbody.innerHTML = '';
    
    if (Object.keys(materias).length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" class="text-center text-muted py-4">
                    <i class="fas fa-info-circle me-2"></i>
                    ${esProfesor ? 'No hay notas registradas en tu materia para este semestre' : 'No hay notas registradas para este semestre'}
                </td>
            </tr>
        `;
        return;
    }
    
    Object.entries(materias).forEach(([materia, datos]) => {
        const row = document.createElement('tr');
        
        // Nombre de la materia
        let html = `<td><strong>${datos.nombre}</strong></td>`;
        
        // Notas 1-6
        for (let i = 1; i <= 6; i++) {
            const nota = datos.notas[`nota${i}`];
            if (nota) {
                let notaHtml = `<span class="nota-valor">${nota.calificacion}</span>`;
                if (nota.porcentaje) {
                    notaHtml += `<br><small class="text-info">${nota.porcentaje}%</small>`;
                }
                html += `<td>${notaHtml}</td>`;
            } else {
                html += `<td class="text-muted">--</td>`;
            }
        }
        
        // Promedio
        const promedio = datos.promedio;
        const clasePromedio = promedio >= 4.0 ? 'text-success' : 'text-danger';
        html += `<td><strong class="${clasePromedio}">${promedio > 0 ? promedio : '--'}</strong></td>`;
        
        // Estado
        const estado = promedio >= 4.0 ? 'Aprobado' : (promedio > 0 ? 'Reprobado' : 'Sin notas');
        const claseEstado = promedio >= 4.0 ? 'badge bg-success' : (promedio > 0 ? 'badge bg-danger' : 'badge bg-secondary');
        html += `<td><span class="${claseEstado}">${estado}</span></td>`;
        
        row.innerHTML = html;
        tbody.appendChild(row);
    });
}

function exportarHistorialAlumno() {
    // Obtener datos del modal
    const alumnoNombre = document.getElementById('historial-alumno-nombre').textContent;
    const alumnoInfo = document.getElementById('historial-alumno-info').textContent;
    const ano = document.getElementById('historial-ano-badge').textContent;
    
    // Crear contenido para exportar
    let contenido = `HISTORIAL DE NOTAS\n`;
    contenido += `================\n\n`;
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
                    for (let i = 1; i <= 6; i++) {
                        notas.push(celdas[i].textContent.trim());
                    }
                    const promedio = celdas[7].textContent.trim();
                    
                    contenido += `${materia}: ${notas.join(' | ')} | Promedio: ${promedio}\n`;
                }
            });
        }
        
        // CAMBIO: Agregar promedio general del semestre con 3 decimales
        const promedioGeneralElement = document.getElementById(`promedio-general-s${semestre}`);
        if (promedioGeneralElement && promedioGeneralElement.textContent !== '--') {
            contenido += `Promedio General del Semestre: ${promedioGeneralElement.textContent}\n`;
        }
        contenido += '\n';
    }
    
    // Crear y descargar archivo
    const blob = new Blob([contenido], { type: 'text/plain;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `historial_${alumnoNombre.replace(/\s+/g, '_')}_${new Date().getFullYear()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    Swal.fire({
        icon: 'success',
        title: 'Historial exportado',
        text: 'El archivo se ha descargado correctamente',
        timer: 2000,
        showConfirmButton: false
    });
}

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
// FUNCIONES EXPUESTAS GLOBALMENTE (CORREGIDAS)
// ============================================================================
// Estas funciones deben estar disponibles globalmente para el HTML
window.cambiarAno = cambiarAno;
window.mostrarModalAgregarAno = mostrarModalAgregarAno;
window.limpiarFiltros = limpiarFiltros;
window.abrirModalEditarNota = abrirModalEditarNota;
window.calcularVistaPrevia = calcularVistaPrevia;
window.verHistorialNotas = verHistorialNotas;
window.exportarHistorialAlumno = exportarHistorialAlumno;
window.recalcularPromedio = recalcularPromedio;
window.guardarNota = guardarNota;
window.eliminarNota = eliminarNota;
window.validarFormularioNota = validarFormularioNota;
window.formatearPromedioFinal = formatearPromedioFinal; // FUNCIÓN PRINCIPAL
window.formatearPromedio = formatearPromedio; // FUNCIÓN ALTERNATIVA

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
console.log('%c✅ EDUVIA - Sistema de Notas con Porcentajes y Precisión de 3 Decimales Inicializado', 'color: #28a745; font-weight: bold; font-size: 14px;');
console.log('%c📊 Los promedios ahora se muestran con exactamente 3 decimales (ej: 3.850)', 'color: #17a2b8; font-weight: bold;');

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
                currentAno,
                notasConPorcentaje,
                filtros: {
                    materia: document.getElementById('materia-filter')?.value,
                    semestre: document.getElementById('semestre-filter')?.value,
                    ano: document.getElementById('year-filter')?.value
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
        
        calcularPromedioTest: function(notas) {
            const resultado = calcularPromedioConPorcentajes(notas);
            console.log(`Promedio calculado: ${formatearPromedioFinal(resultado)}`);
            return resultado;
        },
        
        // FUNCIÓN CORREGIDA: Probar formateo de promedio
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
    console.log('%c📊 Ejemplo de uso: debugNotas.calcularPromedioTest([{valor: 6.5, porcentaje: 30}, {valor: 5.8, porcentaje: 70}])', 'color: #17a2b8;');
}

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
