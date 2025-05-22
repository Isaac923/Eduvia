from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth import authenticate, login
from django.contrib import messages
from .models import Usuario  # Asegúrate de importar el modelo Usuario
from django.core.paginator import Paginator 
from django.views.decorators.csrf import csrf_exempt

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

def nuevo_usuario(request):
    if request.method == 'POST':
        # Obtener datos del formulario
        rut = request.POST.get('rut')
        nombres = request.POST.get('nombres')
        apellidos = request.POST.get('apellidos')
        telefono = request.POST.get('telefono')
        correo = request.POST.get('correo')
        rol = request.POST.get('rol')
        estado = request.POST.get('estado', 'inactive')  # Por defecto inactivo
        funcion = request.POST.get('funcion')
        
        # Validar datos (validación básica)
        if not all([rut, nombres, apellidos, correo, rol]):
            # No usar messages.error aquí para evitar mensajes en la parte superior
            return render(request, 'usuarios/nuevo_usuario.html', {
                'error_campos': 'Por favor, complete todos los campos obligatorios.'
            })
        
        # Verificar si ya existe un usuario con el mismo RUT o correo
        if Usuario.objects.filter(rut=rut).exists():
            # En lugar de usar messages.error, pasamos el error directamente al contexto
            return render(request, 'usuarios/nuevo_usuario.html', {
                'error_rut': f'Ya existe un usuario con el RUT {rut}.'
            })
        
        if Usuario.objects.filter(correo=correo).exists():
            return render(request, 'usuarios/nuevo_usuario.html', {
                'error_correo': f'Ya existe un usuario con el correo {correo}.'
            })
        
        # Crear nuevo usuario
        try:
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
            
            messages.success(request, f'Usuario {nombres} {apellidos} creado exitosamente.')
            return redirect('usuarios:lista_usuarios')
        except Exception as e:
            return render(request, 'usuarios/nuevo_usuario.html', {
                'error_general': f'Error al crear el usuario: {str(e)}'
            })
    
    # Si es GET, simplemente mostramos el formulario
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
