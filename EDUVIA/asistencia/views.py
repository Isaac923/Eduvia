from django.shortcuts import render, get_object_or_404, redirect
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.utils import timezone
from django.db import transaction
from django.http import JsonResponse
from django.core.paginator import Paginator
from django.db.models import Q, Count
from .models import Asistencia, Asignatura, AsignaturaCurso
from alumnos.models import Alumno, AnoAcademico  # Agregué AnoAcademico aquí
from cursos.models import Curso
from usuarios.models import Usuario
from datetime import date
from django.urls import reverse
from collections import defaultdict, OrderedDict

def get_user_asignaturas(user):
    """Obtiene las asignaturas que puede gestionar el usuario"""
    if user.is_superuser:
        return AsignaturaCurso.objects.filter(activa=True).order_by('curso__nivel', 'curso__letra', 'asignatura__nombre')
    
    try:
        usuario_eduvia = Usuario.objects.get(rut=user.username)
        if usuario_eduvia.rol == 'profesor':
            # Buscar asignaturas donde este usuario es el profesor asignado
            return AsignaturaCurso.objects.filter(
                profesor=usuario_eduvia,
                activa=True
            ).order_by('curso__nivel', 'curso__letra', 'asignatura__nombre')
    except Usuario.DoesNotExist:
        pass
    
    return AsignaturaCurso.objects.none()

@login_required
def index_asistencia(request):
    """Vista principal del módulo de asistencia"""
    context = {
        'titulo': 'Módulo de Asistencia',
    }
    return render(request, 'asistencia/index.html', context)

@login_required
def seleccionar_asignatura(request):
    """Vista para seleccionar asignatura y curso para registrar asistencia"""
    # Manejar asignación de profesor si es POST
    if request.method == 'POST' and request.user.is_superuser:
        asignatura_curso_id = request.POST.get('asignatura_curso_id')
        profesor_id = request.POST.get('profesor_id')
        
        try:
            asignatura_curso = AsignaturaCurso.objects.get(id=asignatura_curso_id)
            
            if profesor_id:
                profesor = Usuario.objects.get(id=profesor_id)
                # CAMBIO: Usar update() en lugar de save() para evitar triggers del modelo
                AsignaturaCurso.objects.filter(id=asignatura_curso_id).update(profesor=profesor)
                messages.success(request, f'Profesor {profesor.nombre_completo()} asignado a {asignatura_curso} exitosamente.')
            else:
                # CAMBIO: Usar update() en lugar de save()
                AsignaturaCurso.objects.filter(id=asignatura_curso_id).update(profesor=None)
                messages.success(request, f'Profesor removido de {asignatura_curso} exitosamente.')
            
        except (AsignaturaCurso.DoesNotExist, Usuario.DoesNotExist):
            messages.error(request, 'Error al asignar profesor.')
        
        return redirect('asistencia:seleccionar_asignatura')
    
    asignaturas_disponibles = get_user_asignaturas(request.user)
    
    # Si es superusuario, mostrar todas las asignaturas-curso para gestión
    if request.user.is_superuser:
        todas_asignaturas_curso = AsignaturaCurso.objects.filter(activa=True).order_by('curso__nivel', 'curso__letra', 'asignatura__nombre')
        profesores = Usuario.objects.filter(rol='profesor', estado='active').order_by('nombres', 'apellidos')
    else:
        todas_asignaturas_curso = asignaturas_disponibles
        profesores = None
    
    # ÚNICO CAMBIO: Obtener año académico activo
    ano_academico_activo = AnoAcademico.get_ano_activo()
    
    context = {
        'titulo': 'Registrar Asistencia - Seleccionar Asignatura y Curso',
        'asignaturas': todas_asignaturas_curso,
        'profesores': profesores,
        'es_superusuario': request.user.is_superuser,
        'ano_academico_activo': ano_academico_activo,  # ÚNICO CAMBIO: Agregar año activo
    }
    return render(request, 'asistencia/seleccionar_asignatura.html', context)

@login_required
def gestionar_profesores(request):
    """Vista para asignar profesores a asignaturas (solo superusuarios)"""
    if not request.user.is_superuser:
        messages.error(request, 'No tiene permisos para acceder a esta sección.')
        return redirect('asistencia:index')
    
    asignaturas = Asignatura.objects.all().order_by('nombre')
    profesores = Usuario.objects.filter(rol='profesor', estado='active').order_by('nombres', 'apellidos')
    
    if request.method == 'POST':
        asignatura_id = request.POST.get('asignatura_id')
        profesor_id = request.POST.get('profesor_id')
        
        try:
            asignatura = Asignatura.objects.get(id=asignatura_id)
            
            if profesor_id:
                profesor = Usuario.objects.get(id=profesor_id)
                asignatura.profesor = profesor
                messages.success(request, f'Profesor {profesor.nombre_completo()} asignado a {asignatura} exitosamente.')
            else:
                asignatura.profesor = None
                messages.success(request, f'Profesor removido de {asignatura} exitosamente.')
            
            asignatura.save()
            
        except (Asignatura.DoesNotExist, Usuario.DoesNotExist):
            messages.error(request, 'Error al asignar profesor.')
    
    context = {
        'titulo': 'Gestionar Profesores por Asignatura',
        'asignaturas': asignaturas,
        'profesores': profesores,
    }
    return render(request, 'asistencia/gestionar_profesores.html', context)

@login_required
def tomar_asistencia(request, asignatura_curso_id):
    """Vista para tomar asistencia"""
    asignatura_curso = get_object_or_404(AsignaturaCurso, id=asignatura_curso_id)
    
    # Verificar permisos
    if not request.user.is_superuser:
        try:
            usuario_eduvia = Usuario.objects.get(rut=request.user.username)
            if usuario_eduvia.rol != 'profesor' or asignatura_curso.profesor != usuario_eduvia:
                messages.error(request, 'No tiene permisos para gestionar esta asignatura.')
                return redirect('asistencia:seleccionar_asignatura')
        except Usuario.DoesNotExist:
            messages.error(request, 'Usuario no encontrado.')
            return redirect('asistencia:seleccionar_asignatura')
    
    # CAMBIO: Obtener alumnos por nivel en lugar de usar la relación ManyToMany
    nivel_curso = f"{asignatura_curso.curso.nivel}{asignatura_curso.curso.letra.upper()}"
    
    # NUEVO: Obtener año académico activo
    from alumnos.models import AnoAcademico, AlumnoAno
    ano_academico = AnoAcademico.get_ano_activo()
    if not ano_academico:
        messages.error(request, 'No hay un año académico activo configurado.')
        return redirect('asistencia:seleccionar_asignatura')
    
    # CAMBIO: Obtener alumnos del año académico activo con el nivel correspondiente
    alumnos_ano = AlumnoAno.objects.filter(
        ano_academico=ano_academico,
        nivel=nivel_curso,
        activo=True
    ).select_related('alumno').order_by('alumno__apellido_paterno', 'alumno__apellido_materno', 'alumno__primer_nombre')
    
    # Extraer los objetos Alumno
    alumnos = [alumno_ano.alumno for alumno_ano in alumnos_ano]
    
    # DEBUG: Imprimir información
    print(f"DEBUG: Nivel curso buscado: {nivel_curso}")
    print(f"DEBUG: Año académico: {ano_academico}")
    print(f"DEBUG: Alumnos encontrados: {len(alumnos)}")
    for alumno in alumnos:
        print(f"  - {alumno.nombre_completo}")
    
    fecha_hoy = timezone.now().date()
    
    # Verificar si ya existe asistencia para hoy de forma más segura
    asistencia_existente = False
    asistencias_actuales = {}
    
    try:
        # Verificar asistencias existentes con año académico explícito
        asistencias_hoy = Asistencia.objects.filter(
            asignatura_curso=asignatura_curso,
            fecha=fecha_hoy
        ).select_related('alumno')
        
        if asistencias_hoy.exists():
            asistencia_existente = True
            asistencias_actuales = {a.alumno.id: a for a in asistencias_hoy}
            
    except Exception as e:
        print(f"Error al obtener asistencias: {e}")
        messages.error(request, f'Error al cargar asistencias existentes: {str(e)}')
        return redirect('asistencia:seleccionar_asignatura')
    
    if request.method == 'POST':
        print("DEBUG: Procesando POST")
        print(f"DEBUG: POST data: {dict(request.POST)}")
        
        try:
            with transaction.atomic():
                # Obtener usuario que registra
                registrado_por = None
                try:
                    registrado_por = Usuario.objects.get(rut=request.user.username)
                    print(f"DEBUG: Usuario registrador: {registrado_por}")
                except Usuario.DoesNotExist:
                    print("DEBUG: Usuario registrador no encontrado")
                    pass
                
                # Procesar cada alumno
                registros_procesados = 0
                for alumno in alumnos:
                    estado = request.POST.get(f'alumno_{alumno.id}', 'ausente')
                    observaciones = request.POST.get(f'observaciones_{alumno.id}', '').strip()
                    
                    print(f"DEBUG: Procesando {alumno.nombre_completo} - Estado: {estado}")
                    
                    # Actualizar o crear asistencia
                    asistencia, created = Asistencia.objects.update_or_create(
                        alumno=alumno,
                        asignatura_curso=asignatura_curso,
                        fecha=fecha_hoy,
                        ano_academico=ano_academico,
                        defaults={
                            'estado': estado,
                            'observaciones': observaciones or None,
                            'registrado_por': registrado_por,
                        }
                    )
                    registros_procesados += 1
                    print(f"DEBUG: {'Creado' if created else 'Actualizado'} registro para {alumno.nombre_completo}")
                
                print(f"DEBUG: Total registros procesados: {registros_procesados}")
                
                # Mensaje de éxito personalizado
                if asistencia_existente:
                    messages.success(
                        request, 
                        f'Asistencia actualizada exitosamente para {registros_procesados} estudiantes del curso {asignatura_curso.curso} en {asignatura_curso.asignatura}.'
                    )
                else:
                    messages.success(
                        request, 
                        f'Asistencia registrada exitosamente para {registros_procesados} estudiantes del curso {asignatura_curso.curso} en {asignatura_curso.asignatura}.'
                    )
                
                # Redirigir a ver asistencias con filtros del día y asignatura
                url = reverse('asistencia:ver_asistencias')
                url += f'?asignatura_curso={asignatura_curso.id}&fecha_inicio={fecha_hoy}&fecha_fin={fecha_hoy}'
                print(f"DEBUG: Redirigiendo a: {url}")
                return redirect(url)
                
        except Exception as e:
            print(f"DEBUG: Error en POST: {e}")
            import traceback
            traceback.print_exc()
            messages.error(request, f'Error al guardar la asistencia: {str(e)}')
    
    context = {
        'titulo': f'Tomar Asistencia - {asignatura_curso}',
        'asignatura_curso': asignatura_curso,
        'alumnos': alumnos,
        'fecha_hoy': fecha_hoy,
        'asistencia_existente': asistencia_existente,
        'asistencias_actuales': asistencias_actuales,
    }
    
    return render(request, 'asistencia/tomar_asistencia.html', context)

@login_required
def modificar_asistencia(request, asignatura_curso_id, fecha):
    """Vista para modificar asistencia de una fecha específica"""
    asignatura_curso = get_object_or_404(AsignaturaCurso, id=asignatura_curso_id)

    # Verificar permisos
    if not request.user.is_superuser:
        try:
            usuario_eduvia = Usuario.objects.get(rut=request.user.username)
            if usuario_eduvia.rol != 'profesor' or asignatura_curso.profesor != usuario_eduvia:
                messages.error(request, 'No tiene permisos para gestionar esta asignatura.')
                return redirect('asistencia:seleccionar_asignatura')
        except Usuario.DoesNotExist:
            messages.error(request, 'Usuario no encontrado.')
            return redirect('asistencia:seleccionar_asignatura')

    # Convertir fecha string a objeto date
    try:
        fecha_obj = timezone.datetime.strptime(fecha, '%Y-%m-%d').date()
    except ValueError:
        messages.error(request, 'Fecha inválida.')
        return redirect('asistencia:ver_asistencias')

    # Validar que los profesores solo puedan modificar asistencias del día actual
    fecha_hoy = timezone.now().date()
    if not request.user.is_superuser and fecha_obj < fecha_hoy:
        messages.error(request, 'No puede modificar asistencias de días anteriores.')
        return redirect('asistencia:ver_asistencias')

    # Obtener el año académico activo o correspondiente
    from alumnos.models import AnoAcademico
    ano_academico_actual = AnoAcademico.get_ano_activo()
    if not ano_academico_actual:
        messages.error(request, 'No hay un año académico activo configurado.')
        return redirect('asistencia:seleccionar_asignatura')

    # Obtener asistencias existentes para esa fecha y año académico
    asistencias_existentes = Asistencia.objects.filter(
        asignatura_curso=asignatura_curso,
        fecha=fecha_obj,
        ano_academico=ano_academico_actual
    ).select_related('alumno')

    # Crear diccionario de asistencias por alumno
    asistencias_por_alumno = {a.alumno.id: a for a in asistencias_existentes}

    # Obtener todos los alumnos del curso (por si se agregaron después)
    alumnos = asignatura_curso.curso.alumnos.filter(activo=True).order_by('apellido_paterno', 'apellido_materno', 'primer_nombre')

    if request.method == 'POST':
        try:
            with transaction.atomic():
                # Obtener usuario que registra
                registrado_por = None
                try:
                    registrado_por = Usuario.objects.get(rut=request.user.username)
                except Usuario.DoesNotExist:
                    pass

                # Procesar cada alumno
                registros_procesados = 0
                for alumno in alumnos:
                    estado = request.POST.get(f'alumno_{alumno.id}', 'ausente')
                    observaciones = request.POST.get(f'observaciones_{alumno.id}', '').strip()

                    # Actualizar o crear asistencia (ahora filtrando por año académico)
                    asistencia, created = Asistencia.objects.update_or_create(
                        alumno=alumno,
                        asignatura_curso=asignatura_curso,
                        fecha=fecha_obj,
                        ano_academico=ano_academico_actual,
                        defaults={
                            'estado': estado,
                            'observaciones': observaciones or None,
                            'registrado_por': registrado_por,
                        }
                    )
                    registros_procesados += 1

                messages.success(
                    request, 
                    f'Asistencia del {fecha_obj.strftime("%d/%m/%Y")} modificada exitosamente para {registros_procesados} estudiantes.'
                )

                # Redirigir a ver asistencias con filtros
                url = reverse('asistencia:ver_asistencias')
                url += f'?asignatura_curso={asignatura_curso.id}&fecha_inicio={fecha_obj}&fecha_fin={fecha_obj}'
                return redirect(url)

        except Exception as e:
            messages.error(request, f'Error al modificar la asistencia: {str(e)}')

    context = {
        'titulo': f'Modificar Asistencia - {asignatura_curso} - {fecha_obj.strftime("%d/%m/%Y")}',
        'asignatura_curso': asignatura_curso,
        'alumnos': alumnos,
        'fecha_modificar': fecha_obj,
        'asistencias_actuales': asistencias_por_alumno,
        'es_modificacion': True,
    }

    return render(request, 'asistencia/tomar_asistencia.html', context)

@login_required
def ver_asistencias(request):
    """Vista para ver asistencias registradas"""
    from alumnos.models import AnoAcademico
    from django.db.models import Count, Q
    
    asignaturas_disponibles = get_user_asignaturas(request.user)
    
    # Obtener todos los años académicos disponibles
    anos_academicos = AnoAcademico.objects.all().order_by('-ano')
    ano_academico_activo = AnoAcademico.get_ano_activo()
    
    # Obtener año académico seleccionado (por defecto el activo)
    ano_academico_id = request.GET.get('ano_academico')
    if ano_academico_id:
        try:
            ano_academico_actual = AnoAcademico.objects.get(id=ano_academico_id)
        except AnoAcademico.DoesNotExist:
            ano_academico_actual = ano_academico_activo
    else:
        ano_academico_actual = ano_academico_activo
    
    if not ano_academico_actual:
        messages.error(request, 'No hay años académicos configurados.')
        context = {
            'titulo': 'Ver Asistencias Registradas',
            'asignaturas': asignaturas_disponibles,
            'asistencias_por_fecha': [],
            'anos_academicos': anos_academicos,
            'ano_academico_activo': ano_academico_activo,
            'ano_academico_actual': None,
            'estados_choices': Asistencia.ESTADO_CHOICES,
            'meses_opciones': [
                (1, 'Enero'), (2, 'Febrero'), (3, 'Marzo'), (4, 'Abril'),
                (5, 'Mayo'), (6, 'Junio'), (7, 'Julio'), (8, 'Agosto'),
                (9, 'Septiembre'), (10, 'Octubre'), (11, 'Noviembre'), (12, 'Diciembre')
            ],
            'total_registros': 0,
        }
        return render(request, 'asistencia/ver_asistencias.html', context)
    
    # Filtros
    asignatura_curso_id = request.GET.get('asignatura_curso')
    mes_filtro = request.GET.get('mes')
    estado_filtro = request.GET.get('estado')
    
    asistencias_por_fecha = OrderedDict()
    asignatura_curso_seleccionada = None
    total_registros = 0
    porcentaje_asistencia_general = 0
    estadisticas_estudiantes = {}
    
    if asignatura_curso_id:
        try:
            asignatura_curso_seleccionada = AsignaturaCurso.objects.get(id=asignatura_curso_id)
            if asignatura_curso_seleccionada in asignaturas_disponibles:
                
                # Filtrar por año académico seleccionado
                asistencias = Asistencia.objects.filter(
                    asignatura_curso=asignatura_curso_seleccionada,
                    ano_academico=ano_academico_actual
                )
                
                # Calcular total de días únicos con asistencia registrada (sin filtros de mes/estado)
                total_dias_registrados = asistencias.values('fecha').distinct().count()
                
                # Calcular estadísticas por estudiante
                if total_dias_registrados > 0:
                    estudiantes_stats = asistencias.values('alumno__id', 'alumno__primer_nombre', 'alumno__apellido_paterno', 'alumno__apellido_materno').annotate(
                        total_registros=Count('id'),
                        presentes=Count('id', filter=Q(estado='presente')),
                        tardanzas=Count('id', filter=Q(estado='tardanza')),
                        justificados=Count('id', filter=Q(estado='justificado')),
                        ausentes=Count('id', filter=Q(estado='ausente'))
                    )
                    
                    for estudiante in estudiantes_stats:
                        asistencias_efectivas = estudiante['presentes'] + estudiante['tardanzas'] + estudiante['justificados']
                        porcentaje = round((asistencias_efectivas / total_dias_registrados) * 100, 2)
                        
                        estadisticas_estudiantes[estudiante['alumno__id']] = {
                            'total_dias': total_dias_registrados,
                            'asistencias_efectivas': asistencias_efectivas,
                            'porcentaje_asistencia': porcentaje,
                            'presentes': estudiante['presentes'],
                            'tardanzas': estudiante['tardanzas'],
                            'justificados': estudiante['justificados'],
                            'ausentes': estudiante['ausentes']
                        }
                
                # Aplicar filtros adicionales para la vista
                if mes_filtro:
                    try:
                        mes_int = int(mes_filtro)
                        asistencias = asistencias.filter(fecha__month=mes_int)
                    except (ValueError, TypeError):
                        pass
                
                if estado_filtro:
                    asistencias = asistencias.filter(estado=estado_filtro)
                
                # Ordenar por fecha descendente y luego por alumno
                asistencias = asistencias.select_related('alumno', 'registrado_por').order_by('-fecha', 'alumno__apellido_paterno', 'alumno__apellido_materno')
                
                # Agrupar asistencias por fecha
                asistencias_agrupadas = defaultdict(list)
                for asistencia in asistencias:
                    asistencias_agrupadas[asistencia.fecha].append(asistencia)
                
                # Calcular estadísticas por fecha y crear estructura ordenada
                total_asistencias_efectivas = 0
                
                for fecha in sorted(asistencias_agrupadas.keys(), reverse=True):
                    asistencias_fecha = asistencias_agrupadas[fecha]
                    
                    # Calcular estadísticas
                    stats = {
                        'total': len(asistencias_fecha),
                        'presentes': len([a for a in asistencias_fecha if a.estado == 'presente']),
                        'ausentes': len([a for a in asistencias_fecha if a.estado == 'ausente']),
                        'tardanzas': len([a for a in asistencias_fecha if a.estado == 'tardanza']),
                        'justificados': len([a for a in asistencias_fecha if a.estado == 'justificado']),
                    }
                    
                    # Calcular asistencias efectivas (presente + tardanza + justificado)
                    stats['asistencias_efectivas'] = stats['presentes'] + stats['tardanzas'] + stats['justificados']
                    
                    # Calcular porcentaje de asistencia para esta fecha
                    if stats['total'] > 0:
                        stats['porcentaje_asistencia'] = round((stats['asistencias_efectivas'] / stats['total']) * 100, 2)
                    else:
                        stats['porcentaje_asistencia'] = 0
                    
                    asistencias_por_fecha[fecha] = {
                        'asistencias': asistencias_fecha,
                        'stats': stats
                    }
                    
                    total_registros += stats['total']
                    total_asistencias_efectivas += stats['asistencias_efectivas']
                
                # Calcular porcentaje general de asistencia
                if total_registros > 0:
                    porcentaje_asistencia_general = round((total_asistencias_efectivas / total_registros) * 100, 2)
                
        except AsignaturaCurso.DoesNotExist:
            messages.error(request, 'Asignatura no encontrada.')
    
    # Definir opciones de meses
    meses_opciones = [
        (1, 'Enero'), (2, 'Febrero'), (3, 'Marzo'), (4, 'Abril'),
        (5, 'Mayo'), (6, 'Junio'), (7, 'Julio'), (8, 'Agosto'),
        (9, 'Septiembre'), (10, 'Octubre'), (11, 'Noviembre'), (12, 'Diciembre')
    ]
    
    context = {
        'titulo': 'Ver Asistencias Registradas',
        'asignaturas': asignaturas_disponibles,
        'asistencias_por_fecha': asistencias_por_fecha.items(),
        'asignatura_curso_seleccionada': asignatura_curso_seleccionada,
        'mes_filtro': mes_filtro,
        'estado_filtro': estado_filtro,
        'estados_choices': Asistencia.ESTADO_CHOICES,
        'meses_opciones': meses_opciones,
        'total_registros': total_registros,
        'porcentaje_asistencia_general': porcentaje_asistencia_general,
        'estadisticas_estudiantes': estadisticas_estudiantes,
        'anos_academicos': anos_academicos,
        'ano_academico_activo': ano_academico_activo,
        'ano_academico_actual': ano_academico_actual,
    }
    
    return render(request, 'asistencia/ver_asistencias.html', context)

@login_required
def asistencia_guardada(request):
    """Vista de confirmación después de guardar asistencia"""
    return render(request, 'asistencia/asistencia_guardada.html', {
        'titulo': 'Asistencia Guardada'
    })

@login_required
def estadisticas_asistencia(request):
    """Vista para mostrar estadísticas de asistencia"""
    from alumnos.models import AnoAcademico
    
    asignaturas_disponibles = get_user_asignaturas(request.user)
    
    # Obtener todos los años académicos disponibles
    anos_academicos = AnoAcademico.objects.all().order_by('-ano')
    ano_academico_activo = AnoAcademico.get_ano_activo()
    
    # Obtener año académico seleccionado (por defecto el activo)
    ano_academico_id = request.GET.get('ano_academico')
    if ano_academico_id:
        try:
            ano_academico_actual = AnoAcademico.objects.get(id=ano_academico_id)
        except AnoAcademico.DoesNotExist:
            ano_academico_actual = ano_academico_activo
    else:
        ano_academico_actual = ano_academico_activo
    
    if not ano_academico_actual:
        messages.error(request, 'No hay años académicos configurados.')
        context = {
            'titulo': 'Estadísticas de Asistencia',
            'estadisticas': [],
            'resumen': {'total_asignaturas': 0, 'total_registros': 0, 'promedio_asistencia': 0, 'total_estudiantes': 0},
            'asignaturas_disponibles': [],
            'cursos_disponibles': [],
            'anos_academicos': anos_academicos,
            'ano_academico_activo': ano_academico_activo,
            'ano_academico_actual': None,
            'filtro_asignatura': '',
            'filtro_curso': '',
        }
        return render(request, 'asistencia/estadisticas.html', context)
    
    # Obtener filtros
    filtro_asignatura = request.GET.get('asignatura', '')
    filtro_curso = request.GET.get('curso', '')
    
    # Aplicar filtros
    asignaturas_filtradas = asignaturas_disponibles
    
    if filtro_asignatura:
        asignaturas_filtradas = asignaturas_filtradas.filter(asignatura__nombre=filtro_asignatura)
    
    if filtro_curso:
        # CORREGIDO: Usar el ID del curso en lugar del nombre
        try:
            curso_id = int(filtro_curso)
            asignaturas_filtradas = asignaturas_filtradas.filter(curso__id=curso_id)
        except (ValueError, TypeError):
            # Si no es un número válido, ignorar el filtro
            pass
    
    # Calcular estadísticas filtradas por año académico
    estadisticas = []
    total_registros_general = 0
    total_asistencias_efectivas_general = 0
    estudiantes_unicos = set()
    
    for asignatura_curso in asignaturas_filtradas:
        stats = Asistencia.objects.filter(
            asignatura_curso=asignatura_curso,
            ano_academico=ano_academico_actual
        ).aggregate(
            total=Count('id'),
            presentes=Count('id', filter=Q(estado='presente')),
            ausentes=Count('id', filter=Q(estado='ausente')),
            tardanzas=Count('id', filter=Q(estado='tardanza')),
            justificados=Count('id', filter=Q(estado='justificado'))
        )
        
        # Calcular asistencias efectivas (presente + tardanza + justificado)
        stats['asistencias_efectivas'] = stats['presentes'] + stats['tardanzas'] + stats['justificados']
        
        if stats['total'] > 0:
            stats['porcentaje_asistencia'] = round((stats['asistencias_efectivas'] / stats['total']) * 100, 2)
        else:
            stats['porcentaje_asistencia'] = 0
        
        # Agregar a totales generales
        total_registros_general += stats['total']
        total_asistencias_efectivas_general += stats['asistencias_efectivas']
        
        # Obtener estudiantes únicos
        estudiantes_asignatura = Asistencia.objects.filter(
            asignatura_curso=asignatura_curso,
            ano_academico=ano_academico_actual
        ).values_list('alumno_id', flat=True).distinct()
        estudiantes_unicos.update(estudiantes_asignatura)
        
        estadisticas.append({
            'asignatura_curso': asignatura_curso,
            'stats': stats
        })
    
    # Calcular resumen general
    promedio_asistencia = 0
    if total_registros_general > 0:
        promedio_asistencia = round((total_asistencias_efectivas_general / total_registros_general) * 100, 2)
    
    resumen = {
        'total_asignaturas': len(estadisticas),
        'total_registros': total_registros_general,
        'promedio_asistencia': promedio_asistencia,
        'total_estudiantes': len(estudiantes_unicos)
    }
    
    # Obtener opciones para filtros
    asignaturas_opciones = asignaturas_disponibles.values_list(
        'asignatura__nombre', flat=True
    ).distinct().order_by('asignatura__nombre')
    
    # CORREGIDO: Obtener cursos únicos con sus IDs
    cursos_opciones = []
    cursos_vistos = set()
    for asignatura_curso in asignaturas_disponibles.select_related('curso').order_by('curso__nivel', 'curso__letra'):
        curso = asignatura_curso.curso
        if curso.id not in cursos_vistos:
            cursos_opciones.append(curso)
            cursos_vistos.add(curso.id)
    
    context = {
        'titulo': 'Estadísticas de Asistencia',
        'estadisticas': estadisticas,
        'resumen': resumen,
        'asignaturas_disponibles': asignaturas_opciones,
        'cursos_disponibles': cursos_opciones,
        'filtro_asignatura': filtro_asignatura,
        'filtro_curso': filtro_curso,
        'anos_academicos': anos_academicos,
        'ano_academico_activo': ano_academico_activo,
        'ano_academico_actual': ano_academico_actual,
    }
    
    return render(request, 'asistencia/estadisticas.html', context)
