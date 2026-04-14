from rest_framework import permissions


class IsSupervisorOrOwner(permissions.BasePermission):
    """
    Custom permission to only allow supervisors or the owner of the object to access it.
    """

    def has_object_permission(self, request, view, obj):
        # Allow if user is admin
        if request.user.role == 'admin':
            return True
        # Allow if user is the owner (student)
        if hasattr(obj, 'placement') and obj.placement.student == request.user:
            return True
        # Allow if user is workplace supervisor for the placement
        if hasattr(obj, 'placement') and obj.placement.workplace_supervisor == request.user:
            return True
        # Allow if user is academic supervisor for the placement
        if hasattr(obj, 'placement') and obj.placement.academic_supervisor == request.user:
            return True
        return False