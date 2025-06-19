from django.core.management.base import BaseCommand
from cursos.models import Curso
from alumnos.models import AnoAcademico

class Command(BaseCommand):
    help = 'Sincroniza automáticamente todos los cursos con sus alumnos correspondientes'

    def add_arguments(self, parser):
        parser.add_argument(
            '--ano',
            type=int,
            help='Año académico específico a sincronizar (opcional)',
        )

    def handle(self, *args, **options):
        ano_especifico = options.get('ano')
        
        if ano_especifico:
            try:
                ano_academico = AnoAcademico.objects.get(ano=ano_especifico)
                self.stdout.write(f'Sincronizando cursos para el año {ano_especifico}...')
            except AnoAcademico.DoesNotExist:
                self.stdout.write(
                    self.style.ERROR(f'El año académico {ano_especifico} no existe')
                )
                return
        else:
            ano_academico = AnoAcademico.get_ano_activo()
            if not ano_academico:
                self.stdout.write(
                    self.style.ERROR('No hay año académico activo')
                )
                return
            self.stdout.write(f'Sincronizando cursos para el año activo {ano_academico.ano}...')

        cursos = Curso.objects.all()
        total_cursos = cursos.count()
        
        for i, curso in enumerate(cursos, 1):
            self.stdout.write(f'Procesando curso {curso} ({i}/{total_cursos})...')
            
            # Contar alumnos antes
            alumnos_antes = curso.alumnos.count()
            
            # Actualizar automáticamente
            curso.actualizar_alumnos_automaticamente(ano_academico)
            
            # Contar alumnos después
            alumnos_despues = curso.alumnos.count()
            
            self.stdout.write(
                f'  - Curso {curso}: {alumnos_antes} → {alumnos_despues} alumnos'
            )
        
        self.stdout.write(
            self.style.SUCCESS(f'Sincronización completada para {total_cursos} cursos')
        )