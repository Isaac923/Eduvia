from django.urls import path
from . import views

app_name = 'notas'

urlpatterns = [
    path('', views.notas_generales, name='notas_generales'),
]