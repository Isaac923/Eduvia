from django.urls import path
from . import views

app_name = 'alumnos'

urlpatterns = [
    # Vistas basadas en funciones para alumnos
    path('', views.lista_alumnos, name='lista_alumnos'),
    path('crear/', views.crear_alumno, name='crear_alumno'),
    path('<int:pk>/editar/', views.editar_alumno, name='editar_alumnos'),
    path('<int:pk>/eliminar/', views.eliminar_alumno, name='eliminar_alumno'),
    path('<int:pk>/detalle/', views.detalle_alumno, name='detalle_alumno'),
    path('<int:pk>/retirar/', views.retirar_alumno, name='retirar_alumno'),
    path('<int:pk>/cambiar-estado/', views.cambiar_estado_alumno, name='cambiar_estado_alumno'),
    
    # Rutas para apoderados
    path('guardar-apoderado/', views.guardar_apoderado, name='guardar_apoderado'),
    path('guardar-apoderado/<int:apoderado_id>/', views.guardar_apoderado, name='actualizar_apoderado'),
    path('eliminar-apoderado/<int:apoderado_id>/', views.eliminar_apoderado, name='eliminar_apoderado'),
    
    # API endpoints
    path('api/detalles/<int:id>/', views.obtener_detalles_alumno, name='api_detalles_alumno'),
]