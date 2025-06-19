from django.contrib import admin
from .models import Alumno, Apoderado, AnoAcademico, AlumnoAno

@admin.register(AnoAcademico)
class AnoAcademicoAdmin(admin.ModelAdmin):
    list_display = ['ano', 'activo', 'fecha_creacion']
    list_filter = ['activo']
    ordering = ['-ano']
    
    def save_model(self, request, obj, form, change):
        if obj.activo:
            # Si se marca como activo, desactivar todos los demás
            AnoAcademico.objects.exclude(pk=obj.pk).update(activo=False)
        super().save_model(request, obj, form, change)

@admin.register(AlumnoAno)
class AlumnoAnoAdmin(admin.ModelAdmin):
    list_display = ['alumno', 'ano_academico', 'nivel', 'jornada', 'activo', 'fecha_matricula']
    list_filter = ['ano_academico', 'activo', 'nivel', 'jornada']
    search_fields = ['alumno__primer_nombre', 'alumno__apellido_paterno', 'alumno__rut']
    list_per_page = 25
    ordering = ['-ano_academico__ano', 'alumno__apellido_paterno', 'alumno__primer_nombre']
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('alumno', 'ano_academico')

@admin.register(Apoderado)
class ApoderadoAdmin(admin.ModelAdmin):
    list_display = ['nombre', 'parentezco', 'telefono', 'correo', 'es_institucion']
    list_filter = ['es_institucion', 'parentezco']
    search_fields = ['nombre', 'telefono', 'correo']
    list_per_page = 25

@admin.register(Alumno)
class AlumnoAdmin(admin.ModelAdmin):
    list_display = ['id', 'nombre_completo', 'rut', 'nivel', 'jornada', 'activo', 'fecha_ingreso']
    list_filter = ['activo', 'nivel', 'jornada', 'sexo', 'programa_pie']
    search_fields = ['primer_nombre', 'segundo_nombre', 'apellido_paterno', 'apellido_materno', 'rut']
    list_per_page = 25
    ordering = ['-fecha_ingreso', 'apellido_paterno', 'primer_nombre']
    
    fieldsets = (
        ('Información Personal', {
            'fields': ('primer_nombre', 'segundo_nombre', 'apellido_paterno', 'apellido_materno', 
                      'rut', 'fecha_nacimiento', 'sexo', 'direccion', 'telefono', 'correo_electronico')
        }),
        ('Información Académica', {
            'fields': ('nivel', 'jornada', 'fecha_ingreso', 'activo', 'ultimo_curso_aprobado', 
                      'curso_repetido', 'anio_repitencia')
        }),
        ('Información Adicional', {
            'fields': ('estado_civil', 'religion', 'situacion_laboral')
        }),
        ('Programa PIE', {
            'fields': ('programa_pie', 'profesional_apoyo', 'informe_psicosocial')
        }),
        ('Contacto de Emergencia', {
            'fields': ('contacto_emergencia_nombre', 'contacto_emergencia_parentezco', 
                      'contacto_emergencia_telefono')
        }),
        ('Retiro', {
            'fields': ('fecha_retiro', 'motivo_retiro')
        }),
        ('Apoderado', {
            'fields': ('apoderado',)
        })
    )
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('apoderado')