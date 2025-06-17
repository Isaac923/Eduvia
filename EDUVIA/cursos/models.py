from django.db import models
from alumnos.models import Alumno

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
    alumnos = models.ManyToManyField(
        Alumno, 
        related_name='cursos', 
        blank=True
    )
    
    class Meta:
        verbose_name = 'Curso'
        verbose_name_plural = 'Cursos'
        unique_together = ['nivel', 'letra']
    
    def __str__(self):
        return f"{self.nivel}° {self.letra.upper()}"
    
    def clean(self):
        """Validación personalizada para evitar crear curso 3B"""
        from django.core.exceptions import ValidationError
        if self.nivel == 3 and self.letra == 'b':
            raise ValidationError('No se permite crear el curso 3B')
    
    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)
        # Actualizar alumnos automáticamente después de guardar
        self.actualizar_alumnos_automaticamente()
    
    def actualizar_alumnos_automaticamente(self, ano_academico=None):
        """Actualiza automáticamente los alumnos del curso según su nivel y jornada"""
        from alumnos.models import AlumnoAno, AnoAcademico
        
        if not ano_academico:
            ano_academico = AnoAcademico.get_ano_activo()
        
        if not ano_academico:
            return
        
        # Determinar el nivel y jornada que corresponde a este curso
        nivel_curso = f"{self.nivel}{self.letra.upper()}"
        jornada_curso = 'diurna' if self.letra.lower() == 'a' else 'vespertina'
        
        # Obtener alumnos activos que corresponden a este curso en el año académico
        alumnos_correspondientes = AlumnoAno.objects.filter(
            ano_academico=ano_academico,
            nivel=nivel_curso,
            jornada=jornada_curso,
            activo=True,  # Solo alumnos activos en AlumnoAno
            alumno__activo=True  # Y también activos en el modelo Alumno
        ).select_related('alumno')
        
        # Limpiar alumnos actuales del curso
        self.alumnos.clear()
        
        # Agregar alumnos correspondientes
        for alumno_ano in alumnos_correspondientes:
            self.alumnos.add(alumno_ano.alumno)
    
    def get_alumnos_con_estado(self, ano_academico=None):
        """Obtiene los alumnos del curso con su estado en el año académico"""
        from alumnos.models import AlumnoAno, AnoAcademico
        
        if not ano_academico:
            ano_academico = AnoAcademico.get_ano_activo()
        
        if not ano_academico:
            return []
        
        nivel_curso = f"{self.nivel}{self.letra.upper()}"
        jornada_curso = 'diurna' if self.letra.lower() == 'a' else 'vespertina'
        
        alumnos_ano = AlumnoAno.objects.filter(
            ano_academico=ano_academico,
            nivel=nivel_curso,
            jornada=jornada_curso
        ).select_related('alumno')
        
        return alumnos_ano

class MatriculaCurso(models.Model):
    """Modelo intermedio para la relación Alumno-Curso con año académico"""
    alumno = models.ForeignKey(Alumno, on_delete=models.CASCADE)
    curso = models.ForeignKey(Curso, on_delete=models.CASCADE)
    fecha_matricula = models.DateField(auto_now_add=True)
    activa = models.BooleanField(default=True)
    anio = models.PositiveIntegerField()  # Agregamos el año directamente
    
    class Meta:
        verbose_name = "Matrícula en Curso"
        verbose_name_plural = "Matrículas en Cursos"
        unique_together = ['alumno', 'curso', 'anio']
    
    def __str__(self):
        return f"{self.alumno} - {self.curso} ({self.anio})"