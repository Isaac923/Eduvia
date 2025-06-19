from django.contrib.auth.decorators import login_required, user_passes_test
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib import messages
from django.http import JsonResponse
from django.db.models import Q
from datetime import date
from .models import Alumno, Apoderado, AnoAcademico, AlumnoAno
from .forms import AlumnoCreationForm
from cursos.models import Curso

def is_superuser(user):
    return user.is_superuser

def is_staff_or_superuser(user):
    """Función para verificar si el usuario es staff o superusuario"""
    return user.is_staff or user.is_superuser

@login_required
@user_passes_test(is_superuser, login_url='usuarios:inicio')
def lista_alumnos(request):
    # Obtener año académico
    ano_param = request.GET.get('year')
    if ano_param:
        try:
            ano_obj = get_object_or_404(AnoAcademico, ano=int(ano_param))
        except (ValueError, AnoAcademico.DoesNotExist):
            ano_obj = AnoAcademico.get_ano_activo()
    else:
        ano_obj = AnoAcademico.get_ano_activo()
    
    if not ano_obj:
        # Si no hay año académico, crear uno por defecto
        from datetime import datetime
        ano_actual = datetime.now().year
        ano_obj = AnoAcademico.objects.create(ano=ano_actual, activo=True)
    
    # Verificar si el año permite edición
    permite_edicion = ano_obj.permite_edicion
    
    # Obtener parámetros de filtro (ELIMINAR diagnostico_filter)
    nombre_busqueda = request.GET.get('nombre', '')
    nivel_filter = request.GET.get('nivel', 'todos')
    estado_filter = request.GET.get('estado', 'todos')
    
    # Consulta base - alumnos del año académico seleccionado
    alumnos_ano = AlumnoAno.objects.filter(ano_academico=ano_obj).select_related('alumno')
    
    # Aplicar filtros (ELIMINAR filtro de diagnóstico)
    if nombre_busqueda:
        alumnos_ano = alumnos_ano.filter(
            Q(alumno__primer_nombre__icontains=nombre_busqueda) | 
            Q(alumno__segundo_nombre__icontains=nombre_busqueda) | 
            Q(alumno__apellido_paterno__icontains=nombre_busqueda) | 
            Q(alumno__apellido_materno__icontains=nombre_busqueda)
        )
    
    if nivel_filter != 'todos':
        alumnos_ano = alumnos_ano.filter(nivel=nivel_filter)
    
    if estado_filter != 'todos':
        if estado_filter == 'activo':
            alumnos_ano = alumnos_ano.filter(activo=True)
        elif estado_filter == 'inactivo':
            alumnos_ano = alumnos_ano.filter(activo=False)
    
    # Obtener lista de niveles únicos para el filtro
    niveles = AlumnoAno.objects.filter(
        ano_academico=ano_obj, 
        activo=True
    ).values_list('nivel', flat=True).distinct()
    
    # Obtener todos los años académicos disponibles
    anos_disponibles = AnoAcademico.objects.all().order_by('-ano')
    
    return render(request, 'alumnos/lista_alumnos.html', {
        'alumnos_ano': alumnos_ano,
        'niveles': niveles,
        'nombre_busqueda': nombre_busqueda,
        'nivel_filter': nivel_filter,
        'estado_filter': estado_filter,
        # ELIMINAR 'diagnostico_filter': diagnostico_filter,
        'ano_actual': ano_obj,
        'anos_disponibles': anos_disponibles,
        'permite_edicion': permite_edicion,
    })

@login_required
@user_passes_test(is_superuser, login_url='usuarios:inicio')
def detalle_alumno(request, pk):
    alumno = get_object_or_404(Alumno, pk=pk)
    return render(request, 'alumnos/detalle_alumno.html', {'alumno': alumno})

@login_required
@user_passes_test(is_superuser, login_url='usuarios:inicio')
def crear_alumno(request):
    if request.method == 'POST':
        form = AlumnoCreationForm(request.POST)
        if form.is_valid():
            alumno = form.save(commit=False)
            alumno.activo = True
            alumno.save()
            
            # Crear relación con año académico activo usando get_or_create
            ano_activo = AnoAcademico.get_ano_activo()
            if ano_activo:
                alumno_ano, created = AlumnoAno.objects.get_or_create(
                    alumno=alumno,
                    ano_academico=ano_activo,
                    defaults={
                        'nivel': alumno.nivel,
                        'jornada': alumno.jornada,
                        'activo': True
                    }
                )
                
                # Si ya existía, actualizar los datos
                if not created:
                    alumno_ano.nivel = alumno.nivel
                    alumno_ano.jornada = alumno.jornada
                    alumno_ano.activo = True
                    alumno_ano.save()
            
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

def sincronizar_cursos_alumno(alumno, ano_academico=None):
    """Sincroniza los cursos cuando cambia un alumno"""
    if not ano_academico:
        ano_academico = AnoAcademico.get_ano_activo()
    
    if ano_academico:
        # Actualizar todos los cursos que podrían verse afectados
        cursos = Curso.objects.all()
        for curso in cursos:
            curso.actualizar_alumnos_automaticamente(ano_academico)

@login_required
@user_passes_test(is_staff_or_superuser, login_url='usuarios:inicio')
def cambiar_estado_alumno(request, pk):
    """Vista para cambiar el estado de un alumno en un año específico"""
    if request.method == 'POST':
        alumno = get_object_or_404(Alumno, pk=pk)
        nuevo_estado = request.POST.get('nuevo_estado')
        ano = request.POST.get('ano')
        
        if not ano:
            messages.error(request, 'No se especificó el año académico.')
            return redirect('alumnos:lista_alumnos')
        
        try:
            ano_academico = AnoAcademico.objects.get(ano=int(ano))
            
            # Verificar permisos de edición
            if not ano_academico.permite_edicion:
                messages.error(request, 'No se pueden realizar cambios en este año académico.')
                return redirect('alumnos:lista_alumnos')
            
            # Obtener o crear AlumnoAno
            alumno_ano, created = AlumnoAno.objects.get_or_create(
                alumno=alumno,
                ano_academico=ano_academico,
                defaults={
                    'nivel': alumno.nivel,
                    'jornada': alumno.jornada,
                    'activo': nuevo_estado == 'activo'
                }
            )
            
            if not created:
                alumno_ano.activo = (nuevo_estado == 'activo')
                alumno_ano.save()
            
            # Sincronizar cursos después del cambio
            sincronizar_cursos_alumno(alumno, ano_academico)
            
            estado_texto = 'activado' if nuevo_estado == 'activo' else 'desactivado'
            messages.success(request, f'El alumno {alumno.nombre_completo} ha sido {estado_texto} para el año {ano}.')
            
        except AnoAcademico.DoesNotExist:
            messages.error(request, 'El año académico especificado no existe.')
        except Exception as e:
            messages.error(request, f'Error al cambiar el estado: {str(e)}')
    
    return redirect('alumnos:lista_alumnos')

# Gestión de años académicos
@login_required
@user_passes_test(is_superuser, login_url='usuarios:inicio')
def gestionar_anos_academicos(request):
    """Vista para gestionar años académicos"""
    anos_academicos = AnoAcademico.objects.all()
    
    # Calcular estadísticas para cada año
    for ano in anos_academicos:
        matriculas = AlumnoAno.objects.filter(ano_academico=ano)
        ano.estadisticas = {
            'total_matriculas': matriculas.count(),
            'activos': matriculas.filter(activo=True).count(),
            'inactivos': matriculas.filter(activo=False).count(),
            'niveles_count': matriculas.values('nivel').distinct().count(),
        }
    
    return render(request, 'alumnos/gestionar_anos_academicos.html', {
        'anos_academicos': anos_academicos,
        'current_year': date.today().year,
    })

@login_required
@user_passes_test(is_superuser, login_url='usuarios:inicio')
def crear_ano_academico(request):
    """Vista para crear un nuevo año académico"""
    if request.method == 'POST':
        ano = request.POST.get('ano')
        
        try:
            ano_int = int(ano)
            
            # Validar que el año sea válido
            if ano_int < 2025:
                messages.error(request, "El año académico debe ser 2025 o posterior.")
                return redirect('alumnos:lista_alumnos')
            
            # Verificar que el año no exista ya
            if AnoAcademico.objects.filter(ano=ano_int).exists():
                messages.error(request, f"El año académico {ano_int} ya existe.")
                return redirect('alumnos:lista_alumnos')
            
            # Obtener el año activo actual
            ano_activo_actual = AnoAcademico.get_ano_activo()
            
            # Crear el nuevo año académico (inactivo por defecto)
            nuevo_ano = AnoAcademico.objects.create(
                ano=ano_int,
                activo=False
            )
            
            # Si hay alumnos en el año activo actual, transferir TODOS (activos e inactivos) al nuevo año
            if ano_activo_actual:
                todos_los_alumnos_ano = AlumnoAno.objects.filter(
                    ano_academico=ano_activo_actual
                )
                
                alumnos_transferidos = 0
                for alumno_ano in todos_los_alumnos_ano:
                    # Crear registro en el nuevo año (inactivo por defecto)
                    AlumnoAno.objects.create(
                        alumno=alumno_ano.alumno,
                        ano_academico=nuevo_ano,
                        nivel=alumno_ano.nivel,
                        jornada=alumno_ano.jornada,
                        activo=False
                    )
                    alumnos_transferidos += 1
                
                messages.success(
                    request, 
                    f'Año académico {ano_int} creado exitosamente. '
                    f'{alumnos_transferidos} alumnos (todos sin excepción) han sido transferidos al nuevo año (inactivos). '
                    f'Puedes activar el nuevo año cuando estés listo.'
                )
            else:
                messages.success(request, f'Año académico {ano_int} creado exitosamente.')
            
            # Redirigir al nuevo año creado
            return redirect(f'/alumnos/?year={ano_int}')
            
        except ValueError:
            messages.error(request, "Por favor ingrese un año válido.")
        except Exception as e:
            messages.error(request, f"Error al crear el año académico: {str(e)}")
    
    return redirect('alumnos:lista_alumnos')

@login_required
@user_passes_test(is_superuser, login_url='usuarios:inicio')
def activar_ano_academico(request):
    """Vista para activar un año académico específico"""
    if request.method == 'POST':
        ano = request.POST.get('ano')
        
        try:
            ano_int = int(ano)
            ano_a_activar = get_object_or_404(AnoAcademico, ano=ano_int)
            
            # Obtener el año activo actual
            ano_activo_actual = AnoAcademico.get_ano_activo()
            
            # Activar el nuevo año (esto automáticamente desactiva los demás)
            ano_a_activar.activo = True
            ano_a_activar.save()
            
            # Sincronizar cursos automáticamente
            sincronizar_todos_los_cursos(ano_a_activar)
            
            if ano_activo_actual and ano_activo_actual.pk != ano_a_activar.pk:
                messages.success(
                    request, 
                    f'El año académico {ano_int} ha sido activado exitosamente. '
                    f'El año {ano_activo_actual.ano} ahora está en modo solo lectura.'
                )
            else:
                messages.success(request, f'El año académico {ano_int} ha sido activado exitosamente.')
            
            # Redirigir al año recién activado
            return redirect(f'/alumnos/?year={ano_int}')
            
        except ValueError:
            messages.error(request, "Año académico inválido.")
        except Exception as e:
            messages.error(request, f"Error al activar el año académico: {str(e)}")
    
    return redirect('alumnos:lista_alumnos')

def sincronizar_todos_los_cursos(ano_academico):
    """Sincroniza todos los cursos con el año académico especificado"""
    cursos = Curso.objects.all()
    for curso in cursos:
        curso.actualizar_alumnos_automaticamente(ano_academico)

@login_required
@user_passes_test(is_superuser, login_url='usuarios:inicio')
def cambiar_estado_ano_academico(request):
    """Vista para cambiar el estado de un año académico"""
    if request.method == 'POST':
        ano = request.POST.get('ano')
        accion = request.POST.get('accion')
        
        try:
            ano_academico = AnoAcademico.objects.get(ano=int(ano))
            
            if accion == 'activar':
                ano_academico.activo = True
                ano_academico.save()
                messages.success(request, f"Año académico {ano} activado exitosamente.")
            elif accion == 'archivar':
                ano_academico.activo = False
                ano_academico.save()
                messages.success(request, f"Año académico {ano} archivado exitosamente.")
                
        except AnoAcademico.DoesNotExist:
            messages.error(request, f"No se encontró el año académico {ano}.")
        except Exception as e:
            messages.error(request, f"Error al cambiar el estado: {str(e)}")
    
    return redirect('alumnos:gestionar_anos_academicos')

@login_required
@user_passes_test(is_superuser, login_url='usuarios:inicio')
def eliminar_ano_academico(request):
    """Vista para eliminar un año académico"""
    if request.method == 'POST':
        ano = request.POST.get('ano')
        
        try:
            ano_academico = AnoAcademico.objects.get(ano=int(ano))
            
            # Verificar que no tenga matrículas
            if AlumnoAno.objects.filter(ano_academico=ano_academico).exists():
                messages.error(request, 
                    f"No se puede eliminar el año {ano} porque tiene alumnos matriculados."
                )
            else:
                ano_academico.delete()
                messages.success(request, f"Año académico {ano} eliminado exitosamente.")
                
        except AnoAcademico.DoesNotExist:
            messages.error(request, f"No se encontró el año académico {ano}.")
        except Exception as e:
            messages.error(request, f"Error al eliminar el año académico: {str(e)}")
    
    return redirect('alumnos:gestionar_anos_academicos')

# Funciones para manejar apoderados
@login_required
@user_passes_test(is_superuser, login_url='usuarios:inicio')
def guardar_apoderado(request, apoderado_id=None):
    """Vista para crear o actualizar un apoderado"""
    if apoderado_id:
        apoderado = get_object_or_404(Apoderado, id=apoderado_id)
    else:
        apoderado = None
    
    if request.method == 'POST':
        nombre = request.POST.get('nombre')
        parentezco = request.POST.get('parentezco')
        telefono = request.POST.get('telefono')
        correo = request.POST.get('correo')
        direccion = request.POST.get('direccion')
        es_institucion = request.POST.get('es_institucion') == 'on'
        
        if not all([nombre, parentezco, telefono]):
            messages.error(request, "Los campos nombre, parentezco y teléfono son obligatorios.")
            return redirect('alumnos:lista_alumnos')
        
        try:
            if apoderado:
                # Actualizar apoderado existente
                apoderado.nombre = nombre
                apoderado.parentezco = parentezco
                apoderado.telefono = telefono
                apoderado.correo = correo or None
                apoderado.direccion = direccion or None
                apoderado.es_institucion = es_institucion
                apoderado.save()
                messages.success(request, f"Apoderado {nombre} actualizado exitosamente.")
            else:
                # Crear nuevo apoderado
                apoderado = Apoderado.objects.create(
                    nombre=nombre,
                    parentezco=parentezco,
                    telefono=telefono,
                    correo=correo or None,
                    direccion=direccion or None,
                    es_institucion=es_institucion
                )
                messages.success(request, f"Apoderado {nombre} creado exitosamente.")
            
        except Exception as e:
            messages.error(request, f"Error al guardar el apoderado: {str(e)}")
    
    return redirect('alumnos:lista_alumnos')

@login_required
@user_passes_test(is_superuser, login_url='usuarios:inicio')
def eliminar_apoderado(request, apoderado_id):
    """Vista para eliminar un apoderado"""
    apoderado = get_object_or_404(Apoderado, id=apoderado_id)
    
    if request.method == 'POST':
        nombre_apoderado = apoderado.nombre
        
        # Verificar si hay alumnos asociados
        alumnos_asociados = Alumno.objects.filter(apoderado=apoderado).count()
        
        if alumnos_asociados > 0:
            messages.warning(
                request, 
                f"No se puede eliminar el apoderado {nombre_apoderado} porque tiene {alumnos_asociados} alumno(s) asociado(s). "
                f"Primero debe reasignar o eliminar los alumnos asociados."
            )
        else:
            apoderado.delete()
            messages.success(request, f"Apoderado {nombre_apoderado} eliminado exitosamente.")
    
    return redirect('alumnos:lista_alumnos')

# API endpoints
@login_required
def obtener_detalles_alumno(request, id):
    """API para obtener detalles de un alumno en formato JSON"""
    try:
        alumno = Alumno.objects.select_related('apoderado').get(id=id)
        
        # Obtener información del año académico actual
        ano_activo = AnoAcademico.get_ano_activo()
        alumno_ano = None
        if ano_activo:
            try:
                alumno_ano = AlumnoAno.objects.get(alumno=alumno, ano_academico=ano_activo)
            except AlumnoAno.DoesNotExist:
                pass
        
        # Construir datos del apoderado
        apoderado_data = None
        if alumno.apoderado:
            apoderado_data = {
                'id': alumno.apoderado.id,
                'nombre': alumno.apoderado.nombre,
                'parentezco': alumno.apoderado.parentezco,
                'telefono': alumno.apoderado.telefono,
                'correo': alumno.apoderado.correo or 'No registrado',
                'direccion': alumno.apoderado.direccion or 'No registrada',
                'es_institucion': alumno.apoderado.es_institucion
            }
        
        # Construir respuesta
        data = {
            'id': alumno.id,
            'nombre_completo': alumno.nombre_completo,
            'primer_nombre': alumno.primer_nombre,
            'segundo_nombre': alumno.segundo_nombre or '',
            'apellido_paterno': alumno.apellido_paterno,
            'apellido_materno': alumno.apellido_materno,
            'rut': alumno.rut,
            'fecha_nacimiento': alumno.fecha_nacimiento.strftime('%d/%m/%Y'),
            'edad': alumno.edad,
            'sexo': alumno.get_sexo_display(),
            'direccion': alumno.direccion,
            'telefono': alumno.telefono,
            'correo_electronico': alumno.correo_electronico or 'No registrado',
            'activo': alumno.activo,
            'nivel': alumno.nivel,
            'jornada': alumno.get_jornada_display() if alumno.jornada else 'No definida',
            'fecha_ingreso': alumno.fecha_ingreso.strftime('%d/%m/%Y'),
            'estado_civil': alumno.get_estado_civil_display(),
            'religion': alumno.get_religion_display(),
            'ultimo_curso_aprobado': alumno.ultimo_curso_aprobado or 'No registrado',
            'curso_repetido': alumno.get_curso_repetido_display(),
            'programa_pie': alumno.programa_pie,
            'profesional_apoyo': alumno.get_profesional_apoyo_display(),
            'informe_psicosocial': alumno.informe_psicosocial,
            'situacion_laboral': alumno.get_situacion_laboral_display(),
            'contacto_emergencia_nombre': alumno.contacto_emergencia_nombre or 'No registrado',
            'contacto_emergencia_parentezco': alumno.contacto_emergencia_parentezco or 'No registrado',
            'contacto_emergencia_telefono': alumno.contacto_emergencia_telefono or 'No registrado',
            'apoderado': apoderado_data,
            'fecha_retiro': alumno.fecha_retiro.strftime('%d/%m/%Y') if alumno.fecha_retiro else None,
            'motivo_retiro': alumno.motivo_retiro,
            'observaciones': alumno.observaciones or 'Sin observaciones',
            'diagnostico': alumno.get_diagnostico_display() if alumno.diagnostico else 'No definido',
        }
        
        # Agregar información específica del año académico si existe
        if alumno_ano:
            data.update({
                'nivel_ano_actual': alumno_ano.nivel,
                'jornada_ano_actual': alumno_ano.get_jornada_display(),
                'activo_ano_actual': alumno_ano.activo,
                'fecha_matricula_ano_actual': alumno_ano.fecha_matricula.strftime('%d/%m/%Y'),
            })
        
        return JsonResponse({'success': True, 'alumno': data})
    
    except Alumno.DoesNotExist:
        return JsonResponse({'success': False, 'error': 'Alumno no encontrado'})
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        return JsonResponse({'success': False, 'error': str(e)})