// ============================================================================
// NOTAS GENERALES - JAVASCRIPT COMPLETO (VERSIÓN CORREGIDA)
// ============================================================================

// Variables globales
let currentAlumnoId = null;
let currentMateria = null;
let currentSemestre = null;
let currentAno = null;

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
function cambiarAno() {
    const anoSeleccionado = document.getElementById('year-filter').value;
    document.getElementById('hidden-year').value = anoSeleccionado;
    
    const url = new URL(window.location);
    url.searchParams.set('year', anoSeleccionado);
    
    // Mantener otros filtros
    const materia = document.getElementById('materia-filter').value;
    const semestre = document.getElementById('semestre-filter').value;
    const nivel = document.getElementById('nivel-filter').value;
    const estado = document.getElementById('estado-filter').value;
    const alumno = document.getElementById('buscar-alumno').value;
    
    if (materia) url.searchParams.set('materia', materia);
    if (semestre) url.searchParams.set('semestre', semestre);
    if (nivel && nivel !== 'todos') url.searchParams.set('nivel', nivel);
    if (estado) url.searchParams.set('estado', estado);
    if (alumno) url.searchParams.set('alumno', alumno);
    
    window.location.href = url.toString();
}

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
    
    // Configurar valores actuales
    if (valorActual && valorActual !== '--' && valorActual !== '') {
        document.getElementById('modal-calificacion').value = valorActual;
        calcularVistaPrevia();
    } else {
        document.getElementById('modal-calificacion').value = '';
    }
    
    // Limpiar otros campos
    document.getElementById('modal-porcentaje').value = '';
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
            const contribucion = (calificacion * porcentaje / 100).toFixed(2);
            document.getElementById('contribucion-preview').textContent = contribucion;
            document.getElementById('detalle-calculo').textContent = 
                `Cálculo: ${calificacion} × ${porcentaje}% = ${contribucion} puntos para el promedio`;
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
    
    console.log('Guardando nota:', {
        alumno_id: formData.get('alumno_id'),
        materia: formData.get('materia'),
        semestre: formData.get('semestre'),
        ano: formData.get('ano'),
        numero_nota: formData.get('numero_nota'),
        calificacion: formData.get('calificacion')
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

function actualizarNotaEnTabla(alumnoId, numeroNota, calificacion, porcentaje) {
    console.log('Actualizando nota en tabla:', {alumnoId, numeroNota, calificacion, porcentaje});
    
    const notaInput = document.querySelector(`input[data-alumno-id="${alumnoId}"][data-numero-nota="${numeroNota}"]`);
    if (notaInput) {
        notaInput.value = calificacion;
        
        // Mostrar indicadores
        const statusContainer = notaInput.parentElement.querySelector('.nota-status');
        if (statusContainer) {
            const iconoPorcentaje = statusContainer.querySelector('.nota-ponderada');
            
            if (porcentaje && porcentaje > 0) {
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
                
                // Ocultar indicadores
                const statusContainer = notaInput.parentElement.querySelector('.nota-status');
                if (statusContainer) {
                    statusContainer.querySelectorAll('i').forEach(icon => {
                        icon.style.display = 'none';
                    });
                }
            }
            
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

// ============================================================================
// CÁLCULO DE PROMEDIOS
// ============================================================================
function recalcularPromedio(alumnoId) {
    console.log('Recalculando promedio para alumno:', alumnoId);
    
    const alumnoRow = document.querySelector(`tr[data-alumno-id="${alumnoId}"]`);
    if (!alumnoRow) return;
    
    const notasInputs = alumnoRow.querySelectorAll('.nota-input');
    const notas = [];
    
    notasInputs.forEach(input => {
        const valor = parseFloat(input.value);
        if (!isNaN(valor) && valor > 0) {
            notas.push(valor);
        }
    });
    
    const promedioContainer = document.getElementById(`promedio-container-${alumnoId}`);
    if (!promedioContainer) return;
    
    const promedioNumero = promedioContainer.querySelector('.promedio-numero');
    const promedioDetalle = promedioContainer.querySelector('.promedio-detalle');
    const promedioIcon = promedioContainer.querySelector('.promedio-icon');
    
    if (notas.length > 0) {
        const suma = notas.reduce((acc, nota) => acc + nota, 0);
        const promedio = suma / notas.length;
        
        promedioNumero.textContent = promedio.toFixed(1);
        promedioDetalle.textContent = `${notas.length} nota${notas.length > 1 ? 's' : ''}`;
        
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
// CARGAR NOTAS EXISTENTES
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
                // Llenar las notas en los inputs
                for (let i = 1; i <= 6; i++) {
                    const notaData = data.notas[`nota${i}`];
                    if (notaData) {
                        const input = row.querySelector(`input[data-numero-nota="${i}"]`);
                        if (input) {
                            input.value = notaData.calificacion;
                            
                            // Mostrar indicador de porcentaje si existe
                            if (notaData.porcentaje && notaData.porcentaje > 0) {
                                const statusContainer = input.parentElement.querySelector('.nota-status');
                                const iconoPorcentaje = statusContainer?.querySelector('.nota-ponderada');
                                if (iconoPorcentaje) {
                                    iconoPorcentaje.style.display = 'inline';
                                    iconoPorcentaje.title = `Nota con ${notaData.porcentaje}% asignado`;
                                }
                            }
                        }
                    }
                }
                
                // Recalcular promedio
                recalcularPromedio(alumnoId);
            }
        })
        .catch(error => {
            console.error('Error al cargar notas para alumno', alumnoId, ':', error);
        });
    });
}

// ============================================================================
// HISTORIAL DE NOTAS
// ============================================================================
function verHistorialNotas(alumnoId) {
    console.log('Abriendo historial para alumno:', alumnoId);
    
    const modal = new bootstrap.Modal(document.getElementById('historialNotasModal'));
    modal.show();
    
    // Mostrar loading
    document.getElementById('historial-loading').style.display = 'block';
    document.getElementById('historial-content').style.display = 'none';
    document.getElementById('historial-error').style.display = 'none';
    
    // Cargar historial
    const ano = document.getElementById('year-filter').value;
    fetch(`/notas/historial-alumno/${alumnoId}/?ano=${ano}`)
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Ocultar loading
            document.getElementById('historial-loading').style.display = 'none';
            document.getElementById('historial-content').style.display = 'block';
            
            // Llenar información del alumno
            document.getElementById('historial-alumno-nombre').textContent = data.alumno.nombre;
            document.getElementById('historial-alumno-info').textContent = `${data.alumno.rut} - ${data.alumno.nivel}`;
            
            const anoElement = document.getElementById('historial-ano-badge');
            if (anoElement) {
                anoElement.textContent = `Año ${ano}`;
            }
            
            // Llenar tablas de notas por semestre
            llenarTablaHistorial('notas-semestre1', data.notas_semestre1 || [], 1);
            llenarTablaHistorial('notas-semestre2', data.notas_semestre2 || [], 2);
            
        } else {
            document.getElementById('historial-loading').style.display = 'none';
            document.getElementById('historial-error').style.display = 'block';
            document.getElementById('historial-error-message').textContent = 
                data.message || 'Error al cargar el historial';
        }
    })
    .catch(error => {
        console.error('Error:', error);
        document.getElementById('historial-loading').style.display = 'none';
        document.getElementById('historial-error').style.display = 'block';
        document.getElementById('historial-error-message').textContent = 'Error de conexión';
    });
}

function llenarTablaHistorial(tablaId, notas, semestre) {
    const tbody = document.getElementById(tablaId);
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    const materiasNombres = {
        'matematicas': 'Matemáticas',
        'lenguaje': 'Lenguaje y Comunicación',
        'ciencias': 'Ciencias Naturales',
        'historia': 'Historia y Geografía',
        'ingles': 'Inglés'
    };
    
    let totalNotas = 0;
    let materiasConNotas = 0;
    let sumaPromedios = 0;
    
    if (notas && notas.length > 0) {
        notas.forEach(materia => {
            const row = document.createElement('tr');
            
            // Calcular promedio de la materia
            const notasArray = [
                materia.nota1, materia.nota2, materia.nota3,
                materia.nota4, materia.nota5, materia.nota6
            ].filter(nota => nota && parseFloat(nota) > 0);
            
            let promedio = '--';
            let clasePromedio = '';
            let iconoEstado = '<i class="fas fa-minus text-muted"></i>';
            
            if (notasArray.length > 0) {
                const suma = notasArray.reduce((acc, nota) => acc + parseFloat(nota), 0);
                const promedioNum = suma / notasArray.length;
                promedio = promedioNum.toFixed(1);
                
                totalNotas += notasArray.length;
                materiasConNotas++;
                sumaPromedios += promedioNum;
                
                if (promedioNum >= 6.0) {
                    clasePromedio = 'text-success fw-bold';
                    iconoEstado = '<i class="fas fa-star text-success"></i>';
                } else if (promedioNum >= 5.0) {
                    clasePromedio = 'text-warning fw-bold';
                    iconoEstado = '<i class="fas fa-check-circle text-warning"></i>';
                } else if (promedioNum >= 4.0) {
                    clasePromedio = 'text-orange fw-bold';
                    iconoEstado = '<i class="fas fa-exclamation-circle text-orange"></i>';
                } else {
                    clasePromedio = 'text-danger fw-bold';
                    iconoEstado = '<i class="fas fa-times-circle text-danger"></i>';
                }
            }
            
            row.innerHTML = `
                <td><strong>${materiasNombres[materia.codigo] || materia.nombre}</strong></td>
                <td class="text-center">${materia.nota1 ? parseFloat(materia.nota1).toFixed(1) : '--'}</td>
                <td class="text-center">${materia.nota2 ? parseFloat(materia.nota2).toFixed(1) : '--'}</td>
                <td class="text-center">${materia.nota3 ? parseFloat(materia.nota3).toFixed(1) : '--'}</td>
                <td class="text-center">${materia.nota4 ? parseFloat(materia.nota4).toFixed(1) : '--'}</td>
                <td class="text-center">${materia.nota5 ? parseFloat(materia.nota5).toFixed(1) : '--'}</td>
                <td class="text-center">${materia.nota6 ? parseFloat(materia.nota6).toFixed(1) : '--'}</td>
                <td class="text-center ${clasePromedio}">${promedio}</td>
                <td class="text-center">${iconoEstado}</td>
            `;
            
            tbody.appendChild(row);
        });
    } else {
        // Mostrar mensaje cuando no hay notas
        const row = document.createElement('tr');
        row.innerHTML = `
            <td colspan="9" class="text-center text-muted py-4">
                <i class="fas fa-clipboard-list fa-2x mb-2"></i><br>
                No hay notas registradas para este semestre
            </td>
        `;
        tbody.appendChild(row);
    }
    
    // Actualizar resumen del semestre
    const materiasElement = document.getElementById(`materias-con-notas-s${semestre}`);
    const promedioElement = document.getElementById(`promedio-general-s${semestre}`);
    const totalElement = document.getElementById(`total-notas-s${semestre}`);
    const badgeElement = document.getElementById(`badge-semestre${semestre}`);
    
    if (materiasElement) materiasElement.textContent = materiasConNotas;
    if (totalElement) totalElement.textContent = totalNotas;
    if (badgeElement) badgeElement.textContent = totalNotas;
    
    if (promedioElement) {
        if (materiasConNotas > 0) {
            const promedioGeneral = sumaPromedios / materiasConNotas;
            promedioElement.textContent = promedioGeneral.toFixed(1);
        } else {
            promedioElement.textContent = '--';
        }
    }
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
// UTILIDADES ADICIONALES
// ============================================================================
function formatearNota(nota) {
    if (!nota || nota === '--' || nota === '') return '--';
    const num = parseFloat(nota);
    return isNaN(num) ? '--' : num.toFixed(1);
}

function validarNota(nota) {
    const num = parseFloat(nota);
    return !isNaN(num) && num >= 1.0 && num <= 7.0;
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
// FUNCIONES EXPUESTAS GLOBALMENTE
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
console.log('%c✅ EDUVIA - Sistema de Notas Inicializado', 'color: #28a745; font-weight: bold; font-size: 14px;');

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
                filtros: {
                    materia: document.getElementById('materia-filter')?.value,
                    semestre: document.getElementById('semestre-filter')?.value,
                    ano: document.getElementById('year-filter')?.value
                }
            });
        },
        
        simularGuardadoNota: function(alumnoId, numeroNota, calificacion) {
            console.log('Simulando guardado de nota...');
            actualizarNotaEnTabla(alumnoId, numeroNota, calificacion, null);
            recalcularPromedio(alumnoId);
        },
        
        limpiarConsola: function() {
            console.clear();
            console.log('%c🧹 Consola limpiada', 'color: #17a2b8;');
        }
    };
    
    console.log('%c🔧 Funciones de debugging disponibles en window.debugNotas', 'color: #ffc107;');
}