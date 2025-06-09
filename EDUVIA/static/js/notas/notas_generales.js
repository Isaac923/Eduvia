document.addEventListener('DOMContentLoaded', function() {
    console.log('Iniciando sistema de gestión de notas...');

    // Variables globales
    let currentNotaInput = null;
    let editModal = null;
    let historialModal = null;

    // Inicializar modales
    editModal = new bootstrap.Modal(document.getElementById('editarNotaModal'));
    historialModal = new bootstrap.Modal(document.getElementById('historialNotasModal'));

    // Función para limpiar filtros
    window.limpiarFiltros = function() {
        document.getElementById('buscar-alumno').value = '';
        document.getElementById('materia-filter').value = '';
        document.getElementById('nivel-filter').value = 'todos';
        document.getElementById('estado-filter').value = 'activo';
        document.getElementById('filtros-form').submit();
    };

    // Auto-submit para filtros
    const materiaFilter = document.getElementById('materia-filter');
    const nivelFilter = document.getElementById('nivel-filter');
    const semestreFilter = document.getElementById('semestre-filter');
    const estadoFilter = document.getElementById('estado-filter');

    [materiaFilter, nivelFilter, semestreFilter, estadoFilter].forEach(filter => {
        if (filter) {
            filter.addEventListener('change', function() {
                document.getElementById('filtros-form').submit();
            });
        }
    });

    // Función para calcular promedio
    function calcularPromedio(alumnoId) {
        const inputs = document.querySelectorAll(`input[data-alumno-id="${alumnoId}"]`);
        let suma = 0;
        let count = 0;

        inputs.forEach(input => {
            const valor = parseFloat(input.value);
            if (!isNaN(valor) && valor > 0) {
                suma += valor;
                count++;
            }
        });

        const promedio = count > 0 ? (suma / count).toFixed(1) : '--';
        const promedioElement = document.querySelector(`span[data-alumno-id="${alumnoId}"]`);
        if (promedioElement) {
            promedioElement.textContent = promedio;
            
            // Aplicar clase según el promedio
            promedioElement.className = 'promedio-value';
            if (promedio !== '--') {
                const valor = parseFloat(promedio);
                if (valor >= 6.0) {
                    promedioElement.classList.add('promedio-excelente');
                } else if (valor >= 5.0) {
                    promedioElement.classList.add('promedio-bueno');
                } else if (valor >= 4.0) {
                    promedioElement.classList.add('promedio-suficiente');
                } else {
                    promedioElement.classList.add('promedio-insuficiente');
                }
            }
        }
    }

    // Event listeners para inputs de notas
    document.addEventListener('input', function(e) {
        if (e.target.classList.contains('nota-input')) {
            const input = e.target;
            const valor = parseFloat(input.value);
            const statusContainer = input.nextElementSibling;
            const savedIcon = statusContainer.querySelector('.nota-saved');
            const errorIcon = statusContainer.querySelector('.nota-error');

            // Validar rango
            if (isNaN(valor) || valor < 1.0 || valor > 7.0) {
                input.style.borderColor = '#dc3545';
                if (input.value !== '') {
                    errorIcon.style.display = 'inline';
                    savedIcon.style.display = 'none';
                }
                return;
            }

            input.style.borderColor = '#28a745';
            
            // Simular guardado automático
            setTimeout(() => {
                savedIcon.style.display = 'inline';
                errorIcon.style.display = 'none';
                
                // Calcular promedio
                calcularPromedio(input.dataset.alumnoId);
                
                // Auto-hide después de 2 segundos
                setTimeout(() => {
                    savedIcon.style.display = 'none';
                }, 2000);
            }, 500);
        }
    });

    // Event listener para doble click en inputs (editar nota)
    document.addEventListener('dblclick', function(e) {
        if (e.target.classList.contains('nota-input')) {
            currentNotaInput = e.target;
            abrirModalEdicion(e.target);
        }
    });

    // Función para abrir modal de edición
    function abrirModalEdicion(input) {
        const alumnoRow = input.closest('tr');
        const alumnoNombre = alumnoRow.querySelector('.alumno-details strong').textContent;
        const materia = input.dataset.materia;
        const semestre = input.dataset.semestre;
        const numeroNota = input.dataset.numeroNota;

        // Llenar información del modal
        document.getElementById('modal-alumno-id').value = input.dataset.alumnoId;
        document.getElementById('modal-materia').value = materia;
        document.getElementById('modal-semestre').value = semestre;
        document.getElementById('modal-numero-nota').value = numeroNota;
        document.getElementById('modal-alumno-nombre').textContent = alumnoNombre;
        document.getElementById('modal-calificacion').value = input.value || '';
        document.getElementById('modal-fecha').value = new Date().toISOString().split('T')[0];

        // Formatear información de materia
        const materiaNames = {
            'matematicas': 'Matemáticas',
            'lenguaje': 'Lenguaje y Comunicación',
            'ciencias': 'Ciencias Naturales',
            'historia': 'Historia y Geografía',
            'ingles': 'Inglés'
        };

        document.getElementById('modal-materia-info').textContent = 
            `${materiaNames[materia] || materia} - Nota ${numeroNota} - ${semestre}° Semestre`;

        // Mostrar/ocultar botón eliminar
        const btnEliminar = document.getElementById('btn-eliminar-nota');
        if (input.value && input.value.trim() !== '') {
            btnEliminar.style.display = 'inline-block';
        } else {
            btnEliminar.style.display = 'none';
        }

        editModal.show();
    }

    // Función para guardar nota desde el modal
    document.getElementById('editarNotaForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const formData = new FormData(this);
        const calificacion = formData.get('calificacion');
        
        // Validar calificación
        const valor = parseFloat(calificacion);
        if (isNaN(valor) || valor < 1.0 || valor > 7.0) {
            Swal.fire({
                title: 'Error',
                text: 'La calificación debe estar entre 1.0 y 7.0',
                icon: 'error'
            });
            return;
        }

        // Actualizar el input correspondiente
        if (currentNotaInput) {
            currentNotaInput.value = valor.toFixed(1);
            currentNotaInput.style.borderColor = '#28a745';
            
            // Mostrar indicador de guardado
            const statusContainer = currentNotaInput.nextElementSibling;
            const savedIcon = statusContainer.querySelector('.nota-saved');
            savedIcon.style.display = 'inline';
            
            // Calcular promedio
            calcularPromedio(currentNotaInput.dataset.alumnoId);
            
            setTimeout(() => {
                savedIcon.style.display = 'none';
            }, 2000);
        }

        // Mostrar mensaje de éxito
        Swal.fire({
            title: '¡Guardado!',
            text: 'La nota ha sido guardada correctamente',
            icon: 'success',
            timer: 1500,
            showConfirmButton: false
        });

        editModal.hide();
    });

    // Función para eliminar nota
    document.getElementById('btn-eliminar-nota').addEventListener('click', function() {
        if (!currentNotaInput) return;

        const alumnoNombre = document.getElementById('modal-alumno-nombre').textContent;
        const materiaInfo = document.getElementById('modal-materia-info').textContent;

        Swal.fire({
            title: '¿Estás seguro?',
            html: `
                <p>Esta acción eliminará la nota de:</p>
                <div style="background: #f8f9fa; padding: 10px; border-radius: 5px; margin: 10px 0;">
                    <strong>Alumno:</strong> ${alumnoNombre}<br>
                    <strong>Evaluación:</strong> ${materiaInfo}
                </div>
            `,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (result.isConfirmed) {
                // Limpiar el input
                currentNotaInput.value = '';
                currentNotaInput.style.borderColor = '';
                
                // Recalcular promedio
                calcularPromedio(currentNotaInput.dataset.alumnoId);
                
                Swal.fire({
                    title: '¡Eliminada!',
                    text: 'La nota ha sido eliminada correctamente',
                    icon: 'success',
                    timer: 1500,
                    showConfirmButton: false
                });

                editModal.hide();
            }
        });
    });

    // Función para ver historial de notas
    window.verHistorialNotas = function(alumnoId) {
        const alumnoRow = document.querySelector(`tr[data-alumno-id="${alumnoId}"]`);
        const alumnoNombre = alumnoRow.querySelector('.alumno-details strong').textContent;
        const alumnoRut = alumnoRow.querySelector('.alumno-details small').textContent;
        const nivel = alumnoRow.querySelector('.nivel-badge').textContent;

        // Mostrar loading
        document.getElementById('historial-loading').style.display = 'block';
        document.getElementById('historial-content').style.display = 'none';
        document.getElementById('historial-error').style.display = 'none';

        // Llenar información del alumno
        document.getElementById('historial-alumno-nombre').textContent = alumnoNombre;
        document.getElementById('historial-alumno-info').textContent = `${alumnoRut} - ${nivel}`;

        historialModal.show();

        // Simular carga de datos
        setTimeout(() => {
            cargarHistorialNotas(alumnoId);
        }, 1000);
    };

    // Función para cargar historial de notas
    function cargarHistorialNotas(alumnoId) {
        // Materias disponibles
        const materias = [
            { key: 'matematicas', name: '📐 Matemáticas' },
            { key: 'lenguaje', name: '📝 Lenguaje y Comunicación' },
            { key: 'ciencias', name: '🔬 Ciencias Naturales' },
            { key: 'historia', name: '🏛️ Historia y Geografía' },
            { key: 'ingles', name: '🇺🇸 Inglés' }
        ];

        // Llenar tablas de ambos semestres
        [1, 2].forEach(semestre => {
            const tbody = document.getElementById(`notas-semestre${semestre}`);
            tbody.innerHTML = '';

            materias.forEach(materia => {
                const row = document.createElement('tr');
                
                // Generar notas simuladas (puedes reemplazar con datos reales)
                const notas = Array.from({length: 6}, () => {
                    return Math.random() > 0.3 ? (Math.random() * 6 + 1).toFixed(1) : '--';
                });
                
                const promedio = calcularPromedioArray(notas);
                
                row.innerHTML = `
                    <td>${materia.name}</td>
                    <td>${notas[0]}</td>
                    <td>${notas[1]}</td>
                    <td>${notas[2]}</td>
                    <td>${notas[3]}</td>
                    <td>${notas[4]}</td>
                    <td>${notas[5]}</td>
                    <td><span class="promedio-badge ${getPromedioClass(promedio)}">${promedio}</span></td>
                `;
                
                tbody.appendChild(row);
            });
        });

        // Ocultar loading y mostrar contenido
        document.getElementById('historial-loading').style.display = 'none';
        document.getElementById('historial-content').style.display = 'block';
    }

    // Función auxiliar para calcular promedio de array
    function calcularPromedioArray(notas) {
        const notasValidas = notas.filter(nota => nota !== '--' && !isNaN(parseFloat(nota)));
        if (notasValidas.length === 0) return '--';
        
        const suma = notasValidas.reduce((acc, nota) => acc + parseFloat(nota), 0);
        return (suma / notasValidas.length).toFixed(1);
    }

    // Función auxiliar para obtener clase de promedio
    function getPromedioClass(promedio) {
        if (promedio === '--') return '';
        const valor = parseFloat(promedio);
        if (valor >= 6.0) return 'promedio-excelente';
        if (valor >= 5.0) return 'promedio-bueno';
        if (valor >= 4.0) return 'promedio-suficiente';
        return 'promedio-insuficiente';
    }

    // Función para editar todas las notas de un alumno
    window.editarNotasAlumno = function(alumnoId) {
        const alumnoRow = document.querySelector(`tr[data-alumno-id="${alumnoId}"]`);
        const alumnoNombre = alumnoRow.querySelector('.alumno-details strong').textContent;
        
        Swal.fire({
            title: 'Editar Notas',
            text: `¿Deseas editar todas las notas de ${alumnoNombre}?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Sí, editar',
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (result.isConfirmed) {
                // Habilitar edición de todas las notas del alumno
                const inputs = alumnoRow.querySelectorAll('.nota-input');
                inputs.forEach(input => {
                    input.focus();
                    input.select();
                });
                
                Swal.fire({
                    title: 'Modo de edición activado',
                    text: 'Puedes editar todas las notas del alumno',
                    icon: 'info',
                    timer: 2000,
                    showConfirmButton: false
                });
            }
        });
    };

    // Función para exportar notas
    window.exportarNotas = function() {
        Swal.fire({
            title: 'Exportar Notas',
            text: 'Esta funcionalidad estará disponible próximamente',
            icon: 'info'
        });
    };

    // Función para exportar historial de alumno
    window.exportarHistorialAlumno = function() {
        Swal.fire({
            title: 'Exportar Historial',
            text: 'Esta funcionalidad estará disponible próximamente',
            icon: 'info'
        });
    };

    // Cargar notas existentes al inicializar
    function cargarNotasExistentes() {
        const notasGuardadas = JSON.parse(localStorage.getItem('notasGuardadas') || '{}');
        
        Object.keys(notasGuardadas).forEach(key => {
            const nota = notasGuardadas[key];
            const input = document.querySelector(
                `input[data-alumno-id="${nota.alumno_id}"][data-materia="${nota.materia}"][data-semestre="${nota.semestre}"][data-numero-nota="${nota.numero_nota}"]`
            );
            
            if (input) {
                input.value = nota.valor;
                input.style.borderColor = '#28a745';
                calcularPromedio(nota.alumno_id);
            }
        });
    }

    // Auto-hide para alertas
    setTimeout(() => {
        const alerts = document.querySelectorAll('.auto-hide-alert');
        alerts.forEach(alert => {
            if (alert) {
                alert.remove();
            }
        });
    }, 5000);

    // Cargar notas existentes
    cargarNotasExistentes();

    console.log('Sistema de gestión de notas inicializado correctamente');
});
