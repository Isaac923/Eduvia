# Generated by Django 4.2.20 on 2025-06-02 22:36

from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('alumnos', '0001_initial'),
        ('usuarios', '0001_initial'),
        ('cursos', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='Asignatura',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('nombre', models.CharField(choices=[('matematicas', 'Matemáticas'), ('lenguaje', 'Lenguaje y Comunicación'), ('ciencias', 'Ciencias Naturales'), ('historia', 'Historia y Geografía'), ('ingles', 'Inglés')], max_length=50, unique=True)),
                ('descripcion', models.TextField(blank=True, null=True)),
                ('activa', models.BooleanField(default=True)),
            ],
            options={
                'verbose_name': 'Asignatura',
                'verbose_name_plural': 'Asignaturas',
                'ordering': ['nombre'],
            },
        ),
        migrations.CreateModel(
            name='AsignaturaCurso',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('activa', models.BooleanField(default=True)),
                ('asignatura', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='cursos_asignados', to='asistencia.asignatura')),
                ('curso', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='asignaturas', to='cursos.curso')),
                ('profesor', models.ForeignKey(blank=True, limit_choices_to={'rol': 'profesor'}, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='asignaturas_asignadas', to='usuarios.usuario')),
            ],
            options={
                'verbose_name': 'Asignatura por Curso',
                'verbose_name_plural': 'Asignaturas por Curso',
                'unique_together': {('asignatura', 'curso')},
            },
        ),
        migrations.CreateModel(
            name='Asistencia',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('fecha', models.DateField(default=django.utils.timezone.now)),
                ('estado', models.CharField(choices=[('presente', 'Presente'), ('ausente', 'Ausente'), ('tardanza', 'Tardanza'), ('justificado', 'Justificado')], default='presente', max_length=20)),
                ('observaciones', models.TextField(blank=True, null=True)),
                ('fecha_registro', models.DateTimeField(auto_now_add=True)),
                ('alumno', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='asistencias', to='alumnos.alumno')),
                ('asignatura_curso', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='asistencias', to='asistencia.asignaturacurso')),
                ('registrado_por', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to='usuarios.usuario')),
            ],
            options={
                'verbose_name': 'Asistencia',
                'verbose_name_plural': 'Asistencias',
                'ordering': ['-fecha', 'alumno__apellido_paterno', 'alumno__apellido_materno'],
                'unique_together': {('alumno', 'asignatura_curso', 'fecha')},
            },
        ),
    ]
