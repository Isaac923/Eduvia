from django.urls import path
from .views import dashboard, vista_login
from  . import views 

app_name = 'usuarios'

urlpatterns = [
    path('', vista_login.as_view(), name='login'),
    path('dashboard/', views.dashboard, name='dashboard'),  
]
