from datetime import date
from django.db import models
from django.core.validators import MinValueValidator

class AnoAcademico(models.Model):
    """Modelo para gestionar los años académicos"""
    ano = models.IntegerField(unique=True, validators=[MinValueValidator(2025)])
    activo = models.BooleanField(default=False)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-ano']
        verbose_name = 'Año Académico'
        verbose_name_plural = 'Años Académicos'
    
    def __str__(self):
        return f"Año {self.ano}" + (" (Activo)" if self.activo else "")
    
    def save(self, *args, **kwargs):
        if self.activo:
            # Si se marca como activo, desactivar todos los demás
            AnoAcademico.objects.exclude(pk=self.pk).update(activo=False)
        super().save(*args, **kwargs)
    
    @classmethod
    def get_ano_activo(cls):
        """Obtiene el año académico activo"""
        return cls.objects.filter(activo=True).first()
    
    @property
    def es_bloqueado(self):
        """Determina si el año está bloqueado (no es el año activo)"""
        ano_activo = AnoAcademico.get_ano_activo()
        return ano_activo and self.pk != ano_activo.pk
    
    @property
    def permite_edicion(self):
        """Determina si se permite edición en este año"""
        return self.activo

class AlumnoAno(models.Model):
    """Relación entre alumno y año académico"""
    alumno = models.ForeignKey('Alumno', on_delete=models.CASCADE, related_name='anos_academicos')
    ano_academico = models.ForeignKey(AnoAcademico, on_delete=models.CASCADE, related_name='alumnos')
    nivel = models.CharField(
        max_length=2,
        choices=[
            ('1A', '1A'), ('1B', '1B'),
            ('2A', '2A'), ('2B', '2B'),
            ('3A', '3A'), ('3B', '3B')
        ]
    )
    jornada = models.CharField(
        max_length=10,
        choices=[('diurna', 'Diurna'), ('vespertina', 'Vespertina')]
    )
    activo = models.BooleanField(default=True)
    fecha_matricula = models.DateField(default=date.today)
    
    class Meta:
        unique_together = ['alumno', 'ano_academico']
        verbose_name = 'Alumno por Año'
        verbose_name_plural = 'Alumnos por Año'
    
    def __str__(self):
        return f"{self.alumno.nombre_completo} - {self.ano_academico.ano}"
    
    def save(self, *args, **kwargs):
        # Actualizar jornada basada en el nivel
        if self.nivel.endswith('A'):
            self.jornada = 'diurna'
        elif self.nivel.endswith('B'):
            self.jornada = 'vespertina'
        
        super().save(*args, **kwargs)
        
        # Sincronizar con el modelo Alumno para compatibilidad
        self.alumno.nivel = self.nivel
        self.alumno.jornada = self.jornada
        # Usar update para evitar recursión
        Alumno.objects.filter(pk=self.alumno.pk).update(
            nivel=self.nivel,
            jornada=self.jornada
        )
        
        # Actualizar cursos automáticamente
        self._actualizar_cursos()
    
    def _actualizar_cursos(self):
        """Actualiza los cursos relacionados con este alumno"""
        from cursos.models import Curso
        
        # Obtener el curso correspondiente
        nivel_num = int(self.nivel[0])  # Extraer el número del nivel (1, 2, 3)
        letra = self.nivel[1].lower()   # Extraer la letra (a, b)
        
        try:
            curso = Curso.objects.get(nivel=nivel_num, letra=letra)
            
            # Si el alumno está activo, agregarlo al curso
            if self.activo:
                curso.alumnos.add(self.alumno)
            else:
                curso.alumnos.remove(self.alumno)
                
        except Curso.DoesNotExist:
            pass  # El curso no existe, no hacer nada

class Apoderado(models.Model):
    es_institucion = models.BooleanField(default=False)
    nombre = models.CharField(max_length=100)
    parentezco = models.CharField(max_length=100)
    telefono = models.CharField(max_length=20, blank=False, null=False)
    correo = models.EmailField(blank=True, null=True)
    direccion = models.TextField(blank=True, null=True)
    
    def __str__(self):
        return self.nombre

class Alumno(models.Model):
    # Datos de matrícula
    id = models.AutoField(primary_key=True)
    fecha_ingreso = models.DateField(default=date.today)
    
    # Datos personales
    primer_nombre = models.CharField(max_length=50, default='')
    segundo_nombre = models.CharField(max_length=50, blank=True, null=True)
    apellido_paterno = models.CharField(max_length=50, default='')
    apellido_materno = models.CharField(max_length=50, default='')
    rut = models.CharField(max_length=12, unique=True, blank=False, null=False)
    fecha_nacimiento = models.DateField()
    sexo = models.CharField(
        max_length=1,
        choices=[('M', 'Masculino'), ('F', 'Femenino')]
    )
    direccion = models.TextField(max_length=200)
    telefono = models.CharField(max_length=20)
    correo_electronico = models.EmailField(max_length=100, blank=True, null=True)
    activo = models.BooleanField(default=True)
    
    # Datos académicos (mantener para compatibilidad)
    nivel = models.CharField(
        max_length=2,
        choices=[
            ('1A', '1A'), ('1B', '1B'),
            ('2A', '2A'), ('2B', '2B'),
            ('3A', '3A'), ('3B', '3B')
        ]
    )
    jornada = models.CharField(
        max_length=10,
        choices=[('diurna', 'Diurna'), ('vespertina', 'Vespertina')],
        blank=True,
        null=True
    )
    
    # Resto de campos igual...
    estado_civil = models.CharField(
        max_length=15,
        choices=[
            ('Casado', 'Casado'),
            ('Soltero', 'Soltero'),
            ('Convive', 'Convive'),
            ('Unión Civil', 'Unión Civil')
        ],
        default='Soltero'
    )
    religion = models.CharField(
        max_length=50,
        choices=[
            ('Católica', 'Católica'),
            ('Evangelica', 'Evangelica'),
            ('Cristiana', 'Cristiana'),
            ('Musulman', 'Musulman'),
            ('Judia', 'Judia'),
            ('Mormona', 'Mormona'),
            ('Otras', 'Otras'),
            ('Ninguna', 'Ninguna'),
        ],
        default='Ninguna'
    )
    
    ultimo_curso_aprobado = models.CharField(
        max_length=20,
        choices=[
            ('1ro Basico', '1ro Basico'),
            ('2do Basico', '2do Basico'),
            ('3ro Basico', '3ro Basico'),
            ('4to Basico', '4to Basico'),
            ('5to Basico', '5to Basico'),
            ('6to Basico', '6to Basico'),
            ('7mo Basico', '7mo Basico'),
            ('8vo Basico', '8vo Basico'),
            ('1ro Medio', '1ro Medio'),
            ('2do Medio', '2do Medio'),
            ('3ro Medio', '3ro Medio'),
            ('4to Medio', '4to Medio'),
        ],
        blank=True,
        null=True
    )
    curso_repetido = models.CharField(
        max_length=20,
        choices=[
            ('Ninguno', 'Ninguno'),
            ('1ro Basico', '1ro Basico'),
            ('2do Basico', '2do Basico'),
            ('3ro Basico', '3ro Basico'),
            ('4to Basico', '4to Basico'),
            ('5to Basico', '5to Basico'),
            ('6to Basico', '6to Basico'),
            ('7mo Basico', '7mo Basico'),
            ('8vo Basico', '8vo Basico'),
            ('1ro Medio', '1ro Medio'),
            ('2do Medio', '2do Medio'),
            ('3ro Medio', '3ro Medio'),
            ('4to Medio', '4to Medio'),
        ],
        default='Ninguno'
    )
    anio_repitencia = models.PositiveIntegerField(blank=True, null=True)
    
    programa_pie = models.CharField(
        max_length=2,
        choices=[('Si', 'Si'), ('No', 'No')],
        default='No'
    )
    profesional_apoyo = models.CharField(
        max_length=20,
        choices=[
            ('Ninguno', 'Ninguno'),
            ('Psicologo', 'Psicologo'),
            ('Educador Diferencial', 'Educador Diferencial'),
            ('Fonoaudiologo', 'Fonoaudiologo'),
            ('Psicopedagogo', 'Psicopedagogo'),
        ],
        default='Ninguno',
        blank=True,
        null=True
    )
    informe_psicosocial = models.CharField(
        max_length=2,
        choices=[('Si', 'Si'), ('No', 'No')],
        default='No'
    )
    situacion_laboral = models.CharField(
        max_length=15,
        choices=[
            ('Desempleado', 'Desempleado'),
            ('Dependiente', 'Dependiente'),
            ('Independiente', 'Independiente'),
            ('Temporada', 'Temporada'),
        ],
        default='Desempleado'
    )
    
    contacto_emergencia_nombre = models.CharField(max_length=100, blank=True, null=True)
    contacto_emergencia_parentezco = models.CharField(max_length=50, blank=True, null=True)
    contacto_emergencia_telefono = models.CharField(max_length=20, blank=True, null=True)
    
    fecha_retiro = models.DateField(blank=True, null=True)
    motivo_retiro = models.TextField(blank=True, null=True)
    
    apoderado = models.ForeignKey(Apoderado, on_delete=models.SET_NULL, null=True, blank=True)

    @property
    def nombre_completo(self):
        nombres = []
        if self.primer_nombre:
            nombres.append(self.primer_nombre)
        if self.segundo_nombre:
            nombres.append(self.segundo_nombre)
        if self.apellido_paterno:
            nombres.append(self.apellido_paterno)
        if self.apellido_materno:
            nombres.append(self.apellido_materno)
        return ' '.join(nombres)
    
    @property
    def edad(self):
        today = date.today()
        return today.year - self.fecha_nacimiento.year - (
            (today.month, today.day) < (self.fecha_nacimiento.month, self.fecha_nacimiento.day)
        )

    def __str__(self):
        return self.nombre_completo

    def save(self, *args, **kwargs):
        if not self.pk:
            self.activo = True
            
        if self.nivel.endswith('A'):
            self.jornada = 'diurna'
        elif self.nivel.endswith('B'):
            self.jornada = 'vespertina'
            
        super().save(*args, **kwargs)
        
        # Sincronizar con AlumnoAno para el año activo usando get_or_create
        ano_activo = AnoAcademico.get_ano_activo()
        if ano_activo:
            alumno_ano, created = AlumnoAno.objects.get_or_create(
                alumno=self,
                ano_academico=ano_activo,
                defaults={
                    'nivel': self.nivel,
                    'jornada': self.jornada,
                    'activo': self.activo
                }
            )
            
            # Si ya existía, actualizar los datos
            if not created:
                alumno_ano.nivel = self.nivel
                alumno_ano.jornada = self.jornada
                alumno_ano.save()  # Esto disparará la actualización de cursos