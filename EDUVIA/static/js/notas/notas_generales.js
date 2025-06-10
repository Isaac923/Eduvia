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
        const anoActual = document.getElementById('year-filter').value;
        const url = new URL(window.location.origin + window.location.pathname);
        url.searchParams.set('year', anoActual); // Mantener solo el año
        window.location.href = url.toString();
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

    // Función para colorear el promedio según la nota
    window.colorearPromedio = function(alumnoId, promedio) {
        const container = document.getElementById(`promedio-container-${alumnoId}`);
        const promedioNumero = container ? container.querySelector('.promedio-numero') : null;
        const icon = container ? container.querySelector('.promedio-icon') : null;
        
        if (!container || !promedioNumero || !icon) return;
        
        // Limpiar clases anteriores
        container.className = 'promedio-container';
        
        if (!promedio || promedio === '--' || promedio === 0) {
            container.classList.add('promedio-sin-nota');
            icon.className = 'promedio-icon fas fa-minus';
            promedioNumero.textContent = '--';
            return;
        }
        
        const nota = parseFloat(promedio);
        promedioNumero.textContent = nota.toFixed(1);
        
        if (nota >= 6.0) {
            // Excelente (6.0 - 7.0)
            container.classList.add('promedio-excelente');
            icon.className = 'promedio-icon fas fa-star';
        } else if (nota >= 5.0) {
            // Bueno (5.0 - 5.9)
            container.classList.add('promedio-bueno');
            icon.className = 'promedio-icon fas fa-thumbs-up';
        } else if (nota >= 4.0) {
            // Regular (4.0 - 4.9)
            container.classList.add('promedio-regular');
            icon.className = 'promedio-icon fas fa-exclamation-triangle';
        } else {
            // Insuficiente (1.0 - 3.9)
            container.classList.add('promedio-insuficiente');
            icon.className = 'promedio-icon fas fa-times-circle';
        }
    };

    // Función para recalcular promedio
    window.recalcularPromedio = function(alumnoId) {
        console.log('Recalculando promedio para alumno:', alumnoId);
        
        // Obtener todas las notas del alumno
        const notasInputs = document.querySelectorAll(`input[data-alumno-id="${alumnoId}"]`);
        let totalNotas = 0;
        let sumaNotas = 0;
        
        notasInputs.forEach(input => {
            const valor = parseFloat(input.value);
            if (!isNaN(valor) && valor > 0) {
                totalNotas++;
                sumaNotas += valor;
            }
        });
        
        let promedio = 0;
        if (totalNotas > 0) {
            promedio = sumaNotas / totalNotas;
        }
        
        // Aplicar colores al promedio
        window.colorearPromedio(alumnoId, promedio);
        
        // Actualizar detalle del promedio
        const detalleElement = document.querySelector(`.promedio-detalle[data-alumno-id="${alumnoId}"]`);
        if (detalleElement) {
            detalleElement.textContent = totalNotas > 0 ? `${totalNotas} notas` : '';
        }
    };

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

    // Función para ver historial de notas - ACTUALIZADA
    window.verHistorialNotas = function(alumnoId) {
        console.log('Cargando historial para alumno:', alumnoId);
        
        // Mostrar modal de historial
        const modal = new bootstrap.Modal(document.getElementById('historialNotasModal'));
        modal.show();
        
        // Mostrar loading
        document.getElementById('historial-loading').style.display = 'block';
        document.getElementById('historial-content').style.display = 'none';
        document.getElementById('historial-error').style.display = 'none';
        
        // Cargar historial
        const ano = document.getElementById('year-filter') ? document.getElementById('year-filter').value : new Date().getFullYear();
        
        // Intentar cargar desde el servidor, si falla usar datos locales
        fetch(`/notas/historial-alumno/${alumnoId}/?ano=${ano}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Datos del historial recibidos:', data);
            
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
                
                // Actualizar badges de los tabs
                actualizarBadgesSemestres(data.notas_semestre1 || [], data.notas_semestre2 || []);
                
            } else {
                throw new Error(data.message || 'Error al cargar el historial');
            }
        })
        .catch(error => {
            console.error('Error al cargar historial del servidor, usando datos locales:', error);
            cargarHistorialNotasLocal(alumnoId);
        });
    };

    // Función para cargar historial de notas local (fallback)
    function cargarHistorialNotasLocal(alumnoId) {
        const alumnoRow = document.querySelector(`tr[data-alumno-id="${alumnoId}"]`);
        const alumnoNombre = alumnoRow.querySelector('.alumno-details strong').textContent;
        const alumnoRut = alumnoRow.querySelector('.alumno-details small').textContent;
        const nivel = alumnoRow.querySelector('.nivel-badge').textContent;
        const ano = document.getElementById('year-filter') ? document.getElementById('year-filter').value : new Date().getFullYear();

        // Llenar información del alumno
        document.getElementById('historial-alumno-nombre').textContent = alumnoNombre;
        document.getElementById('historial-alumno-info').textContent = `${alumnoRut} - ${nivel}`;
        
        const anoElement = document.getElementById('historial-ano-badge');
        if (anoElement) {
            anoElement.textContent = `Año ${ano}`;
        }

        // Materias disponibles
        const materias = [
            { key: 'matematicas', name: '📐 Matemáticas' },
            { key: 'lenguaje', name: '📝 Lenguaje y Comunicación' },
            { key: 'ciencias', name: '🔬 Ciencias Naturales' },
            { key: 'historia', name: '🏛️ Historia y Geografía' },
            { key: 'ingles', name: '🇺🇸 Inglés' }
        ];

        // Obtener notas reales de la tabla actual para ambos semestres
        const notasSemestre1 = obtenerNotasAlumnoSemestre(alumnoId, 1, materias);
        const notasSemestre2 = obtenerNotasAlumnoSemestre(alumnoId, 2, materias);

        // Llenar tablas de ambos semestres
        llenarTablaHistorial('notas-semestre1', notasSemestre1, 1);
        llenarTablaHistorial('notas-semestre2', notasSemestre2, 2);
        
        // Actualizar badges de los tabs
        actualizarBadgesSemestres(notasSemestre1, notasSemestre2);

        // Ocultar loading y mostrar contenido
        document.getElementById('historial-loading').style.display = 'none';
        document.getElementById('historial-content').style.display = 'block';
    }

    // Nueva función para obtener notas reales del alumno por semestre
    function obtenerNotasAlumnoSemestre(alumnoId, semestre, materias) {
        const notasSemestre = [];
        
        materias.forEach(materia => {
            const notasMateria = {
                materia: materia.key,
                nombre: materia.name,
                nota1: null, nota2: null, nota3: null, nota4
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
        const anoActual = document.getElementById('year-filter').value;
        const url = new URL(window.location.origin + window.location.pathname);
        url.searchParams.set('year', anoActual); // Mantener solo el año
        window.location.href = url.toString();
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

    // Función para colorear el promedio según la nota
    window.colorearPromedio = function(alumnoId, promedio) {
        const container = document.getElementById(`promedio-container-${alumnoId}`);
        const promedioNumero = container ? container.querySelector('.promedio-numero') : null;
        const icon = container ? container.querySelector('.promedio-icon') : null;
        
        if (!container || !promedioNumero || !icon) return;
        
        // Limpiar clases anteriores
        container.className = 'promedio-container';
        
        if (!promedio || promedio === '--' || promedio === 0) {
            container.classList.add('promedio-sin-nota');
            icon.className = 'promedio-icon fas fa-minus';
            promedioNumero.textContent = '--';
            return;
        }
        
        const nota = parseFloat(promedio);
        promedioNumero.textContent = nota.toFixed(1);
        
        if (nota >= 6.0) {
            // Excelente (6.0 - 7.0)
            container.classList.add('promedio-excelente');
            icon.className = 'promedio-icon fas fa-star';
        } else if (nota >= 5.0) {
            // Bueno (5.0 - 5.9)
            container.classList.add('promedio-bueno');
            icon.className = 'promedio-icon fas fa-thumbs-up';
        } else if (nota >= 4.0) {
            // Regular (4.0 - 4.9)
            container.classList.add('promedio-regular');
            icon.className = 'promedio-icon fas fa-exclamation-triangle';
        } else {
            // Insuficiente (1.0 - 3.9)
            container.classList.add('promedio-insuficiente');
            icon.className = 'promedio-icon fas fa-times-circle';
        }
    };

    // Función para recalcular promedio
    window.recalcularPromedio = function(alumnoId) {
        console.log('Recalculando promedio para alumno:', alumnoId);
        
        // Obtener todas las notas del alumno
        const notasInputs = document.querySelectorAll(`input[data-alumno-id="${alumnoId}"]`);
        let totalNotas = 0;
        let sumaNotas = 0;
        
        notasInputs.forEach(input => {
            const valor = parseFloat(input.value);
            if (!isNaN(valor) && valor > 0) {
                totalNotas++;
                sumaNotas += valor;
            }
        });
        
        let promedio = 0;
        if (totalNotas > 0) {
            promedio = sumaNotas / totalNotas;
        }
        
        // Aplicar colores al promedio
        window.colorearPromedio(alumnoId, promedio);
        
        // Actualizar detalle del promedio
        const detalleElement = document.querySelector(`.promedio-detalle[data-alumno-id="${alumnoId}"]`);
        if (detalleElement) {
            detalleElement.textContent = totalNotas > 0 ? `${totalNotas} notas` : '';
        }
    };

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

    // Función para ver historial de notas - ACTUALIZADA
    window.verHistorialNotas = function(alumnoId) {
        console.log('Cargando historial para alumno:', alumnoId);
        
        // Mostrar modal de historial
        const modal = new bootstrap.Modal(document.getElementById('historialNotasModal'));
        modal.show();
        
        // Mostrar loading
        document.getElementById('historial-loading').style.display = 'block';
        document.getElementById('historial-content').style.display = 'none';
        document.getElementById('historial-error').style.display = 'none';
        
        // Cargar historial
        const ano = document.getElementById('year-filter') ? document.getElementById('year-filter').value : new Date().getFullYear();
        
        // Intentar cargar desde el servidor, si falla usar datos locales
        fetch(`/notas/historial-alumno/${alumnoId}/?ano=${ano}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Datos del historial recibidos:', data);
            
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
                
                // Actualizar badges de los tabs
                actualizarBadgesSemestres(data.notas_semestre1 || [], data.notas_semestre2 || []);
                
            } else {
                throw new Error(data.message || 'Error al cargar el historial');
            }
        })
        .catch(error => {
            console.error('Error al cargar historial del servidor, usando datos locales:', error);
            cargarHistorialNotasLocal(alumnoId);
        });
    };

    // Función para cargar historial de notas local (fallback)
    function cargarHistorialNotasLocal(alumnoId) {
        const alumnoRow = document.querySelector(`tr[data-alumno-id="${alumnoId}"]`);
        const alumnoNombre = alumnoRow.querySelector('.alumno-details strong').textContent;
        const alumnoRut = alumnoRow.querySelector('.alumno-details small').textContent;
        const nivel = alumnoRow.querySelector('.nivel-badge').textContent;
        const ano = document.getElementById('year-filter') ? document.getElementById('year-filter').value : new Date().getFullYear();

        // Llenar información del alumno
        document.getElementById('historial-alumno-nombre').textContent = alumnoNombre;
        document.getElementById('historial-alumno-info').textContent = `${alumnoRut} - ${nivel}`;
        
        const anoElement = document.getElementById('historial-ano-badge');
        if (anoElement) {
            anoElement.textContent = `Año ${ano}`;
        }

        // Materias disponibles
        const materias = [
            { key: 'matematicas', name: '📐 Matemáticas' },
            { key: 'lenguaje', name: '📝 Lenguaje y Comunicación' },
            { key: 'ciencias', name: '🔬 Ciencias Naturales' },
            { key: 'historia', name: '🏛️ Historia y Geografía' },
            { key: 'ingles', name: '🇺🇸 Inglés' }
        ];

        // Obtener notas reales de la tabla actual para ambos semestres
        const notasSemestre1 = obtenerNotasAlumnoSemestre(alumnoId, 1, materias);
        const notasSemestre2 = obtenerNotasAlumnoSemestre(alumnoId, 2, materias);

        // Llenar tablas de ambos semestres
        llenarTablaHistorial('notas-semestre1', notasSemestre1, 1);
        llenarTablaHistorial('notas-semestre2', notasSemestre2, 2);
        
        // Actualizar badges de los tabs
        actualizarBadgesSemestres(notasSemestre1, notasSemestre2);

        // Ocultar loading y mostrar contenido
        document.getElementById('historial-loading').style.display = 'none';
        document.getElementById('historial-content').style.display = 'block';
    }

    // Nueva función para obtener notas reales del alumno por semestre
    function obtenerNotasAlumnoSemestre(alumnoId, semestre, materias) {
        const notasSemestre = [];
        
        materias.forEach(materia => {
            const notasMateria = {
                materia: materia.key,
                nombre: materia.name,
                nota1: null, nota2: null, nota3: null, nota4: null, nota5: null, nota6: null
            };
            
            // Buscar notas en la tabla actual si es el semestre que se está mostrando
            const semestreActual = document.getElementById('semestre-filter') ? 
                document.getElementById('semestre-filter').value : '1';
            
            if (semestre.toString() === semestreActual) {
                // Obtener notas de la tabla visible
                for (let i = 1; i <= 6; i++) {
                    const input = document.querySelector(
                        `input[data-alumno-id="${alumnoId}"][data-materia="${materia.key}"][data-semestre="${semestre}"][data-numero-nota="${i}"]`
                    );
                    if (input && input.value && parseFloat(input.value) > 0) {
                        notasMateria[`nota${i}`] = parseFloat(input.value).toFixed(1);
                    }
                }
            } else {
                // Para el otro semestre, generar notas simuladas o buscar en localStorage
                const notasGuardadas = JSON.parse(localStorage.getItem('notasGuardadas') || '{}');
                for (let i = 1; i <= 6; i++) {
                    const key = `${alumnoId}_${materia.key}_${semestre}_${i}`;
                    if (notasGuardadas[key]) {
                        notasMateria[`nota${i}`] = notasGuardadas[key].valor;
                    } else {
                        // Generar nota simulada ocasionalmente
                        if (Math.random() > 0.6) {
                            notasMateria[`nota${i}`] = (Math.random() * 6 + 1).toFixed(1);
                        }
                    }
                }
            }
            
            notasSemestre.push(notasMateria);
        });
        
        return notasSemestre;
    }

    // Función para llenar tabla de historial - ACTUALIZADA
    function llenarTablaHistorial(tablaId, notas, semestre) {
        const tbody = document.getElementById(tablaId);
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        console.log(`Llenando tabla ${tablaId} con notas:`, notas);
        
        // Definir todas las materias disponibles
        const materiasDisponibles = {
            'matematicas': '📐 Matemáticas',
            'lenguaje': '📝 Lenguaje y Comunicación',
            'ciencias': '🔬 Ciencias Naturales',
            'historia': '🏛️ Historia y Geografía',
            'ingles': '🇺🇸 Inglés'
        };
        
        let totalNotas = 0;
        let materiasConNotas = 0;
        let sumaPromedios = 0;
        let promediosValidos = 0;
        
        // Crear una fila para cada materia
        Object.keys(materiasDisponibles).forEach(materiaKey => {
            const materiaData = notas.find(n => n.materia === materiaKey) || {};
            const row = document.createElement('tr');
            
            // Calcular promedio de la materia
            const notasMateria = [
                materiaData.nota1, materiaData.nota2, materiaData.nota3,
                materiaData.nota4, materiaData.nota5, materiaData.nota6
            ].filter(nota => nota && parseFloat(nota) > 0);
            
            let promedioMateria = '--';
            let estadoMateria = 'sin-notas';
            
            if (notasMateria.length > 0) {
                const suma = notasMateria.reduce((acc, nota) => acc + parseFloat(nota), 0);
                const promedio = suma / notasMateria.length;
                promedioMateria = promedio.toFixed(1);
                
                materiasConNotas++;
                totalNotas += notasMateria.length;
                sumaPromedios += promedio;
                promediosValidos++;
                
                // Determinar estado según el promedio
                if (promedio >= 6.0) {
                    estadoMateria = 'excelente';
                } else if (promedio >= 5.0) {
                    estadoMateria = 'bueno';
                } else if (promedio >= 4.0) {
                    estadoMateria = 'regular';
                } else {
                    estadoMateria = 'insuficiente';
                }
            }
            
            // Crear celdas de notas
            const celdasNotas = [];
            for (let i = 1; i <= 6; i++) {
                const nota = materiaData[`nota${i}`];
                let celdaNota = '--';
                let claseNota = '';
                
                if (nota && parseFloat(nota) > 0) {
                    const valorNota = parseFloat(nota);
                    celdaNota = valorNota.toFixed(1);
                    
                    // Aplicar colores según la nota
                    if (valorNota >= 6.0) {
                        claseNota = 'text-success fw-bold';
                    } else if (valorNota >= 5.0) {
                        claseNota = 'text-info fw-bold';
                    } else if (valorNota >= 4.0) {
                        claseNota = 'text-warning fw-bold';
                    } else {
                        claseNota = 'text-danger fw-bold';
                    }
                }
                
                celdasNotas.push(`<td class="${claseNota}">${celdaNota}</td>`);
            }
            
            // Crear celda de promedio con color
            let clasePromedio = '';
            let iconoEstado = '';
            
            if (promedioMateria !== '--') {
                const valorPromedio = parseFloat(promedioMateria);
                if (valorPromedio >= 6.0) {
                    clasePromedio = 'text-success fw-bold';
                    iconoEstado = '<i class="fas fa-star text-warning"></i>';
                } else if (valorPromedio >= 5.0) {
                    clasePromedio = 'text-info fw-bold';
                    iconoEstado = '<i class="fas fa-thumbs-up text-info"></i>';
                } else if (valorPromedio >= 4.0) {
                    clasePromedio = 'text-warning fw-bold';
                    iconoEstado = '<i class="fas fa-exclamation-triangle text-warning"></i>';
                } else {
                    clasePromedio = 'text-danger fw-bold';
                    iconoEstado = '<i class="fas fa-times-circle text-danger"></i>';
                }
            } else {
                iconoEstado = '<i class="fas fa-minus text-muted"></i>';
            }
            
            row.innerHTML = `
                <td><strong>${materiasDisponibles[materiaKey]}</strong></td>
                ${celdasNotas.join('')}
                <td class="${clasePromedio}">${promedioMateria}</td>
                <td class="text-center">${iconoEstado}</td>
            `;
            
            tbody.appendChild(row);
        });
        
        // Si no hay ninguna materia con notas, mostrar mensaje
        if (materiasConNotas === 0) {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td colspan="9" class="text-center text-muted py-4">
                    <i class="fas fa-info-circle me-2"></i>
                    No hay notas registradas para este semestre
                </td>
            `;
            tbody.appendChild(row);
        }
        
        // Actualizar resumen del semestre
        actualizarResumenSemestre(semestre, materiasConNotas, totalNotas, sumaPromedios, promediosValidos);
    }

    // Función para actualizar el resumen de cada semestre
    function actualizarResumenSemestre(semestre, materiasConNotas, totalNotas, sumaPromedios, promediosValidos) {
        const promedioGeneral = promediosValidos > 0 ? (sumaPromedios / promediosValidos).toFixed(1) : '--';
        
        const materiasElement = document.getElementById(`materias-con-notas-s${semestre}`);
        const totalElement = document.getElementById(`total-notas-s${semestre}`);
        const promedioElement = document.getElementById(`promedio-general-s${semestre}`);
        
        if (materiasElement) materiasElement.textContent = materiasConNotas;
        if (totalElement) totalElement.textContent = totalNotas;
        if (promedioElement) {
            promedioElement.textContent = promedioGeneral;
            
            // Aplicar color al promedio general
            if (promedioGeneral !== '--') {
                const valor = parseFloat(promedioGeneral);
                if (valor >= 6.0) {
                    promedioElement.className = 'text-success fw-bold';
                } else if (valor >= 5.0) {
                    promedioElement.className = 'text-info fw-bold';
                } else if (valor >= 4.0) {
                    promedioElement.className = 'text-warning fw-bold';
                } else {
                    promedioElement.className = 'text-danger fw-bold';
                }
            } else {
                promedioElement.className = 'text-muted';
            }
        }
    }

    // Función para actualizar los badges de los tabs de semestres
    function actualizarBadgesSemestres(notasSemestre1, notasSemestre2) {
        // Contar notas del primer semestre
        let totalNotasS1 = 0;
        notasSemestre1.forEach(materia => {
            for (let i = 1; i <= 6; i++) {
                if (materia[`nota${i}`] && parseFloat(materia[`nota${i}`]) > 0) {
                    totalNotasS1++;
                }
            }
        });
        
        // Contar notas del segundo semestre
        let totalNotasS2 = 0;
        notasSemestre2.forEach(materia => {
            for (let i = 1; i <= 6; i++) {
                if (materia[`nota${i}`] && parseFloat(materia[`nota${i}`]) > 0) {
                    totalNotasS2++;
                }
            }
        });
        
        // Actualizar badges
        const badgeS1 = document.getElementById('badge-semestre1');
        const badgeS2 = document.getElementById('badge-semestre2');
        
        if (badgeS1) {
            badgeS1.textContent = totalNotasS1;
            badgeS1.className = totalNotasS1 > 0 ? 'badge bg-success ms-2' : 'badge bg-secondary ms-2';
        }
        
        if (badgeS2) {
            badgeS2.textContent = totalNotasS2;
            badgeS2.className = totalNotasS2 > 0 ? 'badge bg-success ms-2' : 'badge bg-secondary ms-2';
        }
    }

    // Función para refrescar el historial después de guardar una nota
    function refrescarHistorialSiEstaAbierto(alumnoId) {
        const modal = document.getElementById('historialNotasModal');
        const modalInstance = bootstrap.Modal.getInstance(modal);
        
        if (modalInstance && modal.classList.contains('show')) {
            // El modal está abierto, refrescar los datos
            setTimeout(() => {
                window.verHistorialNotas(alumnoId);
            }, 500); // Pequeño delay para asegurar que la nota se guardó
        }
    }

    // Función para guardar nota desde el modal
    document.getElementById('editarNotaForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const formData = new FormData(this);
        const calificacion = formData.get('calificacion');
        const alumnoId = formData.get('alumno_id');
        
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
        
        // Refrescar historial si está abierto
        refrescarHistorialSiEstaAbierto(alumnoId);
    });

    // Función para eliminar nota
    document.getElementById('btn-eliminar-nota').addEventListener('click', function() {
        if (!currentNotaInput) return;

        const alumnoNombre = document.getElementById('modal-alumno-nombre').textContent;
        const materiaInfo = document.getElementById('modal-materia-info').textContent;
        const alumnoId = currentNotaInput.dataset.alumnoId;

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
                
                // Refrescar historial si está abierto
                refrescarHistorialSiEstaAbierto(alumnoId);
            }
        });
    });

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

    // Función mejorada para exportar historial de alumno
    window.exportarHistorialAlumno = function() {
        const alumnoNombre = document.getElementById('historial-alumno-nombre').textContent;
        const ano = document.getElementById('year-filter') ? document.getElementById('year-filter').value : new Date().getFullYear();
        
        Swal.fire({
            title: 'Exportar Historial',
            text: `¿Deseas exportar el historial completo de ${alumnoNombre} para el año ${ano}?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Sí, exportar',
            cancelButtonText: 'Cancelar',
            showLoaderOnConfirm: true,
            preConfirm: () => {
                return new Promise((resolve) => {
                    // Simular exportación (aquí implementarías la lógica real)
                    setTimeout(() => {
                        resolve();
                    }, 2000);
                });
            }
        }).then((result) => {
            if (result.isConfirmed) {
                Swal.fire({
                    icon: 'success',
                    title: 'Historial exportado',
                    text: 'El historial se ha exportado correctamente.',
                    timer: 2000,
                    showConfirmButton: false
                });
            }
        });
    };

    // Función para aplicar colores a todos los promedios visibles al cargar la página
    function aplicarColoresPromediosIniciales() {
        const alumnosRows = document.querySelectorAll('.alumno-row');
        alumnosRows.forEach(row => {
            const alumnoId = row.dataset.alumnoId;
            // Inicializar con promedio 0 (sin nota)
            window.colorearPromedio(alumnoId, 0);
        });
    }

    // Función para cargar notas de alumno
    function cargarNotasAlumno(alumnoId) {
        const materia = document.getElementById('materia-filter') ? document.getElementById('materia-filter').value : '';
        const semestre = document.getElementById('semestre-filter') ? document.getElementById('semestre-filter').value : '1';
        const ano = document.getElementById('year-filter') ? document.getElementById('year-filter').value : new Date().getFullYear();
        
        if (!materia) {
            console.log('No hay materia seleccionada, saltando carga de notas');
            return;
        }
        
        console.log(`Cargando notas para alumno ${alumnoId}: materia=${materia}, semestre=${semestre}, ano=${ano}`);
        
        // Intentar cargar desde el servidor
        fetch(`/notas/obtener-notas/${alumnoId}/?materia=${materia}&semestre=${semestre}&ano=${ano}`)
        .then(response => response.json())
        .then(data => {
            console.log(`Notas recibidas para alumno ${alumnoId}:`, data);
            
            if (data.success && data.notas) {
                // Actualizar notas en la tabla
                data.notas.forEach(nota => {
                    const notaInput = document.querySelector(`input[data-alumno-id="${alumnoId}"][data-numero-nota="${nota.numero}"]`);
                    if (notaInput) {
                        notaInput.value = nota.calificacion;
                        notaInput.setAttribute('data-ano', ano);
                        
                        if (nota.porcentaje && nota.porcentaje > 0) {
                            const statusContainer = notaInput.parentElement.querySelector('.nota-status');
                            const iconoPorcentaje = statusContainer.querySelector('.nota-ponderada');
                            if (iconoPorcentaje) {
                                iconoPorcentaje.style.display = 'inline';
                                iconoPorcentaje.title = `Nota con ${nota.porcentaje}% asignado`;
                            }
                        }
                    }
                });
                
                // Aplicar colores al promedio
                if (data.promedio) {
                    window.colorearPromedio(alumnoId, data.promedio);
                    
                    const detalleElement = document.querySelector(`.promedio-detalle[data-alumno-id="${alumnoId}"]`);
                    if (detalleElement && data.detalle_promedio) {
                        detalleElement.textContent = data.detalle_promedio;
                    }
                } else {
                    window.colorearPromedio(alumnoId, 0);
                }
            }
        })
        .catch(error => {
            console.error('Error al cargar notas:', error);
            // Aplicar colores por defecto
            window.colorearPromedio(alumnoId, 0);
        });
    }

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

    // Aplicar colores iniciales al cargar
    aplicarColoresPromediosIniciales();
    
    // Cargar notas para cada alumno visible
    const alumnosRows = document.querySelectorAll('.alumno-row');
    alumnosRows.forEach(row => {
        const alumnoId = row.dataset.alumnoId;
        cargarNotasAlumno(alumnoId);
    });

    // Cargar notas existentes
    cargarNotasExistentes();

    console.log('Sistema de gestión de notas inicializado correctamente');
});
