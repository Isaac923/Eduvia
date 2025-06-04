from django.urls import path
from . import views

app_name = 'notas'

urlpatterns = [
    path('', views.notas_generales, name='notas_generales'),
    path('generales/', views.notas_generales, name='notas_generales'),
    # Otras URLs...
]