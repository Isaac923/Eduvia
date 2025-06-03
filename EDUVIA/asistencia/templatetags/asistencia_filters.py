from django import template

register = template.Library()

@register.filter
def get_item(dictionary, key):
    """Obtiene un item de un diccionario usando una clave"""
    if dictionary and key:
        return dictionary.get(key)
    return None

@register.filter
def get_estado(asistencias_dict, alumno_id):
    """Obtiene el estado de asistencia de un alumno"""
    if asistencias_dict and alumno_id in asistencias_dict:
        return asistencias_dict[alumno_id].estado
    return 'ausente'

@register.filter
def get_observaciones(asistencias_dict, alumno_id):
    """Obtiene las observaciones de asistencia de un alumno"""
    if asistencias_dict and alumno_id in asistencias_dict:
        return asistencias_dict[alumno_id].observaciones or ''
    return ''