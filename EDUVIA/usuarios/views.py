from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login
from django.contrib import messages

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
