from django.shortcuts import render, redirect, get_object_or_404
from django.contrib import messages
from django.contrib.auth.decorators import login_required, user_passes_test
from django.http import JsonResponse
from .forms import CursoForm, AsignaturaForm
from alumnos.models import Alumno
from .models import Curso, Asignatura

def is_staff_or_superuser(user):
    return user.is_staff or user.is_superuser

@login_required
@user_passes_test(is_staff_or_superuser)
def gestion_cursos(request):
    # Obtener parámetros de filtrado
    nivel_filter = request.GET.get('nivel', 'todos')
    jornada_filter = request.GET.get('jornada', 'todos')
    
    # Filtrar cursos
    cursos = Curso.objects.all()
    
    if nivel_filter != 'todos':
        cursos = cursos.filter(nivel=nivel_filter)
    
    if jornada_filter != 'todos':
        cursos = cursos.filter(letra=jornada_filter)
    
    context = {
        'cursos': cursos,
        'nivel_filter': nivel_filter,
        'jornada_filter': jornada_filter,
    }
    
    return render(request, 'gestion_cursos.html', context)

@login_required
@user_passes_test(is_staff_or_superuser)
def crear_curso(request):
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
@user_passes_test(is_staff_or_superuser)
def editar_curso(request, id):
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
@user_passes_test(is_staff_or_superuser)
def detalle_curso(request, id):
    curso = Curso.objects.prefetch_related('alumnos').get(id=id)
    return render(request, 'cursos/detalle_curso.html', {'curso': curso})

@login_required
@user_passes_test(is_staff_or_superuser)
def eliminar_curso(request, id):
    curso = get_object_or_404(Curso, id=id)
    
    if request.method == 'POST':
        nombre_curso = f"{curso.nivel}° {curso.letra.upper()}"
        curso.delete()
        messages.success(request, f'Curso {nombre_curso} eliminado exitosamente.')
        return redirect('cursos:gestion_cursos')
    
    return render(request, 'cursos/confirmar_eliminar_curso.html', {'curso': curso})

@login_required
@user_passes_test(is_staff_or_superuser)
def obtener_detalles_curso(request, id):
    """API para obtener detalles de un curso en formato JSON"""
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

def filtrar_alumnos_por_nivel_letra(request):
    nivel = request.GET.get('nivel')
    letra = request.GET.get('letra')

    if nivel and letra:
        nivel_letra = f"{nivel}{letra.upper()}"
        alumnos = Alumno.objects.filter(nivel=nivel_letra, activo=True)
        alumnos_data = [{'id': a.id, 'nombre': a.nombre_completo} for a in alumnos]
    else:
        alumnos_data = []

    return JsonResponse({'alumnos': alumnos_data})

def detalle_alumno(request, id):
    alumno = get_object_or_404(Alumno, id=id)
    return render(request, 'alumnos/detalle_alumno.html', {'alumno': alumno})

@login_required
@user_passes_test(is_staff_or_superuser)
def gestion_asignaturas(request):
    # Obtener todas las asignaturas sin agrupar por nivel
    asignaturas = Asignatura.objects.all().order_by('nombre')
    
    context = {
        'asignaturas': asignaturas,
    }
    
    return render(request, 'asignaturas/gestion_asignaturas.html', context)

@login_required
@user_passes_test(is_staff_or_superuser)
def crear_asignatura(request):
    if request.method == 'POST':
        form = AsignaturaForm(request.POST)
        if form.is_valid():
            asignatura = form.save(commit=False)
            # Asignar un curso por defecto (por ejemplo, el primer curso)
            # Esto es solo un ejemplo, deberías adaptarlo según tus necesidades
            curso_default = Curso.objects.first()
            if curso_default:
                asignatura.curso = curso_default
                asignatura.save()
                messages.success(request, f'Asignatura "{asignatura.nombre}" creada exitosamente.')
                return redirect('cursos:gestion_asignaturas')
            else:
                messages.error(request, 'No se pudo crear la asignatura porque no hay cursos disponibles.')
        else:
            messages.error(request, 'No se pudo crear la asignatura. Por favor, revise los campos marcados en rojo.')
    else:
        form = AsignaturaForm()
    
    return render(request, 'asignaturas/crear_asignatura.html', {'form': form})

@login_required
@user_passes_test(is_staff_or_superuser)
def editar_asignatura(request, id):
    asignatura = get_object_or_404(Asignatura, id=id)
    
    if request.method == 'POST':
        form = AsignaturaForm(request.POST, instance=asignatura)
        if form.is_valid():
            form.save()
            messages.success(request, f'Asignatura "{asignatura.nombre}" actualizada exitosamente.')
            return redirect('cursos:gestion_asignaturas')
        else:
            messages.error(request, 'No se pudo actualizar la asignatura. Por favor, revise los campos marcados en rojo.')
    else:
        form = AsignaturaForm(instance=asignatura)
    
    return render(request, 'asignaturas/crear_asignatura.html', {'form': form, 'asignatura': asignatura})

@login_required
@user_passes_test(is_staff_or_superuser)
def eliminar_asignatura(request, id):
    asignatura = get_object_or_404(Asignatura, id=id)
    
    if request.method == 'POST':
        nombre_asignatura = asignatura.nombre
        asignatura.delete()
        messages.success(request, f'Asignatura "{nombre_asignatura}" eliminada exitosamente.')
        return redirect('cursos:gestion_asignaturas')
    
    return render(request, 'asignaturas/confirmar_eliminar_asignatura.html', {'asignatura': asignatura})
