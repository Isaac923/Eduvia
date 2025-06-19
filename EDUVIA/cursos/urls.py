from django.urls import path
from . import views

app_name = 'cursos'

urlpatterns = [
    path('', views.gestion_cursos, name='gestion_cursos'),
    path('crear/', views.crear_curso, name='crear_curso'),
    path('eliminar/<int:id>/', views.eliminar_curso, name='eliminar_curso'),
    path('detalle/<int:id>/', views.detalle_curso, name='detalle_curso'),
    path('sincronizar/', views.sincronizar_cursos, name='sincronizar_cursos'),
    
    # API endpoints
    path('api/detalles/<int:id>/', views.obtener_detalles_curso, name='api_detalles_curso'),
    path('api/filtrar-alumnos/', views.filtrar_alumnos_por_nivel_letra, name='filtrar_alumnos'),
]
