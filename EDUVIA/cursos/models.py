from django.db import models
from alumnos.models import Alumno

# Lista predefinida de asignaturas


class Curso(models.Model):
    NIVEL_CHOICES = (
        (1, 'Nivel 1'),
        (2, 'Nivel 2'),
        (3, 'Nivel 3'),
    )
    
    LETRA_CHOICES = (
        ('a', 'Diurna (A)'),
        ('b', 'Vespertina (B)'),
    )
    
    nivel = models.IntegerField(choices=NIVEL_CHOICES)
    letra = models.CharField(max_length=1, choices=LETRA_CHOICES)
    alumnos = models.ManyToManyField(Alumno, related_name='cursos', blank=True)
    # docente = models.ForeignKey('usuarios.docente', on_delete=models.CASCADE)  # Esta relación se implementará en el futuro
    
    class Meta:
        verbose_name = 'Curso'
        verbose_name_plural = 'Cursos'
        # Cambiamos la restricción unique_together para incluir asignatura
        unique_together = ('nivel', 'letra')
    
    def __str__(self):
        return f"{self.nivel}° {self.letra.upper()}"
