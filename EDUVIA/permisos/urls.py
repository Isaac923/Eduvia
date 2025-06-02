from django.urls import path
from . import views

app_name = 'permisos'

urlpatterns = [
    path('', views.gestion_permisos, name='gestion_permisos'),
    path('actualizar/', views.actualizar_permisos, name='actualizar_permisos'),
]