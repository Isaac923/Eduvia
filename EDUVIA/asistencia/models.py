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
        ('estudios_sociales', 'Estudios Sociales'),
        ('formacion_instrumental', 'Formación Instrumental'),
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
    
    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
    
    def puede_ser_modificada_por(self, usuario):
        """Verifica si un usuario puede modificar asistencias de esta asignatura-curso"""
        if usuario.is_superuser:
            return True
        
        try:
            usuario_eduvia = Usuario.objects.get(rut=usuario.username)
            return usuario_eduvia.rol == 'profesor' and self.profesor == usuario_eduvia
        except Usuario.DoesNotExist:
            return False

class Asistencia(models.Model):
    ESTADO_CHOICES = [
        ('presente', 'Presente'),
        ('ausente', 'Ausente'),
        ('tardanza', 'Tardanza'),
        ('justificado', 'Justificado'),
    ]
    
    alumno = models.ForeignKey(Alumno, on_delete=models.CASCADE, related_name='asistencias')
    asignatura_curso = models.ForeignKey(AsignaturaCurso, on_delete=models.CASCADE, related_name='asistencias')
    ano_academico = models.ForeignKey('alumnos.AnoAcademico', on_delete=models.CASCADE)
    fecha = models.DateField(default=timezone.now)
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='presente')
    observaciones = models.TextField(blank=True, null=True)
    registrado_por = models.ForeignKey(Usuario, on_delete=models.SET_NULL, null=True, blank=True)
    fecha_registro = models.DateTimeField(auto_now_add=True)
    fecha_modificacion = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Asistencia'
        verbose_name_plural = 'Asistencias'
        unique_together = ['alumno', 'asignatura_curso', 'fecha', 'ano_academico']
        ordering = ['-fecha', 'alumno__apellido_paterno', 'alumno__apellido_materno']

    def __str__(self):
        return f"{self.alumno} - {self.asignatura_curso} - {self.fecha} - {self.estado}"
    
    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
    
    def fue_modificada(self):
        """Verifica si la asistencia fue modificada después de su creación"""
        return self.fecha_modificacion > self.fecha_registro
    
    def get_estado_display_with_icon(self):
        """Retorna el estado con su icono correspondiente"""
        icons = {
            'presente': 'fas fa-check text-success',
            'ausente': 'fas fa-times text-danger',
            'tardanza': 'fas fa-clock text-warning',
            'justificado': 'fas fa-file-medical text-info',
        }
        return {
            'estado': self.get_estado_display(),
            'icon': icons.get(self.estado, 'fas fa-question text-muted')
        }

class ResumenAsistencia(models.Model):
    """Modelo para almacenar resúmenes de asistencia por período"""
    alumno = models.ForeignKey(Alumno, on_delete=models.CASCADE, related_name='resumenes_asistencia')
    asignatura_curso = models.ForeignKey(AsignaturaCurso, on_delete=models.CASCADE)
    mes = models.PositiveIntegerField()  # 1-12
    anio = models.PositiveIntegerField()  # Agregamos el año directamente
    
    total_clases = models.PositiveIntegerField(default=0)
    presentes = models.PositiveIntegerField(default=0)
    ausentes = models.PositiveIntegerField(default=0)
    tardanzas = models.PositiveIntegerField(default=0)
    justificados = models.PositiveIntegerField(default=0)
    porcentaje_asistencia = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    
    fecha_calculo = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Resumen de Asistencia"
        verbose_name_plural = "Resúmenes de Asistencia"
        unique_together = ['alumno', 'asignatura_curso', 'mes', 'anio']
    
    def __str__(self):
        return f"{self.alumno} - {self.asignatura_curso} - {self.mes}/{self.anio}"

    def calcular_resumen_por_anio(self):
        """Calcula el resumen de asistencia para todo el año académico"""
        asistencias_anio = Asistencia.objects.filter(
            alumno=self.alumno,
            asignatura_curso=self.asignatura_curso,
            fecha__year=self.anio
        )
        
        self.total_clases = asistencias_anio.count()
        self.presentes = asistencias_anio.filter(estado='presente').count()
        self.ausentes = asistencias_anio.filter(estado='ausente').count()
        self.tardanzas = asistencias_anio.filter(estado='tardanza').count()
        self.justificados = asistencias_anio.filter(estado='justificado').count()
        
        if self.total_clases > 0:
            # Considerar presentes y tardanzas como asistencia
            asistencias_efectivas = self.presentes + self.tardanzas
            self.porcentaje_asistencia = round((asistencias_efectivas / self.total_clases) * 100, 2)
        else:
            self.porcentaje_asistencia = 0.00
        
        self.save()
        return self.porcentaje_asistencia
