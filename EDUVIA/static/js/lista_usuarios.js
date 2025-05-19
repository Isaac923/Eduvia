document.addEventListener('DOMContentLoaded', function() {
        // Configurar el modal de eliminación
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
        
        // Animación para los elementos de la tabla
        const tableRows = document.querySelectorAll('.user-table tbody tr');
        tableRows.forEach((row, index) => {
            row.style.animation = `fadeIn 0.3s ease-out forwards ${index * 0.05}s`;
            row.style.opacity = '0';
        });
        
        // Búsqueda en tiempo real (solo si hay usuarios)
        const searchInput = document.querySelector('.search-input');
        if (searchInput) {
            searchInput.addEventListener('input', function() {
                const searchTerm = this.value.toLowerCase();
                const tableRows = document.querySelectorAll('.user-table tbody tr');
                
                tableRows.forEach(row => {
                    // Ignorar la fila de estado vacío
                    if (row.querySelector('.empty-state')) return;
                    
                    const text = row.textContent.toLowerCase();
                    if (text.includes(searchTerm)) {
                        row.style.display = '';
                    } else {
                        row.style.display = 'none';
                    }
                });
            });
        }
        
        // Filtros de dropdown (solo si hay usuarios)
        const filterDropdowns = document.querySelectorAll('.filter-dropdown');
        filterDropdowns.forEach(dropdown => {
            dropdown.addEventListener('change', function() {
                // Aquí iría la lógica de filtrado
                // Por ahora solo recargamos la página con el parámetro
                const value = this.value;
                if (value) {
                    const currentUrl = new URL(window.location.href);
                    currentUrl.searchParams.set(this.getAttribute('name') || 'filter', value);
                    window.location.href = currentUrl.toString();
                }
            });
        });
    });