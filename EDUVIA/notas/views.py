from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from alumnos.models import Alumno

@login_required
def notas_generales(request):
    """Vista simple para mostrar la página de notas"""
    
    # Obtener parámetros de filtro (para que no se rompa el template)
    alumno_busqueda = request.GET.get('alumno', '')
    materia_filter = request.GET.get('materia', 'matematicas')
    nivel_filter = request.GET.get('nivel', 'todos')
    semestre_filter = request.GET.get('semestre', '1')
    estado_filter = request.GET.get('estado', 'activo')
    
    # Obtener alumnos básicos - CORREGIDO: usar los campos correctos
    alumnos = Alumno.objects.filter(activo=True).order_by('apellido_paterno', 'primer_nombre')[:20]
    
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
        'total_alumnos': alumnos.count(),
        'promedio_general': 5.5,  # Valor fijo por ahora
    }
    
    return render(request, 'notas_generales.html', context)
