
function marcarTodos(estado) {
    const radios = document.querySelectorAll(`input[type="radio"][value="${estado}"]`);
    radios.forEach(radio => {
        radio.checked = true;
    });
}

// Confirmación antes de enviar con SweetAlert2 mejorado
document.getElementById('asistenciaForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const esModificacion = {{ es_modificacion|yesno:"true,false" }};
    const fecha = esModificacion ? '{{ fecha_modificar|date:"d/m/Y" }}' : '{{ fecha_hoy|date:"d/m/Y" }}';
    const asignatura = '{{ asignatura_curso.asignatura }}';
    const curso = '{{ asignatura_curso.curso }}';
    
    // Contar estados
    const presentes = document.querySelectorAll('input[value="presente"]:checked').length;
    const ausentes = document.querySelectorAll('input[value="ausente"]:checked').length;
    const tardanzas = document.querySelectorAll('input[value="tardanza"]:checked').length;
    const justificados = document.querySelectorAll('input[value="justificado"]:checked').length;
    const total = presentes + ausentes + tardanzas + justificados;
    
    // Contar observaciones
    const observaciones = Array.from(document.querySelectorAll('input[name^="observaciones_"]'))
        .filter(input => input.value.trim() !== '').length;
    
    const titulo = esModificacion ? '¿Actualizar Asistencia?' : '¿Guardar Asistencia?';
    const textoBoton = esModificacion ? 'Sí, actualizar' : 'Sí, guardar';
    const colorBoton = esModificacion ? '#ffc107' : '#28a745';
    const iconoBoton = esModificacion ? 'edit' : 'save';
    
    Swal.fire({
        title: titulo,
        html: `
            <div class="text-start">
                <div class="mb-3 text-center">
                    <i class="fas fa-${esModificacion ? 'edit' : 'clipboard-check'} fa-3x text-${esModificacion ? 'warning' : 'success'} mb-3"></i>
                </div>
                
                <div class="row mb-3">
                    <div class="col-6">
                        <p><strong><i class="fas fa-calendar me-2"></i>Fecha:</strong></p>
                        <p><strong><i class="fas fa-book me-2"></i>Asignatura:</strong></p>
                        <p><strong><i class="fas fa-users me-2"></i>Curso:</strong></p>
                    </div>
                    <div class="col-6">
                        <p>${fecha}</p>
                        <p>${asignatura}</p>
                        <p>${curso}</p>
                    </div>
                </div>
                
                <hr>
                
                <div class="row text-center mb-3">
                    <div class="col-3">
                        <div class="text-success">
                            <i class="fas fa-check-circle"></i>
                            <div class="fw-bold">${presentes}</div>
                            <small>Presentes</small>
                        </div>
                    </div>
                    <div class="col-3">
                        <div class="text-danger">
                            <i class="fas fa-times-circle"></i>
                            <div class="fw-bold">${ausentes}</div>
                            <small>Ausentes</small>
                        </div>
                    </div>
                    <div class="col-3">
                        <div class="text-warning">
                            <i class="fas fa-clock"></i>
                            <div class="fw-bold">${tardanzas}</div>
                            <small>Tardanzas</small>
                        </div>
                    </div>
                    <div class="col-3">
                        <div class="text-info">
                            <i class="fas fa-file-medical"></i>
                            <div class="fw-bold">${justificados}</div>
                            <small>Justificados</small>
                        </div>
                    </div>
                </div>
                
                <div class="alert alert-info py-2">
                    <small>
                        <i class="fas fa-info-circle me-2"></i>
                        <strong>Total estudiantes:</strong> ${total}
                        ${observaciones > 0 ? `<br><i class="fas fa-comment me-2"></i><strong>Con observaciones:</strong> ${observaciones}` : ''}
                    </small>
                </div>
                
                ${esModificacion ? '<div class="alert alert-warning py-2"><small><i class="fas fa-exclamation-triangle me-2"></i>Esta acción sobrescribirá los registros existentes</small></div>' : ''}
            </div>
        `,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: colorBoton,
        cancelButtonColor: '#6c757d',
        confirmButtonText: `<i class="fas fa-${iconoBoton} me-2"></i>${textoBoton}`,
        cancelButtonText: '<i class="fas fa-times me-2"></i>Cancelar',
        customClass: {
            popup: 'swal2-popup-custom',
            title: 'swal2-title-custom',
            confirmButton: `btn btn-${esModificacion ? 'warning' : 'success'}`,
            cancelButton: 'btn btn-secondary'
        },
        buttonsStyling: false,
        focusConfirm: false,
        allowOutsideClick: false
    }).then((result) => {
        if (result.isConfirmed) {
            // Mostrar loading
            Swal.fire({
                title: esModificacion ? 'Actualizando...' : 'Guardando...',
                html: `
                    <div class="text-center">
                        <div class="spinner-border text-${esModificacion ? 'warning' : 'success'}" role="status">
                            <span class="visually-hidden">Procesando...</span>
                        </div>
                        <p class="mt-3 mb-0">${esModificacion ? 'Actualizando registros de asistencia' : 'Guardando registros de asistencia'}</p>
                    </div>
                `,
                allowOutsideClick: false,
                allowEscapeKey: false,
                showConfirmButton: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });
            
            // Enviar formulario
            this.submit();
        }
    });
});