// Script para manejar la visibilidad del campo de año de repitencia
document.addEventListener('DOMContentLoaded', function() {
    const cursoRepetidoSelect = document.querySelector('[name="curso_repetido"]');
    const anioRepitenciaInput = document.querySelector('[name="anio_repitencia"]').parentNode;
    
    function toggleAnioRepitencia() {
        if (cursoRepetidoSelect.value === 'Ninguno') {
            anioRepitenciaInput.style.display = 'none';
        } else {
            anioRepitenciaInput.style.display = 'block';
        }
    }
    
    // Ejecutar al cargar la página
    toggleAnioRepitencia();
    
    // Ejecutar cuando cambie la selección
    cursoRepetidoSelect.addEventListener('change', toggleAnioRepitencia);
    
    // Script para manejar la visibilidad del campo de profesional de apoyo
    const programaPieSelect = document.querySelector('[name="programa_pie"]');
    const profesionalApoyoSelect = document.querySelector('[name="profesional_apoyo"]').parentNode;
    
    function toggleProfesionalApoyo() {
        if (programaPieSelect.value === 'No') {
            profesionalApoyoSelect.style.display = 'none';
        } else {
            profesionalApoyoSelect.style.display = 'block';
        }
    }
    
    // Ejecutar al cargar la página
    toggleProfesionalApoyo();
    
    // Ejecutar cuando cambie la selección
    programaPieSelect.addEventListener('change', toggleProfesionalApoyo);
});