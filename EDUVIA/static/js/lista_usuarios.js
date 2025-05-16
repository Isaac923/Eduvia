document.addEventListener('DOMContentLoaded', function() {
    // Animación de entrada para las filas de usuarios
    const userRows = document.querySelectorAll('.user-row');
    userRows.forEach((row, index) => {
      row.style.opacity = '0';
      row.style.transform = 'translateY(20px)';
      
      setTimeout(() => {
        row.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        row.style.opacity = '1';
        row.style.transform = 'translateY(0)';
      }, 50 + (index * 30)); // Acelerado para mejor experiencia
    });
    
    // Efecto hover para el botón de crear usuario
    const createButton = document.querySelector('.btn-create-user');
    if (createButton) {
      createButton.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-2px)';
      });
      
      createButton.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0)';
      });
      
      // Efecto de pulsación al hacer clic
      createButton.addEventListener('click', function() {
        this.style.transform = 'scale(0.95)';
        setTimeout(() => {
          this.style.transform = 'scale(1)';
        }, 150);
      });
    }
    
    // Efecto para la paginación
    const pageLinks = document.querySelectorAll('.pagination .page-link');
    pageLinks.forEach(link => {
      if (!link.parentElement.classList.contains('disabled') && 
          !link.parentElement.classList.contains('active')) {
        link.addEventListener('mouseenter', function() {
          this.style.transform = 'translateY(-2px)';
        });
        
        link.addEventListener('mouseleave', function() {
          this.style.transform = 'translateY(0)';
        });
      }
    });
    
    // Efecto de pulso para el título
    const pageTitle = document.querySelector('.page-title i');
    if (pageTitle) {
      setInterval(() => {
        pageTitle.style.animation = 'pulse 1.5s ease';
        setTimeout(() => {
          pageTitle.style.animation = 'none';
        }, 1500);
      }, 3000);
    }
  });