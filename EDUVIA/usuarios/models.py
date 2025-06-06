from django.db import models
from django.core.validators import RegexValidator
from django.contrib.auth.hashers import make_password, check_password

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
    
    # Validador para RUT chileno (formato: 12.345.678-9)
    rut_validator = RegexValidator(
        regex=r'^\d{1,2}\.\d{3}\.\d{3}-[\dkK]$',
        message="RUT debe tener formato válido (Ej: 12.345.678-9)"
    )
    
    # Validador para teléfono chileno (formato: +56 9 1234 5678)
    telefono_validator = RegexValidator(
        regex=r'^\+56\s9\s\d{4}\s\d{4}$',
        message="Teléfono debe tener formato válido (Ej: +56 9 1234 5678)"
    )
    
    # Campos del modelo
    rut = models.CharField(
        max_length=12, 
        unique=True, 
        verbose_name="RUT", 
        validators=[rut_validator]
    )
    password = models.CharField(
        max_length=128, 
        verbose_name="Contraseña",
        help_text="Contraseña hasheada del usuario"
    )
    nombres = models.CharField(max_length=100, verbose_name="Nombres")
    apellidos = models.CharField(max_length=100, verbose_name="Apellidos")
    telefono = models.CharField(
        max_length=20, 
        blank=True, 
        null=True, 
        verbose_name="Teléfono", 
        validators=[telefono_validator]
    )
    correo = models.EmailField(unique=True, verbose_name="Correo Electrónico")
    rol = models.CharField(max_length=20, choices=ROL_CHOICES, verbose_name="Rol")
    estado = models.CharField(
        max_length=20, 
        choices=ESTADO_CHOICES, 
        default='inactive', 
        verbose_name="Estado"
    )
    funcion = models.CharField(
        max_length=200, 
        blank=True, 
        null=True, 
        verbose_name="Función"
    )
    fecha_creacion = models.DateTimeField(auto_now_add=True, verbose_name="Fecha de Creación")
    fecha_modificacion = models.DateTimeField(auto_now=True, verbose_name="Última Modificación")
    
    # Campo interno para controlar cuándo hashear la contraseña
    _password_changed = False
    
    class Meta:
        verbose_name = "Usuario"
        verbose_name_plural = "Usuarios"
        ordering = ['-fecha_creacion']
    
    def __str__(self):
        return f"{self.nombres} {self.apellidos} ({self.rut})"
    
    def nombre_completo(self):
        return f"{self.nombres} {self.apellidos}"
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Guardar la contraseña original para detectar cambios
        self._original_password = self.password
    
    def save(self, *args, **kwargs):
        # Solo hashear la contraseña si:
        # 1. Es un nuevo usuario (pk is None) Y la contraseña no está hasheada
        # 2. O si la contraseña cambió explícitamente
        
        if self.pk is None:
            # Usuario nuevo - hashear si no está ya hasheada
            if not self._is_password_hashed(self.password):
                self.password = make_password(self.password)
        else:
            # Usuario existente - solo hashear si la contraseña cambió
            if (hasattr(self, '_original_password') and 
                self.password != self._original_password and 
                not self._is_password_hashed(self.password)):
                self.password = make_password(self.password)
        
        super().save(*args, **kwargs)
        
        # Actualizar la contraseña original después de guardar
        self._original_password = self.password
    
    def _is_password_hashed(self, password):
        """Verifica si una contraseña ya está hasheada"""
        if not password:
            return False
        return (password.startswith('pbkdf2_') or 
                password.startswith('argon2') or 
                password.startswith('bcrypt') or
                password.startswith('sha1$') or
                password.startswith('md5$') or
                password.startswith('crypt$'))
    
    def check_password(self, raw_password):
        """Verificar contraseña"""
        return check_password(raw_password, self.password)
    
    def set_password(self, raw_password):
        """Establecer nueva contraseña"""
        self.password = make_password(raw_password)
        self._original_password = self.password