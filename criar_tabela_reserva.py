#!/usr/bin/env python
"""
Script para criar a tabela core_reserva manualmente
Execute este script quando o servidor Django estiver parado ou em outro terminal
"""

import os
import sys
import django

# Configurar o Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'stayhub.settings')
django.setup()

from django.db import connection

# SQL para criar a tabela
sql = """
CREATE TABLE IF NOT EXISTS "core_reserva" (
    "id" integer NOT NULL PRIMARY KEY AUTOINCREMENT,
    "checkin" date NOT NULL,
    "checkout" date NOT NULL,
    "hospedes" integer NOT NULL,
    "valor_total" decimal NOT NULL,
    "pago" bool NOT NULL,
    "criado_em" datetime NOT NULL,
    "quarto_id" bigint NOT NULL REFERENCES "core_quarto" ("id") DEFERRABLE INITIALLY DEFERRED,
    "usuario_id" integer NOT NULL REFERENCES "auth_user" ("id") DEFERRABLE INITIALLY DEFERRED
);

CREATE INDEX IF NOT EXISTS "core_reserva_quarto_id" ON "core_reserva" ("quarto_id");
CREATE INDEX IF NOT EXISTS "core_reserva_usuario_id" ON "core_reserva" ("usuario_id");
"""

try:
    with connection.cursor() as cursor:
        # Dividir o SQL em comandos separados
        commands = [cmd.strip() for cmd in sql.split(';') if cmd.strip()]
        for command in commands:
            if command:
                cursor.execute(command)
        connection.commit()
    print("✓ Tabela core_reserva criada com sucesso!")
except Exception as e:
    print(f"✗ Erro ao criar tabela: {e}")
    import traceback
    traceback.print_exc()

