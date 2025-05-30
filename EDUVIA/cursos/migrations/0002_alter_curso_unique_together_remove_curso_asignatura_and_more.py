# Generated by Django 4.2.20 on 2025-05-22 16:12

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('cursos', '0001_initial'),
    ]

    operations = [
        migrations.AlterUniqueTogether(
            name='curso',
            unique_together={('nivel', 'letra')},
        ),
        migrations.RemoveField(
            model_name='curso',
            name='asignatura',
        ),
        migrations.CreateModel(
            name='Asignatura',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('nombre', models.CharField(max_length=100)),
                ('curso', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='asignaturas', to='cursos.curso')),
            ],
            options={
                'verbose_name': 'Asignatura',
                'verbose_name_plural': 'Asignaturas',
                'unique_together': {('nombre', 'curso')},
            },
        ),
    ]
