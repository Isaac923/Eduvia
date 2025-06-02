import json
from django import template
from django.utils.safestring import mark_safe

register = template.Library()

@register.filter
def dicttojson(value):
    """
    Convierte un diccionario Python a JSON string.
    """
    if value is None:
        return '{}'
    try:
        return mark_safe(json.dumps(value))
    except (TypeError, ValueError):
        return '{}'

@register.simple_tag(takes_context=True)
def user_permissions(context):
    """
    Obtiene los permisos del usuario actual.
    """
    request = context.get('request')
    if not request or not hasattr(request, 'user') or not request.user.is_authenticated:
        return {}
    
    user = request.user
    
    # Si es superusuario, tiene todos los permisos
    if user.is_superuser:
        return {
            'inicio': True,
            'estudiantes': True,
            'cursos': True,
            'notas': True,
            'asistencia': True,
            'usuarios': True,
            'permisos': True,
        }
    
    # Obtener permisos específicos del usuario
    try:
        from permisos.models import PermisoUsuario
        from usuarios.models import Usuario
        
        usuario_obj = Usuario.objects.get(id=user.id)
        permisos_usuario = PermisoUsuario.objects.filter(usuario=usuario_obj)
        
        permisos = {}
        for permiso in permisos_usuario:
            permisos[permiso.modulo] = permiso.puede_ver
        
        return permisos
    except:
        return {}