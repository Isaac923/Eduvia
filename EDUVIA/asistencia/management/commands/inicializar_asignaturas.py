from django.core.management.base import BaseCommand
from django.db import transaction
from asistencia.models import Asignatura, AsignaturaCurso
from cursos.models import Curso

class Command(BaseCommand):
    help = 'Inicializa las asignaturas y cursos fijos del sistema'

    def handle(self, *args, **options):
        with transaction.atomic():
            # Crear asignaturas fijas
            asignaturas_data = [
                ('matematicas', 'Matemáticas'),
                ('lenguaje', 'Lenguaje'),
                ('ciencias', 'Ciencias'),
                ('historia', 'Historia'),
                ('ingles', 'Inglés'),
            ]
            
            for codigo, nombre in asignaturas_data:
                asignatura, created = Asignatura.objects.get_or_create(
                    nombre=codigo,
                    defaults={'activa': True}
                )
                if created:
                    self.stdout.write(f'Asignatura creada: {nombre}')
                else:
                    self.stdout.write(f'Asignatura ya existe: {nombre}')
            
            # Crear cursos fijos si no existen
            cursos_data = [
                (1, 'a'), (1, 'b'),
                (2, 'a'), (2, 'b'),
                (3, 'a'), (3, 'b'),
            ]
            
            for nivel, letra in cursos_data:
                curso, created = Curso.objects.get_or_create(
                    nivel=nivel,
                    letra=letra
                )
                if created:
                    self.stdout.write(f'Curso creado: {nivel}° {letra.upper()}')
                else:
                    self.stdout.write(f'Curso ya existe: {nivel}° {letra.upper()}')
            
            # Crear relaciones AsignaturaCurso para todas las combinaciones
            asignaturas = Asignatura.objects.all()
            cursos = Curso.objects.all()
            
            for asignatura in asignaturas:
                for curso in cursos:
                    asignatura_curso, created = AsignaturaCurso.objects.get_or_create(
                        asignatura=asignatura,
                        curso=curso,
                        defaults={'activa': True}
                    )
                    if created:
                        self.stdout.write(f'Relación creada: {asignatura} - {curso}')
            
            self.stdout.write(
                self.style.SUCCESS('Inicialización completada exitosamente')
            )