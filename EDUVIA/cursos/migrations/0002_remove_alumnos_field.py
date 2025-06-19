from django.db import migrations

class Migration(migrations.Migration):

    dependencies = [
        ('cursos', '0001_initial'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='curso',
            name='alumnos',
        ),
        migrations.DeleteModel(
            name='MatriculaCurso',
        ),
    ]