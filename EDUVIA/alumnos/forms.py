from django import forms
from django.utils.timezone import localdate
from .models import Alumno
from django.conf import settings

class AlumnoCreationForm(forms.ModelForm):
    SEXO_CHOICES = [('M', 'Masculino'), ('F', 'Femenino')]
    RELIGION_CHOICES = [
        ('Católica', 'Católica'),
        ('Evangelica', 'Evangelica'),
        ('Cristiana', 'Cristiana'),
        ('Musulman', 'Musulman'),
        ('Judia', 'Judia'),
        ('Mormona', 'Mormona'),
        ('Otras', 'Otras'),
        ('Ninguna', 'Ninguna'),
    ]
    TELEFONO_PREFIX = '+569'

    NUMERO_CHOICES = [('1', '1'), ('2', '2'), ('3', '3')]
    LETRA_CHOICES = [('A', 'A'), ('B', 'B')]
    
    ESTADO_CIVIL_CHOICES = [
        ('Casado', 'Casado'),
        ('Soltero', 'Soltero'),
        ('Convive', 'Convive'),
        ('Unión Civil', 'Unión Civil')
    ]
    
    CURSO_CHOICES = [
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
    ]
    
    CURSO_REPETIDO_CHOICES = [('Ninguno', 'Ninguno')] + CURSO_CHOICES
    
    SI_NO_CHOICES = [('Si', 'Si'), ('No', 'No')]
    
    PROFESIONAL_CHOICES = [
        ('Ninguno', 'Ninguno'),
        ('Psicologo', 'Psicologo'),
        ('Educador Diferencial', 'Educador Diferencial'),
        ('Fonoaudiologo', 'Fonoaudiologo'),
        ('Psicopedagogo', 'Psicopedagogo'),
    ]
    
    SITUACION_LABORAL_CHOICES = [
        ('Desempleado', 'Desempleado'),
        ('Dependiente', 'Dependiente'),
        ('Independiente', 'Independiente'),
        ('Temporada', 'Temporada'),
    ]

    # Datos de matrícula
    fecha_ingreso = forms.DateField(
        widget=forms.DateInput(
            attrs={'class': 'form-control', 'type': 'date'},
            format='%Y-%m-%d'
        ),
        input_formats=['%Y-%m-%d'],
        initial=localdate,
        label='Fecha de Matrícula'
    )
    
    # Datos personales
    primer_nombre = forms.CharField(
        max_length=50,
        widget=forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Ej: Juan'})
    )
    segundo_nombre = forms.CharField(
        max_length=50,
        required=False,
        widget=forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Ej: Antonio'})
    )
    apellido_paterno = forms.CharField(
        max_length=50,
        widget=forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Ej: Pérez'})
    )
    apellido_materno = forms.CharField(
        max_length=50,
        widget=forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Ej: González'})
    )
    rut = forms.CharField(
        max_length=12,
        widget=forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Ej: 12345678-9'})
    )
    fecha_nacimiento = forms.DateField(
        widget=forms.DateInput(
            attrs={'class': 'form-control', 'type': 'date'},
            format='%Y-%m-%d'
        ),
        input_formats=['%Y-%m-%d']
    )
    sexo = forms.ChoiceField(
        choices=SEXO_CHOICES,
        widget=forms.Select(attrs={'class': 'form-control'})
    )
    direccion = forms.CharField(
        widget=forms.Textarea(attrs={'class': 'form-control', 'rows': 3, 'placeholder': 'Ej: Calle Falsa 123, Santiago'})
    )
    telefono = forms.CharField(
        max_length=20,
        widget=forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Ej: +56912345678'})
    )
    correo_electronico = forms.EmailField(
        max_length=100,
        required=False,
        widget=forms.EmailInput(attrs={'class': 'form-control', 'placeholder': 'Ej: juan.perez@email.com'})
    )
    
    # Datos académicos
    numero_nivel = forms.ChoiceField(
        choices=NUMERO_CHOICES,
        widget=forms.Select(attrs={'class': 'form-control'}),
        label='Nivel'
    )
    letra_nivel = forms.ChoiceField(
        choices=LETRA_CHOICES,
        widget=forms.Select(attrs={'class': 'form-control'}),
        label='Jornada'
    )
    
    # Datos adicionales
    estado_civil = forms.ChoiceField(
        choices=ESTADO_CIVIL_CHOICES,
        widget=forms.Select(attrs={'class': 'form-control'})
    )
    religion = forms.ChoiceField(
        choices=RELIGION_CHOICES,
        widget=forms.Select(attrs={'class': 'form-control'}),
        initial='Ninguna'
    )
    
    # Historial académico
    ultimo_curso_aprobado = forms.ChoiceField(
        choices=CURSO_CHOICES,
        widget=forms.Select(attrs={'class': 'form-control'}),
        required=False
    )
    curso_repetido = forms.ChoiceField(
        choices=CURSO_REPETIDO_CHOICES,
        widget=forms.Select(attrs={'class': 'form-control'}),
        initial='Ninguno'
    )
    anio_repitencia = forms.IntegerField(
        required=False,
        widget=forms.NumberInput(attrs={'class': 'form-control', 'placeholder': 'Ej: 2022'})
    )
    
    # Datos PIE
    programa_pie = forms.ChoiceField(
        choices=SI_NO_CHOICES,
        widget=forms.Select(attrs={'class': 'form-control'}),
        label='¿Ha estado en programa PIE?',
        initial='No'
    )
    profesional_apoyo = forms.ChoiceField(
        choices=PROFESIONAL_CHOICES,
        widget=forms.Select(attrs={'class': 'form-control'}),
        label='¿Qué profesional te ayudó en la sala de clases?',
        initial='Ninguno',
        required=False
    )
    informe_psicosocial = forms.ChoiceField(
        choices=SI_NO_CHOICES,
        widget=forms.Select(attrs={'class': 'form-control'}),
        label='¿Cuenta con informe psicosocial?',
        initial='No'
    )
    situacion_laboral = forms.ChoiceField(
        choices=SITUACION_LABORAL_CHOICES,
        widget=forms.Select(attrs={'class': 'form-control'}),
        initial='Desempleado'
    )
    
    # Contacto de emergencia
    contacto_emergencia_nombre = forms.CharField(
        max_length=100,
        required=False,
        widget=forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Ej: María Pérez'})
    )
    contacto_emergencia_parentezco = forms.CharField(
        max_length=50,
        required=False,
        widget=forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Ej: Madre'})
    )
    contacto_emergencia_telefono = forms.CharField(
        max_length=20,
        required=False,
        widget=forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Ej: +56912345678'})
    )

    # Asegurarnos de que el campo activo esté incluido en el formulario
    activo = forms.BooleanField(required=False, initial=True, label="Alumno Activo")

    class Meta:
        model = Alumno
        exclude = ['jornada', 'nivel', 'apoderado', 'fecha_retiro', 'motivo_retiro']
        # No excluimos 'activo' para que se pueda editar

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        # Forzar fechas a formato correcto para input tipo date
        if self.instance and self.instance.pk:
            if self.instance.fecha_nacimiento:
                self.fields['fecha_nacimiento'].initial = self.instance.fecha_nacimiento.strftime('%Y-%m-%d')
            if self.instance.fecha_ingreso:
                self.fields['fecha_ingreso'].initial = self.instance.fecha_ingreso.strftime('%Y-%m-%d')

        # Si estamos editando un alumno existente, establecer el valor inicial de activo
        if self.instance and self.instance.pk:
            self.fields['activo'].initial = self.instance.activo

        # Ordenar los campos para una mejor presentación en el formulario
        self.order_fields([
            # Datos de matrícula
            'fecha_ingreso',
            
            # Datos personales
            'primer_nombre',
            'segundo_nombre',
            'apellido_paterno',
            'apellido_materno',
            'rut',
            'fecha_nacimiento',
            'sexo',
            'direccion',
            'telefono',
            'correo_electronico',
            'estado_civil',
            'religion',
            
            # Datos académicos
            'numero_nivel',
            'letra_nivel',
            'ultimo_curso_aprobado',
            'curso_repetido',
            'anio_repitencia',
            
            # Datos PIE
            'programa_pie',
            'profesional_apoyo',
            'informe_psicosocial',
            'situacion_laboral',
            
            # Contacto de emergencia
            'contacto_emergencia_nombre',
            'contacto_emergencia_parentezco',
            'contacto_emergencia_telefono',
        ])

        self.fields['telefono'].widget.attrs.update({
            'pattern': '^' + self.TELEFONO_PREFIX + r'\d{8}$',
            'title': 'Ingrese un teléfono válido comenzando con +569'
        })
        
        self.fields['contacto_emergencia_telefono'].widget.attrs.update({
            'pattern': '^' + self.TELEFONO_PREFIX + r'\d{8}$',
            'title': 'Ingrese un teléfono válido comenzando con +569'
        })

        # Prellenar nivel si se está editando
        if self.instance and self.instance.pk:
            if self.instance.nivel:
                self.fields['numero_nivel'].initial = self.instance.nivel[0]
                self.fields['letra_nivel'].initial = self.instance.nivel[1]

    def clean_telefono(self):
        telefono = self.cleaned_data.get('telefono')
        if telefono and not telefono.startswith(self.TELEFONO_PREFIX):
            raise forms.ValidationError('El teléfono debe comenzar con ' + self.TELEFONO_PREFIX)
        return telefono
        
    def clean_contacto_emergencia_telefono(self):
        telefono = self.cleaned_data.get('contacto_emergencia_telefono')
        if telefono and not telefono.startswith(self.TELEFONO_PREFIX):
            raise forms.ValidationError('El teléfono debe comenzar con ' + self.TELEFONO_PREFIX)
        return telefono

    def clean(self):
        cleaned_data = super().clean()
        numero = cleaned_data.get('numero_nivel')
        letra = cleaned_data.get('letra_nivel')
        if numero and letra:
            cleaned_data['nivel'] = f'{numero}{letra}'
            
        # Validar que si curso_repetido no es 'Ninguno', anio_repitencia debe tener valor
        curso_repetido = cleaned_data.get('curso_repetido')
        anio_repitencia = cleaned_data.get('anio_repitencia')
        
        if curso_repetido and curso_repetido != 'Ninguno' and not anio_repitencia:
            self.add_error('anio_repitencia', 'Si seleccionó un curso repetido, debe indicar el año de repitencia')
            
        return cleaned_data

    def save(self, commit=True):
        instance = super().save(commit=False)
        instance.nivel = self.cleaned_data['nivel']
        if commit:
            instance.save()
        return instance