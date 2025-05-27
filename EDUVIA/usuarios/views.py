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
        
        user = authenticate(request, username=username, password=password)
        
        if user is not None:
            login(request, user)
            return redirect('usuarios:inicio')
        else:
            error_message = "Credenciales incorrectas. Por favor, intente nuevamente."
            return render(request, 'Login.html', {'error_message': error_message})
    
    return render(request, 'Login.html')

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
            rut = request.POST.get('rut', '').strip()
            nombres = request.POST.get('nombres', '').strip()
            apellidos = request.POST.get('apellidos', '').strip()
            telefono = request.POST.get('telefono', '').strip()
            correo = request.POST.get('correo', '').strip()
            rol = request.POST.get('rol', '').strip()
            estado = request.POST.get('estado', 'inactive')
            funcion = request.POST.get('funcion', '').strip()
            
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
                'redirect_url': '/usuarios/'
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
    
    return render(request, 'usuarios/nuevo_usuario.html')

@require_http_methods(["GET", "POST"])
def editar_usuario(request, usuario_id):
    usuario = get_object_or_404(Usuario, id=usuario_id)
    
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
            estado = request.POST.get('estado', '').strip()
            funcion = request.POST.get('funcion', '').strip()
            
            # Validar datos requeridos
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
            
            # Verificar si el RUT ya existe en otro usuario
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
            
            # Verificar si el correo ya existe en otro usuario
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
            
            # Actualizar usuario
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
    
    # Si es GET, mostrar el formulario con los datos del usuario
    return render(request, 'usuarios/editar_usuario.html', {'usuario': usuario})

@csrf_exempt
def eliminar_usuario(request, usuario_id):
    """
    Vista para eliminar un usuario.
    Requiere confirmación a través de un modal.
    """
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
