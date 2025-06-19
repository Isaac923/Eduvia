from decimal import Decimal
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from datetime import datetime
from alumnos.models import Alumno, AnoAcademico

class Nota(models.Model):
    # CORREGIDO: Usar exactamente las mismas opciones que ASIGNATURA_CHOICES en Usuario
    ASIGNATURA_CHOICES = [
        ('matematicas', 'Matemáticas'),
        ('lenguaje', 'Lenguaje y Comunicación'),
        ('ciencias', 'Ciencias Naturales'),
        ('historia', 'Historia y Geografía'),
        ('ingles', 'Inglés'),
        ('estudios_sociales', 'Estudios Sociales'),
        ('f_instrumental', 'F. Instrumental'),
    ]
    
    SEMESTRE_CHOICES = [
        (1, 'Primer Semestre'),
        (2, 'Segundo Semestre'),
    ]
    
    alumno = models.ForeignKey(Alumno, on_delete=models.CASCADE)
    materia = models.CharField(max_length=20, choices=ASIGNATURA_CHOICES)  # Usar ASIGNATURA_CHOICES
    semestre = models.IntegerField(choices=[(1, '1° Semestre'), (2, '2° Semestre')])
    numero_nota = models.IntegerField(choices=[(i, f'Nota {i}') for i in range(1, 7)])
    calificacion = models.DecimalField(max_digits=3, decimal_places=1)
    porcentaje = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True, default=None)
    fecha_evaluacion = models.DateField()
    observaciones = models.TextField(blank=True, null=True)
    ano_academico = models.ForeignKey(AnoAcademico, on_delete=models.CASCADE, default=None, null=True)
    ano = models.IntegerField(null=True, blank=True)  # Mantener por compatibilidad
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_modificacion = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['alumno', 'materia', 'semestre', 'numero_nota', 'ano']
        ordering = ['ano', 'semestre', 'materia', 'numero_nota']
        verbose_name = 'Nota'
        verbose_name_plural = 'Notas'
        indexes = [
            models.Index(fields=['alumno', 'materia', 'semestre', 'ano']),
            models.Index(fields=['ano', 'semestre']),
            models.Index(fields=['ano_academico']),
        ]
    
    def __str__(self):
        return f"{self.alumno.nombre_completo} - {self.get_materia_display()} - Nota {self.numero_nota} ({self.ano})"
    
    def save(self, *args, **kwargs):
        # Si no se especifica año académico, usar el activo
        if not self.ano_academico_id:
            self.ano_academico = AnoAcademico.get_ano_activo()
    
        # Asegurar que el campo ano siempre tenga un valor
        if not self.ano and self.ano_academico:
            self.ano = self.ano_academico.ano
        elif not self.ano:
            # Fallback si no hay año académico
            ano_activo = AnoAcademico.get_ano_activo()
            self.ano = ano_activo.ano
            if not self.ano_academico:
                self.ano_academico = ano_activo
    
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
                ano=self.ano,
                ano_academico=self.ano_academico
            )
            promedio_obj.calcular_promedio()
        except Exception as e:
            print(f"Error al actualizar promedio: {e}")

class PromedioMateria(models.Model):
    """Modelo para almacenar los promedios calculados por materia"""
    alumno = models.ForeignKey(Alumno, on_delete=models.CASCADE, related_name='promedios')
    materia = models.CharField(max_length=50, choices=Nota.ASIGNATURA_CHOICES)  # Usar ASIGNATURA_CHOICES
    semestre = models.IntegerField(choices=Nota.SEMESTRE_CHOICES)
    ano_academico = models.ForeignKey(AnoAcademico, on_delete=models.CASCADE, default=None, null=True)
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
    
    def save(self, *args, **kwargs):
        # Si no se especifica año académico, usar el activo
        if not self.ano_academico_id:
            self.ano_academico = AnoAcademico.get_ano_activo()
            self.ano = self.ano_academico.ano
        super().save(*args, **kwargs)
    
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
