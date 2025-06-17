from django.core.management.base import BaseCommand
from django.utils import timezone
from alumnos.models import AnoAcademico, Alumno, AlumnoAno

class Command(BaseCommand):
    help = 'Inicializa los años académicos y migra los alumnos existentes'

    def add_arguments(self, parser):
        parser.add_argument(
            '--ano-inicial',
            type=int,
            default=2025,
            help='Año académico inicial (por defecto: 2025)'
        )

    def handle(self, *args, **options):
        ano_inicial = options['ano_inicial']
        
        self.stdout.write(f'Inicializando años académicos desde {ano_inicial}...')
        
        # Crear año académico inicial si no existe
        ano_obj, created = AnoAcademico.objects.get_or_create(
            ano=ano_inicial,
            defaults={'activo': True}
        )
        
        if created:
            self.stdout.write(
                self.style.SUCCESS(f'Año académico {ano_inicial} creado como activo')
            )
        else:
            # Asegurar que sea el único activo
            AnoAcademico.objects.exclude(pk=ano_obj.pk).update(activo=False)
            ano_obj.activo = True
            ano_obj.save()
            self.stdout.write(
                self.style.SUCCESS(f'Año académico {ano_inicial} establecido como activo')
            )
        
        # Migrar alumnos existentes que no tengan registro en AlumnoAno
        alumnos_sin_ano = Alumno.objects.exclude(
            anos_academicos__ano_academico=ano_obj
        )
        
        count = 0
        for alumno in alumnos_sin_ano:
            AlumnoAno.objects.create(
                alumno=alumno,
                ano_academico=ano_obj,
                nivel=alumno.nivel,
                jornada=alumno.jornada,
                activo=alumno.activo
            )
            count += 1
        
        if count > 0:
            self.stdout.write(
                self.style.SUCCESS(f'{count} alumnos migrados al año académico {ano_inicial}')
            )
        else:
            self.stdout.write('No hay alumnos para migrar')
        
        self.stdout.write(
            self.style.SUCCESS('Inicialización completada exitosamente')
        )