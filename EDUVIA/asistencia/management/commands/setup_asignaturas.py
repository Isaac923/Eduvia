from django.core.management.base import BaseCommand
from asistencia.models import Asignatura, AsignaturaCurso
from cursos.models import Curso
from usuarios.models import Usuario

class Command(BaseCommand):
    help = 'Configura las asignaturas básicas del sistema'

    def handle(self, *args, **options):
        self.stdout.write('Iniciando configuración de asignaturas...')
        
        # Crear las asignaturas básicas
        asignaturas_data = [
            ('matematicas', 'Matemáticas'),
            ('lenguaje', 'Lenguaje y Comunicación'),
            ('ciencias', 'Ciencias Naturales'),
            ('historia', 'Historia y Geografía'),
            ('ingles', 'Inglés'),
        ]

        for codigo, nombre in asignaturas_data:
            asignatura, created = Asignatura.objects.get_or_create(
                nombre=codigo,
                defaults={'descripcion': f'Asignatura de {nombre}'}
            )
            if created:
                self.stdout.write(
                    self.style.SUCCESS(f'Asignatura {nombre} creada')
                )
            else:
                self.stdout.write(f'Asignatura {nombre} ya existe')

        # Asignar asignaturas a cursos
        cursos = Curso.objects.all()
        asignaturas = Asignatura.objects.all()
        
        if not cursos.exists():
            self.stdout.write(
                self.style.WARNING('No hay cursos en el sistema. Crea cursos primero.')
            )
            return

        for curso in cursos:
            for asignatura in asignaturas:
                asignatura_curso, created = AsignaturaCurso.objects.get_or_create(
                    asignatura=asignatura,
                    curso=curso
                )
                if created:
                    self.stdout.write(f'Asignado {asignatura} a {curso}')

        # Asignar profesores a asignaturas según su especialidad
        profesores = Usuario.objects.filter(rol='profesor')
        
        for profesor in profesores:
            if profesor.funcion:  # La función contiene la especialidad
                try:
                    asignatura = Asignatura.objects.get(nombre=profesor.funcion)
                    # Asignar profesor a todas las asignaturas-curso de su especialidad
                    asignaturas_curso = AsignaturaCurso.objects.filter(
                        asignatura=asignatura,
                        profesor__isnull=True
                    )
                    
                    for ac in asignaturas_curso:
                        ac.profesor = profesor
                        ac.save()
                        self.stdout.write(f'Profesor {profesor.nombre_completo()} asignado a {ac}')
                        
                except Asignatura.DoesNotExist:
                    self.stdout.write(
                        self.style.WARNING(
                            f'Especialidad {profesor.funcion} del profesor {profesor.nombre_completo()} no encontrada'
                        )
                    )

        self.stdout.write(
            self.style.SUCCESS('Configuración completada exitosamente')
        )