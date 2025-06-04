from django import template

register = template.Library()

@register.filter
def get_item(dictionary, key):
    """
    Filtro personalizado para obtener un item de un diccionario usando una clave
    """
    if dictionary and key:
        return dictionary.get(key)
    return None

@register.filter
def get_estado(asistencia):
    """
    Filtro para obtener el estado de una asistencia
    """
    if asistencia:
        return asistencia.estado
    return None

@register.filter
def get_observaciones(asistencia):
    """
    Filtro para obtener las observaciones de una asistencia
    """
    if asistencia:
        return asistencia.observaciones or ''
    return ''