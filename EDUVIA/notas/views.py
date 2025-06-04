from django.shortcuts import render, get_object_or_404
from django.http import JsonResponse
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from alumnos.models import Alumno

@login_required
def notas_generales(request):
    """Vista simplificada para gestión de notas"""
    
    # Obtener filtros
    buscar = request.GET.get('buscar', '')
    nivel_filter = request.GET.get('nivel', '')
    asignatura_filter = request.GET.get('asignatura', '')
    
    # Filtrar alumnos
    alumnos = Alumno.objects.filter(activo=True)
    
    if buscar:
        alumnos = alumnos.filter(nombre_completo__icontains=buscar)
    
    if nivel_filter:
        alumnos = alumnos.filter(nivel=nivel_filter)
    
    # Obtener niveles disponibles
    niveles_disponibles = Alumno.objects.filter(activo=True).values_list('nivel', flat=True).distinct()
    
    # Asignaturas disponibles
    asignaturas_disponibles = ['matematicas', 'lenguaje', 'ciencias', 'historia', 'ingles']
    
    if asignatura_filter:
        asignaturas_disponibles = [asignatura_filter]
    
    context = {
        'alumnos': alumnos,
        'niveles_disponibles': niveles_disponibles,
        'asignaturas_disponibles': asignaturas_disponibles,
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
