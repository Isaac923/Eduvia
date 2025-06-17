from django.urls import path
from . import views

app_name = 'notas'

urlpatterns = [
    path('', views.notas_generales, name='notas_generales'),
    path('obtener-notas/<int:alumno_id>/', views.obtener_notas, name='obtener_notas'),
    path('guardar-nota/', views.guardar_nota, name='guardar_nota'),
    path('eliminar-nota/', views.eliminar_nota, name='eliminar_nota'),
    path('historial-notas/<int:alumno_id>/', views.obtener_historial_notas, name='historial_notas'),
    path('guardar-nota/', views.guardar_nota, name='guardar_nota'),
    # URLs para años académicos
    path('agregar-ano-academico/', views.agregar_ano, name='agregar_ano_academico'),
]