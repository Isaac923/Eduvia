from django.db import models
from usuarios.models import Usuario
from cursos.models import Curso
from alumnos.models import Alumno
from django.utils import timezone

class Asignatura(models.Model):
    ASIGNATURAS_CHOICES = [
        ('matematicas', 'Matemáticas'),
        ('lenguaje', 'Lenguaje y Comunicación'),
        ('ciencias', 'Ciencias Naturales'),
        ('historia', 'Historia y Geografía'),
        ('ingles', 'Inglés'),
    ]
    
    nombre = models.CharField(max_length=50, choices=ASIGNATURAS_CHOICES, unique=True)
    descripcion = models.TextField(blank=True, null=True)
    activa = models.BooleanField(default=True)
    
    class Meta:
        verbose_name = 'Asignatura'
        verbose_name_plural = 'Asignaturas'
        ordering = ['nombre']
    
    def __str__(self):
        return self.get_nombre_display()

class AsignaturaCurso(models.Model):
    """Relación entre asignatura y curso para organizar las clases"""
    asignatura = models.ForeignKey(Asignatura, on_delete=models.CASCADE, related_name='cursos_asignados')
    curso = models.ForeignKey(Curso, on_delete=models.CASCADE, related_name='asignaturas')
    profesor = models.ForeignKey(Usuario, on_delete=models.SET_NULL, null=True, blank=True, 
                                limit_choices_to={'rol': 'profesor'}, related_name='asignaturas_asignadas')
    activa = models.BooleanField(default=True)
    
    class Meta:
        verbose_name = 'Asignatura por Curso'
        verbose_name_plural = 'Asignaturas por Curso'
        unique_together = ['asignatura', 'curso']
    
    def __str__(self):
        return f"{self.asignatura} - {self.curso}"

class Asistencia(models.Model):
    ESTADO_CHOICES = [
        ('presente', 'Presente'),
        ('ausente', 'Ausente'),
        ('tardanza', 'Tardanza'),
        ('justificado', 'Justificado'),
    ]
    
    alumno = models.ForeignKey(Alumno, on_delete=models.CASCADE, related_name='asistencias')
    asignatura_curso = models.ForeignKey(AsignaturaCurso, on_delete=models.CASCADE, related_name='asistencias')
    fecha = models.DateField(default=timezone.now)
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='presente')
    observaciones = models.TextField(blank=True, null=True)
    registrado_por = models.ForeignKey(Usuario, on_delete=models.SET_NULL, null=True, blank=True)
    fecha_registro = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Asistencia'
        verbose_name_plural = 'Asistencias'
        unique_together = ['alumno', 'asignatura_curso', 'fecha']
        ordering = ['-fecha', 'alumno__apellido_paterno', 'alumno__apellido_materno']

    def __str__(self):
        return f"{self.alumno} - {self.asignatura_curso} - {self.fecha} - {self.estado}"