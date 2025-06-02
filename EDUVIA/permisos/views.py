from django.shortcuts import render, redirect, get_object_or_404
from django.contrib import messages
from django.views.decorators.http import require_http_methods
from django.http import JsonResponse
from django.db import transaction
from usuarios.models import Usuario
from .models import PermisoUsuario
import json

def gestion_permisos(request):
    """Vista para gestionar permisos de usuarios"""
    if not request.user.is_superuser:
        messages.error(request, 'No tiene permisos para acceder a esta sección.')
        return redirect('usuarios:inicio')
    
    usuarios = Usuario.objects.all().order_by('nombres', 'apellidos')
    
    # Obtener todos los módulos disponibles
    modulos = PermisoUsuario.MODULOS_CHOICES
    
    # Preparar datos de permisos por usuario
    usuarios_con_permisos = []
    for usuario in usuarios:
        permisos_usuario = {}
        for modulo_code, modulo_name in modulos:
            try:
                permiso = PermisoUsuario.objects.get(usuario=usuario, modulo=modulo_code)
                permisos_usuario[modulo_code] = permiso.puede_ver
            except PermisoUsuario.DoesNotExist:
                permisos_usuario[modulo_code] = False
        
        usuarios_con_permisos.append({
            'usuario': usuario,
            'permisos': permisos_usuario
        })
    
    context = {
        'usuarios_con_permisos': usuarios_con_permisos,
        'modulos': modulos,
    }
    
    return render(request, 'permisos/gestion_permisos.html', context)

@require_http_methods(["POST"])
def actualizar_permisos(request):
    """Vista AJAX para actualizar permisos de un usuario"""
    if not request.user.is_superuser:
        return JsonResponse({'success': False, 'message': 'No autorizado'})
    
    try:
        data = json.loads(request.body)
        usuario_id = data.get('usuario_id')
        permisos = data.get('permisos', {})
        
        usuario = get_object_or_404(Usuario, id=usuario_id)
        
        with transaction.atomic():
            # Actualizar o crear permisos
            for modulo, puede_ver in permisos.items():
                permiso, created = PermisoUsuario.objects.get_or_create(
                    usuario=usuario,
                    modulo=modulo,
                    defaults={
                        'puede_ver': puede_ver,
                        'asignado_por': Usuario.objects.get(rut=request.user.username)
                    }
                )
                
                if not created:
                    permiso.puede_ver = puede_ver
                    permiso.asignado_por = Usuario.objects.get(rut=request.user.username)
                    permiso.save()
        
        return JsonResponse({
            'success': True,
            'message': f'Permisos actualizados para {usuario.nombres} {usuario.apellidos}'
        })
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': f'Error al actualizar permisos: {str(e)}'
        })

def obtener_permisos_usuario(usuario_rut):
    """Función auxiliar para obtener permisos de un usuario por RUT"""
    try:
        usuario = Usuario.objects.get(rut=usuario_rut)
        permisos = PermisoUsuario.objects.filter(usuario=usuario, puede_ver=True).values_list('modulo', flat=True)
        return list(permisos)
    except Usuario.DoesNotExist:
        return []
