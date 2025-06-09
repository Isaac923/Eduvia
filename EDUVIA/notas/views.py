from django.shortcuts import render, get_object_or_404
from django.http import JsonResponse
from django.contrib import messages
from django.views.decorators.http import require_POST
from django.views.decorators.csrf import csrf_exempt
from django.utils import timezone
from alumnos.models import Alumno
from datetime import datetime
import json

def notas_generales(request):
    """Vista para mostrar la página de notas con selector de año"""
    
    # Obtener parámetros de filtro
    alumno_busqueda = request.GET.get('alumno', '')
    materia_filter = request.GET.get('materia', 'matematicas')
    nivel_filter = request.GET.get('nivel', 'todos')
    semestre_filter = request.GET.get('semestre', '1')
    estado_filter = request.GET.get('estado', 'activo')
    ano_actual = int(request.GET.get('year', 2025))
    
    # Obtener años disponibles de manera más dinámica
    ano_minimo = 2025
    ano_maximo = max(datetime.now().year + 5, ano_actual + 1)  # Al menos 5 años hacia el futuro
    anos_disponibles = list(range(ano_minimo, ano_maximo + 1))
    
    # Si el año seleccionado no está en la lista, agregarlo
    if ano_actual not in anos_disponibles:
        anos_disponibles.append(ano_actual)
        anos_disponibles.sort()
    
    # Obtener alumnos básicos
    alumnos_query = Alumno.objects.filter(activo=True)
    
    # Aplicar filtros
    if alumno_busqueda:
        alumnos_query = alumnos_query.filter(
            primer_nombre__icontains=alumno_busqueda
        ) | alumnos_query.filter(
            apellido_paterno__icontains=alumno_busqueda
        )
    
    if nivel_filter != 'todos':
        alumnos_query = alumnos_query.filter(nivel=nivel_filter)
    
    if estado_filter == 'activo':
        alumnos_query = alumnos_query.filter(activo=True)
    
    alumnos = alumnos_query.order_by('apellido_paterno', 'primer_nombre')[:20]
    
    # Obtener niveles para el filtro
    niveles = Alumno.objects.values_list('nivel', flat=True).distinct().order_by('nivel')
    
    # Datos básicos para el template
    context = {
        'alumnos': alumnos,
        'niveles': niveles,
        'alumno_busqueda': alumno_busqueda,
        'materia_filter': materia_filter,
        'nivel_filter': nivel_filter,
        'semestre_filter': semestre_filter,
        'estado_filter': estado_filter,
        'ano_actual': ano_actual,
        'anos_disponibles': anos_disponibles,
        'total_alumnos': alumnos.count(),
        'promedio_general': 5.5,  # Valor fijo por ahora
    }
    
    return render(request, 'notas_generales.html', context)

@require_POST
def agregar_ano(request):
    """Vista para agregar un nuevo año académico"""
    try:
        nuevo_ano = int(request.POST.get('nuevo_ano'))
        
        # Validar que el año sea razonable (desde 2025 hacia adelante)
        if nuevo_ano < 2025:
            return JsonResponse({
                'success': False,
                'message': 'El año debe ser 2025 o posterior'
            })
        
        # Validación adicional opcional para años muy lejanos
        ano_actual = datetime.now().year
        if nuevo_ano > ano_actual + 50:  # Permitir hasta 50 años en el futuro
            return JsonResponse({
                'success': False,
                'message': f'El año {nuevo_ano} parece demasiado lejano. ¿Estás seguro?'
            })
        
        # Aquí podrías crear registros necesarios para el nuevo año
        # Por ejemplo, crear estructura de notas, períodos académicos, etc.
        
        return JsonResponse({
            'success': True,
            'ano': nuevo_ano,
            'message': f'Año académico {nuevo_ano} agregado correctamente'
        })
        
    except (ValueError, TypeError):
        return JsonResponse({
            'success': False,
            'message': 'Año inválido'
        })
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': f'Error al agregar el año: {str(e)}'
        })

def obtener_notas(request, alumno_id):
    """Vista para obtener las notas de un alumno específico"""
    try:
        alumno = get_object_or_404(Alumno, id=alumno_id)
        materia = request.GET.get('materia')
        semestre = request.GET.get('semestre')
        ano = request.GET.get('ano', 2025)  # Cambio aquí: por defecto 2025
        
        # Aquí implementarías la lógica para obtener las notas reales
        # Por ahora devolvemos datos de ejemplo
        notas_ejemplo = [
            {'numero': 1, 'calificacion': 6.5, 'porcentaje': None},
            {'numero': 2, 'calificacion': 5.8, 'porcentaje': 20},
            {'numero': 3, 'calificacion': 6.2, 'porcentaje': None},
        ]
        
        return JsonResponse({
            'success': True,
            'notas': notas_ejemplo,
            'promedio': '6.2',
            'detalle_promedio': '3 notas'
        })
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': f'Error al obtener notas: {str(e)}'
        })

@require_POST
def guardar_nota(request):
    """Vista para guardar una nota individual"""
    try:
        alumno_id = request.POST.get('alumno_id')
        materia = request.POST.get('materia')
        semestre = request.POST.get('semestre')
        numero_nota = request.POST.get('numero_nota')
        calificacion = float(request.POST.get('calificacion'))
        porcentaje = request.POST.get('porcentaje')
        ano = request.POST.get('ano', 2025)  # Cambio aquí: por defecto 2025
        fecha_evaluacion = request.POST.get('fecha_evaluacion')
        observaciones = request.POST.get('observaciones', '')
        
        # Validar calificación
        if calificacion < 1.0 or calificacion > 7.0:
            return JsonResponse({
                'success': False,
                'message': 'La calificación debe estar entre 1.0 y 7.0'
            })
        
        # Validar porcentaje si se proporciona
        if porcentaje:
            porcentaje = float(porcentaje)
            if porcentaje < 0 or porcentaje > 100:
                return JsonResponse({
                    'success': False,
                    'message': 'El porcentaje debe estar entre 0 y 100'
                })
        else:
            porcentaje = None
        
        # Aquí implementarías la lógica para guardar en la base de datos
        # Por ejemplo, crear o actualizar un modelo Nota
        
        return JsonResponse({
            'success': True,
            'alumno_id': alumno_id,
            'numero_nota': numero_nota,
            'calificacion': calificacion,
            'porcentaje': porcentaje,
            'message': 'Nota guardada correctamente'
        })
        
    except ValueError:
        return JsonResponse({
            'success': False,
            'message': 'Valores numéricos inválidos'
        })
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': f'Error al guardar la nota: {str(e)}'
        })

@require_POST
def eliminar_nota(request):
    """Vista para eliminar una nota"""
    try:
        alumno_id = request.POST.get('alumno_id')
        numero_nota = request.POST.get('numero_nota')
        materia = request.POST.get('materia')
        semestre = request.POST.get('semestre')
        ano = request.POST.get('ano')
        
        # Aquí implementarías la lógica para eliminar la nota de la base de datos
        
        return JsonResponse({
            'success': True,
            'message': 'Nota eliminada correctamente'
        })
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': f'Error al eliminar la nota: {str(e)}'
        })

def historial_alumno(request, alumno_id):
    """Vista para obtener el historial completo de notas de un alumno"""
    try:
        alumno = get_object_or_404(Alumno, id=alumno_id)
        ano = request.GET.get('ano', 2025)
        
        # Aquí implementarías la lógica real para obtener todas las notas del alumno
        # Por ahora devolvemos listas vacías hasta que implementes el modelo Nota
        
        # Cuando tengas el modelo Nota implementado, usarías algo como:
        # from .models import Nota, PromedioMateria
        # 
        # notas_semestre1_data = []
        # notas_semestre2_data = []
        # 
        # materias = ['matematicas', 'lenguaje', 'ciencias', 'historia', 'ingles']
        # 
        # for materia in materias:
        #     # Semestre 1
        #     notas_s1 = Nota.objects.filter(
        #         alumno=alumno,
        #         materia=materia,
        #         semestre=1,
        #         ano_academico=ano
        #     ).order_by('numero_nota')
        #     
        #     promedio_s1 = PromedioMateria.objects.filter(
        #         alumno=alumno,
        #         materia=materia,
        #         semestre=1,
        #         ano_academico=ano
        #     ).first()
        #     
        #     materia_data_s1 = {
        #         'nombre': dict(Nota.MATERIAS_CHOICES)[materia],
        #         'nota1': notas_s1.filter(numero_nota=1).first().calificacion if notas_s1.filter(numero_nota=1).exists() else None,
        #         'nota2': notas_s1.filter(numero_nota=2).first().calificacion if notas_s1.filter(numero_nota=2).exists() else None,
        #         'nota3': notas_s1.filter(numero_nota=3).first().calificacion if notas_s1.filter(numero_nota=3).exists() else None,
        #         'nota4': notas_s1.filter(numero_nota=4).first().calificacion if notas_s1.filter(numero_nota=4).exists() else None,
        #         'nota5': notas_s1.filter(numero_nota=5).first().calificacion if notas_s1.filter(numero_nota=5).exists() else None,
        #         'nota6': notas_s1.filter(numero_nota=6).first().calificacion if notas_s1.filter(numero_nota=6).exists() else None,
        #         'promedio': promedio_s1.promedio if promedio_s1 else None
        #     }
        #     notas_semestre1_data.append(materia_data_s1)
        #     
        #     # Semestre 2 (similar lógica)
        #     # ...
        
        # Por ahora, devolver listas vacías
        notas_semestre1 = []
        notas_semestre2 = []
        
        return JsonResponse({
            'success': True,
            'alumno': {
                'nombre': alumno.nombre_completo,
                'rut': alumno.rut,
                'nivel': alumno.nivel
            },
            'notas_semestre1': notas_semestre1,
            'notas_semestre2': notas_semestre2,
            'ano': ano
        })
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': f'Error al obtener historial: {str(e)}'
        })
