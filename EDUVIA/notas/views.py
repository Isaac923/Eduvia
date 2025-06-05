from django.shortcuts import render
from django.core.paginator import Paginator
from django.db.models import Q, Avg, Count
from django.contrib import messages
from django.http import JsonResponse
from alumnos.models import Alumno
from django.contrib.auth.decorators import login_required

@login_required
def notas_generales(request):
    # Obtener todos los alumnos ordenados por primer_nombre y apellido_paterno
    alumnos_queryset = Alumno.objects.all().order_by('primer_nombre', 'apellido_paterno')
    
    # Filtros
    alumno_busqueda = request.GET.get('alumno', '')
    nivel_filter = request.GET.get('nivel', 'todos')
    semestre_filter = request.GET.get('semestre', 'todos')
    estado_filter = request.GET.get('estado', 'activo')
    materia_filter = request.GET.get('materia', 'matematicas')  # Por defecto matemáticas
    
    # Aplicar filtros
    if alumno_busqueda:
        alumnos_queryset = alumnos_queryset.filter(
            Q(primer_nombre__icontains=alumno_busqueda) |
            Q(segundo_nombre__icontains=alumno_busqueda) |
            Q(apellido_paterno__icontains=alumno_busqueda) |
            Q(apellido_materno__icontains=alumno_busqueda) |
            Q(rut__icontains=alumno_busqueda)
        )
    
    if nivel_filter != 'todos':
        alumnos_queryset = alumnos_queryset.filter(nivel=nivel_filter)
    
    if estado_filter == 'activo':
        alumnos_queryset = alumnos_queryset.filter(activo=True)
    elif estado_filter == 'inactivo':
        alumnos_queryset = alumnos_queryset.filter(activo=False)
    # Si es 'todos', no aplicar filtro de estado
    
    # Obtener niveles únicos para el filtro
    niveles = Alumno.objects.values_list('nivel', flat=True).distinct().order_by('nivel')
    
    # Calcular estadísticas
    total_alumnos = alumnos_queryset.count()
    alumnos_activos = alumnos_queryset.filter(activo=True).count()
    
    # Estadísticas simuladas (puedes calcularlas según tus notas reales)
    if materia_filter == 'todas':
        promedio_general = 5.5  # Promedio general de todas las materias
    else:
        # Promedio específico por materia (simulado)
        promedios_por_materia = {
            'matematicas': 5.2,
            'lenguaje': 5.8,
            'ciencias': 5.4,
            'historia': 5.6,
            'ingles': 5.3
        }
        promedio_general = promedios_por_materia.get(materia_filter, 5.5)
    
    alumnos_destacados = int(total_alumnos * 0.3)  # 30% destacados
    alumnos_riesgo = int(total_alumnos * 0.1)  # 10% en riesgo
    
    # Paginación
    paginator = Paginator(alumnos_queryset, 10)  # 10 alumnos por página
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)
    
    # Lista de materias disponibles
    materias_disponibles = [
        ('matematicas', 'Matemáticas'),
        ('lenguaje', 'Lenguaje y Comunicación'),
        ('ciencias', 'Ciencias Naturales'),
        ('historia', 'Historia y Geografía'),
        ('ingles', 'Inglés'),
    ]
    
    context = {
        'alumnos': page_obj,
        'page_obj': page_obj,
        'is_paginated': page_obj.has_other_pages(),
        'alumno_busqueda': alumno_busqueda,
        'nivel_filter': nivel_filter,
        'semestre_filter': semestre_filter,
        'estado_filter': estado_filter,
        'materia_filter': materia_filter,  # Nuevo filtro
        'niveles': niveles,
        'materias_disponibles': materias_disponibles,  # Lista de materias
        'total_alumnos': total_alumnos,
        'promedio_general': promedio_general,
        'alumnos_destacados': alumnos_destacados,
        'alumnos_riesgo': alumnos_riesgo,
    }
    
    return render(request, 'notas_generales.html', context)


@login_required
def guardar_notas(request):
    """API para guardar notas"""
    if request.method == 'POST':
        try:
            # Obtener datos del formulario
            alumno_id = request.POST.get('alumno_id')
            materia = request.POST.get('materia')
            semestre = request.POST.get('semestre')
            calificacion = request.POST.get('calificacion')
            fecha_evaluacion = request.POST.get('fecha_evaluacion')
            observaciones = request.POST.get('observaciones', '')
            
            # Validar datos
            if not all([alumno_id, materia, semestre, calificacion]):
                return JsonResponse({
                    'success': False, 
                    'error': 'Faltan datos obligatorios'
                })
            
            # Validar que el alumno existe
            try:
                alumno = Alumno.objects.get(id=alumno_id)
            except Alumno.DoesNotExist:
                return JsonResponse({
                    'success': False, 
                    'error': 'Alumno no encontrado'
                })
            
            # Validar calificación
            try:
                calificacion_float = float(calificacion)
                if calificacion_float < 1.0 or calificacion_float > 7.0:
                    return JsonResponse({
                        'success': False, 
                        'error': 'La calificación debe estar entre 1.0 y 7.0'
                    })
            except ValueError:
                return JsonResponse({
                    'success': False, 
                    'error': 'Calificación inválida'
                })
            
            # Aquí implementarías la lógica para guardar las notas
            # Por ejemplo, usando un modelo Nota que crearías
            
            # Simulación de guardado exitoso
            messages.success(request, f'Nota de {materia} guardada correctamente para {alumno.nombre_completo}')
            
            return JsonResponse({
                'success': True,
                'message': 'Nota guardada correctamente',
                'data': {
                    'alumno_id': alumno_id,
                    'materia': materia,
                    'semestre': semestre,
                    'calificacion': calificacion_float,
                    'fecha_evaluacion': fecha_evaluacion,
                    'observaciones': observaciones
                }
            })
            
        except Exception as e:
            messages.error(request, f'Error al guardar nota: {str(e)}')
            return JsonResponse({
                'success': False, 
                'error': f'Error interno: {str(e)}'
            })
    
    return JsonResponse({
        'success': False, 
        'error': 'Método no permitido'
    })


@login_required
def obtener_notas_alumno(request, alumno_id):
    """API para obtener las notas de un alumno específico"""
    try:
        alumno = Alumno.objects.get(id=alumno_id)
        materia = request.GET.get('materia', 'todas')
        semestre = request.GET.get('semestre', 'todos')
        
        # Aquí implementarías la lógica para obtener las notas reales
        # Por ahora, devolvemos datos simulados
        
        notas_simuladas = {
            'matematicas': {
                '1': [6.5, 5.8, 6.2, 0, 0],  # 5 notas por semestre
                '2': [6.0, 5.5, 6.8, 0, 0]
            },
            'lenguaje': {
                '1': [5.8, 6.2, 5.9, 0, 0],
                '2': [6.1, 5.7, 6.3, 0, 0]
            },
            'ciencias': {
                '1': [5.5, 5.8, 5.2, 0, 0],
                '2': [5.9, 6.0, 5.6, 0, 0]
            },
            'historia': {
                '1': [6.2, 5.9, 6.1, 0, 0],
                '2': [5.8, 6.3, 6.0, 0, 0]
            },
            'ingles': {
                '1': [5.7, 5.4, 5.9, 0, 0],
                '2': [5.6, 5.8, 5.5, 0, 0]
            }
        }
        
        if materia == 'todas':
            notas_response = notas_simuladas
        else:
            notas_response = {materia: notas_simuladas.get(materia, {'1': [0,0,0,0,0], '2': [0,0,0,0,0]})}
        
        return JsonResponse({
            'success': True,
            'alumno': {
                'id': alumno.id,
                'nombre': alumno.nombre_completo,
                'nivel': alumno.nivel,
                'jornada': alumno.jornada
            },
            'notas': notas_response
        })
        
    except Alumno.DoesNotExist:
        return JsonResponse({
            'success': False,
            'error': 'Alumno no encontrado'
        })
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        })


@login_required
def estadisticas_materia(request):
    """API para obtener estadísticas por materia"""
    materia = request.GET.get('materia', 'matematicas')
    
    # Aquí implementarías la lógica para calcular estadísticas reales
    # Por ahora, devolvemos datos simulados
    
    estadisticas_simuladas = {
        'matematicas': {
            'promedio_general': 5.2,
            'total_evaluaciones': 156,
            'alumnos_destacados': 23,
            'alumnos_riesgo': 8
        },
        'lenguaje': {
            'promedio_general': 5.8,
            'total_evaluaciones': 142,
            'alumnos_destacados': 31,
            'alumnos_riesgo': 5
        },
        'ciencias': {
            'promedio_general': 5.4,
            'total_evaluaciones': 138,
            'alumnos_destacados': 27,
            'alumnos_riesgo': 7
        },
        'historia': {
            'promedio_general': 5.6,
            'total_evaluaciones': 134,
            'alumnos_destacados': 29,
            'alumnos_riesgo': 6
        },
        'ingles': {
            'promedio_general': 5.3,
            'total_evaluaciones': 145,
            'alumnos_destacados': 25,
            'alumnos_riesgo': 9
        }
    }
    
    stats = estadisticas_simuladas.get(materia, estadisticas_simuladas['matematicas'])
    
    return JsonResponse({
        'success': True,
        'materia': materia,
        'estadisticas': stats
    })

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
import json

@require_POST
def asignar_nota_ajax(request):
    try:
        alumno_id = request.POST.get('alumno_id')
        materia = request.POST.get('materia')
        semestre = request.POST.get('semestre')
        nota_numero = request.POST.get('nota_numero')
        calificacion = request.POST.get('calificacion')
        fecha_evaluacion = request.POST.get('fecha_evaluacion')
        tipo_evaluacion = request.POST.get('tipo_evaluacion')
        observaciones = request.POST.get('observaciones')
        
        # Aquí debes crear o actualizar la nota en tu modelo
        # Ejemplo (ajusta según tu modelo):
        # nota, created = Nota.objects.update_or_create(
        #     alumno_id=alumno_id,
        #     materia=materia,
        #     semestre=semestre,
        #     numero_nota=nota_numero,
        #     defaults={
        #         'calificacion': calificacion,
        #         'fecha_evaluacion': fecha_evaluacion,
        #         'tipo_evaluacion': tipo_evaluacion,
        #         'observaciones': observaciones,
        #     }
        # )
        
        return JsonResponse({
            'success': True,
            'message': 'Nota asignada correctamente'
        })
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': f'Error al asignar la nota: {str(e)}'
        })

def obtener_notas_ajax(request):
    try:
        # Obtener filtros de la URL
        materia_filter = request.GET.get('materia', 'matematicas')
        nivel_filter = request.GET.get('nivel', 'todos')
        semestre_filter = request.GET.get('semestre', 'todos')
        estado_filter = request.GET.get('estado', 'activo')
        
        # Aquí debes obtener las notas desde tu modelo
        # Ejemplo (ajusta según tu modelo):
        # notas = Nota.objects.filter(
        #     alumno__activo=True if estado_filter == 'activo' else Q()
        # )
        # 
        # if materia_filter != 'todas':
        #     notas = notas.filter(materia=materia_filter)
        # 
        # if nivel_filter != 'todos':
        #     notas = notas.filter(alumno__nivel=nivel_filter)
        # 
        # if semestre_filter != 'todos':
        #     notas = notas.filter(semestre=semestre_filter)
        
        # notas_data = []
        # for nota in notas:
        #     notas_data.append({
        #         'alumno_id': nota.alumno.id,
        #         'materia': nota.materia,
        #         'semestre': nota.semestre,
        #         'numero_nota': nota.numero_nota,
        #         'calificacion': float(nota.calificacion),
        #         'fecha_evaluacion': nota.fecha_evaluacion.strftime('%Y-%m-%d'),
        #         'tipo_evaluacion': nota.tipo_evaluacion,
        #         'observaciones': nota.observaciones or ''
        #     })
        
        # Por ahora devolvemos una lista vacía hasta que implementes tu modelo
        notas_data = []
        
        return JsonResponse({
            'success': True,
            'notas': notas_data
        })
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': f'Error al obtener las notas: {str(e)}'
        })