/**
 * Funcionalidad para el sidebar oculto/visible en hover
 * Este script maneja la visibilidad del sidebar cuando el cursor
 * se posiciona sobre él o sale de él respectivamente.
 */
document.addEventListener('DOMContentLoaded', function() {
    // Elementos principales
    const appContainer = document.querySelector('.app-container');
    const sidebar = document.querySelector('.sidebar');
    const mainContent = document.querySelector('.main-content');
    
    if (appContainer && sidebar && mainContent) {
        const sidebarTrigger = document.createElement('div');
        
        // Crear área de activación para mostrar el sidebar
        sidebarTrigger.className = 'sidebar-trigger';
        appContainer.appendChild(sidebarTrigger);
        
        // Función para ocultar el sidebar
        function hideSidebar() {
            sidebar.classList.add('hidden');
            mainContent.classList.add('full-width');
            sidebarTrigger.classList.add('active');
        }
        
        // Función para mostrar el sidebar
        function showSidebar() {
            sidebar.classList.remove('hidden');
            mainContent.classList.remove('full-width');
            sidebarTrigger.classList.remove('active');
        }
        
        // Ocultar sidebar inicialmente
        hideSidebar();
        
        // Event listeners para el sidebar
        sidebarTrigger.addEventListener('mouseenter', showSidebar);
        sidebar.addEventListener('mouseenter', showSidebar);
        sidebar.addEventListener('mouseleave', hideSidebar);
    }
    
    // Inicializar cierre de alertas
    initializeAlertClosing();
});

/**
 * Función para inicializar el cierre de alertas
 * Maneja tanto alertas existentes como dinámicas
 */
function initializeAlertClosing() {
    // Delegación de eventos para botones de cerrar alertas
    document.addEventListener('click', function(e) {
        if (e.target.matches('.alert-close, .btn-close, .close')) {
            const alert = e.target.closest('.alert');
            if (alert) {
                closeAlert(alert);
            }
        }
    });
    
    // Auto-cerrar alertas después de 5 segundos (opcional)
    autoCloseAlerts();
    
    // Observar nuevas alertas dinámicas
    observeNewAlerts();
}

/**
 * Función para cerrar una alerta específica
 */
function closeAlert(alertElement) {
    if (alertElement) {
        alertElement.style.transition = 'opacity 0.3s ease';
        alertElement.style.opacity = '0';
        
        setTimeout(() => {
            alertElement.remove();
        }, 300);
    }
}

/**
 * Auto-cerrar alertas de éxito después de 5 segundos
 */
function autoCloseAlerts() {
    const successAlerts = document.querySelectorAll('.alert-success');
    
    successAlerts.forEach(alert => {
        // Solo auto-cerrar si no tiene la clase 'persistent'
        if (!alert.classList.contains('persistent')) {
            setTimeout(() => {
                if (alert.parentNode) { // Verificar que aún existe
                    closeAlert(alert);
                }
            }, 5000);
        }
    });
}

/**
 * Observar nuevas alertas que se agreguen dinámicamente
 */
function observeNewAlerts() {
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            mutation.addedNodes.forEach(function(node) {
                if (node.nodeType === 1) { // Element node
                    // Buscar alertas en el nodo agregado
                    const alerts = node.matches && node.matches('.alert') ? 
                        [node] : 
                        node.querySelectorAll ? node.querySelectorAll('.alert') : [];
                    
                    alerts.forEach(alert => {
                        // Auto-cerrar alertas de éxito después de 5 segundos
                        if (alert.classList.contains('alert-success') && 
                            !alert.classList.contains('persistent')) {
                            setTimeout(() => {
                                if (alert.parentNode) {
                                    closeAlert(alert);
                                }
                            }, 5000);
                        }
                    });
                }
            });
        });
    });
    
    // Observar cambios en el body
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
}

/**
 * Función para mostrar alertas dinámicamente
 * Úsala cuando necesites mostrar alertas via JavaScript
 */
function showAlert(message, type = 'info', persistent = false) {
    const alertContainer = document.getElementById('alert-container') || document.body;
    
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show ${persistent ? 'persistent' : ''}`;
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close alert-close" aria-label="Cerrar"></button>
    `;
    
    // Insertar la alerta al principio del contenedor
    alertContainer.insertBefore(alertDiv, alertContainer.firstChild);
    
    // Auto-cerrar si no es persistente
    if (!persistent && type === 'success') {
        setTimeout(() => {
            if (alertDiv.parentNode) {
                closeAlert(alertDiv);
            }
        }, 5000);
    }
    
    return alertDiv;
}

/**
 * Función para remover todas las alertas
 */
function clearAllAlerts() {
    const alerts = document.querySelectorAll('.alert');
    alerts.forEach(alert => {
        closeAlert(alert);
    });
}
