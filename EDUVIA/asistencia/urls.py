from django.urls import path
from . import views

app_name = 'asistencia'

urlpatterns = [
  path('', views.seleccionar_asignatura, name='seleccionar_asignatura'),
  path('tomar/<int:asignatura_curso_id>/', views.tomar_asistencia, name='tomar_asistencia'),
  path('ver/', views.ver_asistencias, name='ver_asistencias'),
  path('guardada/', views.asistencia_guardada, name='asistencia_guardada'),
  path('estadisticas/', views.estadisticas_asistencia, name='estadisticas'),
]