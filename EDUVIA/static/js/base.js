// Script para la plantilla base

document.addEventListener('DOMContentLoaded', function() {
    // Manejo de alertas
    const closeButtons = document.querySelectorAll('.close-alert');
    closeButtons.forEach(button => {
        button.addEventListener('click', function() {
            const alert = this.closest('.alert');
            alert.style.opacity = '0';
            setTimeout(() => {
                alert.style.display = 'none';
            }, 300);
        });
    });

    // Manejo de dropdowns en dispositivos táctiles
    const actionButtons = document.querySelectorAll('.action-button');
    actionButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.stopPropagation();
            const parent = this.closest('.action-item');
            const dropdown = parent.querySelector('.dropdown-menu');
            
            // Cerrar todos los otros dropdowns
            document.querySelectorAll('.dropdown-menu').forEach(menu => {
                if (menu !== dropdown && menu.classList.contains('show')) {
                    menu.classList.remove('show');
                }
            });
            
            // Toggle el dropdown actual
            if (dropdown) {
                dropdown.classList.toggle('show');
            }
        });
    });

    // Cerrar dropdowns al hacer clic fuera
    document.addEventListener('click', function() {
        document.querySelectorAll('.dropdown-menu.show').forEach(menu => {
            menu.classList.remove('show');
        });
    });

    // Prevenir cierre al hacer clic dentro del dropdown
    document.querySelectorAll('.dropdown-menu').forEach(menu => {
        menu.addEventListener('click', function(e) {
            e.stopPropagation();
        });
    });

    // Manejo de responsive para el sidebar
    const menuToggle = document.getElementById('menuToggle');
    if (menuToggle) {
        menuToggle.addEventListener('click', function() {
            const sidebar = document.getElementById('sidebar');
            sidebar.classList.toggle('active');
        });
    }

    // Cerrar sidebar en modo responsive al hacer clic en un enlace
    const sidebarLinks = document.querySelectorAll('.sidebar-nav a');
    sidebarLinks.forEach(link => {
        link.addEventListener('click', function() {
            if (window.innerWidth < 992) {
                const sidebar = document.getElementById('sidebar');
                sidebar.classList.remove('active');
            }
        });
    });

    // Cerrar sidebar en modo responsive al hacer clic fuera
    document.addEventListener('click', function(e) {
        if (window.innerWidth < 992) {
            const sidebar = document.getElementById('sidebar');
            const menuToggle = document.getElementById('menuToggle');
            
            if (sidebar && sidebar.classList.contains('active') && 
                !sidebar.contains(e.target) && 
                e.target !== menuToggle && 
                !menuToggle.contains(e.target)) {
                sidebar.classList.remove('active');
            }
        }
    });
});