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
from .models import Nota, AnoAcademico, PromedioMateria
from usuarios.models import Usuario
from datetime import datetime, date
from .models import Nota, PromedioMateria
from alumnos.models import Alumno, AnoAcademico, AlumnoAno
from decimal import Decimal
from .models import Nota, Alumno, AnoAcademico  # Ajusta según tus modelos
from django.http import HttpResponse
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from io import BytesIO
import datetime


@login_required
def notas_generales(request):
    """Vista para administradores y profesores - ACTUALIZADA PARA AÑOS ACADÉMICOS"""
    
    print("=== INICIO DE VISTA NOTAS_GENERALES (AÑOS ACADÉMICOS) ===")
    print(f"Usuario Django: {request.user}")
    print(f"Username: {request.user.username}")
    print(f"Is superuser: {request.user.is_superuser}")
    
    # Variables globales
    currentAlumnoId = None
    currentMateria = None
    currentSemestre = None                                                                 
    currentAnoAcademicoId = None
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
                    'asignatura': getattr(usuario_eduvia, 'asignatura', None),  # CORREGIDO: usar 'asignatura' en lugar de 'funcion'
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
    ano_academico_id = request.GET.get('ano_academico')
    
    try:
        # Obtener todos los años académicos disponibles
        anos_academicos = AnoAcademico.objects.all().order_by('-ano')
        
        if ano_academico_id:
            # Si se especifica un año académico, usarlo
            ano_academico_actual = get_object_or_404(AnoAcademico, id=ano_academico_id)
        else:
            # Si no se especifica, usar el activo o el más reciente
            ano_academico_actual = anos_academicos.filter(activo=True).first()
            if not ano_academico_actual:
                ano_academico_actual = anos_academicos.first()
        
        # Si no hay años académicos, crear uno por defecto
        if not ano_academico_actual:
            ano_academico_actual = AnoAcademico.objects.create(
                ano=timezone.now().year,
                activo=True
            )
            anos_academicos = AnoAcademico.objects.all().order_by('-ano')
            
    except Exception as e:
        print(f"Error manejando años académicos: {e}")
        # Crear año académico por defecto
        ano_academico_actual = AnoAcademico.objects.create(
            ano=timezone.now().year,
            activo=True
        )
        anos_academicos = AnoAcademico.objects.all().order_by('-ano')
    
    print(f"Año académico actual: {ano_academico_actual}")
    
    # Determinar si es administrador o profesor
    es_admin = es_superuser_django or eduvia_data['rol'] == 'admin'
    es_profesor = eduvia_data['rol'] == 'profesor'
    
    print(f"Es admin: {es_admin}, Es profesor: {es_profesor}")
    print(f"Asignatura del usuario: {eduvia_data.get('asignatura')}")
    
    # CORRECCIÓN CRÍTICA: Verificación mejorada para profesores
    if es_profesor:
        # Para profesores, verificar que tengan asignatura
        asignatura = eduvia_data.get('asignatura')
        print(f"🔍 Verificando asignatura del profesor: '{asignatura}'")
        
        if not asignatura:
            # Si no se encuentra en eduvia_data, intentar obtenerla directamente del modelo
            try:
                usuario_eduvia = Usuario.objects.get(rut=request.user.username)
                asignatura = usuario_eduvia.asignatura
                print(f"🔍 Asignatura obtenida directamente del modelo: '{asignatura}'")
                
                # Actualizar eduvia_data para futuras referencias
                eduvia_data['asignatura'] = asignatura
            except (Usuario.DoesNotExist, AttributeError) as e:
                print(f"❌ Error obteniendo asignatura del modelo: {e}")
                asignatura = None
        
        if asignatura:
            # IMPORTANTE: Para profesores, SIEMPRE usar su asignatura
            materia_filter = asignatura
            print(f"✅ Profesor con asignatura confirmada: {materia_filter}")
        else:
            print("❌ Profesor SIN asignatura asignada")
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
    print(f"  - Año académico: {ano_academico_actual.ano}")
    
    # Base queryset de alumnos FILTRADO POR AÑO ACADÉMICO
    try:
        # FILTRAR ALUMNOS POR AÑO ACADÉMICO ESPECÍFICO
        alumnos_query = Alumno.objects.filter(
            anos_academicos__ano_academico=ano_academico_actual,
            anos_academicos__activo=True
        ).distinct()
        
        # Filtrar por estado activo (redundante pero por seguridad)
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
    
    # Para profesores, SIEMPRE mostrar alumnos (tienen materia fija)
    # Para administradores, solo si hay materia seleccionada
    if materia_filter:
        try:
            alumnos = alumnos_query.order_by('apellido_paterno', 'apellido_materno', 'primer_nombre')
            
            # Calcular promedio general usando PromedioMateria
            try:
                promedios_materia = PromedioMateria.objects.filter(
                    materia=materia_filter,
                    semestre=int(semestre_filter),
                    ano_academico=ano_academico_actual,
                    alumno__in=alumnos,
                    promedio__isnull=False
                )
                
                if promedios_materia.exists():
                    promedio_general = promedios_materia.aggregate(Avg('promedio'))['promedio__avg'] or 0
                else:
                    promedio_general = 0
                    
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
        'ano_academico_actual': ano_academico_actual,
        'anos_academicos': anos_academicos,
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
    """Vista para obtener las notas de un alumno específico - ACTUALIZADA"""
    try:
        materia = request.GET.get('materia')
        semestre = int(request.GET.get('semestre', 1))
        ano_academico_id = request.GET.get('ano_academico_id')
        
        # Si no se proporciona ano_academico_id, usar el activo
        if ano_academico_id:
            ano_academico = get_object_or_404(AnoAcademico, id=ano_academico_id)
        else:
            ano_academico = AnoAcademico.objects.filter(activo=True).first()
            if not ano_academico:
                ano_academico = AnoAcademico.objects.first()
        
        alumno = get_object_or_404(Alumno, id=alumno_id)
        
        notas = Nota.objects.filter(
            alumno=alumno,
            materia=materia,
            semestre=semestre,
            ano_academico=ano_academico
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
    """Guardar una nota individual con manejo correcto de tipos Decimal"""
    try:
        # Obtener datos del formulario
        alumno_id = request.POST.get('alumno_id')
        materia = request.POST.get('materia')
        semestre = request.POST.get('semestre')
        numero_nota = request.POST.get('numero_nota')
        ano_academico_id = request.POST.get('ano_academico_id')
        calificacion_str = request.POST.get('calificacion')
        porcentaje_str = request.POST.get('porcentaje')
        fecha_evaluacion = request.POST.get('fecha_evaluacion')
        observaciones = request.POST.get('observaciones', '')
        
        # Validar datos requeridos
        if not all([alumno_id, materia, semestre, numero_nota, ano_academico_id, calificacion_str]):
            return JsonResponse({
                'success': False,
                'message': 'Faltan datos requeridos'
            })
        
        # Convertir calificación con manejo de errores robusto
        try:
            calificacion = Decimal(str(calificacion_str).strip())
        except (ValueError, TypeError, Exception):
            return JsonResponse({
                'success': False,
                'message': 'Calificación inválida'
            })
        
        # Manejar porcentaje (opcional) con manejo de errores robusto
        porcentaje = None
        if porcentaje_str and str(porcentaje_str).strip():
            try:
                porcentaje = Decimal(str(porcentaje_str).strip())
            except (ValueError, TypeError, Exception):
                return JsonResponse({
                    'success': False,
                    'message': 'Porcentaje inválido'
                })
        
        # Validar rangos
        if calificacion < Decimal('1.0') or calificacion > Decimal('7.0'):
            return JsonResponse({
                'success': False,
                'message': 'La calificación debe estar entre 1.0 y 7.0'
            })
        
        if porcentaje is not None and (porcentaje < Decimal('0') or porcentaje > Decimal('100')):
            return JsonResponse({
                'success': False,
                'message': 'El porcentaje debe estar entre 0 y 100'
            })
        
        # Obtener objetos necesarios
        try:
            alumno = get_object_or_404(Alumno, id=alumno_id)
            ano_academico = get_object_or_404(AnoAcademico, id=ano_academico_id)
        except Exception:
            return JsonResponse({
                'success': False,
                'message': 'Alumno o año académico no encontrado'
            })
        
        # Verificar que el año académico esté activo para edición
        if not ano_academico.activo:
            return JsonResponse({
                'success': False,
                'message': 'Solo se pueden editar notas del año académico activo'
            })
        
        # Buscar o crear la nota
        try:
            nota, created = Nota.objects.get_or_create(
                alumno=alumno,
                materia=materia,
                semestre=int(semestre),
                ano=ano_academico.ano,
                numero_nota=int(numero_nota),
                defaults={
                    'calificacion': calificacion,
                    'porcentaje': porcentaje,
                    'fecha_evaluacion': fecha_evaluacion,
                    'observaciones': observaciones
                }
            )
            
            # Si la nota ya existía, actualizarla
            if not created:
                nota.calificacion = calificacion
                nota.porcentaje = porcentaje
                nota.fecha_evaluacion = fecha_evaluacion
                nota.observaciones = observaciones
                nota.save()
            
            return JsonResponse({
                'success': True,
                'message': 'Nota guardada correctamente',
                'calificacion': str(calificacion),
                'porcentaje': str(porcentaje) if porcentaje else None,
                'alumno_id': alumno_id,
                'numero_nota': numero_nota,
                'created': created
            })
            
        except Exception as e:
            return JsonResponse({
                'success': False,
                'message': f'Error al guardar en la base de datos: {str(e)}'
            })
        
    except Exception as e:
        print(f"Error completo en guardar_nota: {e}")
        return JsonResponse({
            'success': False,
            'message': f'Error interno del servidor: {str(e)}'
        })

@login_required
@require_http_methods(["POST"])
def cambiar_ano_academico(request):
    """Vista para cambiar el año académico activo del sistema"""
    try:
        # Verificar que sea administrador
        if not request.user.is_superuser:
            try:
                usuario_eduvia = Usuario.objects.get(rut=request.user.username)
                if usuario_eduvia.rol != 'admin':
                    return JsonResponse({
                        'success': False,
                        'message': 'No tienes permisos para cambiar el año académico del sistema'
                    })
            except Usuario.DoesNotExist:
                return JsonResponse({
                    'success': False,
                    'message': 'Usuario no encontrado en el sistema EDUVIA'
                })
        
        ano_academico_id = request.POST.get('ano_academico_id')
        ano_academico = get_object_or_404(AnoAcademico, id=ano_academico_id)
        
        # Desactivar todos los años académicos
        AnoAcademico.objects.all().update(activo=False)
        
        # Activar el año seleccionado
        ano_academico.activo = True
        ano_academico.save()
        
        return JsonResponse({
            'success': True,
            'message': f'Año académico {ano_academico.ano} activado correctamente',
            'ano_academico': {
                'id': ano_academico.id,
                'ano': ano_academico.ano,
                'activo': ano_academico.activo
            }
        })
        
    except Exception as e:
        print(f"Error en cambiar_ano_academico: {e}")
        return JsonResponse({
            'success': False,
            'message': f'Error interno: {str(e)}'
        })

@login_required
@require_http_methods(["POST"])
def agregar_ano_academico(request):
    """Vista para agregar un nuevo año académico"""












    if request.method == 'POST':
        try:
            nuevo_ano = int(request.POST.get('nuevo_ano_academico'))
            
            if nuevo_ano < 2025:
                return JsonResponse({
                    'success': False,

                    'message': 'El año debe ser 2025 o posterior'
                })




            
            ano_academico, created = AnoAcademico.objects.get_or_create(
                ano=nuevo_ano,
                defaults={'activo': True}
            )
            
            if created:
                return JsonResponse({
                    'success': True,
                    'message': f'Año académico {nuevo_ano} agregado correctamente',
                    'ano_academico': {
                        'id': ano_academico.id,
                        'ano': ano_academico.ano,
                        'activo': ano_academico.activo
                    }
                })
            else:
                return JsonResponse({
                    'success': False,
                    'message': f'El año académico {nuevo_ano} ya existe'
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

def agregar_ano(request):
    """Vista de compatibilidad - redirige a agregar_ano_academico"""
    return agregar_ano_academico(request)

@login_required
@require_http_methods(["POST"])
def cambiar_ano_sistema(request):
    """Vista de compatibilidad - redirige a cambiar_ano_academico"""
    return cambiar_ano_academico(request)

@login_required
def obtener_ano_sistema(request):
    """Vista de compatibilidad - redirige a obtener_ano_academico_activo"""
    return obtener_ano_academico_activo(request)

@login_required
@require_http_methods(["POST"])
def activar_ano_academico(request):
    """Vista para activar un año académico específico"""
    try:
        # Verificar permisos
        if not request.user.is_superuser:
            try:
                usuario_eduvia = Usuario.objects.get(rut=request.user.username)
                if usuario_eduvia.rol != 'admin':
                    return JsonResponse({
                        'success': False,
                        'message': 'No tienes permisos para activar años académicos'
                    })
            except Usuario.DoesNotExist:
                return JsonResponse({
                    'success': False,
                    'message': 'Usuario no encontrado en el sistema EDUVIA'
                })
        
        ano_academico_id = request.POST.get('ano_academico_id')
        ano_academico = get_object_or_404(AnoAcademico, id=ano_academico_id)
        
        # Desactivar todos los años académicos
        AnoAcademico.objects.all().update(activo=False)
        
        # Activar el año seleccionado
        ano_academico.activo = True
        ano_academico.save()
        
        return JsonResponse({
            'success': True,
            'message': f'Año académico {ano_academico.ano} activado correctamente'
        })
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': f'Error al activar el año académico: {str(e)}'
        })

@login_required
def obtener_ano_academico_activo(request):
    """Vista para obtener el año académico activo actual"""
    try:
        ano_academico_activo = AnoAcademico.objects.filter(activo=True).order_by('-ano').first()
        
        if not ano_academico_activo:
            # Si no hay años activos, crear uno para el año actual
            ano_academico_activo = AnoAcademico.objects.create(
                ano=timezone.now().year,
                activo=True
            )
        
        return JsonResponse({
            'success': True,
            'ano_academico': {
                'id': ano_academico_activo.id,
                'ano': ano_academico_activo.ano,
                'activo': ano_academico_activo.activo
            }
        })
        
    except Exception as e:
        print(f"Error en obtener_ano_academico_activo: {e}")
        return JsonResponse({
            'success': False,
            'message': f'Error: {str(e)}'
        })

@login_required
def obtener_historial_notas(request, alumno_id):
    """Vista para obtener el historial completo de notas de un alumno - ACTUALIZADA"""
    try:
        print("=== OBTENER HISTORIAL NOTAS (AÑOS ACADÉMICOS) ===")
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
        
        # Obtener año académico
        ano_academico_id = request.GET.get('ano_academico_id')
        if ano_academico_id:
            ano_academico = get_object_or_404(AnoAcademico, id=ano_academico_id)
        else:
            ano_academico = AnoAcademico.objects.filter(activo=True).first()
            if not ano_academico:
                ano_academico = AnoAcademico.objects.first()
        
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
            ano_academico=ano_academico,
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
        
        # Calcular promedios por materia usando PromedioMateria
        for semestre in ['semestre1', 'semestre2']:
            semestre_num = 1 if semestre == 'semestre1' else 2
            
            for materia in historial[semestre]:
                try:
                    promedio_obj = PromedioMateria.objects.get(
                        alumno=alumno,
                        materia=materia,
                        semestre=semestre_num,
                        ano_academico=ano_academico
                    )
                    historial[semestre][materia]['promedio'] = float(promedio_obj.promedio) if promedio_obj.promedio else 0
                except PromedioMateria.DoesNotExist:
                    # Si no existe el promedio calculado, calcularlo manualmente
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
                        
                        historial[semestre][materia]['promedio'] = round(promedio, 3)
        
        print("✓ Historial procesado correctamente")
        
        return JsonResponse({
            'success': True,
            'alumno': {
                'id': alumno.id,
                'nombre': alumno.nombre_completo,
                'rut': alumno.rut,
                'nivel': alumno.nivel
            },
            'ano_academico': {
                'id': ano_academico.id,
                'ano': ano_academico.ano,
                'activo': ano_academico.activo
            },
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
    """Vista para eliminar una nota individual - ACTUALIZADA"""
    try:
        alumno_id = request.POST.get('alumno_id')
        materia = request.POST.get('materia')
        semestre = int(request.POST.get('semestre'))
        ano_academico_id = request.POST.get('ano_academico_id')
        numero_nota = int(request.POST.get('numero_nota'))
        
        # Obtener año académico
        ano_academico = get_object_or_404(AnoAcademico, id=ano_academico_id)
        
        # Buscar y eliminar la nota
        nota = Nota.objects.filter(
            alumno_id=alumno_id,
            materia=materia,
            semestre=semestre,
            ano_academico=ano_academico,
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
def obtener_anos_academicos(request):
    """Vista para obtener la lista de años académicos disponibles"""
    try:
        anos_academicos = AnoAcademico.objects.all().order_by('-ano')
        
        data = []
        for ano in anos_academicos:
            data.append({
                'id': ano.id,
                'ano': ano.ano,
                'activo': ano.activo,
                'fecha_creacion': ano.fecha_creacion.strftime('%d/%m/%Y') if ano.fecha_creacion else None
            })
        
        return JsonResponse({
            'success': True,
            'anos_academicos': data
        })
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': f'Error al obtener años académicos: {str(e)}'
        })

@login_required
def obtener_ano_academico_activo(request):
    """Vista para obtener el año académico activo actual"""
    try:
        ano_activo = AnoAcademico.objects.filter(activo=True).first()
        
        if not ano_activo:
            # Si no hay año activo, usar el más reciente
            ano_activo = AnoAcademico.objects.order_by('-ano').first()
        
        if not ano_activo:
            # Si no hay años académicos, crear uno para el año actual
            ano_actual = timezone.now().year
            ano_activo = AnoAcademico.objects.create(ano=ano_actual, activo=True)
        
        return JsonResponse({
            'success': True,
            'ano_academico': {
                'id': ano_activo.id,
                'ano': ano_activo.ano,
                'activo': ano_activo.activo
            }
        })
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': f'Error: {str(e)}'
        })

@login_required
@require_http_methods(["POST"])
def sincronizar_ano_academico(request):
    """Vista para sincronizar el año académico seleccionado con el servidor"""
    try:
        data = json.loads(request.body)
        ano_academico_id = data.get('ano_academico_id')
        
        if not ano_academico_id:
            return JsonResponse({
                'success': False,
                'message': 'ID de año académico requerido'
            })
        
        ano_academico = get_object_or_404(AnoAcademico, id=ano_academico_id)
        
        # Aquí podrías agregar lógica adicional de sincronización
        # Por ejemplo, actualizar la sesión del usuario, logs, etc.
        
        return JsonResponse({
            'success': True,
            'message': 'Año académico sincronizado correctamente',
            'ano_academico': {
                'id': ano_academico.id,
                'ano': ano_academico.ano,
                'activo': ano_academico.activo
            }
        })
        
    except json.JSONDecodeError:
        return JsonResponse({
            'success': False,
            'message': 'Datos JSON inválidos'
        })
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': f'Error en sincronización: {str(e)}'
        })
    
def exportar_historial_pdf(request, alumno_id):
    # Obtener el año académico
    ano_academico_id = request.GET.get('ano_academico_id', None)
    
    # Obtener los mismos datos que usamos para el historial
    try:
        alumno = Alumno.objects.get(id=alumno_id)
        
        if ano_academico_id:
            ano_academico = AnoAcademico.objects.get(id=ano_academico_id)
        else:
            ano_academico = AnoAcademico.objects.filter(activo=True).first()
            
        if not ano_academico:
            return HttpResponse("No hay un año académico activo o seleccionado", status=400)
        
        # Obtener historial de notas para ambos semestres
        historial = {
            'semestre1': {},
            'semestre2': {}
        }
        
        # Definir las materias a incluir
        materias = [
            ('matematicas', 'Matemáticas'),
            ('lenguaje', 'Lenguaje y Comunicación'),
            ('ciencias', 'Ciencias Naturales'),
            ('historia', 'Historia y Geografía'),
            ('ingles', 'Inglés'),
            ('estudios_sociales', 'Estudios Sociales'),
            ('f_instrumental', 'F. Instrumental')
        ]
        
        # Obtener notas para cada materia y semestre
        for codigo_materia, nombre_materia in materias:
            for semestre in [1, 2]:
                notas_semestre = {}
                
                # Obtener notas para esta materia y semestre
                for i in range(1, 7):  # 6 notas por semestre
                    try:
                        nota = Nota.objects.get(
                            alumno=alumno,
                            materia=codigo_materia,
                            semestre=semestre,
                            numero_nota=i,
                            ano_academico=ano_academico
                        )
                        notas_semestre[f'nota{i}'] = {
                            'calificacion': nota.calificacion,
                            'porcentaje': nota.porcentaje
                        }
                    except Nota.DoesNotExist:
                        pass
                
                # Calcular promedio si hay notas
                if notas_semestre:
                    # Calcular promedio considerando porcentajes
                    promedio = calcular_promedio_con_porcentajes(notas_semestre)
                    
                    # Agregar al historial
                    semestre_key = f'semestre{semestre}'
                    historial[semestre_key][codigo_materia] = {
                        'nombre': nombre_materia,
                        'notas': notas_semestre,
                        'promedio': promedio
                    }
        
        # Crear el PDF
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter)
        elements = []
        
        # Estilos
        styles = getSampleStyleSheet()
        title_style = styles['Heading1']
        subtitle_style = styles['Heading2']
        normal_style = styles['Normal']
        
        # Título
        elements.append(Paragraph(f"Historial de Notas - {alumno.primer_nombre} {alumno.segundo_nombre}", title_style))
        elements.append(Paragraph(f"RUT: {alumno.rut} - Nivel: {alumno.nivel}", normal_style))
        elements.append(Paragraph(f"Año Académico: {ano_academico.ano}", normal_style))
        elements.append(Spacer(1, 0.25*inch))
        
        # Generar tablas para cada semestre
        for semestre in [1, 2]:
            semestre_key = f'semestre{semestre}'
            elements.append(Paragraph(f"{semestre}° Semestre", subtitle_style))
            
            if not historial[semestre_key]:
                elements.append(Paragraph("No hay notas registradas para este semestre", normal_style))
                elements.append(Spacer(1, 0.25*inch))
                continue
            
            # Crear datos para la tabla
            data = [
                ['Materia', 'Nota 1', 'Nota 2', 'Nota 3', 'Nota 4', 'Nota 5', 'Nota 6', 'Promedio', 'Estado']
            ]
            
            # Agregar filas para cada materia
            for codigo_materia, info_materia in historial[semestre_key].items():
                row = [info_materia['nombre']]
                
                # Agregar notas
                for i in range(1, 7):
                    nota_key = f'nota{i}'
                    if nota_key in info_materia['notas']:
                        nota = info_materia['notas'][nota_key]
                        valor = f"{nota['calificacion']}"
                        if nota.get('porcentaje'):
                            valor += f"\n({nota['porcentaje']}%)"
                        row.append(valor)
                    else:
                        row.append('--')
                
                # Agregar promedio y estado
                promedio = info_materia['promedio']
                row.append(f"{promedio:.3f}" if promedio else '--')
                
                if promedio:
                    estado = "Aprobado" if promedio >= 4.0 else "Reprobado"
                else:
                    estado = "Sin notas"
                row.append(estado)
                
                data.append(row)
            
            # Crear tabla
            table = Table(data, colWidths=[1.5*inch] + [0.6*inch]*6 + [0.8*inch, 0.8*inch])
            
            # Estilo de tabla
            table_style = TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 10),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                ('TEXTCOLOR', (0, 1), (-1, -1), colors.black),
                ('ALIGN', (1, 1), (-2, -1), 'CENTER'),
                ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
                ('FONTSIZE', (0, 1), (-1, -1), 9),
                ('GRID', (0, 0), (-1, -1), 1, colors.black),
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ])
            
            # Colorear estados
            for i, row in enumerate(data[1:], 1):
                estado = row[-1]
                if estado == "Aprobado":
                    table_style.add('TEXTCOLOR', (-1, i), (-1, i), colors.green)
                    table_style.add('FONTNAME', (-1, i), (-1, i), 'Helvetica-Bold')
                elif estado == "Reprobado":
                    table_style.add('TEXTCOLOR', (-1, i), (-1, i), colors.red)
                    table_style.add('FONTNAME', (-1, i), (-1, i), 'Helvetica-Bold')
            
            table.setStyle(table_style)
            elements.append(table)
            elements.append(Spacer(1, 0.25*inch))
            
            # Calcular estadísticas del semestre
            materias_con_notas = len(historial[semestre_key])
            total_notas = sum(len(info['notas']) for info in historial[semestre_key].values())
            promedios = [info['promedio'] for info in historial[semestre_key].values() if info['promedio']]
            
            promedio_general = sum(promedios) / len(promedios) if promedios else 0
            
            # Agregar resumen del semestre
            elements.append(Paragraph("Resumen del Semestre:", styles['Heading3']))
            elements.append(Paragraph(f"- Materias con notas: {materias_con_notas}", normal_style))
            elements.append(Paragraph(f"- Total de notas: {total_notas}", normal_style))
            elements.append(Paragraph(f"- Promedio general: {promedio_general:.3f}" if promedio_general else "- Promedio general: --", normal_style))
            
            if promedio_general:
                estado_general = "Aprobado" if promedio_general >= 4.0 else "Reprobado"
                elements.append(Paragraph(f"- Estado general: {estado_general}", normal_style))
            else:
                elements.append(Paragraph("- Estado general: Sin datos", normal_style))
            
            elements.append(Spacer(1, 0.5*inch))
        
        # Agregar fecha de generación
        elements.append(Spacer(1, 0.5*inch))
        fecha_actual = datetime.datetime.now().strftime("%d/%m/%Y %H:%M:%S")
        elements.append(Paragraph(f"Documento generado el {fecha_actual}", normal_style))
        
        
        # Construir PDF
        doc.build(elements)
        
        # Preparar respuesta
        buffer.seek(0)
        response = HttpResponse(buffer, content_type='application/pdf')
        filename = f"historial_notas_{alumno.primer_nombre}_{alumno.segundo_nombre}_{ano_academico.ano}.pdf"
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        
        return response
        
    except Alumno.DoesNotExist:
        return HttpResponse("Alumno no encontrado", status=404)
    except AnoAcademico.DoesNotExist:
        return HttpResponse("Año académico no encontrado", status=404)
    except Exception as e:
        return HttpResponse(f"Error al generar el PDF: {str(e)}", status=500)

def calcular_promedio_con_porcentajes(notas_dict):
    """
    Calcula el promedio considerando porcentajes si existen.
    Esta función replica la lógica del cálculo en JavaScript.
    """
    notas_para_promedio = []
    
    # Convertir el diccionario de notas a una lista de objetos
    for nota_key, nota_data in notas_dict.items():
        if 'calificacion' in nota_data and nota_data['calificacion']:
            valor = float(nota_data['calificacion'])
            porcentaje = float(nota_data['porcentaje']) if 'porcentaje' in nota_data and nota_data['porcentaje'] else None
            
            if porcentaje and porcentaje > 0:
                contribucion = (valor * porcentaje) / 100
                notas_para_promedio.append({
                    'valor': valor,
                    'porcentaje': porcentaje,
                    'contribucion': contribucion
                })
            else:
                notas_para_promedio.append({
                    'valor': valor,
                    'porcentaje': None,
                    'contribucion': valor
                })
    
    if not notas_para_promedio:
        return None
    
    # Verificar si hay notas con porcentaje
    notas_con_porcentaje = [n for n in notas_para_promedio if n['porcentaje']]
    hay_porcentajes = len(notas_con_porcentaje) > 0
    
    if hay_porcentajes:
        suma_total = sum(n['contribucion'] for n in notas_con_porcentaje)
        suma_porcentajes = sum(n['porcentaje'] for n in notas_con_porcentaje)
        
        notas_sin_porcentaje = [n for n in notas_para_promedio if not n['porcentaje']]
        
        if suma_porcentajes == 100:
            # Solo porcentajes que suman 100%
            return suma_total
        elif notas_sin_porcentaje:
            # Mezcla de notas con y sin porcentaje
            suma_sin_porcentaje = sum(n['valor'] for n in notas_sin_porcentaje)
            porcentaje_restante = max(0, 100 - suma_porcentajes)
            
            if porcentaje_restante > 0:
                promedio_sin_porcentaje = suma_sin_porcentaje / len(notas_sin_porcentaje)
                contribucion_sin_porcentaje = (promedio_sin_porcentaje * porcentaje_restante) / 100
                return suma_total + contribucion_sin_porcentaje
            else:
                return suma_total
        else:
            # Solo notas con porcentaje pero no suman 100%
            return (suma_total * 100) / suma_porcentajes
    else:
        # Cálculo tradicional (promedio simple)
        suma = sum(n['valor'] for n in notas_para_promedio)
        return suma / len(notas_para_promedio)

@login_required
def exportar_notas_ano_academico(request):
    """Vista para exportar todas las notas de un año académico específico"""
    try:
        # Verificar permisos de administrador
        es_superuser_django = request.user.is_superuser
        es_admin_eduvia = False
        
        if not es_superuser_django:
            try:
                usuario_eduvia = Usuario.objects.get(rut=request.user.username)
                es_admin_eduvia = usuario_eduvia.rol == 'admin'
            except Usuario.DoesNotExist:
                pass
        
        if not (es_superuser_django or es_admin_eduvia):
            return JsonResponse({
                'success': False,
                'message': 'No tienes permisos para exportar datos'
            })
        
        ano_academico_id = request.GET.get('ano_academico_id')
        if not ano_academico_id:
            return JsonResponse({
                'success': False,
                'message': 'ID de año académico requerido'
            })
        
        ano_academico = get_object_or_404(AnoAcademico, id=ano_academico_id)
        
        # Obtener todas las notas del año académico
        notas = Nota.objects.filter(ano=ano_academico.ano).select_related('alumno').order_by(
            'alumno__apellido_paterno',
            'alumno__apellido_materno',
            'alumno__primer_nombre',
            'materia',
            'semestre',
            'numero_nota'
        )
        
        # Crear respuesta CSV
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="notas_{ano_academico.ano}.csv"'
        response.write('\ufeff')  # BOM para UTF-8
        
        writer = csv.writer(response)
        
        # Escribir encabezados
        writer.writerow([
            'RUT Alumno',
            'Nombre Completo',
            'Nivel',
            'Materia',
            'Semestre',
            'Número Nota',
            'Calificación',
            'Porcentaje',
            'Fecha Evaluación',
            'Observaciones',
            'Fecha Creación'
        ])
        
        # Escribir datos
        for nota in notas:
            writer.writerow([
                nota.alumno.rut,
                nota.alumno.nombre_completo,
                nota.alumno.nivel,
                nota.get_materia_display(),
                f"{nota.semestre}° Semestre",
                f"Nota {nota.numero_nota}",
                nota.calificacion,
                f"{nota.porcentaje}%" if nota.porcentaje else "Sin porcentaje",
                nota.fecha_evaluacion.strftime('%d/%m/%Y') if nota.fecha_evaluacion else '',
                nota.observaciones or '',
                nota.fecha_creacion.strftime('%d/%m/%Y %H:%M') if nota.fecha_creacion else ''
            ])
        
        return response
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': f'Error al exportar: {str(e)}'
        })

@login_required
def estadisticas_ano_academico(request):
    """Vista para obtener estadísticas de un año académico específico"""
    try:
        ano_academico_id = request.GET.get('ano_academico_id')
        if not ano_academico_id:
            return JsonResponse({
                'success': False,
                'message': 'ID de año académico requerido'
            })
        
        ano_academico = get_object_or_404(AnoAcademico, id=ano_academico_id)
        
        # Estadísticas básicas
        total_notas = Nota.objects.filter(ano=ano_academico.ano).count()
        total_alumnos_con_notas = Nota.objects.filter(ano=ano_academico.ano).values('alumno').distinct().count()
        
        # Estadísticas por materia
        materias_stats = {}
        materias_choices = dict(Nota.MATERIAS_CHOICES)
        
        for materia_key, materia_nombre in materias_choices.items():
            notas_materia = Nota.objects.filter(ano=ano_academico.ano, materia=materia_key)
            
            if notas_materia.exists():
                promedio_materia = notas_materia.aggregate(Avg('calificacion'))['calificacion__avg']
                alumnos_materia = notas_materia.values('alumno').distinct().count()
                
                materias_stats[materia_key] = {
                    'nombre': materia_nombre,
                    'total_notas': notas_materia.count(),
                    'total_alumnos': alumnos_materia,
                    'promedio': round(promedio_materia, 3) if promedio_materia else 0
                }
        
        # Estadísticas por semestre
        semestres_stats = {}
        for semestre in [1, 2]:
            notas_semestre = Nota.objects.filter(ano=ano_academico.ano, semestre=semestre)
            
            if notas_semestre.exists():
                promedio_semestre = notas_semestre.aggregate(Avg('calificacion'))['calificacion__avg']
                
                semestres_stats[f'semestre_{semestre}'] = {
                    'nombre': f'{semestre}° Semestre',
                    'total_notas': notas_semestre.count(),
                    'promedio': round(promedio_semestre, 3) if promedio_semestre else 0
                }
        
        # Promedios generales usando PromedioMateria
        promedios_generales = PromedioMateria.objects.filter(
            ano=ano_academico.ano,
            promedio__isnull=False
        )
        
        promedio_general_ano = 0
        if promedios_generales.exists():
            suma_promedios = promedios_generales.aggregate(Avg('promedio'))['promedio__avg']
            promedio_general_ano = round(suma_promedios, 3) if suma_promedios else 0
        
        return JsonResponse({
            'success': True,
            'estadisticas': {
                'ano_academico': {
                    'id': ano_academico.id,
                    'ano': ano_academico.ano,
                    'activo': ano_academico.activo
                },
                'generales': {
                    'total_notas': total_notas,
                    'total_alumnos_con_notas': total_alumnos_con_notas,
                    'promedio_general': promedio_general_ano
                },
                'por_materia': materias_stats,
                'por_semestre': semestres_stats
            }
        })
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': f'Error al obtener estadísticas: {str(e)}'
        })

@login_required
def migrar_notas_ano_academico(request):
    """Vista para migrar notas de un año académico a otro (solo administradores)"""
    if request.method != 'POST':
        return JsonResponse({
            'success': False,
            'message': 'Método no permitido'
        })
    
    try:
        # Verificar permisos de administrador
        es_superuser_django = request.user.is_superuser
        es_admin_eduvia = False
        
        if not es_superuser_django:
            try:
                usuario_eduvia = Usuario.objects.get(rut=request.user.username)
                es_admin_eduvia = usuario_eduvia.rol == 'admin'
            except Usuario.DoesNotExist:
                pass
        
        if not (es_superuser_django or es_admin_eduvia):
            return JsonResponse({
                'success': False,
                'message': 'No tienes permisos para migrar datos'
            })
        
        data = json.loads(request.body)
        ano_origen_id = data.get('ano_origen_id')
        ano_destino_id = data.get('ano_destino_id')
        
        if not ano_origen_id or not ano_destino_id:
            return JsonResponse({
                'success': False,
                'message': 'Se requieren ambos años académicos'
            })
        
        if ano_origen_id == ano_destino_id:
            return JsonResponse({
                'success': False,
                'message': 'Los años académicos deben ser diferentes'
            })
        
        ano_origen = get_object_or_404(AnoAcademico, id=ano_origen_id)
        ano_destino = get_object_or_404(AnoAcademico, id=ano_destino_id)
        
        # Obtener notas del año origen
        notas_origen = Nota.objects.filter(ano=ano_origen.ano)
        
        if not notas_origen.exists():
            return JsonResponse({
                'success': False,
                'message': f'No hay notas en el año {ano_origen.ano} para migrar'
            })
        
        # Verificar si ya existen notas en el año destino
        notas_destino_existentes = Nota.objects.filter(ano=ano_destino.ano).count()
        
        if notas_destino_existentes > 0:
            return JsonResponse({
                'success': False,
                'message': f'El año {ano_destino.ano} ya tiene {notas_destino_existentes} notas. No se puede migrar sobre datos existentes.'
            })
        
        # Realizar migración
        notas_migradas = 0
        
        for nota_origen in notas_origen:
            # Crear nueva nota en el año destino
            Nota.objects.create(
                alumno=nota_origen.alumno,
                materia=nota_origen.materia,
                semestre=nota_origen.semestre,
                numero_nota=nota_origen.numero_nota,
                calificacion=nota_origen.calificacion,
                porcentaje=nota_origen.porcentaje,
                fecha_evaluacion=nota_origen.fecha_evaluacion,
                observaciones=nota_origen.observaciones,
                ano=ano_destino.ano
            )
            notas_migradas += 1
        
        return JsonResponse({
            'success': True,
            'message': f'Se migraron {notas_migradas} notas del año {ano_origen.ano} al año {ano_destino.ano}',
            'notas_migradas': notas_migradas
        })
        
    except json.JSONDecodeError:
        return JsonResponse({
            'success': False,
            'message': 'Datos JSON inválidos'
        })
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': f'Error en migración: {str(e)}'
        })

# Vista legacy mantenida por compatibilidad
@login_required
def agregar_ano(request):
    """Vista legacy - redirige a agregar_ano_academico"""
    return agregar_ano_academico(request)

@login_required
@require_http_methods(["POST"])
def cambiar_ano_sistema(request):
    """Vista legacy - ahora maneja años académicos"""
    try:
        # Verificar que sea administrador
        if not request.user.is_superuser:
            try:
                usuario_eduvia = Usuario.objects.get(rut=request.user.username)
                if usuario_eduvia.rol != 'admin':
                    return JsonResponse({
                        'success': False,
                        'message': 'No tienes permisos para cambiar el año académico del sistema'
                    })
            except Usuario.DoesNotExist:
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
        ano_obj, created = AnoAcademico.objects.get_or_create(
            ano=nuevo_ano,
            defaults={'activo': False}
        )
        
        # Desactivar todos los años y activar el seleccionado
        AnoAcademico.objects.all().update(activo=False)
        ano_obj.activo = True
        ano_obj.save()
        
        if created:
            print(f"Año académico {nuevo_ano} creado automáticamente")
        
        return JsonResponse({
            'success': True,
            'message': f'Año académico cambiado a {nuevo_ano}',
            'ano_academico': {
                'id': ano_obj.id,
                'ano': ano_obj.ano,
                'activo': ano_obj.activo
            }
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
    """Vista legacy - ahora devuelve el año académico activo"""
    try:
        # Buscar el año académico activo
        ano_activo = AnoAcademico.objects.filter(activo=True).first()
        
        if not ano_activo:
            # Si no hay año activo, usar el más reciente
            ano_activo = AnoAcademico.objects.order_by('-ano').first()
        
        if not ano_activo:
            # Si no hay años académicos, crear uno para el año actual
            ano_actual = timezone.now().year
            ano_activo = AnoAcademico.objects.create(ano=ano_actual, activo=True)
        
        return JsonResponse({
            'success': True,
            'ano': ano_activo.ano,
            'ano_academico': {
                'id': ano_activo.id,
                'ano': ano_activo.ano,
                'activo': ano_activo.activo
            }
        })
        
    except Exception as e:
        print(f"Error en obtener_ano_sistema: {e}")
        return JsonResponse({
            'success': False,
            'message': f'Error: {str(e)}'
        })