from django.contrib import admin
from .models import Alumno, Apoderado

class AlumnoAdmin(admin.ModelAdmin):
    list_display = ('id', 'nombre_completo', 'rut', 'nivel', 'jornada', 'fecha_ingreso', 'activo')
    list_filter = ('nivel', 'jornada', 'activo')
    search_fields = ('primer_nombre', 'segundo_nombre', 'apellido_paterno', 'apellido_materno', 'rut')
    date_hierarchy = 'fecha_ingreso'
    
    # Si necesitas mostrar campos calculados o personalizados
    def nombre_completo(self, obj):
        return obj.nombre_completo
    nombre_completo.short_description = 'Nombre Completo'

class ApoderadoAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'parentezco', 'telefono', 'correo')
    search_fields = ('nombre', 'telefono', 'correo')

admin.site.register(Alumno, AlumnoAdmin)
admin.site.register(Apoderado, ApoderadoAdmin)