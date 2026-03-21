import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
django.setup()

from users.models import User
from core.utils import generer_code

print("=== KOTIZO — Setup utilisateur de test ===")

email = "roland@kotizo.app"
pseudo = "roland"
password = "kotizo2026"

if User.objects.filter(email=email).exists():
    u = User.objects.get(email=email)
    print(f"User existant trouve : {u.email}")
else:
    u = User.objects.create_user(
        email=email,
        password=password,
        nom="Ahourma",
        prenom="Roland",
        pseudo=pseudo,
        telephone="+22890000000",
        pays="TG",
        cgu_acceptees=True,
        code_parrainage=generer_code(8),
    )
    print(f"User cree : {email}")

u.email_verifie = True
u.whatsapp_verifie = True
u.whatsapp_numero = "+22890000000"
u.is_active = True
u.save()

print(f"Email : {email}")
print(f"Mot de passe : {password}")
print(f"Pseudo : @{pseudo}")
print(f"Niveau : {u.niveau}")
print(f"Code parrainage : {u.code_parrainage}")
print("=========================================")
print("User pret pour les tests !")