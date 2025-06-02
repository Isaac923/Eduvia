from django.db import models
from usuarios.models import Usuario

class PermisoUsuario(models.Model):
    MODULOS_CHOICES = [
        ('inicio', 'Inicio'),
        ('estudiantes', 'Estudiantes'),
        ('cursos', 'Cursos'),
        ('notas', 'Notas'),
        ('asistencia', 'Asistencia'),
        ('usuarios', 'Usuarios'),
        ('permisos', 'Permisos'),
    ]
    
    usuario = models.ForeignKey(Usuario, on_delete=models.CASCADE, related_name='permisos')
    modulo = models.CharField(max_length=50, choices=MODULOS_CHOICES)
    puede_ver = models.BooleanField(default=False)
    puede_crear = models.BooleanField(default=False)
    puede_editar = models.BooleanField(default=False)
    puede_eliminar = models.BooleanField(default=False)
    fecha_asignacion = models.DateTimeField(auto_now_add=True)
    asignado_por = models.ForeignKey(Usuario, on_delete=models.SET_NULL, null=True, blank=True, related_name='permisos_asignados')
    
    class Meta:
        unique_together = ('usuario', 'modulo')
        verbose_name = 'Permiso de Usuario'
        verbose_name_plural = 'Permisos de Usuarios'
        ordering = ['usuario__nombres', 'modulo']
    
    def __str__(self):
        return f"{self.usuario.nombres} {self.usuario.apellidos} - {self.get_modulo_display()}"
