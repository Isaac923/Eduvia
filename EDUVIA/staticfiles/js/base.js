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
    
    // Ocultar sidebar inicialmente (cambiado de mostrar a ocultar)
    hideSidebar();
    
    // Mostrar sidebar al pasar el cursor por el área de activación
    sidebarTrigger.addEventListener('mouseenter', function() {
        showSidebar();
    });
    
    // Mostrar sidebar al pasar el cursor por el sidebar
    sidebar.addEventListener('mouseenter', function() {
        showSidebar();
    });
    
    // Ocultar sidebar al salir del sidebar
    sidebar.addEventListener('mouseleave', function() {
        hideSidebar();
    });
    
    // Cerrar alertas
    const closeAlerts = document.querySelectorAll('.close-alert');
    closeAlerts.forEach(function(button) {
        button.addEventListener('click', function() {
            const alert = this.closest('.alert');
            alert.classList.add('fade-out');
            setTimeout(function() {
                alert.remove();
            }, 300);
        });
    });
    
    // Ajustar para dispositivos móviles
    function handleMobileView() {
        if (window.innerWidth < 992) {
            // En móviles, usar un botón para mostrar/ocultar
            const mobileToggle = document.createElement('button');
            mobileToggle.className = 'mobile-sidebar-toggle';
            mobileToggle.innerHTML = '<i class="fas fa-bars"></i>';
            document.body.appendChild(mobileToggle);
            
            // En móviles, iniciar con el sidebar oculto
            hideSidebar();
            
            mobileToggle.addEventListener('click', function() {
                if (sidebar.classList.contains('hidden')) {
                    showSidebar();
                    sidebar.classList.add('mobile-visible');
                } else {
                    hideSidebar();
                    sidebar.classList.remove('mobile-visible');
                }
            });
            
            // Cerrar al hacer clic fuera
            document.addEventListener('click', function(e) {
                if (!sidebar.contains(e.target) || 
                    !mobileToggle.contains(e.target) && 
                    sidebar.classList.contains('mobile-visible')) {
                    hideSidebar();
                    sidebar.classList.remove('mobile-visible');
                }
            });
        }
    }
    
    // Verificar si es móvil al cargar
    handleMobileView();
    
    // Configuración del indicador de sidebar
    const sidebarHint = document.getElementById('sidebarHint');
    if (sidebarHint) {
        // Ocultar el indicador después de un tiempo
        setTimeout(function() {
            sidebarHint.style.opacity = '0.7';
        }, 5000);
        
        // Mostrar sidebar al hacer clic en el indicador
        sidebarHint.addEventListener('click', function() {
            showSidebar();
            // Ocultar el indicador
            sidebarHint.style.opacity = '0';
            setTimeout(function() {
                sidebarHint.style.display = 'none';
            }, 300);
        });
        
        // Gestionar visibilidad del indicador con el sidebar
        sidebar.addEventListener('mouseenter', function() {
            sidebarHint.style.opacity = '0';
        });
        
        sidebar.addEventListener('mouseleave', function() {
            // Solo mostrar el indicador si no ha sido ocultado permanentemente
            if (sidebarHint.style.display !== 'none') {
                sidebarHint.style.opacity = '0.7';
            }
        });
    }
});
