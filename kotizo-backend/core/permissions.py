from rest_framework.permissions import BasePermission


class IsVerifie(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and
            request.user.niveau in ['verifie', 'business']
        )


class IsBusiness(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and
            request.user.niveau == 'business'
        )


class IsAdminKotizo(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and
            request.user.is_staff
        )


class IsAdminWithPermission(BasePermission):
    def __init__(self, permission_required):
        self.permission_required = permission_required

    def has_permission(self, request, view):
        if not request.user.is_authenticated or not request.user.is_staff:
            return False
        if request.user.admin_role == 'super_admin':
            return True
        permissions = request.user.admin_permissions or []
        return self.permission_required in permissions