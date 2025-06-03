from django.urls import path
from . import views

app_name = 'notas'

urlpatterns = [
    # Vista principal de notas generales
    path('', views.notas_generales, name='notas_generales'),
    
    # AJAX endpoints
   
]