from django.shortcuts import render, get_object_or_404
from django.http import JsonResponse
from django.contrib.auth.decorators import login_required
from django.core.paginator import Paginator
from django.db.models import Q, Avg, Count
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.contrib import messages
from datetime import datetime
import json

# Importar tus modelos
from alumnos.models import Alumno
from .models import Nota, AnoAcademico, PromedioMateria

def notas_generales(request):
    """Vista principal para gestión de notas"""
    
    # Obtener el año de los parámetros GET
    ano_actual = request.GET.get('year', datetime.now().year)
    
    # Asegurarse de que sea un entero
    try:
        ano_actual = int(ano_actual)
    except (ValueError, TypeError):
        ano_actual = datetime.now().year
    
    # Obtener años disponibles
    try:
        anos_disponibles = AnoAcademico.objects.filter(activo=True).values_list('ano', flat=True).order_by('-ano')
        if not anos_disponibles:
            # Crear año actual si no existe
            AnoAcademico.objects.get_or_create(ano=ano_actual)
            anos_disponibles = [ano_actual]
    except:
        anos_disponibles = [ano_actual]
    
    # Resto de filtros
    materia_filter = request.GET.get('materia', '')
    semestre_filter = request.GET.get('semestre', '1')
    nivel_filter = request.GET.get('nivel', 'todos')
    estado_filter = request.GET.get('estado', 'activo')
    alumno_busqueda = request.GET.get('alumno', '')
    
    # Filtrar alumnos
    alumnos = Alumno.objects.filter(activo=True)
    
    if nivel_filter != 'todos':
        alumnos = alumnos.filter(nivel=nivel_filter)
    
    if alumno_busqueda:
        alumnos = alumnos.filter(
            Q(nombre__icontains=alumno_busqueda) |
            Q(apellido__icontains=alumno_busqueda) |
            Q(rut__icontains=alumno_busqueda)
        )
    
    # Obtener niveles para el filtro
    niveles = Alumno.objects.values_list('nivel', flat=True).distinct().order_by('nivel')
    
    # Calcular estadísticas básicas
    total_alumnos = alumnos.count()
    promedio_general = 0
    
    if materia_filter:
        # Calcular promedio general para la materia seleccionada
        promedios = PromedioMateria.objects.filter(
            alumno__in=alumnos,
            materia=materia_filter,
            semestre=int(semestre_filter),
            ano=ano_actual,
            promedio__isnull=False
        )
        if promedios.exists():
            promedio_general = promedios.aggregate(Avg('promedio'))['promedio__avg'] or 0
            promedio_general = round(promedio_general, 1)
    
    # Paginación
    paginator = Paginator(alumnos, 20)  # 20 alumnos por página
    page_number = request.GET.get('page')
    alumnos_paginados = paginator.get_page(page_number)
    
    # Datos para el template
    context = {
        'alumnos': alumnos_paginados,
        'niveles': niveles,
        'alumno_busqueda': alumno_busqueda,
        'materia_filter': materia_filter,
        'nivel_filter': nivel_filter,
        'semestre_filter': semestre_filter,
        'estado_filter': estado_filter,
        'ano_actual': ano_actual,
        'anos_disponibles': anos_disponibles,
        'total_alumnos': total_alumnos,
        'promedio_general': promedio_general,
    }
    
    return render(request, 'notas_generales.html', context)

@login_required
def obtener_notas(request, alumno_id):
    """Vista para obtener las notas de un alumno específico"""
    try:
        materia = request.GET.get('materia')
        semestre = int(request.GET.get('semestre', 1))
        ano = int(request.GET.get('ano', datetime.now().year))
        
        alumno = get_object_or_404(Alumno, id=alumno_id)
        
        notas = Nota.objects.filter(
            alumno=alumno,
            materia=materia,
            semestre=semestre,
            ano=ano
        )
        
        notas_data = {}
        for nota in notas:
            notas_data[f'nota{nota.numero_nota}'] = {
                'calificacion': float(nota.calificacion),
                'porcentaje': nota.porcentaje,
                'fecha_evaluacion': nota.fecha_evaluacion.strftime('%Y-%m-%d') if nota.fecha_evaluacion else None,
                'observaciones': nota.observaciones
            }
        
        return JsonResponse({
            'success': True,
            'notas': notas_data
        })
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': f'Error al obtener las notas: {str(e)}'
        })

@login_required
@require_http_methods(["POST"])
def guardar_nota(request):
    """Vista para guardar una nota individual"""
    try:
        alumno_id = request.POST.get('alumno_id')
        materia = request.POST.get('materia')
        semestre = int(request.POST.get('semestre'))
        ano = int(request.POST.get('ano'))
        numero_nota = int(request.POST.get('numero_nota'))
        calificacion = float(request.POST.get('calificacion'))
        porcentaje = request.POST.get('porcentaje')
        fecha_evaluacion = request.POST.get('fecha_evaluacion')
        observaciones = request.POST.get('observaciones', '')
        
        # Validar datos
        if not all([alumno_id, materia, semestre, ano, numero_nota, calificacion]):
            return JsonResponse({
                'success': False,
                'message': 'Faltan datos requeridos'
            })
        
        if calificacion < 1.0 or calificacion > 7.0:
            return JsonResponse({
                'success': False,
                'message': 'La calificación debe estar entre 1.0 y 7.0'
            })
        
        # Obtener alumno
        alumno = get_object_or_404(Alumno, id=alumno_id)
        
        # Crear o actualizar nota
        nota, created = Nota.objects.update_or_create(
            alumno=alumno,
            materia=materia,
            semestre=semestre,
            ano=ano,
            numero_nota=numero_nota,
            defaults={
                'calificacion': calificacion,
                'porcentaje': int(porcentaje) if porcentaje else None,
                'fecha_evaluacion': fecha_evaluacion,
                'observaciones': observaciones
            }
        )
        
        return JsonResponse({
            'success': True,
            'message': 'Nota guardada correctamente',
            'alumno_id': alumno_id,
            'numero_nota': numero_nota,
            'calificacion': float(calificacion),
            'porcentaje': nota.porcentaje
        })
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': f'Error al guardar la nota: {str(e)}'
        })

def agregar_ano(request):
    """Vista para agregar un nuevo año académico"""
    if request.method == 'POST':
        try:
            nuevo_ano = int(request.POST.get('nuevo_ano'))
            
            if nuevo_ano < 2025:
                return JsonResponse({
                    'success': False,
                    'message': 'El año debe ser 2025 o posterior'
                })
            
            ano_obj, created = AnoAcademico.objects.get_or_create(ano=nuevo_ano)
            
            if created:
                return JsonResponse({
                    'success': True,
                    'message': f'Año académico {nuevo_ano} agregado correctamente',
                    'ano': nuevo_ano
                })
            else:
                return JsonResponse({
                    'success': False,
                    'message': f'El año {nuevo_ano} ya existe'
                })
                
        except (ValueError, TypeError):
            return JsonResponse({
                'success': False,
                'message': 'Año inválido'
            })
        except Exception as e:
            return JsonResponse({
                'success': False,
                'message': f'Error: {str(e)}'
            })
    
    return JsonResponse({'success': False, 'message': 'Método no permitido'})

def historial_alumno(request, alumno_id):
    """Vista para obtener el historial completo de notas de un alumno"""
    try:
        alumno = get_object_or_404(Alumno, id=alumno_id)
        ano_actual = request.GET.get('ano', datetime.now().year)
        
        try:
            ano_actual = int(ano_actual)
        except (ValueError, TypeError):
            ano_actual = datetime.now().year
        
        # Obtener notas por semestre
        materias = ['matematicas', 'lenguaje', 'ciencias', 'historia', 'ingles']
        materias_nombres = dict(Nota.MATERIAS_CHOICES)
        
        # Datos para ambos semestres
        notas_semestre1 = []
        notas_semestre2 = []
        
        for materia in materias:
            # Semestre 1
            notas_s1 = Nota.objects.filter(
                alumno=alumno,
                materia=materia,
                semestre=1,
                ano=ano_actual
            ).order_by('numero_nota')
            
            # Semestre 2
            notas_s2 = Nota.objects.filter(
                alumno=alumno,
                materia=materia,
                semestre=2,
                ano=ano_actual
            ).order_by('numero_nota')
            
            # Formatear datos para semestre 1
            materia_data_s1 = {
                'nombre': materias_nombres.get(materia, materia),
                'nota1': float(notas_s1.filter(numero_nota=1).first().calificacion) if notas_s1.filter(numero_nota=1).exists() else None,
                'nota2': float(notas_s1.filter(numero_nota=2).first().calificacion) if notas_s1.filter(numero_nota=2).exists() else None,
                'nota3': float(notas_s1.filter(numero_nota=3).first().calificacion) if notas_s1.filter(numero_nota=3).exists() else None,
                'nota4': float(notas_s1.filter(numero_nota=4).first().calificacion) if notas_s1.filter(numero_nota=4).exists() else None,
                'nota5': float(notas_s1.filter(numero_nota=5).first().calificacion) if notas_s1.filter(numero_nota=5).exists() else None,
                'nota6': float(notas_s1.filter(numero_nota=6).first().calificacion) if notas_s1.filter(numero_nota=6).exists() else None,
                'promedio': round(notas_s1.aggregate(Avg('calificacion'))['calificacion__avg'], 1) if notas_s1.exists() else None
            }
            
            # Formatear datos para semestre 2
            materia_data_s2 = {
                'nombre': materias_nombres.get(materia, materia),
                'nota1': float(notas_s2.filter(numero_nota=1).first().calificacion) if notas_s2.filter(numero_nota=1).exists() else None,
                'nota2': float(notas_s2.filter(numero_nota=2).first().calificacion) if notas_s2.filter(numero_nota=2).exists() else None,
                'nota3': float(notas_s2.filter(numero_nota=3).first().calificacion) if notas_s2.filter(numero_nota=3).exists() else None,
                'nota4': float(notas_s2.filter(numero_nota=4).first().calificacion) if notas_s2.filter(numero_nota=4).exists() else None,
                'nota5': float(notas_s2.filter(numero_nota=5).first().calificacion) if notas_s2.filter(numero_nota=5).exists() else None,
                'nota6': float(notas_s2.filter(numero_nota=6).first().calificacion) if notas_s2.filter(numero_nota=6).exists() else None,
                'promedio': round(notas_s2.aggregate(Avg('calificacion'))['calificacion__avg'], 1) if notas_s2.exists() else None
            }
            
            notas_semestre1.append(materia_data_s1)
            notas_semestre2.append(materia_data_s2)
        
        return JsonResponse({
            'success': True,
            'alumno': {
                'nombre': alumno.nombre_completo,
                'rut': alumno.rut,
                'nivel': alumno.nivel
            },
            'notas_semestre1': notas_semestre1,
            'notas_semestre2': notas_semestre2
        })
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': f'Error al cargar el historial: {str(e)}'
        })

@login_required
@require_http_methods(["POST"])
def eliminar_nota(request):
    """Vista para eliminar una nota individual"""
    try:
        alumno_id = request.POST.get('alumno_id')
        materia = request.POST.get('materia')
        semestre = int(request.POST.get('semestre'))
        ano = int(request.POST.get('ano'))
        numero_nota = int(request.POST.get('numero_nota'))
        
        # Buscar y eliminar la nota
        nota = Nota.objects.filter(
            alumno_id=alumno_id,
            materia=materia,
            semestre=semestre,
            ano=ano,
            numero_nota=numero_nota
        ).first()
        
        if nota:
            nota.delete()
            return JsonResponse({
                'success': True,
                'message': 'Nota eliminada correctamente'
            })
        else:
            return JsonResponse({
                'success': False,
                'message': 'Nota no encontrada'
            })
            
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': f'Error al eliminar la nota: {str(e)}'
        })
