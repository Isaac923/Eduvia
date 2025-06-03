from django.contrib import admin
from .models import Asignatura, AsignaturaCurso, Asistencia

@admin.register(Asignatura)
class AsignaturaAdmin(admin.ModelAdmin):
    list_display = ['get_nombre_display', 'activa']
    list_filter = ['activa']
    search_fields = ['nombre']

@admin.register(AsignaturaCurso)
class AsignaturaCursoAdmin(admin.ModelAdmin):
    list_display = ['asignatura', 'curso', 'profesor', 'activa']
    list_filter = ['asignatura', 'activa']
    search_fields = ['asignatura__nombre', 'curso__nivel', 'curso__letra']
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('asignatura', 'curso', 'profesor')

@admin.register(Asistencia)
class AsistenciaAdmin(admin.ModelAdmin):
    list_display = ['alumno', 'asignatura_curso', 'fecha', 'estado', 'registrado_por']
    list_filter = ['estado', 'fecha', 'asignatura_curso__asignatura']
    search_fields = ['alumno__nombre', 'alumno__apellido', 'alumno__rut']
    date_hierarchy = 'fecha'
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related(
            'alumno', 'asignatura_curso__asignatura', 'asignatura_curso__curso', 'registrado_por'
        )
