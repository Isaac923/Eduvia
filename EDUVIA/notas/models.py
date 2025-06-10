from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from datetime import datetime
from alumnos.models import Alumno

class AnoAcademico(models.Model):
    """Modelo para gestionar los años académicos disponibles"""
    ano = models.IntegerField(unique=True, validators=[MinValueValidator(2025)])
    activo = models.BooleanField(default=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-ano']
        verbose_name = 'Año Académico'
        verbose_name_plural = 'Años Académicos'
    
    def __str__(self):
        return f"Año Académico {self.ano}"

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
    materia = models.CharField(max_length=50, choices=MATERIAS_CHOICES)
    semestre = models.IntegerField(choices=SEMESTRE_CHOICES)
    ano = models.IntegerField(validators=[MinValueValidator(2025)], default=2025)
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
        help_text="Porcentaje que representa esta nota en el promedio final"
    )
    fecha_evaluacion = models.DateField()
    observaciones = models.TextField(blank=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_modificacion = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['alumno', 'materia', 'semestre', 'ano', 'numero_nota']
        ordering = ['ano', 'semestre', 'materia', 'numero_nota']
        verbose_name = 'Nota'
        verbose_name_plural = 'Notas'
        indexes = [
            models.Index(fields=['alumno', 'materia', 'semestre', 'ano']),
            models.Index(fields=['ano', 'semestre']),
        ]
    
    def __str__(self):
        return f"{self.alumno.nombre_completo} - {self.get_materia_display()} - Nota {self.numero_nota} ({self.ano})"
    
    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        # Actualizar promedio después de guardar
        self.actualizar_promedio()
    
    def actualizar_promedio(self):
        """Actualiza el promedio de la materia después de guardar una nota"""
        try:
            promedio_obj, created = PromedioMateria.objects.get_or_create(
                alumno=self.alumno,
                materia=self.materia,
                semestre=self.semestre,
                ano=self.ano
            )
            promedio_obj.calcular_promedio()
        except Exception as e:
            print(f"Error al actualizar promedio: {e}")

class PromedioMateria(models.Model):
    """Modelo para almacenar los promedios calculados por materia"""
    alumno = models.ForeignKey(Alumno, on_delete=models.CASCADE, related_name='promedios')
    materia = models.CharField(max_length=50, choices=Nota.MATERIAS_CHOICES)
    semestre = models.IntegerField(choices=Nota.SEMESTRE_CHOICES)
    ano = models.IntegerField(validators=[MinValueValidator(2025)], default=2025)
    promedio = models.DecimalField(max_digits=3, decimal_places=1, null=True, blank=True)
    total_notas = models.IntegerField(default=0)
    notas_con_porcentaje = models.IntegerField(default=0)
    fecha_actualizacion = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['alumno', 'materia', 'semestre', 'ano']
        ordering = ['ano', 'semestre', 'materia']
        verbose_name = 'Promedio por Materia'
        verbose_name_plural = 'Promedios por Materia'
    
    def __str__(self):
        return f"{self.alumno.nombre_completo} - {self.get_materia_display()} - {self.semestre}° Sem. {self.ano}"
    
    def calcular_promedio(self):
        """Calcula el promedio basado en las notas del alumno"""
        notas = Nota.objects.filter(
            alumno=self.alumno,
            materia=self.materia,
            semestre=self.semestre,
            ano=self.ano
        )
        
        if not notas.exists():
            self.promedio = None
            self.total_notas = 0
            self.notas_con_porcentaje = 0
            self.save()
            return
        
        total_puntos = 0
        total_porcentaje_usado = 0
        notas_sin_porcentaje = []
        notas_con_porcentaje = 0
        
        for nota in notas:
            if nota.porcentaje and nota.porcentaje > 0:
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
            
            if porcentaje_restante > 0:
                total_puntos += promedio_sin_porcentaje * (porcentaje_restante / 100)
            elif total_porcentaje_usado == 0:
                # Si no hay porcentajes, usar promedio simple
                total_puntos = promedio_sin_porcentaje
        
        self.promedio = round(total_puntos, 1) if total_puntos > 0 else None
        self.total_notas = notas.count()
        self.notas_con_porcentaje = notas_con_porcentaje
        self.save()
