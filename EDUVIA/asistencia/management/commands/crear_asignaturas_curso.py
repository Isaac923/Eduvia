from django.core.management.base import BaseCommand
from asistencia.models import AsignaturaCurso, Asignatura
from cursos.models import Curso
from usuarios.models import Usuario

class Command(BaseCommand):
    help = 'Crea relaciones AsignaturaCurso para todas las combinaciones'

    def handle(self, *args, **options):
        asignaturas = Asignatura.objects.all()
        cursos = Curso.objects.all()
        
        relaciones_creadas = 0
        
        for curso in cursos:
            for asignatura in asignaturas:
                asignatura_curso, created = AsignaturaCurso.objects.get_or_create(
                    asignatura=asignatura,
                    curso=curso,
                    defaults={
                        'activa': True,
                        'profesor': None
                    }
                )
                
                if created:
                    relaciones_creadas += 1
                    self.stdout.write(
                        self.style.SUCCESS(
                            f'Creada: {asignatura.get_nombre_display()} - {curso}'
                        )
                    )
        
        self.stdout.write(
            self.style.SUCCESS(
                f'Proceso completado. {relaciones_creadas} relaciones creadas.'
            )
        )