from django.db import models
from alumnos.models import Alumno
from django.core.validators import MinValueValidator, MaxValueValidator

class Nota(models.Model):
    MATERIAS_CHOICES = [
        ('matematicas', 'Matemáticas'),
        ('lenguaje', 'Lenguaje y Comunicación'),
        ('ciencias', 'Ciencias Naturales'),
        ('historia', 'Historia y Geografía'),
        ('ingles', 'Inglés'),
    ]
    
    SEMESTRE_CHOICES = [
        (1, 'Primer Semestre'),
        (2, 'Segundo Semestre'),
    ]
    
    alumno = models.ForeignKey(Alumno, on_delete=models.CASCADE, related_name='notas')
    materia = models.CharField(max_length=20, choices=MATERIAS_CHOICES)
    semestre = models.IntegerField(choices=SEMESTRE_CHOICES)
    numero_nota = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(6)])
    calificacion = models.DecimalField(
        max_digits=3, 
        decimal_places=1,
        validators=[MinValueValidator(1.0), MaxValueValidator(7.0)]
    )
    porcentaje = models.IntegerField(
        null=True, 
        blank=True,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text="Porcentaje de ponderación para el promedio"
    )
    ano_academico = models.IntegerField(default=2025)  # Cambio aquí: por defecto 2025
    fecha_evaluacion = models.DateField()
    observaciones = models.TextField(blank=True, null=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_modificacion = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['alumno', 'materia', 'semestre', 'numero_nota', 'ano_academico']
        ordering = ['ano_academico', 'semestre', 'materia', 'numero_nota']
        verbose_name = 'Nota'
        verbose_name_plural = 'Notas'
    
    def __str__(self):
        return f"{self.alumno.nombre_completo} - {self.get_materia_display()} - Nota {self.numero_nota} ({self.ano_academico})"
    
    def save(self, *args, **kwargs):
        # Validar que el año académico no sea menor a 2025
        if self.ano_academico < 2025:
            raise ValueError("El año académico no puede ser menor a 2025")
        super().save(*args, **kwargs)

class AnoAcademico(models.Model):
    """Modelo para gestionar los años académicos disponibles"""
    ano = models.IntegerField(unique=True, validators=[MinValueValidator(2025)])  # Solo mínimo, sin máximo
    activo = models.BooleanField(default=True)
    fecha_inicio = models.DateField(null=True, blank=True)
    fecha_fin = models.DateField(null=True, blank=True)
    observaciones = models.TextField(blank=True, null=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-ano']
        verbose_name = 'Año Académico'
        verbose_name_plural = 'Años Académicos'
    
    def __str__(self):
        return f"Año Académico {self.ano}"
    
    def clean(self):
        """Validación personalizada"""
        if self.ano < 2025:
            raise ValidationError('El año académico debe ser 2025 o posterior.')
        
        # Validación opcional para años muy lejanos
        if self.ano > datetime.now().year + 100:
            raise ValidationError('El año parece demasiado lejano en el futuro.')
    
    @classmethod
    def get_anos_disponibles(cls):
        """Retorna lista de años académicos disponibles"""
        return cls.objects.filter(activo=True).values_list('ano', flat=True).order_by('ano')
    
    @classmethod
    def get_ano_actual(cls):
        """Retorna el año académico actual o 2025 por defecto"""
        try:
            return cls.objects.filter(activo=True).latest('ano').ano
        except cls.DoesNotExist:
            return 2025

class PromedioMateria(models.Model):
    """Modelo para almacenar promedios calculados por materia"""
    alumno = models.ForeignKey(Alumno, on_delete=models.CASCADE, related_name='promedios')
    materia = models.CharField(max_length=20, choices=Nota.MATERIAS_CHOICES)
    semestre = models.IntegerField(choices=Nota.SEMESTRE_CHOICES)
    ano_academico = models.IntegerField(default=2025)
    promedio = models.DecimalField(max_digits=3, decimal_places=1, null=True, blank=True)
    total_notas = models.IntegerField(default=0)
    notas_con_porcentaje = models.IntegerField(default=0)
    fecha_calculo = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['alumno', 'materia', 'semestre', 'ano_academico']
        ordering = ['ano_academico', 'semestre', 'materia']
        verbose_name = 'Promedio por Materia'
        verbose_name_plural = 'Promedios por Materia'
    
    def __str__(self):
        return f"{self.alumno.nombre_completo} - {self.get_materia_display()} - {self.semestre}° Sem. ({self.ano_academico}): {self.promedio}"
    
    def calcular_promedio(self):
        """Calcula el promedio basado en las notas del alumno"""
        notas = Nota.objects.filter(
            alumno=self.alumno,
            materia=self.materia,
            semestre=self.semestre,
            ano_academico=self.ano_academico
        )
        
        if not notas.exists():
            self.promedio = None
            self.total_notas = 0
            self.notas_con_porcentaje = 0
            return
        
        total_puntos = 0
        total_porcentaje_usado = 0
        notas_sin_porcentaje = []
        notas_con_porcentaje = 0
        
        for nota in notas:
            if nota.porcentaje:
                # Nota con porcentaje específico
                total_puntos += float(nota.calificacion) * (nota.porcentaje / 100)
                total_porcentaje_usado += nota.porcentaje
                notas_con_porcentaje += 1
            else:
                # Nota sin porcentaje específico
                notas_sin_porcentaje.append(float(nota.calificacion))
        
        # Calcular promedio de notas sin porcentaje
        if notas_sin_porcentaje:
            promedio_sin_porcentaje = sum(notas_sin_porcentaje) / len(notas_sin_porcentaje)
            porcentaje_restante = max(0, 100 - total_porcentaje_usado)
            total_puntos += promedio_sin_porcentaje * (porcentaje_restante / 100)
        
        self.promedio = round(total_puntos, 1) if total_puntos > 0 else None
        self.total_notas = notas.count()
        self.notas_con_porcentaje = notas_con_porcentaje
        self.save()
