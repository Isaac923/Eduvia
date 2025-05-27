from datetime import date
from django.db import models

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
    id = models.AutoField(primary_key=True)  # N°Matricula
    fecha_ingreso = models.DateField(default=date.today)  # Fecha Matricula
    
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
    telefono = models.CharField(max_length=20)  # Teléfono de contacto
    correo_electronico = models.EmailField(max_length=100, blank=True, null=True)
    activo = models.BooleanField(default=True)
    # Datos académicos
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
    
    # Datos adicionales
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
    
    # Historial académico
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
    
    # Datos PIE
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
    
    # Contacto de emergencia
    contacto_emergencia_nombre = models.CharField(max_length=100, blank=True, null=True)
    contacto_emergencia_parentezco = models.CharField(max_length=50, blank=True, null=True)
    contacto_emergencia_telefono = models.CharField(max_length=20, blank=True, null=True)
    
    # Retiro del colegio
    fecha_retiro = models.DateField(blank=True, null=True)
    motivo_retiro = models.TextField(blank=True, null=True)
    
    # Relaciones
    apoderado = models.ForeignKey(Apoderado, on_delete=models.SET_NULL, null=True, blank=True)

    @property
    def nombre_completo(self):
        return f"{self.primer_nombre} {self.segundo_nombre or ''} {self.apellido_paterno} {self.apellido_materno}".strip()

    def __str__(self):
        return self.nombre_completo

    @property
    def edad(self):
        today = date.today()
        return today.year - self.fecha_nacimiento.year - (
            (today.month, today.day) < (self.fecha_nacimiento.month, self.fecha_nacimiento.day)
        )

    def save(self, *args, **kwargs):
        # Si es un nuevo alumno, asegurar que esté activo
        if not self.pk:
            self.activo = True
            
        # Lógica para determinar la jornada basada en el nivel
        if self.nivel.endswith('A'):
            self.jornada = 'diurna'
        elif self.nivel.endswith('B'):
            self.jornada = 'vespertina'
        super().save(*args, **kwargs)