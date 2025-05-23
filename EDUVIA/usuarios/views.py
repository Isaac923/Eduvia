from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth import authenticate, login
from django.contrib import messages
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
from .models import Usuario
from django.core.paginator import Paginator 

def login_view(request):
    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')
        user_type = request.POST.get('user_type')
        
        # Aquí deberías implementar la lógica de autenticación según tu modelo
        user = authenticate(request, username=username, password=password)
        
        if user is not None:
            login(request, user)
            # Redirigir al usuario a la página de inicio después de iniciar sesión
            return redirect('usuarios:inicio')
        else:
            # Si la autenticación falla, mostrar un mensaje de error
            error_message = "Credenciales incorrectas. Por favor, intente nuevamente."
            return render(request, 'Login.html', {'error_message': error_message})
    
    # Si es una solicitud GET, simplemente mostrar la página de login
    return render(request, 'Login.html')

def inicio_view(request):
    # Aquí puedes agregar lógica para verificar si el usuario está autenticado
    return render(request, 'inicio.html')

def lista_usuarios(request):
    # Obtener todos los usuarios
    usuarios_list = Usuario.objects.all()
    
    # Configurar paginación
    paginator = Paginator(usuarios_list, 10)  # 10 usuarios por página
    page_number = request.GET.get('page')
    usuarios = paginator.get_page(page_number)
    
    return render(request, 'usuarios/lista_usuarios.html', {'usuarios': usuarios})

@require_http_methods(["GET", "POST"])
def nuevo_usuario(request):
    if request.method == 'POST':
        # Verificar si es una petición AJAX
        is_ajax = request.headers.get('X-Requested-With') == 'XMLHttpRequest'
        
        try:
            # Obtener datos del formulario
            rut = request.POST.get('rut', '').strip()
            nombres = request.POST.get('nombres', '').strip()
            apellidos = request.POST.get('apellidos', '').strip()
            telefono = request.POST.get('telefono', '').strip()
            correo = request.POST.get('correo', '').strip()
            rol = request.POST.get('rol', '').strip()
            estado = request.POST.get('estado', 'inactive')  # Por defecto inactivo
            funcion = request.POST.get('funcion', '').strip()
            
            # Validar datos (validación básica)
            if not all([rut, nombres, apellidos, correo, rol]):
                error_data = {
                    'success': False,
                    'error_type': 'validation_error',
                    'message': 'Por favor, complete todos los campos obligatorios.'
                }
                
                if is_ajax:
                    return JsonResponse(error_data)
                else:
                    messages.error(request, error_data['message'])
                    return render(request, 'usuarios/nuevo_usuario.html')
            
            # Verificar si ya existe un usuario con el mismo RUT
            if Usuario.objects.filter(rut=rut).exists():
                existing_user = Usuario.objects.get(rut=rut)
                error_data = {
                    'success': False,
                    'error_type': 'user_exists',
                    'existing_field': 'RUT',
                    'existing_value': f'{existing_user.nombres} {existing_user.apellidos} (RUT: {existing_user.rut})',
                    'message': f'Ya existe un usuario registrado con el RUT {rut}.'
                }
                
                if is_ajax:
                    return JsonResponse(error_data)
                else:
                    messages.error(request, error_data['message'])
                    return render(request, 'usuarios/nuevo_usuario.html')
            
            # Verificar si ya existe un usuario con el mismo correo
            if Usuario.objects.filter(correo=correo).exists():
                existing_user = Usuario.objects.get(correo=correo)
                error_data = {
                    'success': False,
                    'error_type': 'user_exists',
                    'existing_field': 'correo electrónico',
                    'existing_value': f'{existing_user.nombres} {existing_user.apellidos} (Email: {existing_user.correo})',
                    'message': f'Ya existe un usuario registrado con el correo {correo}.'
                }
                
                if is_ajax:
                    return JsonResponse(error_data)
                else:
                    messages.error(request, error_data['message'])
                    return render(request, 'usuarios/nuevo_usuario.html')
            
            # Crear nuevo usuario
            usuario = Usuario(
                rut=rut,
                nombres=nombres,
                apellidos=apellidos,
                telefono=telefono,
                correo=correo,
                rol=rol,
                estado=estado,
                funcion=funcion
            )
            usuario.save()
            
            success_data = {
                'success': True,
                'message': f'Usuario {nombres} {apellidos} creado exitosamente.',
                'redirect_url': '/usuarios/'  # Ajusta según tu configuración de URLs
            }
            
            if is_ajax:
                return JsonResponse(success_data)
            else:
                messages.success(request, success_data['message'])
                return redirect('usuarios:lista_usuarios')
                
        except Exception as e:
            error_data = {
                'success': False,
                'error_type': 'general_error',
                'message': f'Error al crear el usuario: {str(e)}'
            }
            
            if is_ajax:
                return JsonResponse(error_data)
            else:
                messages.error(request, error_data['message'])
                return render(request, 'usuarios/nuevo_usuario.html')
    
    # Si es una solicitud GET, simplemente mostrar el formulario
    return render(request, 'usuarios/nuevo_usuario.html')

@csrf_exempt
def eliminar_usuario(request, usuario_id):
    """
    Vista para eliminar un usuario.
    Requiere confirmación a través de un modal.
    """
    # Obtener el usuario o devolver 404 si no existe
    usuario = get_object_or_404(Usuario, id=usuario_id)
    
    if request.method == 'POST':
        # Guardar el nombre para el mensaje de confirmación
        nombre_completo = f"{usuario.nombres} {usuario.apellidos}"
        
        try:
            # Eliminar el usuario
            usuario.delete()
            # Mostrar mensaje de éxito
            messages.success(request, f'El usuario {nombre_completo} ha sido eliminado correctamente.')
        except Exception as e:
            # En caso de error, mostrar mensaje de error
            messages.error(request, f'Error al eliminar el usuario: {str(e)}')
        
        # Redireccionar a la lista de usuarios
        return redirect('usuarios:lista_usuarios')
    
    # Si la solicitud no es POST, redireccionar a la lista de usuarios
    return redirect('usuarios:lista_usuarios')
    