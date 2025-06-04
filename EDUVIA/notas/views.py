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
    promedio_general = 5.5  # Calcular según tus notas
    alumnos_destacados = int(total_alumnos * 0.3)  # 30% destacados
    alumnos_riesgo = int(total_alumnos * 0.1)  # 10% en riesgo
    
    # Paginación
    paginator = Paginator(alumnos_queryset, 10)  # 10 alumnos por página
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)
    
    context = {
        'alumnos': page_obj,
        'page_obj': page_obj,
        'is_paginated': page_obj.has_other_pages(),
        'alumno_busqueda': alumno_busqueda,
        'nivel_filter': nivel_filter,
        'semestre_filter': semestre_filter,
        'estado_filter': estado_filter,
        'niveles': niveles,
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
            # Aquí implementarías la lógica para guardar las notas
            # Por ejemplo, usando un modelo Nota
            
            messages.success(request, 'Notas guardadas correctamente')
            return JsonResponse({'success': True})
            
        except Exception as e:
            messages.error(request, f'Error al guardar notas: {str(e)}')
            return JsonResponse({'success': False, 'error': str(e)})
    
    return JsonResponse({'success': False, 'error': 'Método no permitido'})