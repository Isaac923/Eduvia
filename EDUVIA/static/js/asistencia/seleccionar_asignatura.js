// Archivo JavaScript para funcionalidades adicionales de seleccionar asignatura
document.addEventListener('DOMContentLoaded', function() {
    console.log('Seleccionar asignatura JS cargado');
    
    // Efectos hover para las cards
    const cards = document.querySelectorAll('.hover-card');
    cards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-5px)';
            this.style.transition = 'transform 0.3s ease';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });
});