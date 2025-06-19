from django.contrib import admin
from django.contrib import messages
from django.db import transaction
from .models import Alumno, AnoAcademico, AlumnoAno

@admin.action(description='Transferir todos los alumnos al año académico activo')
def transferir_alumnos_ano_activo(modeladmin, request, queryset):
    """Acción del admin para transferir alumnos al año activo"""
    
    ano_activo = AnoAcademico.get_ano_activo()
    if not ano_activo:
        messages.error(request, "No hay un año académico activo definido")
        return
    
    alumnos = Alumno.objects.all()
    transferidos = 0
    actualizados = 0
    errores = 0
    
    with transaction.atomic():
        for alumno in alumnos:
            try:
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
                else:
                    alumno_ano.nivel = alumno.nivel
                    alumno_ano.jornada = alumno.jornada
                    alumno_ano.activo = alumno.activo
                    alumno_ano.save()
                    actualizados += 1
                    
            except Exception as e:
                errores += 1
    
    if errores == 0:
        messages.success(
            request, 
            f"Transferencia exitosa al año {ano_activo.ano}: "
            f"{transferidos} transferidos, {actualizados} actualizados"
        )
    else:
        messages.warning(
            request,
            f"Transferencia completada con errores: "
            f"{transferidos} transferidos, {actualizados} actualizados, {errores} errores"
        )