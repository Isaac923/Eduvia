from django.urls import path
from  . import views 

app_name = 'usuarios'

urlpatterns = [
     path('', views.login_view, name='login'),
    path('inicio/', views.inicio_view, name='inicio'),
]
