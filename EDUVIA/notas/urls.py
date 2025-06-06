from django.urls import path
from . import views

app_name = 'notas'

urlpatterns = [
    path('generales/', views.notas_generales, name='notas_generales'),  # Esto hará /calificaciones/generales/
    path('guardar/', views.guardar_notas, name='guardar_notas'),
    path('alumno/<int:alumno_id>/notas/', views.obtener_notas_alumno, name='obtener_notas_alumno'),
    path('estadisticas/', views.estadisticas_materia, name='estadisticas_materia'),
    path('asignar-nota-ajax/', views.asignar_nota_ajax, name='asignar_nota_ajax'),
    path('obtener-notas-ajax/', views.obtener_notas_ajax, name='obtener_notas_ajax'),
]