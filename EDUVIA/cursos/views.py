from django.shortcuts import render, redirect, get_object_or_404
from django.contrib import messages
from django.contrib.auth.decorators import login_required, user_passes_test
from django.http import JsonResponse
from .forms import CursoForm
from alumnos.models import Alumno
from .models import Curso

def is_superuser(user):
    """Función para verificar si el usuario es superusuario"""
    return user.is_superuser

def is_staff_or_superuser(user):
    """Función para verificar si el     usuario es staff o superusuario"""
    return user.is_staff or user.is_superuser

@login_required
@user_passes_test(is_superuser, login_url='usuarios:inicio')
def gestion_cursos(request):
    """Vista para la gestión de cursos - Solo superusuarios"""
    # Obtener parámetros de filtro
    nivel_filter = request.GET.get('nivel', 'todos')
    jornada_filter = request.GET.get('jornada', 'todos')
    
    # Filtrar cursos
    cursos = Curso.objects.all()
    
    if nivel_filter != 'todos':
        cursos = cursos.filter(nivel=nivel_filter)
    
    if jornada_filter != 'todos':
        cursos = cursos.filter(letra=jornada_filter)
    
    context = {
        'cursos': cursos.order_by('nivel', 'letra'),
        'nivel_filter': nivel_filter,
        'jornada_filter': jornada_filter,
    }
    
    return render(request, 'gestion_cursos.html', context)

@login_required
@user_passes_test(is_superuser, login_url='usuarios:inicio')
def crear_curso(request):
    """Vista para crear un nuevo curso - Solo superusuarios"""
    if request.method == 'POST':
        form = CursoForm(request.POST)
        if form.is_valid():
            curso = form.save()
            messages.success(request, f'Curso {curso.nivel}° {curso.letra.upper()} creado exitosamente.')
            return redirect('cursos:gestion_cursos')
        else:
            print(f"Errores del formulario: {form.errors}")
            messages.error(request, 'No se pudo crear el curso. Por favor, revise los campos marcados en rojo.')
    else:
        form = CursoForm()
    
    return render(request, 'crear_curso.html', {'form': form})

@login_required
@user_passes_test(is_superuser, login_url='usuarios:inicio')
def editar_curso(request, id):
    """Vista para editar un curso - Solo superusuarios"""
    curso = get_object_or_404(Curso, id=id)
    
    if request.method == 'POST':
        form = CursoForm(request.POST, instance=curso)
        if form.is_valid():
            form.save()
            messages.success(request, f'Curso {curso.nivel}° {curso.letra.upper()} actualizado exitosamente.')
            return redirect('cursos:gestion_cursos')
        else:
            messages.error(request, 'No se pudo actualizar el curso. Por favor, revise los campos marcados en rojo.')
    else:
        form = CursoForm(instance=curso)
    
    return render(request, 'crear_curso.html', {'form': form, 'curso': curso})

@login_required
@user_passes_test(is_staff_or_superuser, login_url='usuarios:inicio')
def detalle_curso(request, id):
    """Vista para ver detalles de un curso - Staff y superusuarios"""
    curso = Curso.objects.prefetch_related('alumnos').get(id=id)
    return render(request, 'cursos/detalle_curso.html', {'curso': curso})

@login_required
@user_passes_test(is_superuser, login_url='usuarios:inicio')
def eliminar_curso(request, id):
    """Vista para eliminar un curso - Solo superusuarios"""
    curso = get_object_or_404(Curso, id=id)
    
    if request.method == 'POST':
        nombre_curso = f"{curso.nivel}° {curso.letra.upper()}"
        curso.delete()
        messages.success(request, f'Curso {nombre_curso} eliminado exitosamente.')
        return redirect('cursos:gestion_cursos')
    
    return render(request, 'cursos/confirmar_eliminar_curso.html', {'curso': curso})

@login_required
@user_passes_test(is_staff_or_superuser, login_url='usuarios:inicio')
def obtener_detalles_curso(request, id):
    """API para obtener detalles de un curso en formato JSON - Staff y superusuarios"""
    try:
        curso = Curso.objects.get(id=id)
        
        # Obtener datos de los alumnos
        alumnos_data = []
        for alumno in curso.alumnos.all():
            alumnos_data.append({
                'id': alumno.id,
                'nombre': alumno.nombre_completo,
                'nivel': alumno.nivel,
                'activo': alumno.activo
            })
        
        # Construir respuesta
        data = {
            'id': curso.id,
            'nivel': curso.nivel,
            'letra': curso.letra.upper(),
            'jornada': 'Diurna' if curso.letra.lower() == 'a' else 'Vespertina',
            'alumnos': alumnos_data,
            'total_alumnos': len(alumnos_data)
        }
        
        return JsonResponse({'success': True, 'data': data})
    
    except Curso.DoesNotExist:
        return JsonResponse({'success': False, 'error': 'Curso no encontrado'})
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        return JsonResponse({'success': False, 'error': str(e)})

@login_required
def filtrar_alumnos_por_nivel_letra(request):
    """Vista para filtrar alumnos por nivel y letra - Todos los usuarios autenticados"""
    nivel = request.GET.get('nivel')
    letra = request.GET.get('letra')

    if nivel and letra:
        nivel_letra = f"{nivel}{letra.upper()}"
        alumnos = Alumno.objects.filter(nivel=nivel_letra, activo=True)
        alumnos_data = [{'id': a.id, 'nombre': a.nombre_completo} for a in alumnos]
    else:
        alumnos_data = []

    return JsonResponse({'alumnos': alumnos_data})

@login_required
def detalle_alumno(request, id):
    """Vista para ver detalles de un alumno - Todos los usuarios autenticados"""
    alumno = get_object_or_404(Alumno, id=id)
    return render(request, 'alumnos/detalle_alumno.html', {'alumno': alumno})
