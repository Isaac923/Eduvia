# Generated by Django 4.2.20 on 2025-06-16 03:40

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('notas', '0007_alter_nota_ano_academico_and_more'),
    ]

    operations = [
        migrations.AlterField(
            model_name='nota',
            name='ano',
            field=models.IntegerField(blank=True, null=True),
        ),
    ]
