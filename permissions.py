from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsAdminRole(BasePermission):
    """Allow access only to users with the admin role."""

    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            (request.user.role == 'admin' or request.user.is_staff)
        )


class IsSupervisorOrOwner(BasePermission):
    """
    Object-level permission:
    - Admins: full access
    - Supervisors (workplace/academic): can read and review logs for their placements
    - Students: can only access their own logs
    """

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)

    def has_object_permission(self, request, view, obj):
        user = request.user

        if user.role == 'admin' or user.is_staff:
            return True

        # The object is a WeeklyLog
        if hasattr(obj, 'placement'):
            placement = obj.placement
            if user.role == 'student':
                return placement.student == user
            if user.role == 'workplace':
                return placement.workplace_supervisor == user
            if user.role == 'academic':
                return placement.academic_supervisor == user

        return False
