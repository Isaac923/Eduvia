from .models import Usuario

def user_role_context(request):
    """Context processor para agregar información del rol del usuario"""
    es_profesor = False
    
    if request.user.is_authenticated and not request.user.is_superuser:
        try:
            usuario_eduvia = Usuario.objects.get(rut=request.user.username)
            es_profesor = usuario_eduvia.rol == 'profesor'
        except Usuario.DoesNotExist:
            pass
    
    return {
        'es_profesor': es_profesor
    }