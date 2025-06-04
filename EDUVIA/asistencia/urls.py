from django.urls import path
from . import views

app_name = 'asistencia'

urlpatterns = [
  # Página principal del módulo
  path('', views.index_asistencia, name='index'),
    
  # Registrar asistencia
  path('registrar/', views.seleccionar_asignatura, name='seleccionar_asignatura'),
  path('registrar/tomar/<int:asignatura_curso_id>/', views.tomar_asistencia, name='tomar_asistencia'),
  path('registrar/guardada/', views.asistencia_guardada, name='asistencia_guardada'),
    
  # Ver asistencias
  path('ver/', views.ver_asistencias, name='ver_asistencias'),
    
  # Estadísticas
  path('estadisticas/', views.estadisticas_asistencia, name='estadisticas'),
  
]