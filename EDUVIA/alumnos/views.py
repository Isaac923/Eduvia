from django.contrib.auth.decorators import login_required, user_passes_test
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib import messages
from django.http import JsonResponse
from django.db.models import Q
from .models import Alumno, Apoderado
from .forms import AlumnoCreationForm

def is_superuser(user):
    """Función para verificar si el usuario es superusuario"""
    return user.is_superuser

# Vistas basadas en funciones para alumnos
@login_required
@user_passes_test(is_superuser, login_url='usuarios:inicio')
def lista_alumnos(request):
    # Obtener parámetros de filtro
    nombre_busqueda = request.GET.get('nombre', '')
    nivel_filter = request.GET.get('nivel', 'todos')
    estado_filter = request.GET.get('estado', 'todos')
    
    # Consulta base
    alumnos = Alumno.objects.all()
    
    # Aplicar filtros
    if nombre_busqueda:
        alumnos = alumnos.filter(
            Q(primer_nombre__icontains=nombre_busqueda) | 
            Q(segundo_nombre__icontains=nombre_busqueda) | 
            Q(apellido_paterno__icontains=nombre_busqueda) | 
            Q(apellido_materno__icontains=nombre_busqueda)
        )
    
    if nivel_filter != 'todos':
        alumnos = alumnos.filter(nivel=nivel_filter)
    
    if estado_filter != 'todos':
        if estado_filter == 'activo':
            alumnos = alumnos.filter(activo=True)
        elif estado_filter == 'inactivo':
            alumnos = alumnos.filter(activo=False)
    
    # Obtener lista de niveles únicos para el filtro (solo de alumnos activos)
    niveles = Alumno.objects.filter(activo=True).values_list('nivel', flat=True).distinct()
    
    return render(request, 'alumnos/lista_alumnos.html', {
        'alumnos': alumnos,
        'niveles': niveles,
        'nombre_busqueda': nombre_busqueda,
        'nivel_filter': nivel_filter,
        'estado_filter': estado_filter,
    })

@login_required
@user_passes_test(is_superuser, login_url='usuarios:inicio')
def detalle_alumno(request, pk):
    """Vista para ver los detalles de un alumno"""
    alumno = get_object_or_404(Alumno, pk=pk)
    return render(request, 'alumnos/detalle_alumno.html', {'alumno': alumno})

@login_required
@user_passes_test(is_superuser, login_url='usuarios:inicio')
def crear_alumno(request):
    """Vista para crear un nuevo alumno"""
    if request.method == 'POST':
        form = AlumnoCreationForm(request.POST)
        if form.is_valid():
            alumno = form.save(commit=False)
            alumno.activo = True
            alumno.save()
            messages.success(request, f"El alumno {alumno.nombre_completo} ha sido creado exitosamente.")
            return redirect('alumnos:lista_alumnos')
        else:
            messages.error(request, "Error al crear el alumno. Por favor revise los datos ingresados.")
    else:
        form = AlumnoCreationForm()
    
    return render(request, 'alumnos/crear_alumnos.html', {'form': form})

@login_required
@user_passes_test(is_superuser, login_url='usuarios:inicio')
def editar_alumno(request, pk):
    """Vista para editar un alumno existente"""
    alumno = get_object_or_404(Alumno, pk=pk)
    
    if request.method == 'POST':
        form = AlumnoCreationForm(request.POST, instance=alumno)
        if form.is_valid():
            form.save()
            messages.success(request, f"Los datos del alumno {alumno.nombre_completo} han sido actualizados exitosamente.")
            return redirect('alumnos:lista_alumnos')
        else:
            messages.error(request, f"Error al actualizar los datos del alumno {alumno.nombre_completo}.")
    else:
        form = AlumnoCreationForm(instance=alumno)
    
    return render(request, 'alumnos/editar_alumno.html', {'form': form, 'alumno': alumno})

@login_required
@user_passes_test(is_superuser, login_url='usuarios:inicio')
def eliminar_alumno(request, pk):
    """Vista para eliminar un alumno de la base de datos"""
    alumno = get_object_or_404(Alumno, pk=pk)
    
    if request.method == 'POST':
        nombre_alumno = alumno.nombre_completo
        alumno.delete()
        messages.success(request, f"El alumno {nombre_alumno} ha sido eliminado permanentemente.")
        return redirect('alumnos:lista_alumnos')
    
    return render(request, 'alumnos/eliminar_alumno.html', {'alumno': alumno})

@login_required
@user_passes_test(is_superuser, login_url='usuarios:inicio')
def retirar_alumno(request, pk):
    """Vista para registrar el retiro de un alumno"""
    alumno = get_object_or_404(Alumno, pk=pk)
    
    if request.method == 'POST':
        fecha_retiro = request.POST.get('fecha_retiro')
        motivo_retiro = request.POST.get('motivo_retiro')
        
        if fecha_retiro and motivo_retiro:
            alumno.fecha_retiro = fecha_retiro
            alumno.motivo_retiro = motivo_retiro
            alumno.activo = False
            alumno.save()
            messages.success(request, f"El alumno {alumno.nombre_completo} ha sido retirado exitosamente.")
            return redirect('alumnos:lista_alumnos')
        else:
            messages.error(request, "Por favor complete todos los campos requeridos.")
    
    return render(request, 'alumnos/retirar_alumno.html', {'alumno': alumno})

@login_required
@user_passes_test(is_superuser, login_url='usuarios:inicio')
def cambiar_estado_alumno(request, pk):
    if request.method == 'POST':
        alumno = get_object_or_404(Alumno, pk=pk)
        nuevo_estado = request.POST.get('nuevo_estado')
        
        if nuevo_estado == 'activo':
            alumno.activo = True
            estado_texto = 'activado'
        elif nuevo_estado == 'inactivo':
            alumno.activo = False
            estado_texto = 'desactivado'
        
        alumno.save()
        
        messages.success(request, f'El alumno {alumno.nombre_completo} ha sido {estado_texto} exitosamente.')
        
    return redirect('alumnos:lista_alumnos')

# Funciones para manejar apoderados
def guardar_apoderado(request, apoderado_id=None):
    """
    Vista para crear o actualizar un apoderado
    """
    if apoderado_id:
        apoderado = get_object_or_404(Apoderado, id=apoderado_id)
    else:
        apoderado = None
    
    if request.method == 'POST':
        # Obtener datos del formulario
        nombre = request.POST.get('nombre')
        parentezco = request.POST.get('parentezco')
        telefono = request.POST.get('telefono')
        correo = request.POST.get('correo')
        direccion = request.POST.get('direccion')
        es_institucion = request.POST.get('es_institucion') == 'on'
        
        # Validar datos básicos
        if not nombre or not telefono:
            messages.error(request, "El nombre y teléfono son obligatorios.")
            return redirect('alumnos:lista_alumnos')
        
        # Crear o actualizar apoderado
        if apoderado:
            apoderado.nombre = nombre
            apoderado.parentezco = parentezco
            apoderado.telefono = telefono
            apoderado.correo = correo
            apoderado.direccion = direccion
            apoderado.es_institucion = es_institucion
            apoderado.save()
            messages.success(request, "Apoderado actualizado exitosamente.")
        else:
            apoderado = Apoderado.objects.create(
                nombre=nombre,
                parentezco=parentezco,
                telefono=telefono,
                correo=correo,
                direccion=direccion,
                es_institucion=es_institucion
            )
            messages.success(request, "Apoderado creado exitosamente.")
        
        # Asociar apoderado a alumno si se proporciona un ID de alumno
        alumno_id = request.POST.get('alumno_id')
        if alumno_id:
            alumno = get_object_or_404(Alumno, id=alumno_id)
            alumno.apoderado = apoderado
            alumno.save()
            return redirect('alumnos:detalle_alumno', pk=alumno.id)
        
        return redirect('alumnos:lista_alumnos')
    
    # Para solicitudes GET, renderizar formulario
    context = {
        'apoderado': apoderado,
        'alumno_id': request.GET.get('alumno_id')
    }
    return render(request, 'alumnos/apoderado_form.html', context)

def eliminar_apoderado(request, apoderado_id):
    """
    Vista para eliminar un apoderado
    """
    apoderado = get_object_or_404(Apoderado, id=apoderado_id)
    
    # Obtener alumnos asociados para redirigir después
    alumnos_asociados = Alumno.objects.filter(apoderado=apoderado)
    alumno_id = None
    if alumnos_asociados.exists():
        alumno_id = alumnos_asociados.first().id
    
    # Desasociar el apoderado de los alumnos
    for alumno in alumnos_asociados:
        alumno.apoderado = None
        alumno.save()
    
    # Eliminar el apoderado
    apoderado.delete()
    messages.success(request, "Apoderado eliminado exitosamente.")
    
    # Redirigir a la página de detalle del alumno si existe
    if alumno_id:
        return redirect('alumnos:detalle_alumno', pk=alumno_id)
    
    return redirect('alumnos:lista_alumnos')

# API para obtener detalles de alumno
def obtener_detalles_alumno(request, id):
    """
    API endpoint para obtener detalles de un alumno en formato JSON
    """
    try:
        alumno = get_object_or_404(Alumno, id=id)
        
        # Construir datos del apoderado si existe
        apoderado_data = None
        if alumno.apoderado:
            apoderado_data = {
                'id': alumno.apoderado.id,
                'nombre': alumno.apoderado.nombre,
                'parentezco': alumno.apoderado.parentezco,
                'telefono': alumno.apoderado.telefono,
                'correo': alumno.apoderado.correo,
                'direccion': alumno.apoderado.direccion,
                'es_institucion': alumno.apoderado.es_institucion,
            }
        
        # Construir respuesta
        data = {
            'id': alumno.id,
            'nombre_completo': alumno.nombre_completo,
            'rut': alumno.rut,
            'fecha_nacimiento': alumno.fecha_nacimiento.strftime('%Y-%m-%d'),
            'edad': alumno.edad,
            'sexo': alumno.get_sexo_display(),
            'direccion': alumno.direccion,
            'telefono': alumno.telefono,
            'correo_electronico': alumno.correo_electronico,
            'nivel': alumno.nivel,
            'jornada': alumno.jornada,
            'fecha_ingreso': alumno.fecha_ingreso.strftime('%Y-%m-%d'),
            'activo': alumno.activo,
            'apoderado': apoderado_data,
            # Campos adicionales
            'estado_civil': alumno.get_estado_civil_display(),
            'religion': alumno.get_religion_display(),
            'ultimo_curso_aprobado': alumno.ultimo_curso_aprobado,
            'curso_repetido': alumno.curso_repetido,
            'anio_repitencia': alumno.anio_repitencia,
            'programa_pie': alumno.programa_pie,
            'profesional_apoyo': alumno.profesional_apoyo,
            'informe_psicosocial': alumno.informe_psicosocial,
            'situacion_laboral': alumno.get_situacion_laboral_display(),
            'contacto_emergencia': {
                'nombre': alumno.contacto_emergencia_nombre,
                'parentezco': alumno.contacto_emergencia_parentezco,
                'telefono': alumno.contacto_emergencia_telefono,
            },
            'retiro': {
                'fecha': alumno.fecha_retiro.strftime('%Y-%m-%d') if alumno.fecha_retiro else None,
                'motivo': alumno.motivo_retiro,
            }
        }
        
        return JsonResponse({'success': True, 'alumno': data})
    except Exception as e:
        import traceback
        print(traceback.format_exc())  # Añadir esto para depuración
        return JsonResponse({'success': False, 'error': str(e)}, status=400)