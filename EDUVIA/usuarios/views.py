from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.contrib import messages
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
from .models import Usuario
from django.core.paginator import Paginator 

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

def lista_usuarios(request):
    usuarios_list = Usuario.objects.all()
    paginator = Paginator(usuarios_list, 10)
    page_number = request.GET.get('page')
    usuarios = paginator.get_page(page_number)
    
    return render(request, 'usuarios/lista_usuarios.html', {'usuarios': usuarios})

@require_http_methods(["GET", "POST"])
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
            estado = request.POST.get('estado', 'active')
            funcion = request.POST.get('funcion', '').strip()
            
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
            
            # Verificar si el RUT ya existe
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
            
            # Verificar correo único
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
            
            # Crear el usuario
            usuario = Usuario(
                rut=rut,
                password=password,
                nombres=nombres,
                apellidos=apellidos,
                telefono=telefono if telefono and telefono != '+56 9 ' else None,
                correo=correo,
                rol=rol,
                estado=estado,
                funcion=funcion
            )
            usuario.save()
            
            success_data = {
                'success': True,
                'message': f'Usuario {nombres} {apellidos} creado exitosamente.'
            }
            
            if is_ajax:
                return JsonResponse(success_data, status=200)
            else:
                messages.success(request, success_data['message'])
                return redirect('usuarios:lista_usuarios')
                
        except Exception as e:
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
            estado = request.POST.get('estado', '').strip()
            funcion = request.POST.get('funcion', '').strip()
            
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
            
            usuario.rut = rut
            usuario.nombres = nombres
            usuario.apellidos = apellidos
            usuario.telefono = telefono if telefono and telefono != '+56 9 ' else ''
            usuario.correo = correo
            usuario.rol = rol
            usuario.estado = estado
            usuario.funcion = funcion
            usuario.save()
            
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
def eliminar_usuario(request, usuario_id):
    usuario = get_object_or_404(Usuario, id=usuario_id)
    
    if request.method == 'POST':
        nombre_completo = f"{usuario.nombres} {usuario.apellidos}"
        
        try:
            usuario.delete()
            messages.success(request, f'El usuario {nombre_completo} ha sido eliminado correctamente.')
        except Exception as e:
            messages.error(request, f'Error al eliminar el usuario: {str(e)}')
        
        return redirect('usuarios:lista_usuarios')
    
    return redirect('usuarios:lista_usuarios')
