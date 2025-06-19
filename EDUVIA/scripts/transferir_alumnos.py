import os
import sys
import django

# Configurar Django
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'EDUVIA.settings')
django.setup()

from django.db import transaction
from alumnos.models import Alumno, AnoAcademico, AlumnoAno

def transferir_alumnos_ano_actual():
    """Transfiere todos los alumnos al año académico actual"""
    
    # Obtener el año académico activo
    ano_activo = AnoAcademico.get_ano_activo()
    if not ano_activo:
        print("❌ Error: No hay un año académico activo definido")
        return False
    
    # Obtener todos los alumnos
    alumnos = Alumno.objects.all()
    if not alumnos.exists():
        print("⚠️  No hay alumnos para transferir")
        return True
    
    print(f"🎓 Iniciando transferencia al año académico {ano_activo.ano}")
    print(f"📊 Total de alumnos a procesar: {alumnos.count()}")
    print("-" * 50)
    
    transferidos = 0
    actualizados = 0
    errores = 0
    
    with transaction.atomic():
        for alumno in alumnos:
            try:
                # Crear o actualizar la relación AlumnoAno
                alumno_ano, created = AlumnoAno.objects.get_or_create(
                    alumno=alumno,
                    ano_academico=ano_activo,
                    defaults={
                        'nivel': alumno.nivel,
                        'jornada': alumno.jornada,
                        'activo': alumno.activo
                    }
                )
                
                if created:
                    transferidos += 1
                    print(f"✅ Transferido: {alumno.nombre_completo} - {alumno.nivel}")
                else:
                    # Actualizar datos existentes
                    alumno_ano.nivel = alumno.nivel
                    alumno_ano.jornada = alumno.jornada
                    alumno_ano.activo = alumno.activo
                    alumno_ano.save()
                    actualizados += 1
                    print(f"🔄 Actualizado: {alumno.nombre_completo} - {alumno.nivel}")
                    
            except Exception as e:
                errores += 1
                print(f"❌ Error con {alumno.nombre_completo}: {str(e)}")
    
    # Resumen
    print("\n" + "="*50)
    print("📋 RESUMEN DE LA TRANSFERENCIA")
    print("="*50)
    print(f"🎯 Año académico objetivo: {ano_activo.ano}")
    print(f"➕ Alumnos transferidos: {transferidos}")
    print(f"🔄 Alumnos actualizados: {actualizados}")
    print(f"❌ Errores: {errores}")
    print(f"📊 Total procesados: {transferidos + actualizados + errores}")
    print("="*50)
    
    if errores == 0:
        print("🎉 ¡Transferencia completada exitosamente!")
        return True
    else:
        print(f"⚠️  Transferencia completada con {errores} errores")
        return False

if __name__ == "__main__":
    transferir_alumnos_ano_actual()