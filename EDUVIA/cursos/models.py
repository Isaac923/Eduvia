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
    #asignatura = models.CharField(max_length=100, blank=True, null=True)
    alumnos = models.ManyToManyField(Alumno, related_name='cursos', blank=True)
    # docente = models.ForeignKey('usuarios.docente', on_delete=models.CASCADE)  # Esta relación se implementará en el futuro
    
    class Meta:
        verbose_name = 'Curso'
        verbose_name_plural = 'Cursos'
        # Cambiamos la restricción unique_together para incluir asignatura
        unique_together = ('nivel', 'letra')
    
    def __str__(self):
        return f"{self.nivel}° {self.letra.upper()}"


class Asignatura(models.Model):
    nombre = models.CharField(max_length=100, default='Sin Asignatura')
    # Hacemos que la relación con curso sea opcional (null=True, blank=True)
    curso = models.ForeignKey(Curso, on_delete=models.CASCADE, related_name='asignaturas', null=True, blank=True)
    #docente = models.ForeignKey('usuarios.Docente', on_delete=models.SET_NULL, null=True, blank=True)

    class Meta:
        verbose_name = 'Asignatura'
        verbose_name_plural = 'Asignaturas'
        # Eliminamos la restricción unique_together ya que el curso ahora es opcional
        # unique_together = ('nombre', 'curso')  # Evita asignaturas duplicadas por curso

    def __str__(self):
        if self.curso:
            return f"{self.nombre} - {self.curso}"
        return self.nombre
    

