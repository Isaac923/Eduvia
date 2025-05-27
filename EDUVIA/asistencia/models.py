from django.db import models

# Create your models here.
class Asistencia(models.Model):
    alumno = models.ForeignKey('alumnos.Alumno', on_delete=models.CASCADE)
    curso = models.ForeignKey('cursos.Curso', on_delete=models.CASCADE)
    asignatura = models.ForeignKey('cursos.Asignatura', on_delete=models.CASCADE)
    fecha = models.DateField()
    presente = models.BooleanField(default=True)
    #profesor = models.ForeignKey('profesores.Profesor', on_delete=models.SET_NULL, null=True)