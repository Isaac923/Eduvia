from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login
from django.contrib.auth.forms import AuthenticationForm
from django.contrib import messages
from django.views import View
from django.contrib.auth.decorators import login_required, user_passes_test
from django.contrib.auth.models import User
from django.contrib.auth import logout

class vista_login(View):
    def get(self, request):
        # Mostrar el formulario de login en el GET
        return render(request, 'Login.html')

    def post(self, request):
        # Obtener los datos del formulario
        username = request.POST.get('username')
        password = request.POST.get('password')
        user_type = request.POST.get('userType', 'funcionario')  # Obtener el tipo de usuario
        
        # Verificar si el usuario existe antes de autenticar
        user_exists = User.objects.filter(username=username).exists()
        
        if not user_exists:
            messages.error(request, "El usuario no existe en el sistema.")
            return render(request, 'Login.html')
        
        # Autenticar al usuario
        user = authenticate(request, username=username, password=password)

        # Verificar si el usuario existe y tiene los permisos adecuados
        if user is not None:
            if user_type == 'administrador' and user.is_superuser:
                # Si es administrador y tiene permisos de superusuario
                login(request, user)
                messages.success(request, "Bienvenido a EDUVIA")
                return redirect('usuarios:dashboard')  # Redirige al dashboard de administrador
            elif user_type == 'funcionario':
                # Por ahora, no permitimos acceso a funcionarios
                messages.error(request, "Acceso solo para administradores en este momento.")
                return render(request, 'Login.html')
            else:
                # Si el tipo de usuario no coincide con los permisos
                if user_type == 'administrador':
                    messages.error(request, "No tienes permisos de administrador.")
                else:
                    messages.error(request, "No tienes permisos de funcionario.")
                return render(request, 'Login.html')
        else:
            # Si las credenciales son incorrectas
            messages.error(request, "Contraseña incorrecta. Por favor, intente nuevamente.")
            return render(request, 'Login.html')

# Función para verificar si el usuario es administrador
def is_admin(user):
    return user.is_superuser

@login_required
@user_passes_test(is_admin)  # Solo permite acceso a administradores
def dashboard(request):
    return render(request, 'dashboard.html')

def logout_view(request):
    # Cerrar la sesión del usuario
    logout(request)
    messages.info(request, "Has cerrado sesión correctamente.")
    return redirect('usuarios:login')  # Redirige a la página de inicio de sesión