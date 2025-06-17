
// Auto-submit form when filters change
document.getElementById('asignatura').addEventListener('change', function() {
    this.form.submit();
});

document.getElementById('curso').addEventListener('change', function() {
    this.form.submit();
});

document.getElementById('nivel').addEventListener('change', function() {
    this.form.submit();
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

