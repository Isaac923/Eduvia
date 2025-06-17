from django.shortcuts import render, redirect, get_object_or_404
from django.contrib import messages
from django.contrib.auth.decorators import login_required, user_passes_test
from django.http import JsonResponse
from .forms import CursoForm
from alumnos.models import Alumno, AnoAcademico, AlumnoAno
from .models import Curso

def is_superuser(user):
    """Función para verificar si el usuario es superusuario"""
    return user.is_superuser

def is_staff_or_superuser(user):
    """Función para verificar si el usuario es staff o superusuario"""
    return user.is_staff or user.is_superuser

@login_required
@user_passes_test(is_superuser, login_url='usuarios:inicio')
def gestion_cursos(request):
    """Vista para la gestión de cursos - Solo superusuarios"""
    # Obtener año académico activo
    ano_activo = AnoAcademico.get_ano_activo()
    
    # Sincronizar todos los cursos con el año activo
    if ano_activo:
        for curso in Curso.objects.all():
            curso.actualizar_alumnos_automaticamente(ano_activo)
    
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
        'ano_activo': ano_activo,
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
        ano_activo = AnoAcademico.get_ano_activo()
        
        # Actualizar alumnos antes de obtener detalles
        if ano_activo:
            curso.actualizar_alumnos_automaticamente(ano_activo)
        
        # Obtener datos de los alumnos SOLO ACTIVOS
        alumnos_data = []
        for alumno in curso.alumnos.filter(activo=True):  # Filtrar solo activos
            # Verificar si el alumno está activo en el año actual
            activo_en_ano = True
            if ano_activo:
                try:
                    alumno_ano = AlumnoAno.objects.get(alumno=alumno, ano_academico=ano_activo)
                    activo_en_ano = alumno_ano.activo
                except AlumnoAno.DoesNotExist:
                    activo_en_ano = False
            
            # Solo agregar si está activo en ambos lugares
            if activo_en_ano:
                alumnos_data.append({
                    'id': alumno.id,
                    'nombre': alumno.nombre_completo,
                    'nivel': alumno.nivel,
                    'activo': True,  # Siempre True porque ya filtramos
                    'edad': alumno.edad,
                    'jornada': alumno.get_jornada_display() if alumno.jornada else 'No definida'
                })
        
        # Construir respuesta
        data = {
            'id': curso.id,
            'nivel': curso.nivel,
            'letra': curso.letra.upper(),
            'jornada': 'Diurna' if curso.letra.lower() == 'a' else 'Vespertina',
            'alumnos': alumnos_data,
            'total_alumnos': len(alumnos_data),
            'ano_academico': ano_activo.ano if ano_activo else None,
            'asignacion_automatica': True
        }
        
        return JsonResponse({'success': True, 'data': data})
    
    except Curso.DoesNotExist:
        return JsonResponse({'success': False, 'error': 'Curso no encontrado'})
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        return JsonResponse({'success': False, 'error': str(e)})

@login_required
@user_passes_test(is_superuser, login_url='usuarios:inicio')
def sincronizar_cursos(request):
    """Vista para sincronizar manualmente todos los cursos"""
    if request.method == 'POST':
        ano_activo = AnoAcademico.get_ano_activo()
        if ano_activo:
            cursos_actualizados = 0
            for curso in Curso.objects.all():
                curso.actualizar_alumnos_automaticamente(ano_activo)
                cursos_actualizados += 1
            
            messages.success(request, f'Se sincronizaron {cursos_actualizados} cursos con el año académico {ano_activo.ano}.')
        else:
            messages.error(request, 'No hay un año académico activo para sincronizar.')
    
    return redirect('cursos:gestion_cursos')

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
