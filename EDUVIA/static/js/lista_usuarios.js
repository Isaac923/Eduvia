// Función para resetear los filtros
    function resetFilters() {
        document.querySelector('.search-input').value = '';
        document.querySelector('.filter-rol').value = '';
        document.querySelector('.filter-estado').value = '';
        
        // Disparar el evento para actualizar la tabla
        document.querySelector('.search-input').dispatchEvent(new Event('input'));
    }
    
    // Configuración del modal de eliminación
    document.addEventListener('DOMContentLoaded', function() {
        const deleteModal = document.getElementById('deleteModal');
        if (deleteModal) {
            deleteModal.addEventListener('show.bs.modal', function(event) {
                const button = event.relatedTarget;
                const userId = button.getAttribute('data-id');
                const userName = button.getAttribute('data-nombre');
                
                document.getElementById('userName').textContent = userName;
                document.getElementById('deleteForm').action = `/usuarios/eliminar/${userId}/`;
            });
        }
    });

    document.addEventListener('DOMContentLoaded', function() {
    const deleteModal = document.getElementById('deleteModal');
    if (deleteModal) {
        deleteModal.addEventListener('show.bs.modal', function(event) {
            const button = event.relatedTarget;
            const userId = button.getAttribute('data-id');
            const userName = button.getAttribute('data-nombre');
            
            document.getElementById('userName').textContent = userName;
            document.getElementById('deleteForm').action = `/usuarios/eliminar/${userId}/`;
        });
    }
});

    // Función para resetear los filtros
    function resetFilters() {
        document.querySelector('.search-input').value = '';
        document.querySelector('.filter-rol').value = '';
        document.querySelector('.filter-estado').value = '';
        
        // Disparar el evento para actualizar la tabla
        document.querySelector('.search-input').dispatchEvent(new Event('input'));
    }
    
    // Función para abrir el modal de eliminación
    function openDeleteModal(userId, userName) {
        document.getElementById('userName').textContent = userName;
        document.getElementById('deleteForm').action = `/usuarios/eliminar/${userId}/`;
        document.getElementById('deleteModal').style.display = 'flex';
        document.body.style.overflow = 'hidden'; // Prevenir scroll
    }
    
    // Función para cerrar el modal de eliminación
    function closeDeleteModal() {
        document.getElementById('deleteModal').style.display = 'none';
        document.body.style.overflow = ''; // Restaurar scroll
    }
    
    // Configuración de los botones de eliminar
    document.addEventListener('DOMContentLoaded', function() {
        // Configurar todos los botones de eliminar
        const deleteButtons = document.querySelectorAll('.btn-delete');
        deleteButtons.forEach(button => {
            button.addEventListener('click', function(event) {
                event.preventDefault();
                const userId = this.getAttribute('data-id');
                const userName = this.getAttribute('data-nombre');
                openDeleteModal(userId, userName);
            });
        });
        
        // Cerrar modal al hacer clic fuera del contenido
        const deleteModal = document.getElementById('deleteModal');
        if (deleteModal) {
            deleteModal.addEventListener('click', function(event) {
                if (event.target === this) {
                    closeDeleteModal();
                }
            });
        }
    });
        