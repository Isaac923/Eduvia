from django.db import models
from django.core.validators import RegexValidator

class Usuario(models.Model):
    ROL_CHOICES = [
        ('usuario', 'Usuario'),
        ('admin', 'Administrador'),
    ]
    
    ESTADO_CHOICES = [
        ('active', 'Activo'),
        ('inactive', 'Inactivo'),
        ('pending', 'Pendiente'),
    ]
    
    # Validador para RUT chileno (formato: 12345678-9)
    rut_validator = RegexValidator(
        regex=r'^\d{1,8}-[\dkK]$',
        message="RUT debe tener formato válido (Ej: 12345678-9)"
    )
    
    # Validador para teléfono chileno (formato: +56 9 1234 5678)
    telefono_validator = RegexValidator(
        regex=r'^\+56\s9\s\d{4}\s\d{4}$',
        message="Teléfono debe tener formato válido (Ej: +56 9 1234 5678)"
    )
    
    rut = models.CharField(max_length=12, unique=True, verbose_name="RUT", validators=[rut_validator])
    nombres = models.CharField(max_length=100, verbose_name="Nombres")
    apellidos = models.CharField(max_length=100, verbose_name="Apellidos")
    telefono = models.CharField(max_length=20, blank=True, null=True, verbose_name="Teléfono", validators=[telefono_validator])
    correo = models.EmailField(unique=True, verbose_name="Correo Electrónico")
    rol = models.CharField(max_length=20, choices=ROL_CHOICES, verbose_name="Rol")
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='inactive', verbose_name="Estado")
    funcion = models.CharField(max_length=200, blank=True, null=True, verbose_name="Función")
    fecha_creacion = models.DateTimeField(auto_now_add=True, verbose_name="Fecha de Creación")
    fecha_modificacion = models.DateTimeField(auto_now=True, verbose_name="Última Modificación")
    
    class Meta:
        verbose_name = "Usuario"
        verbose_name_plural = "Usuarios"
        ordering = ['-fecha_creacion']
    
    def __str__(self):
        return f"{self.nombres} {self.apellidos} ({self.rut})"
    
    def nombre_completo(self):
        return f"{self.nombres} {self.apellidos}"
