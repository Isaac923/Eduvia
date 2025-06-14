from django.shortcuts import render, get_object_or_404, redirect
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.http import JsonResponse, HttpResponse
from django.core.paginator import Paginator
from django.db.models import Q, Avg, Count
from django.utils import timezone
from django.views.decorators.http import require_http_methods
import json
import csv
from datetime import datetime

from alumnos.models import Alumno
from .models import Nota, AnoAcademico
from usuarios.models import Usuario

@login_required
def notas_generales(request):
    """Vista para administradores y profesores"""
    
    print("=== INICIO DE VISTA NOTAS_GENERALES ===")
    print(f"Usuario Django: {request.user}")
    print(f"Username: {request.user.username}")
    print(f"Is superuser: {request.user.is_superuser}")
    
    # Variables globales
    currentAlumnoId = None
    currentMateria = None
    currentSemestre = None                                                                 
    currentAno = None
    notasConPorcentaje = {} # Cache para almacenar porcentajes

    # Obtener datos EDUVIA del usuario
    eduvia_data = None
    es_superuser_django = request.user.is_superuser
    
    try:
        # Si es superusuario de Django, crear datos por defecto
        if es_superuser_django:
            eduvia_data = {
                'rol': 'admin',
                'tipo_usuario': 'admin',
                'asignatura': None,
                'telefono': None,
                'rut_original': request.user.username,
                'usuario_eduvia_id': None
            }
            print(f"✓ Superusuario Django detectado, usando datos por defecto: {eduvia_data}")
        else:
            # Para usuarios normales, intentar obtener de los datos guardados en la sesión
            if hasattr(request.user, '_eduvia_data'):
                eduvia_data = request.user._eduvia_data
                print(f"✓ Datos EDUVIA desde sesión: {eduvia_data}")
            else:
                # Si no están en sesión, buscar en BD
                usuario_eduvia = Usuario.objects.get(rut=request.user.username)
                eduvia_data = {
                    'rol': usuario_eduvia.rol,
                    'tipo_usuario': getattr(usuario_eduvia, 'tipo_usuario', None),
                    'asignatura': getattr(usuario_eduvia, 'asignatura', None),
                    'telefono': getattr(usuario_eduvia, 'telefono', None),
                    'rut_original': usuario_eduvia.rut,
                    'usuario_eduvia_id': usuario_eduvia.id
                }
                print(f"✓ Datos EDUVIA desde BD: {eduvia_data}")
            
    except Usuario.DoesNotExist:
        if not es_superuser_django:
            print("✗ Usuario EDUVIA NO encontrado y no es superusuario")
            messages.error(request, 'Usuario no encontrado en el sistema EDUVIA.')
            return redirect('usuarios:inicio')
        else:
            # Si es superusuario pero no está en EDUVIA, usar datos por defecto
            eduvia_data = {
                'rol': 'admin',
                'tipo_usuario': 'admin',
                'asignatura': None,
                'telefono': None,
                'rut_original': request.user.username,
                'usuario_eduvia_id': None
            }
            print(f"✓ Superusuario sin datos EDUVIA, usando por defecto: {eduvia_data}")
    
    # Obtener año académico actual
    ano_actual = int(request.GET.get('year', timezone.now().year))
    
    try:
        anos_disponibles = list(AnoAcademico.objects.values_list('ano', flat=True).order_by('-ano'))
    except:
        anos_disponibles = []
    
    if not anos_disponibles:
        try:
            AnoAcademico.objects.create(ano=timezone.now().year)
            anos_disponibles = [timezone.now().year]
        except:
            anos_disponibles = [timezone.now().year]
    
    # Determinar si es administrador o profesor
    es_admin = es_superuser_django or eduvia_data['rol'] == 'admin'
    es_profesor = eduvia_data['rol'] == 'profesor'
    
    print(f"Es admin: {es_admin}, Es profesor: {es_profesor}")
    print(f"Asignatura del usuario: {eduvia_data.get('asignatura')}")
    
    # CAMBIO PRINCIPAL: Filtros con lógica mejorada para profesores
    if es_profesor:
        # Para profesores, verificar que tengan asignatura
        asignatura = eduvia_data.get('asignatura')
        if asignatura:
            # IMPORTANTE: Para profesores, SIEMPRE usar su asignatura
            materia_filter = asignatura
            print(f"✓ Profesor con asignatura fija: {materia_filter}")
        else:
            print("✗ Profesor SIN asignatura asignada")
            messages.error(request, 'No tienes una asignatura asignada. Contacta al administrador para que te asigne una materia.')
            return redirect('usuarios:inicio')
    else:
        # Para administradores, permitir selección libre
        materia_filter = request.GET.get('materia', '')
        print(f"Admin - materia seleccionada: '{materia_filter}'")
    
    semestre_filter = request.GET.get('semestre', '1')
    nivel_filter = request.GET.get('nivel', 'todos')
    
    # Para profesores, forzar solo activos
    if es_profesor:
        estado_filter = 'activo'
    else:
        estado_filter = request.GET.get('estado', 'activo')
        
    alumno_busqueda = request.GET.get('alumno', '')
    
    print(f"Filtros aplicados:")
    print(f"  - Materia: {materia_filter}")
    print(f"  - Semestre: {semestre_filter}")
    print(f"  - Nivel: {nivel_filter}")
    print(f"  - Estado: {estado_filter}")
    
    # Base queryset de alumnos
    try:
        alumnos_query = Alumno.objects.all()
        
        # Filtrar por estado activo
        if estado_filter == 'activo':
            alumnos_query = alumnos_query.filter(activo=True)
        
        if nivel_filter != 'todos':
            alumnos_query = alumnos_query.filter(nivel=nivel_filter)
        
        if alumno_busqueda:
            alumnos_query = alumnos_query.filter(
                Q(primer_nombre__icontains=alumno_busqueda) |
                Q(segundo_nombre__icontains=alumno_busqueda) |
                Q(apellido_paterno__icontains=alumno_busqueda) |
                Q(apellido_materno__icontains=alumno_busqueda) |
                Q(rut__icontains=alumno_busqueda)
            )
    except Exception as e:
        print(f"Error en queryset de alumnos: {e}")
        alumnos_query = Alumno.objects.none()
    
    # CAMBIO: Para profesores, SIEMPRE mostrar alumnos (tienen materia fija)
    # Para administradores, solo si hay materia seleccionada
    if materia_filter:  # Cambié la condición aquí
        try:
            alumnos = alumnos_query.order_by('apellido_paterno', 'apellido_materno', 'primer_nombre')
            
            # Calcular promedio general
            try:
                notas_materia = Nota.objects.filter(
                    materia=materia_filter,
                    semestre=int(semestre_filter),
                    ano=ano_actual,
                    alumno__in=alumnos
                )
                promedio_general = notas_materia.aggregate(Avg('calificacion'))['calificacion__avg'] or 0
                print(f"Promedio calculado: {promedio_general}")
            except Exception as e:
                print(f"Error calculando promedio: {e}")
                promedio_general = 0
        except Exception as e:
            print(f"Error ordenando alumnos: {e}")
            alumnos = Alumno.objects.none()
            promedio_general = 0
    else:
        alumnos = Alumno.objects.none()
        promedio_general = 0
    
    # Paginación
    try:
        paginator = Paginator(alumnos, 20)
        page_number = request.GET.get('page')
        alumnos = paginator.get_page(page_number)
    except Exception as e:
        print(f"Error en paginación: {e}")
        alumnos = []
    
    # Obtener niveles disponibles
    try:
        niveles = list(Alumno.objects.values_list('nivel', flat=True).distinct().order_by('nivel'))
    except Exception as e:
        print(f"Error obteniendo niveles: {e}")
        niveles = []
    
    try:
        total_alumnos = alumnos_query.count()
    except:
        total_alumnos = 0
    
    print(f"Total alumnos encontrados: {total_alumnos}")
    print("=== PREPARANDO CONTEXT ===")
    
    # Crear objeto usuario para el template
    class UsuarioTemplate:
        def __init__(self, django_user, eduvia_data):
            self.rut = eduvia_data['rut_original']
            self.rol = eduvia_data['rol']
            self.asignatura = eduvia_data.get('asignatura')
            self.tipo_usuario = eduvia_data.get('tipo_usuario')
            self.nombres = django_user.first_name or 'Admin'
            self.apellidos = django_user.last_name or 'Sistema'
            self.is_superuser = django_user.is_superuser
    
    usuario_template = UsuarioTemplate(request.user, eduvia_data)
    
    context = {
        'alumnos': alumnos,
        'ano_actual': ano_actual,
        'anos_disponibles': anos_disponibles,
        'materia_filter': materia_filter,
        'semestre_filter': semestre_filter,
        'nivel_filter': nivel_filter,
        'estado_filter': estado_filter,
        'alumno_busqueda': alumno_busqueda,
        'niveles': niveles,
        'total_alumnos': total_alumnos,
        'promedio_general': promedio_general,
        'usuario': usuario_template,
        'es_admin': es_admin,
        'es_profesor': es_profesor,
    }
    
    print("=== RENDERIZANDO TEMPLATE ===")
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

@login_required
def obtener_historial_notas(request, alumno_id):
    """Vista para obtener el historial completo de notas de un alumno"""
    try:
        print("=== OBTENER HISTORIAL NOTAS ===")
        print(f"Usuario Django: {request.user}")
        print(f"Is superuser: {request.user.is_superuser}")
        
        # Obtener datos EDUVIA del usuario (similar a notas_generales)
        eduvia_data = None
        es_superuser_django = request.user.is_superuser
        
        try:
            # Si es superusuario de Django, crear datos por defecto
            if es_superuser_django:
                eduvia_data = {
                    'rol': 'admin',
                    'asignatura': None,
                }
                print(f"✓ Superusuario Django detectado para historial")
            else:
                # Para usuarios normales, intentar obtener de los datos guardados en la sesión
                if hasattr(request.user, '_eduvia_data'):
                    eduvia_data = request.user._eduvia_data
                    print(f"✓ Datos EDUVIA desde sesión para historial: {eduvia_data}")
                else:
                    # Si no están en sesión, buscar en BD
                    usuario_eduvia = Usuario.objects.get(rut=request.user.username)
                    eduvia_data = {
                        'rol': usuario_eduvia.rol,
                        'asignatura': getattr(usuario_eduvia, 'asignatura', None),
                    }
                    print(f"✓ Datos EDUVIA desde BD para historial: {eduvia_data}")
                
        except Usuario.DoesNotExist:
            if not es_superuser_django:
                print("✗ Usuario EDUVIA NO encontrado para historial")
                return JsonResponse({
                    'success': False,
                    'message': 'Usuario no encontrado en el sistema EDUVIA.'
                })
            else:
                # Si es superusuario pero no está en EDUVIA, usar datos por defecto
                eduvia_data = {
                    'rol': 'admin',
                    'asignatura': None,
                }
                print(f"✓ Superusuario sin datos EDUVIA para historial")
        
        # Verificar permisos usando los datos obtenidos
        es_admin = es_superuser_django or eduvia_data['rol'] == 'admin'
        es_profesor = eduvia_data['rol'] == 'profesor'
        
        print(f"Es admin: {es_admin}, Es profesor: {es_profesor}")
        
        if not (es_admin or es_profesor):
            return JsonResponse({
                'success': False,
                'message': 'No tienes permisos para ver el historial de notas'
            })
        
        alumno = get_object_or_404(Alumno, id=alumno_id)
        ano = request.GET.get('ano', timezone.now().year)
        
        # Si es profesor, solo puede ver notas de su materia
        if es_profesor and eduvia_data.get('asignatura'):
            materias_permitidas = [eduvia_data['asignatura']]
            print(f"Profesor - materias permitidas: {materias_permitidas}")
        else:
            # Administradores pueden ver todas las materias
            materias_permitidas = [
                'matematicas', 'lenguaje_basica', 'lenguaje', 'ciencias', 
                'historia', 'ingles', 'estudios_sociales', 'f_instrumental'
            ]
            print(f"Admin - todas las materias permitidas")
        
        # Obtener notas del alumno
        notas = Nota.objects.filter(
            alumno=alumno,
            ano=ano,
            materia__in=materias_permitidas
        ).order_by('materia', 'semestre', 'numero_nota')
        
        print(f"Notas encontradas: {notas.count()}")
        
        # Organizar notas por semestre y materia
        historial = {
            'semestre1': {},
            'semestre2': {}
        }
        
        materias_nombres = {
            'matematicas': '📐 Matemáticas',
            'lenguaje_basica': '📝 Lenguaje Básica',
            'lenguaje': '📝 Lenguaje',
            'ciencias': '🔬 Ciencias',
            'historia': '🏛️ Historia',
            'ingles': '🇺🇸 Inglés',
            'estudios_sociales': '🌍 Estudios Sociales',
            'f_instrumental': '🎵 F. Instrumental'
        }
        
        for nota in notas:
            semestre_key = f'semestre{nota.semestre}'
            materia = nota.materia
            
            if materia not in historial[semestre_key]:
                historial[semestre_key][materia] = {
                    'nombre': materias_nombres.get(materia, materia.title()),
                    'notas': {},
                    'promedio': 0
                }
            
            historial[semestre_key][materia]['notas'][f'nota{nota.numero_nota}'] = {
                'calificacion': float(nota.calificacion),
                'porcentaje': int(nota.porcentaje) if nota.porcentaje else None,
                'fecha_evaluacion': nota.fecha_evaluacion.strftime('%d/%m/%Y') if nota.fecha_evaluacion else None,
                'observaciones': nota.observaciones
            }
        
        # Calcular promedios por materia
        for semestre in ['semestre1', 'semestre2']:
            for materia in historial[semestre]:
                notas_materia = historial[semestre][materia]['notas']
                if notas_materia:
                    suma_total = 0.0
                    suma_porcentajes = 0
                    notas_con_porcentaje = 0
                    notas_sin_porcentaje = 0
                    suma_sin_porcentaje = 0.0
                    
                    for nota_data in notas_materia.values():
                        calificacion = float(nota_data['calificacion'])
                        porcentaje = nota_data['porcentaje']
                        
                        if porcentaje and porcentaje > 0:
                            contribucion = (calificacion * float(porcentaje)) / 100.0
                            suma_total += contribucion
                            suma_porcentajes += porcentaje
                            notas_con_porcentaje += 1
                        else:
                            suma_sin_porcentaje += calificacion
                            notas_sin_porcentaje += 1
                    
                    # Calcular promedio
                    if notas_con_porcentaje > 0 and notas_sin_porcentaje > 0:
                        porcentaje_restante = 100 - suma_porcentajes
                        promedio_sin_porcentaje = suma_sin_porcentaje / notas_sin_porcentaje
                        contribucion_sin_porcentaje = (promedio_sin_porcentaje * float(porcentaje_restante)) / 100.0
                        promedio = suma_total + contribucion_sin_porcentaje
                    elif notas_con_porcentaje > 0:
                        promedio = suma_total
                    else:
                        promedio = suma_sin_porcentaje / notas_sin_porcentaje if notas_sin_porcentaje > 0 else 0
                    
                    historial[semestre][materia]['promedio'] = round(promedio, 1)
        
        print("✓ Historial procesado correctamente")
        
        return JsonResponse({
            'success': True,
            'alumno': {
                'id': alumno.id,
                'nombre': alumno.nombre_completo,
                'rut': alumno.rut,
                'nivel': alumno.nivel
            },
            'ano': ano,
            'historial': historial,
            'es_profesor': es_profesor,
            'materia_profesor': eduvia_data.get('asignatura') if es_profesor else None
        })
        
    except Exception as e:
        print(f"Error en obtener_historial_notas: {e}")
        return JsonResponse({
            'success': False,
            'message': f'Error al obtener el historial: {str(e)}'
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

@login_required
@require_http_methods(["POST"])
def cambiar_ano_sistema(request):
    """Vista para cambiar el año académico del sistema (solo administradores)"""
    try:
        # Verificar que sea administrador
        if not request.user.is_superuser:
            return JsonResponse({
                'success': False,
                'message': 'No tienes permisos para cambiar el año académico del sistema'
            })
        
        nuevo_ano = int(request.POST.get('ano'))
        
        if nuevo_ano < 2020:
            return JsonResponse({
                'success': False,
                'message': 'El año debe ser 2020 o posterior'
            })
        
        # Verificar que el año exista en la base de datos
        ano_obj, created = AnoAcademico.objects.get_or_create(ano=nuevo_ano)
        
        if created:
            print(f"Año académico {nuevo_ano} creado automáticamente")
        
        return JsonResponse({
            'success': True,
            'message': f'Año académico cambiado a {nuevo_ano}',
            'ano': nuevo_ano
        })
        
    except (ValueError, TypeError):
        return JsonResponse({
            'success': False,
            'message': 'Año inválido'
        })
    except Exception as e:
        print(f"Error en cambiar_ano_sistema: {e}")
        return JsonResponse({
            'success': False,
            'message': f'Error interno: {str(e)}'
        })

@login_required
def obtener_ano_sistema(request):
    """Vista para obtener el año académico actual del sistema"""
    try:
        # Por ahora, devolver el año actual o el más reciente en la BD
        try:
            ano_actual = AnoAcademico.objects.latest('ano').ano
        except AnoAcademico.DoesNotExist:
            ano_actual = timezone.now().year
        
        return JsonResponse({
            'success': True,
            'ano': ano_actual
        })
        
    except Exception as e:
        print(f"Error en obtener_ano_sistema: {e}")
        return JsonResponse({
            'success': False,
            'message': f'Error: {str(e)}'
        })
