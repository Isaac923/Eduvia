from django.urls import path
from . import views

app_name = 'cursos'

urlpatterns = [
    path('', views.gestion_cursos, name='gestion_cursos'),
    path('crear/', views.crear_curso, name='crear_curso'),
    path('editar/<int:id>/', views.editar_curso, name='editar_curso'),
    path('detalle/<int:id>/', views.detalle_curso, name='detalle_curso'),
    path('eliminar/<int:id>/', views.eliminar_curso, name='eliminar_curso'),
    path('api/detalles/<int:id>/', views.obtener_detalles_curso, name='api_curso_detalles'),    
    path('filtro-alumnos/', views.filtrar_alumnos_por_nivel_letra, name='filtro_alumnos'),
    path('alumno/<int:id>/', views.detalle_alumno, name='detalle_alumno'),


]