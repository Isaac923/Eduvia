// Función para cambiar año académico
function cambiarAnoAcademico() {
    const anoSelect = document.getElementById('ano-academico-filter');
    const hiddenInput = document.getElementById('hidden-ano-academico');
    const form = document.getElementById('filtros-form');
    
    if (anoSelect && hiddenInput && form) {
        hiddenInput.value = anoSelect.value;
        form.submit();
    }
}

// Función para limpiar filtros
function limpiarFiltros() {
    const form = document.getElementById('filtros-form');
    const anoAcademico = document.getElementById('hidden-ano-academico').value;
    
    // Limpiar todos los campos excepto el año académico
    form.reset();
    document.getElementById('hidden-ano-academico').value = anoAcademico;
    document.getElementById('ano-academico-filter').value = anoAcademico;
    
    form.submit();
}

// Variables para el calendario
let calendarioMesActual = new Date();
let asistenciasData = {};

// Auto-submit form when filters change
document.addEventListener('DOMContentLoaded', function() {
    const asignaturaSelect = document.getElementById('asignatura_curso');
    const mesSelect = document.getElementById('mes');
    const estadoSelect = document.getElementById('estado');
    
    if (asignaturaSelect) {
        asignaturaSelect.addEventListener('change', function() {
            document.getElementById('filtros-form').submit();
        });
    }
    
    if (mesSelect) {
        mesSelect.addEventListener('change', function() {
            if (asignaturaSelect && asignaturaSelect.value) {
                document.getElementById('filtros-form').submit();
            }
        });
    }
    
    if (estadoSelect) {
        estadoSelect.addEventListener('change', function() {
            if (asignaturaSelect && asignaturaSelect.value) {
                document.getElementById('filtros-form').submit();
            }
        });
    }

    // Inicializar calendario
    calendarioMesActual = new Date();
    if (typeof anoAcademico !== 'undefined') {
        calendarioMesActual.setFullYear(anoAcademico);
        console.log('Año académico:', anoAcademico);
        console.log('Calendario inicializado para:', calendarioMesActual);
    }
});

// Funciones para expandir/contraer todos
function expandirTodos() {
    const collapses = document.querySelectorAll('.collapse');
    const icons = document.querySelectorAll('.collapse-icon');
    
    collapses.forEach(collapse => {
        const bsCollapse = new bootstrap.Collapse(collapse, {show: true});
    });
    
    icons.forEach(icon => {
        icon.classList.add('rotated');
    });
}

function contraerTodos() {
    const collapses = document.querySelectorAll('.collapse');
    const icons = document.querySelectorAll('.collapse-icon');
    
    collapses.forEach(collapse => {
        const bsCollapse = bootstrap.Collapse.getInstance(collapse);
        if (bsCollapse) {
            bsCollapse.hide();
        }
    });
    
    icons.forEach(icon => {
        icon.classList.remove('rotated');
    });
}

// Manejar rotación de iconos al expandir/contraer
document.addEventListener('DOMContentLoaded', function() {
    const collapseElements = document.querySelectorAll('.collapse');
    
    collapseElements.forEach(function(collapseEl) {
        const header = document.querySelector(`[data-bs-target="#${collapseEl.id}"]`);
        if (header) {
            const icon = header.querySelector('.collapse-icon');
            
            collapseEl.addEventListener('show.bs.collapse', function() {
                if (icon) icon.classList.add('rotated');
            });
            
            collapseEl.addEventListener('hide.bs.collapse', function() {
                if (icon) icon.classList.remove('rotated');
            });
        }
    });
});

// SweetAlert2 para confirmación de modificar asistencia
document.addEventListener('DOMContentLoaded', function() {
    const botonesModificar = document.querySelectorAll('.modificar-asistencia-btn');
    
    botonesModificar.forEach(function(boton) {
        boton.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const fecha = this.getAttribute('data-fecha');
            const fechaDisplay = this.getAttribute('data-fecha-display');
            const asignatura = this.getAttribute('data-asignatura');
            const curso = this.getAttribute('data-curso');
            const url = this.getAttribute('data-url');
            
            Swal.fire({
                title: '¿Modificar Asistencia?',
                html: `
                    <div class="text-start">
                        <div class="mb-3 text-center">
                            <i class="fas fa-edit fa-2x text-warning mb-3"></i>
                        </div>
                        <p><strong><i class="fas fa-calendar me-2"></i>Fecha:</strong> ${fechaDisplay}</p>
                        <p><strong><i class="fas fa-book me-2"></i>Asignatura:</strong> ${asignatura}</p>
                        <p><strong><i class="fas fa-users me-2"></i>Curso:</strong> ${curso}</p>
                        <hr>
                        <div class="alert alert-warning py-2">
                            <small><i class="fas fa-exclamation-triangle me-2"></i>Podrá modificar el estado y observaciones de cada estudiante</small>
                        </div>
                    </div>
                `,
                icon: 'question',
                showCancelButton: true,
                confirmButtonColor: '#ffc107',
                cancelButtonColor: '#6c757d',
                confirmButtonText: '<i class="fas fa-edit me-2"></i>Sí, modificar',
                cancelButtonText: '<i class="fas fa-times me-2"></i>Cancelar',
                customClass: {
                    popup: 'swal2-popup-custom',
                    title: 'swal2-title-custom',
                    confirmButton: 'btn btn-warning',
                    cancelButton: 'btn btn-secondary'
                },
                buttonsStyling: false,
                focusConfirm: false,
                allowOutsideClick: false
            }).then((result) => {
                if (result.isConfirmed) {
                    Swal.fire({
                        title: 'Cargando...',
                        html: `
                            <div class="text-center">
                                <div class="spinner-border text-warning" role="status">
                                    <span class="visually-hidden">Cargando...</span>
                                </div>
                                <p class="mt-3 mb-0">Preparando formulario de modificación</p>
                            </div>
                        `,
                        allowOutsideClick: false,
                        allowEscapeKey: false,
                        showConfirmButton: false,
                        didOpen: () => {
                            Swal.showLoading();
                        }
                    });
                    
                    setTimeout(() => {
                        window.location.href = url;
                    }, 1000);
                }
            });
        });
    });
});

// Función para cambiar entre vista lista y calendario
function cambiarVista(vista) {
    const vistaLista = document.getElementById('vista-lista');
    const vistaCalendario = document.getElementById('vista-calendario');
    const btnLista = document.getElementById('btn-vista-lista');
    const btnCalendario = document.getElementById('btn-vista-calendario');
    
    if (vista === 'calendario') {
        vistaLista.style.display = 'none';
        vistaCalendario.style.display = 'block';
        btnLista.classList.remove('btn-primary');
        btnLista.classList.add('btn-outline-primary');
        btnCalendario.classList.remove('btn-outline-primary');
        btnCalendario.classList.add('btn-primary');
        
        procesarAsistenciasParaCalendario();
        generarCalendario();
    } else {
        vistaLista.style.display = 'block';
        vistaCalendario.style.display = 'none';
        btnLista.classList.remove('btn-outline-primary');
        btnLista.classList.add('btn-primary');
        btnCalendario.classList.remove('btn-primary');
        btnCalendario.classList.add('btn-outline-primary');
    }
}

// Función para procesar datos de asistencias
function procesarAsistenciasParaCalendario() {
    asistenciasData = {};
    
    const tarjetasFecha = document.querySelectorAll('[id^="collapse-"]');
    
    tarjetasFecha.forEach(tarjeta => {
        const fechaStr = tarjeta.id.replace('collapse-', '');
        const header = document.querySelector(`[data-bs-target="#${tarjeta.id}"]`);
        
        if (header) {
            const badges = header.querySelectorAll('.badge');
            
            if (badges.length >= 4) {
                asistenciasData[fechaStr] = {
                    total: parseInt(badges[0].textContent) || 0,
                    presentes: parseInt(badges[1].textContent) || 0,
                    ausentes: parseInt(badges[2].textContent) || 0,
                    tardanzas: parseInt(badges[3].textContent) || 0,
                    justificados: parseInt(badges[4] ? badges[4].textContent : 0) || 0
                };
            }
        }
    });
}

// Función para cambiar mes - Limitado al año académico
function cambiarMes(direccion) {
    const nuevaFecha = new Date(calendarioMesActual);
    nuevaFecha.setMonth(nuevaFecha.getMonth() + direccion);
    
    if (typeof anoAcademico !== 'undefined' && nuevaFecha.getFullYear() === anoAcademico) {
        calendarioMesActual = nuevaFecha;
        generarCalendario();
    }
}

// Función para generar el calendario - Solo año académico
function generarCalendario() {
    const grid = document.getElementById('calendario-grid');
    const titulo = document.getElementById('calendario-titulo');
    
    if (!grid || !titulo) return;
    
    if (typeof anoAcademico !== 'undefined') {
        calendarioMesActual.setFullYear(anoAcademico);
    }
    
    const meses = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    titulo.textContent = `${meses[calendarioMesActual.getMonth()]} ${calendarioMesActual.getFullYear()}`;
    
    grid.innerHTML = '';
    
    const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    diasSemana.forEach(dia => {
        const header = document.createElement('div');
        header.className = 'calendario-dia-header';
        header.textContent = dia;
        grid.appendChild(header);
    });
    
    const primerDia = new Date(calendarioMesActual.getFullYear(), calendarioMesActual.getMonth(), 1);
    const ultimoDia = new Date(calendarioMesActual.getFullYear(), calendarioMesActual.getMonth() + 1, 0);
    const hoy = new Date();
    
    // Días del mes anterior
    const diasMesAnterior = primerDia.getDay();
    for (let i = diasMesAnterior - 1; i >= 0; i--) {
        const fecha = new Date(primerDia);
        fecha.setDate(fecha.getDate() - i - 1);
        crearDiaCalendario(fecha, true, grid);
    }
    
    // Días del mes actual
    for (let dia = 1; dia <= ultimoDia.getDate(); dia++) {
        const fecha = new Date(calendarioMesActual.getFullYear(), calendarioMesActual.getMonth(), dia);
        const esHoy = fecha.toDateString() === hoy.toDateString();
        crearDiaCalendario(fecha, false, grid, esHoy);
    }
    
    // Días del mes siguiente
    const diasRestantes = 42 - (diasMesAnterior + ultimoDia.getDate());
    for (let dia = 1; dia <= diasRestantes; dia++) {
        const fecha = new Date(calendarioMesActual.getFullYear(), calendarioMesActual.getMonth() + 1, dia);
        crearDiaCalendario(fecha, true, grid);
    }
}

// Función para crear un día del calendario
function crearDiaCalendario(fecha, otroMes, grid, esHoy = false) {
    const dia = document.createElement('div');
    dia.className = 'calendario-dia';
    
    if (otroMes) dia.classList.add('otro-mes');
    if (esHoy) dia.classList.add('hoy');
    
    const fechaStr = fecha.toISOString().split('T')[0];
    const asistencia = asistenciasData[fechaStr];
    
    if (asistencia && asistencia.total > 0) {
        dia.classList.add('con-asistencia');
    }
    
    dia.innerHTML = `
        <div class="calendario-numero">${fecha.getDate()}</div>
        <div class="calendario-asistencias">
            ${asistencia && asistencia.total > 0 ? `
                <span class="calendario-estadistica presentes">${asistencia.presentes}P</span>
                <span class="calendario-estadistica ausentes">${asistencia.ausentes}A</span>
                ${asistencia.tardanzas > 0 ? `<span class="calendario-estadistica tardanzas">${asistencia.tardanzas}T</span>` : ''}
                ${asistencia.justificados > 0 ? `<span class="calendario-estadistica justificados">${asistencia.justificados}J</span>` : ''}
            ` : ''}
        </div>
    `;
    
    if (asistencia && asistencia.total > 0) {
        dia.style.cursor = 'pointer';
        dia.addEventListener('click', () => {
            cambiarVista('lista');
            
            const tarjeta = document.getElementById(`collapse-${fechaStr}`);
            if (tarjeta) {
                const bsCollapse = new bootstrap.Collapse(tarjeta, {show: true});
                
                setTimeout(() => {
                    const cardItem = tarjeta.closest('.card');
                    if (cardItem) {
                        cardItem.scrollIntoView({ 
                            behavior: 'smooth', 
                            block: 'center' 
                        });
                    }
                }, 300);
            }
        });
    }
    
    grid.appendChild(dia);
}

// Función para establecer el año académico desde el template
function setAnoAcademico(ano) {
    anoAcademico = ano;
    calendarioMesActual.setFullYear(ano);
}

// Inicializar calendario
document.addEventListener('DOMContentLoaded', function() {
    calendarioMesActual = new Date();
    // El año se establecerá desde el template
});
document.addEventListener('DOMContentLoaded', function() {
    const mensajes = document.querySelectorAll('.messages li');
    if (mensajes.length > 0) {
        setTimeout(() => {
            mensajes.forEach(mensaje => {
                mensaje.style.transition = 'opacity 0.5s ease';
                mensaje.style.opacity = '0';
                setTimeout(() => mensaje.remove(), 3000); // Remover el mensaje después de la animación
            });
        }, 3000);
    }
});