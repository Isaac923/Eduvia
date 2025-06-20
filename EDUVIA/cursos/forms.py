from django import forms
from .models import Curso
from alumnos.models import Alumno

class CursoForm(forms.ModelForm):
    nivel = forms.ChoiceField(
        choices=[('', 'Seleccione el nivel del curso')] + [(1, 'Nivel 1'), (2, 'Nivel 2'), (3, 'Nivel 3')],
        widget=forms.Select(attrs={'class': 'form-select'}),
        required=True
    )

    letra = forms.ChoiceField(
        choices=[('', 'Seleccione la jornada')] + [('a', 'Diurna (A)'), ('b', 'Vespertina (B)')],
        widget=forms.Select(attrs={'class': 'form-select'}),
        required=True
    )

    alumnos = forms.ModelMultipleChoiceField(
        queryset=Alumno.objects.filter(activo=True),
        widget=forms.SelectMultiple(attrs={'class': 'form-select', 'size': '10'}),
        required=False
    )

    class Meta:
        model = Curso
        fields = ('nivel', 'letra', 'alumnos')

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        # Personalizar el queryset para evitar errores
        try:
            # Si estamos editando un curso existente, filtrar alumnos por nivel
            if self.instance and self.instance.pk:
                nivel_str = f"{self.instance.nivel}{self.instance.letra.upper()}"
                self.fields['alumnos'].queryset = Alumno.objects.filter(
                    activo=True,
                    nivel=nivel_str
                )
            else:
                # Si estamos creando un curso nuevo, mostrar solo alumnos activos
                self.fields['alumnos'].queryset = Alumno.objects.filter(activo=True)
        except Exception as e:
            # En caso de error, usar un queryset vacío
            self.fields['alumnos'].queryset = Alumno.objects.none()

        # Personalizar labels
        self.fields['nivel'].label = "Nivel del curso"
        self.fields['letra'].label = "Jornada"
        self.fields['alumnos'].label = "Alumnos asignados"

    def clean(self):
        cleaned_data = super().clean()
        nivel = cleaned_data.get('nivel')
        letra = cleaned_data.get('letra')

        # Convertir nivel a entero si es una cadena
        if nivel and isinstance(nivel, str):
            try:
                cleaned_data['nivel'] = int(nivel)
                nivel = int(nivel)
            except ValueError:
                self.add_error('nivel', 'El nivel debe ser un número.')

        # Verificar si ya existe un curso con la misma combinación nivel-letra
        if nivel and letra:
            existing_curso = Curso.objects.filter(nivel=nivel, letra=letra)
            if self.instance and self.instance.pk:
                existing_curso = existing_curso.exclude(pk=self.instance.pk)
            if existing_curso.exists():
                self.add_error(
                    'letra',
                    f'Ya existe un curso con nivel {nivel} y letra {letra}. Por favor, seleccione una combinación diferente.'
                )

        return cleaned_data
