from django.core.management.base import BaseCommand
from django.db import transaction
from alumnos.models import Alumno, AnoAcademico, AlumnoAno

class Command(BaseCommand):
    help = 'Transfiere todos los alumnos al año académico actual'

    def add_arguments(self, parser):
        parser.add_argument(
            '--ano',
            type=int,
            help='Año académico específico (opcional, por defecto usa el año activo)',
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Simula la transferencia sin realizar cambios',
        )
        parser.add_argument(
            '--estado',
            choices=['activo', 'inactivo', 'mantener'],
            default='mantener',
            help='Estado de los alumnos transferidos (por defecto mantiene el estado actual)',
        )

    def handle(self, *args, **options):
        # Obtener el año académico objetivo
        if options['ano']:
            try:
                ano_objetivo = AnoAcademico.objects.get(ano=options['ano'])
            except AnoAcademico.DoesNotExist:
                self.stdout.write(
                    self.style.ERROR(f'El año académico {options["ano"]} no existe')
                )
                return
        else:
            ano_objetivo = AnoAcademico.get_ano_activo()
            if not ano_objetivo:
                self.stdout.write(
                    self.style.ERROR('No hay un año académico activo definido')
                )
                return

        # Obtener todos los alumnos
        alumnos = Alumno.objects.all()
        
        if not alumnos.exists():
            self.stdout.write(
                self.style.WARNING('No hay alumnos para transferir')
            )
            return

        self.stdout.write(
            self.style.SUCCESS(f'Iniciando transferencia al año académico {ano_objetivo.ano}')
        )
        self.stdout.write(f'Total de alumnos a procesar: {alumnos.count()}')

        if options['dry_run']:
            self.stdout.write(
                self.style.WARNING('MODO SIMULACIÓN - No se realizarán cambios reales')
            )

        transferidos = 0
        actualizados = 0
        errores = 0

        with transaction.atomic():
            for alumno in alumnos:
                try:
                    # Determinar el estado del alumno
                    if options['estado'] == 'activo':
                        estado_alumno = True
                    elif options['estado'] == 'inactivo':
                        estado_alumno = False
                    else:  # mantener
                        estado_alumno = alumno.activo

                    # Verificar si ya existe la relación
                    alumno_ano, created = AlumnoAno.objects.get_or_create(
                        alumno=alumno,
                        ano_academico=ano_objetivo,
                        defaults={
                            'nivel': alumno.nivel,
                            'jornada': alumno.jornada,
                            'activo': estado_alumno
                        }
                    )

                    if not options['dry_run']:
                        if created:
                            transferidos += 1
                            self.stdout.write(
                                f'✓ Transferido: {alumno.nombre_completo} - {alumno.nivel}'
                            )
                        else:
                            # Actualizar datos existentes
                            alumno_ano.nivel = alumno.nivel
                            alumno_ano.jornada = alumno.jornada
                            alumno_ano.activo = estado_alumno
                            alumno_ano.save()
                            actualizados += 1
                            self.stdout.write(
                                f'↻ Actualizado: {alumno.nombre_completo} - {alumno.nivel}'
                            )
                    else:
                        if created:
                            transferidos += 1
                            self.stdout.write(
                                f'[SIMULACIÓN] ✓ Se transferiría: {alumno.nombre_completo} - {alumno.nivel}'
                            )
                        else:
                            actualizados += 1
                            self.stdout.write(
                                f'[SIMULACIÓN] ↻ Se actualizaría: {alumno.nombre_completo} - {alumno.nivel}'
                            )

                except Exception as e:
                    errores += 1
                    self.stdout.write(
                        self.style.ERROR(f'✗ Error con {alumno.nombre_completo}: {str(e)}')
                    )

        # Resumen final
        self.stdout.write('\n' + '='*50)
        self.stdout.write(self.style.SUCCESS('RESUMEN DE LA TRANSFERENCIA'))
        self.stdout.write('='*50)
        self.stdout.write(f'Año académico objetivo: {ano_objetivo.ano}')
        self.stdout.write(f'Alumnos transferidos: {transferidos}')
        self.stdout.write(f'Alumnos actualizados: {actualizados}')
        self.stdout.write(f'Errores: {errores}')
        self.stdout.write(f'Total procesados: {transferidos + actualizados + errores}')
        
        if options['dry_run']:
            self.stdout.write(
                self.style.WARNING('\nEsto fue una simulación. Para ejecutar realmente, omite --dry-run')
            )
        else:
            self.stdout.write(
                self.style.SUCCESS('\n¡Transferencia completada exitosamente!')
            )