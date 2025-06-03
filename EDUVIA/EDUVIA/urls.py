"""
URL configuration for EDUVIA project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/4.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from . import views  # Acá se importan las vistas del proyecto principal

urlpatterns = [
    path('admin/', admin.site.urls),  # la wea de admin
    path('', include('usuarios.urls')),  # URLs de la app usuarios
    path('alumnos/', include('alumnos.urls')),  # URLs de la app alumnos
    path('cursos/', include('cursos.urls')),  # URLs de la app cursos
    path('asistencias/', include('asistencia.urls')), # URLs de la app asistencias
]

# Add this if you're using media files
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
