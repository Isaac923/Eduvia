from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login
from django.contrib import messages
from .models import Usuario  # Asegúrate de importar el modelo Usuario

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
    usuarios = Usuario.objects.all()
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
            messages.error(request, 'Por favor, complete todos los campos obligatorios.')
            return render(request, 'usuarios/nuevo_usuario.html')
        
        # Verificar si ya existe un usuario con el mismo RUT o correo
        if Usuario.objects.filter(rut=rut).exists():
            messages.error(request, f'Ya existe un usuario con el RUT {rut}.')
            return render(request, 'usuarios/nuevo_usuario.html')
        
        if Usuario.objects.filter(correo=correo).exists():
            messages.error(request, f'Ya existe un usuario con el correo {correo}.')
            return render(request, 'usuarios/nuevo_usuario.html')
        
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
            messages.error(request, f'Error al crear el usuario: {str(e)}')
            return render(request, 'usuarios/nuevo_usuario.html')
    
    # Si es GET, simplemente mostramos el formulario
    return render(request, 'usuarios/nuevo_usuario.html')
