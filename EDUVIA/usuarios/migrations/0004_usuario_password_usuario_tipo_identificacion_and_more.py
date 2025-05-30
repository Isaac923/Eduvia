# Generated by Django 4.2.21 on 2025-05-29 19:09

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('usuarios', '0003_auto_20250529_1505'),
    ]

    operations = [
        migrations.AddField(
            model_name='usuario',
            name='password',
            field=models.CharField(default='temporal123', max_length=128, verbose_name='Contraseña'),
        ),
        migrations.AddField(
            model_name='usuario',
            name='tipo_identificacion',
            field=models.CharField(choices=[('usuario', 'Nombre de Usuario'), ('rut', 'RUT')], default='rut', max_length=20, verbose_name='Tipo de Identificación'),
        ),
        migrations.AddField(
            model_name='usuario',
            name='username',
            field=models.CharField(blank=True, max_length=150, null=True, unique=True, verbose_name='Nombre de Usuario'),
        ),
    ]
