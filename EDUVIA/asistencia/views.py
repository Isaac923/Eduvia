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

def get_user_asignaturas(user):
    """Obtiene las asignaturas que puede gestionar el usuario"""
    if user.is_superuser:
        return AsignaturaCurso.objects.filter(activa=True)
    
    try:
        usuario_eduvia = Usuario.objects.get(rut=user.username)
        if usuario_eduvia.rol == 'profesor' and usuario_eduvia.funcion:
            # La función contiene la especialidad del profesor
            return AsignaturaCurso.objects.filter(
                asignatura__nombre=usuario_eduvia.funcion,
                activa=True
            )
    except Usuario.DoesNotExist:
        pass
    
    return AsignaturaCurso.objects.none()

@login_required
def seleccionar_asignatura(request):
    """Vista para seleccionar asignatura y curso"""
    asignaturas_disponibles = get_user_asignaturas(request.user)
    
    context = {
        'titulo': 'Seleccionar Asignatura y Curso',
        'asignaturas': asignaturas_disponibles,
    }
    return render(request, 'asistencia/seleccionar_asignatura.html', context)

@login_required
def tomar_asistencia(request, asignatura_curso_id):
    """Vista para tomar asistencia"""
    asignatura_curso = get_object_or_404(AsignaturaCurso, id=asignatura_curso_id)
    
    # Verificar permisos
    if not request.user.is_superuser:
        try:
            usuario_eduvia = Usuario.objects.get(rut=request.user.username)
            if usuario_eduvia.rol != 'profesor' or usuario_eduvia.funcion != asignatura_curso.asignatura.nombre:
                messages.error(request, 'No tiene permisos para gestionar esta asignatura.')
                return redirect('asistencia:seleccionar_asignatura')
        except Usuario.DoesNotExist:
            messages.error(request, 'Usuario no encontrado.')
            return redirect('asistencia:seleccionar_asignatura')
    
    # Obtener alumnos del curso
    alumnos = asignatura_curso.curso.alumnos.filter(activo=True).order_by('apellido', 'nombre')
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
                return redirect('asistencia:asistencia_guardada')
                
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
                
                asistencias = asistencias.select_related('alumno', 'registrado_por').order_by('-fecha', 'alumno__apellido')
        except AsignaturaCurso.DoesNotExist:
            messages.error(request, 'Asignatura no encontrada.')
    
    # Paginación
    paginator = Paginator(asistencias, 50)
    page_number = request.GET.get('page')
    asistencias_paginadas = paginator.get_page(page_number)
    
    context = {
        'titulo': 'Ver Asistencias',
        'asignaturas': asignaturas_disponibles,
        'asistencias': asistencias_paginadas,
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
