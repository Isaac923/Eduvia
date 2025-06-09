
// Auto-submit form when date inputs change
document.getElementById('fecha_inicio').addEventListener('change', function() {
    if (document.getElementById('asignatura_curso').value) {
        this.form.submit();
    }
});

document.getElementById('fecha_fin').addEventListener('change', function() {
    if (document.getElementById('asignatura_curso').value) {
        this.form.submit();
    }
});

document.getElementById('estado').addEventListener('change', function() {
    if (document.getElementById('asignatura_curso').value) {
        this.form.submit();
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
        const icon = header.querySelector('.collapse-icon');
        
        collapseEl.addEventListener('show.bs.collapse', function() {
            icon.classList.add('rotated');
        });
        
        collapseEl.addEventListener('hide.bs.collapse', function() {
            icon.classList.remove('rotated');
        });
    });
});

// SweetAlert2 para confirmación de modificar asistencia
document.addEventListener('DOMContentLoaded', function() {
    const botonesModificar = document.querySelectorAll('.modificar-asistencia-btn');
    
    botonesModificar.forEach(function(boton) {
        boton.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation(); // Evitar que se active el collapse
            
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
                    // Mostrar loading
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
                    
                    // Redirigir después de un breve delay para mostrar el loading
                    setTimeout(() => {
                        window.location.href = url;
                    }, 1000);
                }
            });
        });
    });
});
