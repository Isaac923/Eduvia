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

// Auto-submit form when filters change
document.addEventListener('DOMContentLoaded', function() {
    const asignaturaSelect = document.getElementById('asignatura');
    const cursoSelect = document.getElementById('curso');
    
    if (asignaturaSelect) {
        asignaturaSelect.addEventListener('change', function() {
            document.getElementById('filtros-form').submit();
        });
    }
    
    if (cursoSelect) {
        cursoSelect.addEventListener('change', function() {
            document.getElementById('filtros-form').submit();
        });
    }
});

// Tooltip para barras de progreso
document.addEventListener('DOMContentLoaded', function() {
    const progressBars = document.querySelectorAll('.progress-bar');
    progressBars.forEach(function(bar) {
        bar.setAttribute('data-bs-toggle', 'tooltip');
        bar.setAttribute('data-bs-placement', 'top');
    });
    
    // Inicializar tooltips si Bootstrap está disponible
    if (typeof bootstrap !== 'undefined') {
        var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
        var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
            return new bootstrap.Tooltip(tooltipTriggerEl);
        });
    }
});

// Auto-hide messages
document.addEventListener('DOMContentLoaded', function() {
    const mensajes = document.querySelectorAll('.messages li');
    if (mensajes.length > 0) {
        setTimeout(() => {
            mensajes.forEach(mensaje => {
                mensaje.style.transition = 'opacity 0.5s ease';
                mensaje.style.opacity = '0';
                setTimeout(() => mensaje.remove(), 3000);
            });
        }, 3000);
    }
});
