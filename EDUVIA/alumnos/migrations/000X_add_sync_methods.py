from django.db import migrations

def sync_existing_data(apps, schema_editor):
    """Sincroniza los datos existentes"""
    Alumno = apps.get_model('alumnos', 'Alumno')
    AlumnoAno = apps.get_model('alumnos', 'AlumnoAno')
    AnoAcademico = apps.get_model('alumnos', 'AnoAcademico')
    Curso = apps.get_model('cursos', 'Curso')
    
    # Obtener año activo
    try:
        ano_activo = AnoAcademico.objects.filter(activo=True).first()
        if not ano_activo:
            print("No hay año académico activo")
            return
            
        print(f"Sincronizando con año académico: {ano_activo.ano}")
        
        # Sincronizar todos los alumnos
        for alumno in Alumno.objects.all():
            # Crear o actualizar AlumnoAno
            alumno_ano, created = AlumnoAno.objects.get_or_create(
                alumno=alumno,
                ano_academico=ano_activo,
                defaults={
                    'nivel': alumno.nivel,
                    'jornada': alumno.jornada,
                    'activo': alumno.activo
                }
            )
            
            if not created:
                # Actualizar datos existentes
                alumno_ano.nivel = alumno.nivel
                alumno_ano.jornada = alumno.jornada
                alumno_ano.activo = alumno.activo
                alumno_ano.save()
            
            print(f"Sincronizado: {alumno.nombre_completo} - {alumno.nivel}")
        
        # Sincronizar cursos
        for curso in Curso.objects.all():
            print(f"Sincronizando curso: {curso}")
            
            # Determinar el nivel y jornada que corresponde a este curso
            nivel_curso = f"{curso.nivel}{curso.letra.upper()}"
            jornada_curso = 'diurna' if curso.letra.lower() == 'a' else 'vespertina'
            
            # Obtener alumnos activos que corresponden a este curso
            alumnos_correspondientes = AlumnoAno.objects.filter(
                ano_academico=ano_activo,
                nivel=nivel_curso,
                jornada=jornada_curso,
                activo=True
            )
            
            # Limpiar alumnos actuales del curso
            curso.alumnos.clear()
            
            # Agregar alumnos correspondientes
            for alumno_ano in alumnos_correspondientes:
                curso.alumnos.add(alumno_ano.alumno)
                print(f"  - Agregado: {alumno_ano.alumno.nombre_completo}")
        
        print("Sincronización completada")
        
    except Exception as e:
        print(f"Error durante la sincronización: {e}")

def reverse_sync(apps, schema_editor):
    """Función reversa (no hace nada)"""
    pass

class Migration(migrations.Migration):

    dependencies = [
        ('alumnos', '0001_initial'),  # Cambia esto por tu última migración
        ('cursos', '0001_initial'),   # Cambia esto por tu última migración de cursos
    ]

    operations = [
        migrations.RunPython(sync_existing_data, reverse_sync),
    ]