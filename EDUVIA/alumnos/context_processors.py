from .models import AnoAcademico

def ano_academico_context(request):
    """Context processor para hacer disponible el año académico en todos los templates"""
    ano_activo = AnoAcademico.get_ano_activo()
    anos_disponibles = AnoAcademico.objects.all().order_by('-ano')
    
    return {
        'ano_academico_activo': ano_activo,
        'anos_academicos_disponibles': anos_disponibles,
    }