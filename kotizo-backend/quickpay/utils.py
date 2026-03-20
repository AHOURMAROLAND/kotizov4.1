from core.utils import generer_code


def generer_code_quickpay():
    from quickpay.models import QuickPay
    while True:
        code = generer_code(6)
        if not QuickPay.objects.filter(code=code).exists():
            return code