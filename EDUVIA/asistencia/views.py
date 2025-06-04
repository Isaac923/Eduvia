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
from collections import defaultdict

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
                asignatura_curso.profesor = profesor
                messages.success(request, f'Profesor {profesor.nombre_completo()} asignado a {asignatura_curso} exitosamente.')
            else:
                asignatura_curso.profesor = None
                messages.success(request, f'Profesor removido de {asignatura_curso} exitosamente.')
            
            asignatura_curso.save()
            
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
                
                messages.success(request, 'Asistencia registrada exitosamente.')
                
                # Redirigir a ver asistencias con filtros del día y asignatura
                url = reverse('asistencia:ver_asistencias')
                url += f'?asignatura_curso={asignatura_curso.id}&fecha_inicio={fecha_hoy}&fecha_fin={fecha_hoy}'
                return redirect(url)
                
        except Exception as e:
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
def ver_asistencias(request):
    """Vista para ver asistencias registradas"""
    asignaturas_disponibles = get_user_asignaturas(request.user)
    
    # Filtros
    asignatura_curso_id = request.GET.get('asignatura_curso')
    fecha_inicio = request.GET.get('fecha_inicio')
    fecha_fin = request.GET.get('fecha_fin')
    estado_filtro = request.GET.get('estado')
    
    asistencias = Asistencia.objects.none()
    asignatura_curso_seleccionada = None
    asistencias_por_curso = {}
    
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
                
                # CORREGIDO: usar los nombres de campos correctos para ordenar
                asistencias = asistencias.select_related('alumno', 'registrado_por').order_by('-fecha', 'alumno__apellido_paterno', 'alumno__apellido_materno')
                
                # Agrupar asistencias por curso del alumno
                asistencias_agrupadas = defaultdict(list)
                for asistencia in asistencias:
                    # Obtener todos los cursos del alumno
                    cursos_alumno = asistencia.alumno.cursos.all()
                    for curso in cursos_alumno:
                        asistencias_agrupadas[curso].append(asistencia)
                
                # Ordenar los cursos por nivel y letra
                cursos_ordenados = sorted(asistencias_agrupadas.keys(), key=lambda c: (c.nivel, c.letra))
                asistencias_por_curso = [(curso, asistencias_agrupadas[curso]) for curso in cursos_ordenados]
                
        except AsignaturaCurso.DoesNotExist:
            messages.error(request, 'Asignatura no encontrada.')
    
    # Paginación (aplicar a todas las asistencias sin agrupar para mantener la funcionalidad)
    paginator = Paginator(asistencias, 50)
    page_number = request.GET.get('page')
    asistencias_paginadas = paginator.get_page(page_number)
    
    context = {
        'titulo': 'Ver Asistencias Registradas',
        'asignaturas': asignaturas_disponibles,
        'asistencias': asistencias_paginadas,
        'asistencias_por_curso': asistencias_por_curso,
        'asignatura_curso_seleccionada': asignatura_curso_seleccionada,
        'fecha_inicio': fecha_inicio,
        'fecha_fin': fecha_fin,
        'estado_filtro': estado_filtro,
        'estados_choices': Asistencia.ESTADO_CHOICES,
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
    
    estadisticas = []
    for asignatura_curso in asignaturas_disponibles:
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
            
        estadisticas.append({
            'asignatura_curso': asignatura_curso,
            'stats': stats
        })
    
    context = {
        'titulo': 'Estadísticas de Asistencia',
        'estadisticas': estadisticas,
    }
    
    return render(request, 'asistencia/estadisticas.html', context)
