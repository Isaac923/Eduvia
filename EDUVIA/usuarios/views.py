from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.contrib import messages
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
from .models import Usuario
from django.core.paginator import Paginator 
from django.contrib.auth.decorators import login_required, user_passes_test

def is_superuser(user):
    """Función para verificar si el usuario es superusuario"""
    return user.is_superuser

def login_view(request):
    if request.method == 'POST':
        rut = request.POST.get('username')  # El campo se llama username pero esperamos RUT
        password = request.POST.get('password')
        
        # Limpiar el RUT (quitar puntos y espacios)
        rut_limpio = rut.replace('.', '').replace(' ', '').strip()
        
        # 1. Primero buscar en usuarios Django (superusuarios) por username = RUT
        try:
            django_user = User.objects.get(username=rut)
            # Intentar autenticar con Django
            authenticated_user = authenticate(request, username=rut, password=password)
            if authenticated_user is not None:
                login(request, authenticated_user)
                if authenticated_user.is_superuser:
                    messages.success(request, f'Bienvenido Superadministrador!')
                else:
                    messages.success(request, f'Bienvenido {authenticated_user.first_name or "Usuario"}!')
                return redirect('usuarios:inicio')
            else:
                # CAMBIO: Si falla la autenticación Django, verificar si existe en EDUVIA
                # y sincronizar la contraseña
                try:
                    usuario_eduvia = Usuario.objects.get(rut=rut)
                    if usuario_eduvia.check_password(password):
                        # La contraseña es correcta en EDUVIA, sincronizar con Django
                        django_user.set_password(password)
                        django_user.save()
                        
                        # Intentar autenticar nuevamente
                        authenticated_user = authenticate(request, username=rut, password=password)
                        if authenticated_user is not None:
                            login(request, authenticated_user)
                            messages.success(request, f'Bienvenido {usuario_eduvia.nombres}!')
                            return redirect('usuarios:inicio')
                except Usuario.DoesNotExist:
                    pass
                
                messages.error(request, 'Contraseña incorrecta.')
                return render(request, 'Login.html')
        except User.DoesNotExist:
            pass  # No existe en Django User, continuar buscando en Usuario EDUVIA
        
        # 2. Si no se encontró en Django User, buscar en Usuario EDUVIA por RUT
        try:
            # Buscar por RUT en nuestro modelo
            usuario_eduvia = Usuario.objects.get(rut=rut)
            
            # Verificar si el usuario está activo
            if usuario_eduvia.estado != 'active':
                messages.error(request, 'Su cuenta no está activa. Contacte al administrador.')
                return render(request, 'Login.html')
            
            # Verificar contraseña
            if usuario_eduvia.check_password(password):
                # Crear o obtener usuario Django asociado
                django_user, created = User.objects.get_or_create(
                    username=rut,
                    defaults={
                        'email': usuario_eduvia.correo,
                        'first_name': usuario_eduvia.nombres,
                        'last_name': usuario_eduvia.apellidos,
                        'is_staff': usuario_eduvia.rol == 'admin',
                        'is_superuser': False,
                        'is_active': True,
                    }
                )
                
                # CAMBIO: Siempre sincronizar la contraseña
                django_user.set_password(password)
                
                # Actualizar datos si ya existía
                if not created:
                    django_user.email = usuario_eduvia.correo
                    django_user.first_name = usuario_eduvia.nombres
                    django_user.last_name = usuario_eduvia.apellidos
                    django_user.is_staff = usuario_eduvia.rol == 'admin'
                
                django_user.save()
                
                # Hacer login
                login(request, django_user)
                messages.success(request, f'Bienvenido {usuario_eduvia.nombres}!')
                return redirect('usuarios:inicio')
            else:
                messages.error(request, 'Contraseña incorrecta.')
                return render(request, 'Login.html')
                
        except Usuario.DoesNotExist:
            # No existe en ninguna tabla
            messages.error(request, 'RUT no encontrado en el sistema.')
            return render(request, 'Login.html')
        except Exception as e:
            messages.error(request, 'Error en el sistema. Intente nuevamente.')
            return render(request, 'Login.html')
    
    return render(request, 'Login.html')

def logout_view(request):
    logout(request)
    messages.info(request, 'Sesión cerrada exitosamente.')
    return redirect('usuarios:login')

def inicio_view(request):
    return render(request, 'inicio.html')

@login_required
@user_passes_test(is_superuser, login_url='usuarios:inicio')
def lista_usuarios(request):
    usuarios_list = Usuario.objects.all()
    paginator = Paginator(usuarios_list, 10)
    page_number = request.GET.get('page')
    usuarios = paginator.get_page(page_number)
    
    return render(request, 'usuarios/lista_usuarios.html', {'usuarios': usuarios})

@require_http_methods(["GET", "POST"])
@login_required
@user_passes_test(is_superuser, login_url='usuarios:inicio')
def nuevo_usuario(request):
    if request.method == 'POST':
        is_ajax = request.headers.get('X-Requested-With') == 'XMLHttpRequest'
        
        try:
            # Obtener datos del formulario
            rut = request.POST.get('rut', '').strip()
            password = request.POST.get('password', '').strip()
            nombres = request.POST.get('nombres', '').strip()
            apellidos = request.POST.get('apellidos', '').strip()
            telefono = request.POST.get('telefono', '').strip()
            correo = request.POST.get('correo', '').strip()
            rol = request.POST.get('rol', '').strip()
            tipo_usuario = request.POST.get('tipo_usuario', '').strip()
            estado = request.POST.get('estado', 'active')
            asignatura = request.POST.get('asignatura', '').strip()
            
            print(f"=== DEBUG NUEVO USUARIO ===")
            print(f"ROL recibido: '{rol}'")
            print(f"TIPO_USUARIO recibido: '{tipo_usuario}'")
            print(f"Datos completos: rut={rut}, nombres={nombres}, apellidos={apellidos}")
            
            # Validar campos básicos requeridos
            if not all([rut, password, nombres, apellidos, correo, rol]):
                error_data = {
                    'success': False,
                    'message': 'Por favor, complete todos los campos obligatorios.'
                }
                
                if is_ajax:
                    return JsonResponse(error_data, status=400)
                else:
                    messages.error(request, error_data['message'])
                    return render(request, 'usuarios/nuevo_usuario.html')
            
            # Verificar si el RUT ya existe en Usuario EDUVIA
            if Usuario.objects.filter(rut=rut).exists():
                existing_user = Usuario.objects.get(rut=rut)
                error_data = {
                    'success': False,
                    'message': f'Ya existe un usuario registrado con el RUT {rut}: {existing_user.nombres} {existing_user.apellidos}'
                }
                
                if is_ajax:
                    return JsonResponse(error_data, status=409)
                else:
                    messages.error(request, error_data['message'])
                    return render(request, 'usuarios/nuevo_usuario.html')
            
            # Verificar si el RUT ya existe en User Django (para superusuarios)
            if User.objects.filter(username=rut).exists():
                existing_django_user = User.objects.get(username=rut)
                error_data = {
                    'success': False,
                    'message': f'Ya existe un usuario registrado con el RUT {rut}: {existing_django_user.first_name} {existing_django_user.last_name}'
                }
                
                if is_ajax:
                    return JsonResponse(error_data, status=409)
                else:
                    messages.error(request, error_data['message'])
                    return render(request, 'usuarios/nuevo_usuario.html')
            
            # Verificar correo único en Usuario EDUVIA
            if Usuario.objects.filter(correo=correo).exists():
                existing_user = Usuario.objects.get(correo=correo)
                error_data = {
                    'success': False,
                    'message': f'Ya existe un usuario registrado con el correo {correo}: {existing_user.nombres} {existing_user.apellidos}'
                }
                
                if is_ajax:
                    return JsonResponse(error_data, status=409)
                else:
                    messages.error(request, error_data['message'])
                    return render(request, 'usuarios/nuevo_usuario.html')
            
            # Verificar correo único en User Django
            if User.objects.filter(email=correo).exists():
                existing_django_user = User.objects.get(email=correo)
                error_data = {
                    'success': False,
                    'message': f'Ya existe un usuario registrado con el correo {correo}: {existing_django_user.first_name} {existing_django_user.last_name}'
                }
                
                if is_ajax:
                    return JsonResponse(error_data, status=409)
                else:
                    messages.error(request, error_data['message'])
                    return render(request, 'usuarios/nuevo_usuario.html')
            
            # Crear usuario según el tipo
            if rol == 'superusuario':
                print("Creando SUPERUSUARIO...")
                
                # Crear superusuario en Django User
                django_user = User.objects.create_user(
                    username=rut,
                    email=correo,
                    password=password,
                    first_name=nombres,
                    last_name=apellidos,
                    is_staff=True,
                    is_superuser=True,
                    is_active=True
                )
                
                print(f"Usuario Django creado: {django_user.username}, is_superuser: {django_user.is_superuser}")
                
                # También crear en Usuario EDUVIA
                usuario = Usuario(
                    rut=rut,
                    password=password,
                    nombres=nombres,
                    apellidos=apellidos,
                    telefono=telefono if telefono and telefono != '+56 9 ' else None,
                    correo=correo,
                    rol='superusuario',  # CAMBIADO: Ahora se guarda como 'superusuario'
                    estado=estado,
                    asignatura=None
                )
                usuario.save()
                
                print(f"Usuario EDUVIA creado: {usuario.rut}, rol: {usuario.rol}")
                
                success_message = f'Superusuario {nombres} {apellidos} creado exitosamente con acceso completo al sistema.'
                
            elif rol == 'profesor':
                print("Creando PROFESOR...")
                
                # Validar que se haya seleccionado asignatura
                if not asignatura:
                    error_data = {
                        'success': False,
                        'message': 'Debe seleccionar una asignatura para el profesor.'
                    }
                    
                    if is_ajax:
                        return JsonResponse(error_data, status=400)
                    else:
                        messages.error(request, error_data['message'])
                        return render(request, 'usuarios/nuevo_usuario.html')
                
                # Crear profesor
                usuario = Usuario(
                    rut=rut,
                    password=password,
                    nombres=nombres,
                    apellidos=apellidos,
                    telefono=telefono if telefono and telefono != '+56 9 ' else None,
                    correo=correo,
                    rol='profesor',
                    estado=estado,
                    asignatura=asignatura
                )
                usuario.save()
                
                print(f"Profesor creado: {usuario.rut}, rol: {usuario.rol}, asignatura: {usuario.asignatura}")
                
                success_message = f'Profesor {nombres} {apellidos} creado exitosamente para la asignatura {asignatura}.'
            
            else:
                print(f"Rol no reconocido: {rol}")
                error_data = {
                    'success': False,
                    'message': f'Tipo de usuario no válido: {rol}'
                }
                
                if is_ajax:
                    return JsonResponse(error_data, status=400)
                else:
                    messages.error(request, error_data['message'])
                    return render(request, 'usuarios/nuevo_usuario.html')
            
            success_data = {
                'success': True,
                'message': success_message
            }
            
            if is_ajax:
                return JsonResponse(success_data, status=200)
            else:
                messages.success(request, success_message)
                return redirect('usuarios:lista_usuarios')
                
        except Exception as e:
            print(f"Error en nuevo_usuario: {str(e)}")
            import traceback
            traceback.print_exc()
            
            error_data = {
                'success': False,
                'message': f'Error al crear el usuario: {str(e)}'
            }
            
            if is_ajax:
                return JsonResponse(error_data, status=500)
            else:
                messages.error(request, error_data['message'])
                return render(request, 'usuarios/nuevo_usuario.html')
    
    return render(request, 'usuarios/nuevo_usuario.html')

@require_http_methods(["GET", "POST"])
@login_required
@user_passes_test(is_superuser, login_url='usuarios:inicio')
def editar_usuario(request, usuario_id):
    usuario = get_object_or_404(Usuario, id=usuario_id)
    
    if request.method == 'POST':
        is_ajax = request.headers.get('X-Requested-With') == 'XMLHttpRequest'
        
        try:
            rut = request.POST.get('rut', '').strip()
            nombres = request.POST.get('nombres', '').strip()
            apellidos = request.POST.get('apellidos', '').strip()
            telefono = request.POST.get('telefono', '').strip()
            correo = request.POST.get('correo', '').strip()
            rol = request.POST.get('rol', '').strip()
            tipo_usuario = request.POST.get('tipo_usuario', '').strip()
            estado = request.POST.get('estado', '').strip()
            asignatura = request.POST.get('asignatura', '').strip()
            
            print(f"=== DEBUG EDITAR USUARIO ===")
            print(f"Usuario ID: {usuario_id}")
            print(f"ROL recibido: '{rol}'")
            print(f"TIPO_USUARIO recibido: '{tipo_usuario}'")
            
            if not all([rut, nombres, apellidos, correo, rol, estado]):
                error_data = {
                    'success': False,
                    'message': 'Por favor, complete todos los campos obligatorios.'
                }
                
                if is_ajax:
                    return JsonResponse(error_data)
                else:
                    messages.error(request, error_data['message'])
                    return render(request, 'usuarios/editar_usuario.html', {'usuario': usuario})
            
            # Verificar RUT único (excluyendo el usuario actual)
            if Usuario.objects.filter(rut=rut).exclude(id=usuario_id).exists():
                error_data = {
                    'success': False,
                    'message': f'Ya existe otro usuario con el RUT {rut}.'
                }
                
                if is_ajax:
                    return JsonResponse(error_data)
                else:
                    messages.error(request, error_data['message'])
                    return render(request, 'usuarios/editar_usuario.html', {'usuario': usuario})
            
            # Verificar correo único (excluyendo el usuario actual)
            if Usuario.objects.filter(correo=correo).exclude(id=usuario_id).exists():
                error_data = {
                    'success': False,
                    'message': f'Ya existe otro usuario con el correo {correo}.'
                }
                
                if is_ajax:
                    return JsonResponse(error_data)
                else:
                    messages.error(request, error_data['message'])
                    return render(request, 'usuarios/editar_usuario.html', {'usuario': usuario})
            
            # Actualizar datos básicos del usuario
            usuario.rut = rut
            usuario.nombres = nombres
            usuario.apellidos = apellidos
            usuario.telefono = telefono if telefono and telefono != '+56 9 ' else ''
            usuario.correo = correo
            usuario.estado = estado
            
            # Manejar cambios de rol
            if rol == 'superusuario':
                print("Actualizando a SUPERUSUARIO...")
                
                # Actualizar rol en EDUVIA
                usuario.rol = 'superusuario'
                usuario.asignatura = None
                
                # Crear o actualizar usuario Django
                try:
                    django_user = User.objects.get(username=rut)
                    django_user.is_superuser = True
                    django_user.is_staff = True
                    django_user.email = correo
                    django_user.first_name = nombres
                    django_user.last_name = apellidos
                    django_user.save()
                    print(f"Usuario Django actualizado: {django_user.username}, is_superuser: {django_user.is_superuser}")
                except User.DoesNotExist:
                    # Crear nuevo usuario Django si no existe
                    django_user = User.objects.create_user(
                        username=rut,
                        email=correo,
                        password='temp_password_change_required',  # Requerirá cambio de contraseña
                        first_name=nombres,
                        last_name=apellidos,
                        is_staff=True,
                        is_superuser=True,
                        is_active=True
                    )
                    print(f"Usuario Django creado: {django_user.username}, is_superuser: {django_user.is_superuser}")
                
            elif rol == 'profesor':
                print("Actualizando a PROFESOR...")
                
                # Validar asignatura para profesores
                if not asignatura:
                    error_data = {
                        'success': False,
                        'message': 'Debe seleccionar una asignatura para el profesor.'
                    }
                    
                    if is_ajax:
                        return JsonResponse(error_data)
                    else:
                        messages.error(request, error_data['message'])
                        return render(request, 'usuarios/editar_usuario.html', {'usuario': usuario})
                
                usuario.rol = 'profesor'
                usuario.asignatura = asignatura
                
                # Si tenía usuario Django como superusuario, quitarle permisos
                try:
                    django_user = User.objects.get(username=rut)
                    django_user.is_superuser = False
                    django_user.is_staff = False
                    django_user.email = correo
                    django_user.first_name = nombres
                    django_user.last_name = apellidos
                    django_user.save()
                    print(f"Permisos de superusuario removidos de: {django_user.username}")
                except User.DoesNotExist:
                    print("No existe usuario Django para este profesor")
                    pass  # No existe usuario Django, no hay problema
            
            else:
                print(f"Rol no reconocido en edición: {rol}")
                error_data = {
                    'success': False,
                    'message': f'Tipo de usuario no válido: {rol}'
                }
                
                if is_ajax:
                    return JsonResponse(error_data)
                else:
                    messages.error(request, error_data['message'])
                    return render(request, 'usuarios/editar_usuario.html', {'usuario': usuario})
            
            usuario.save()
            print(f"Usuario EDUVIA actualizado: {usuario.rut}, rol: {usuario.rol}")
            
            success_data = {
                'success': True,
                'message': f'Usuario {nombres} {apellidos} actualizado exitosamente.'
            }
            
            if is_ajax:
                return JsonResponse(success_data)
            else:
                messages.success(request, success_data['message'])
                return redirect('usuarios:lista_usuarios')
                
        except Exception as e:
            print(f"Error en editar_usuario: {str(e)}")
            import traceback
            traceback.print_exc()
            
            error_data = {
                'success': False,
                'message': f'Error al actualizar el usuario: {str(e)}'
            }
            
            if is_ajax:
                return JsonResponse(error_data)
            else:
                messages.error(request, error_data['message'])
                return render(request, 'usuarios/editar_usuario.html', {'usuario': usuario})
    
    return render(request, 'usuarios/editar_usuario.html', {'usuario': usuario})

@csrf_exempt
@login_required
@user_passes_test(is_superuser, login_url='usuarios:inicio')
def eliminar_usuario(request, usuario_id):
    usuario = get_object_or_404(Usuario, id=usuario_id)
    
    if request.method == 'POST':
        nombre_completo = f"{usuario.nombres} {usuario.apellidos}"
        rut_usuario = usuario.rut
        es_superusuario = usuario.rol == 'superusuario'
        
        try:
            # Eliminar usuario de EDUVIA
            usuario.delete()
            print(f"Usuario EDUVIA eliminado: {rut_usuario}")
            
            # Si era superusuario, también eliminar de Django User
            if es_superusuario:
                try:
                    django_user = User.objects.get(username=rut_usuario)
                    django_user.delete()
                    print(f"Usuario Django eliminado: {rut_usuario}")
                except User.DoesNotExist:
                    print(f"No se encontró usuario Django para: {rut_usuario}")
                    pass  # No existe usuario Django, no hay problema
            
            messages.success(request, f'El usuario {nombre_completo} ha sido eliminado correctamente.')
        except Exception as e:
            print(f"Error al eliminar usuario: {str(e)}")
            messages.error(request, f'Error al eliminar el usuario: {str(e)}')
        
        return redirect('usuarios:lista_usuarios')
    
    return redirect('usuarios:lista_usuarios')
