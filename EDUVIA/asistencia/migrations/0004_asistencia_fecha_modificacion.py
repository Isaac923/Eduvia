# Generated by Django 4.2.20 on 2025-06-05 19:10

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('asistencia', '0003_remove_asignatura_profesor_asignaturacurso_profesor_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='asistencia',
            name='fecha_modificacion',
            field=models.DateTimeField(auto_now=True),
        ),
    ]
