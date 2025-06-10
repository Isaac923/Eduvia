from django.urls import path
from . import views

app_name = 'notas'

urlpatterns = [
    path('', views.notas_generales, name='notas_generales'),
    path('guardar-nota/', views.guardar_nota, name='guardar_nota'),
    path('obtener-notas/<int:alumno_id>/', views.obtener_notas, name='obtener_notas'),
    path('agregar-ano/', views.agregar_ano, name='agregar_ano'),
    path('eliminar-nota/', views.eliminar_nota, name='eliminar_nota'),
    path('historial-alumno/<int:alumno_id>/', views.historial_alumno, name='historial_alumno'),
]