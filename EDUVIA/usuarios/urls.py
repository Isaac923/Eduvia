from django.urls import path
from  . import views 

app_name = 'usuarios'

urlpatterns = [
     path('', views.login_view, name='login'),
    path('inicio/', views.inicio_view, name='inicio'),
    path('usuarios/', views.lista_usuarios, name='lista_usuarios'),
    path('usuarios/nuevo/', views.nuevo_usuario, name='nuevo_usuario'),
    path('usuarios/eliminar/<int:usuario_id>/', views.eliminar_usuario, name='eliminar_usuario'),
    path('usuarios/editar/<int:usuario_id>/', views.editar_usuario, name='editar_usuario'),
]
