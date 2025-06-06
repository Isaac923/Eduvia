from django.shortcuts import render, get_object_or_404, redirect
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.utils import timezone
from django.db import transaction
from django.http import JsonResponse
from django.core.paginator import Paginator
from django.db.models import Q, Count
from .models import Asistencia, Asignatura, AsignaturaCurso
from alumnos.models import Alumno
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
    
    context = {
        'titulo': 'Registrar Asistencia - Seleccionar Asignatura y Curso',
        'asignaturas': todas_asignaturas_curso,
        'profesores': profesores,
        'es_superusuario': request.user.is_superuser,
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
    
    # Obtener alumnos del curso - CORREGIDO: usar los nombres de campos correctos
    alumnos = asignatura_curso.curso.alumnos.filter(activo=True).order_by('apellido_paterno', 'apellido_materno', 'primer_nombre')
    fecha_hoy = timezone.now().date()
    
    # Verificar si ya existe asistencia para hoy
    asistencia_existente = Asistencia.objects.filter(
        asignatura_curso=asignatura_curso,
        fecha=fecha_hoy
    ).exists()
    
    # Obtener asistencias actuales si existen
    asistencias_actuales = {}
    if asistencia_existente:
        asistencias_hoy = Asistencia.objects.filter(
            asignatura_curso=asignatura_curso,
            fecha=fecha_hoy
        )
        asistencias_actuales = {a.alumno.id: a for a in asistencias_hoy}
    
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
                    
                    # Actualizar o crear asistencia
                    asistencia, created = Asistencia.objects.update_or_create(
                        alumno=alumno,
                        asignatura_curso=asignatura_curso,
                        fecha=fecha_hoy,
                        defaults={
                            'estado': estado,
                            'observaciones': observaciones or None,
                            'registrado_por': registrado_por,
                        }
                    )
                    registros_procesados += 1
                
                # Mensaje de éxito personalizado con SweetAlert2
                if asistencia_existente:
                    messages.success(
                        request, 
                        f'✅ Asistencia actualizada exitosamente para {registros_procesados} estudiantes del curso {asignatura_curso.curso} en {asignatura_curso.asignatura}.'
                    )
                else:
                    messages.success(
                        request, 
                        f'✅ Asistencia registrada exitosamente para {registros_procesados} estudiantes del curso {asignatura_curso.curso} en {asignatura_curso.asignatura}.'
                    )
                
                # Redirigir a ver asistencias con filtros del día y asignatura
                url = reverse('asistencia:ver_asistencias')
                url += f'?asignatura_curso={asignatura_curso.id}&fecha_inicio={fecha_hoy}&fecha_fin={fecha_hoy}'
                return redirect(url)
                
        except Exception as e:
            messages.error(request, f'❌ Error al guardar la asistencia: {str(e)}')
    
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
    
    # Obtener asistencias existentes para esa fecha
    asistencias_existentes = Asistencia.objects.filter(
        asignatura_curso=asignatura_curso,
        fecha=fecha_obj
    ).select_related('alumno')
    
    if not asistencias_existentes.exists():
        messages.error(request, 'No se encontraron registros de asistencia para esta fecha.')
        return redirect('asistencia:ver_asistencias')
    
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
                    
                    # Actualizar o crear asistencia
                    asistencia, created = Asistencia.objects.update_or_create(
                        alumno=alumno,
                        asignatura_curso=asignatura_curso,
                        fecha=fecha_obj,
                        defaults={
                            'estado': estado,
                            'observaciones': observaciones or None,
                            'registrado_por': registrado_por,
                        }
                    )
                    registros_procesados += 1
                
                messages.success(
                    request, 
                    f'✅ Asistencia del {fecha_obj.strftime("%d/%m/%Y")} modificada exitosamente para {registros_procesados} estudiantes.'
                )
                
                # Redirigir a ver asistencias con filtros
                url = reverse('asistencia:ver_asistencias')
                url += f'?asignatura_curso={asignatura_curso.id}&fecha_inicio={fecha_obj}&fecha_fin={fecha_obj}'
                return redirect(url)
                
        except Exception as e:
            messages.error(request, f'❌ Error al modificar la asistencia: {str(e)}')
    
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
    asignaturas_disponibles = get_user_asignaturas(request.user)
    
    # Filtros
    asignatura_curso_id = request.GET.get('asignatura_curso')
    fecha_inicio = request.GET.get('fecha_inicio')
    fecha_fin = request.GET.get('fecha_fin')
    estado_filtro = request.GET.get('estado')
    
    asistencias_por_fecha = OrderedDict()
    asignatura_curso_seleccionada = None
    total_registros = 0
    
    if asignatura_curso_id:
        try:
            asignatura_curso_seleccionada = AsignaturaCurso.objects.get(id=asignatura_curso_id)
            if asignatura_curso_seleccionada in asignaturas_disponibles:
                asistencias = Asistencia.objects.filter(asignatura_curso=asignatura_curso_seleccionada)
                
                # Aplicar filtros adicionales
                if fecha_inicio:
                    asistencias = asistencias.filter(fecha__gte=fecha_inicio)
                if fecha_fin:
                    asistencias = asistencias.filter(fecha__lte=fecha_fin)
                if estado_filtro:
                    asistencias = asistencias.filter(estado=estado_filtro)
                
                # Ordenar por fecha descendente y luego por alumno
                asistencias = asistencias.select_related('alumno', 'registrado_por').order_by('-fecha', 'alumno__apellido_paterno', 'alumno__apellido_materno')
                
                # Agrupar asistencias por fecha
                asistencias_agrupadas = defaultdict(list)
                for asistencia in asistencias:
                    asistencias_agrupadas[asistencia.fecha].append(asistencia)
                
                # Calcular estadísticas por fecha y crear estructura ordenada
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
                    
                    asistencias_por_fecha[fecha] = {
                        'asistencias': asistencias_fecha,
                        'stats': stats
                    }
                    
                    total_registros += stats['total']
                
        except AsignaturaCurso.DoesNotExist:
            messages.error(request, 'Asignatura no encontrada.')
    
    context = {
        'titulo': 'Ver Asistencias Registradas',
        'asignaturas': asignaturas_disponibles,
        'asistencias_por_fecha': asistencias_por_fecha.items(),
        'asignatura_curso_seleccionada': asignatura_curso_seleccionada,
        'fecha_inicio': fecha_inicio,
        'fecha_fin': fecha_fin,
        'estado_filtro': estado_filtro,
        'estados_choices': Asistencia.ESTADO_CHOICES,
        'total_registros': total_registros,
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
    asignaturas_disponibles = get_user_asignaturas(request.user)
    
    # Obtener filtros
    filtro_asignatura = request.GET.get('asignatura', '')
    filtro_curso = request.GET.get('curso', '')
    filtro_nivel = request.GET.get('nivel', '')
    
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
    
    if filtro_nivel:
        try:
            nivel_int = int(filtro_nivel)
            asignaturas_filtradas = asignaturas_filtradas.filter(curso__nivel=nivel_int)
        except (ValueError, TypeError):
            # Si no es un número válido, ignorar el filtro
            pass
    
    # Calcular estadísticas
    estadisticas = []
    total_registros_general = 0
    total_presentes_general = 0
    estudiantes_unicos = set()
    
    for asignatura_curso in asignaturas_filtradas:
        stats = Asistencia.objects.filter(asignatura_curso=asignatura_curso).aggregate(
            total=Count('id'),
            presentes=Count('id', filter=Q(estado='presente')),
            ausentes=Count('id', filter=Q(estado='ausente')),
            tardanzas=Count('id', filter=Q(estado='tardanza')),
            justificados=Count('id', filter=Q(estado='justificado'))
        )
        
        if stats['total'] > 0:
            stats['porcentaje_asistencia'] = round((stats['presentes'] / stats['total']) * 100, 2)
        else:
            stats['porcentaje_asistencia'] = 0
        
        # Agregar a totales generales
        total_registros_general += stats['total']
        total_presentes_general += stats['presentes']
        
        # Obtener estudiantes únicos
        estudiantes_asignatura = Asistencia.objects.filter(
            asignatura_curso=asignatura_curso
        ).values_list('alumno_id', flat=True).distinct()
        estudiantes_unicos.update(estudiantes_asignatura)
        
        estadisticas.append({
            'asignatura_curso': asignatura_curso,
            'stats': stats
        })
    
    # Calcular resumen general
    promedio_asistencia = 0
    if total_registros_general > 0:
        promedio_asistencia = round((total_presentes_general / total_registros_general) * 100, 2)
    
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
        'filtro_nivel': filtro_nivel,
    }
    
    return render(request, 'asistencia/estadisticas.html', context)
