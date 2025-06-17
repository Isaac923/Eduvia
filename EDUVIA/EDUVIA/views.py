from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from usuarios.models import Usuario

@login_required
def get_user_context(request):
    """
    Función para obtener el contexto del usuario EDUVIA
    basado en el usuario de Django autenticado
    """
    try:
        # Buscar el usuario EDUVIA por RUT (que está en username)
        usuario_eduvia = Usuario.objects.get(rut=request.user.username)
        return {
            'usuario_eduvia': usuario_eduvia,
            'es_profesor': usuario_eduvia.rol == 'profesor',
            'es_administrador': usuario_eduvia.rol == 'administrador',
            'es_usuario': usuario_eduvia.rol == 'usuario',
        }
    except Usuario.DoesNotExist:
        # Si no existe el usuario EDUVIA, asumir que es admin si es superuser
        return {
            'usuario_eduvia': None,
            'es_profesor': False,
            'es_administrador': request.user.is_superuser,
            'es_usuario': not request.user.is_superuser,
        }

def check_user_permissions(user, required_role=None):
    """
    Función para verificar permisos del usuario
    """
    if user.is_superuser:
        return True
    
    try:
        usuario_eduvia = Usuario.objects.get(rut=user.username)
        if required_role:
            return usuario_eduvia.rol == required_role
        return True
    except Usuario.DoesNotExist:
        return False

def is_profesor(user):
    """Verifica si el usuario es profesor"""
    try:
        usuario_eduvia = Usuario.objects.get(rut=user.username)
        return usuario_eduvia.rol == 'profesor'
    except Usuario.DoesNotExist:
        return False

def is_administrador(user):
    """Verifica si el usuario es administrador"""
    if user.is_superuser:
        return True
    try:
        usuario_eduvia = Usuario.objects.get(rut=user.username)
        return usuario_eduvia.rol == 'administrador'
    except Usuario.DoesNotExist:
        return False
