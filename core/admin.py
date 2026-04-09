from .models import CustomUser, InternshipPlacement, WeeklyLog
# core/admin.py
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser

class CustomUserAdmin(UserAdmin):
    """
    Custom admin interface for the CustomUser model.
    Extends Django's default UserAdmin to include our custom fields.
    """
    
    model = CustomUser
    
    # Fields to display in the user list
    list_display = [
        'username', 
        'email', 
        'first_name', 
        'last_name',
        'role', 
        'student_number', 
        'staff_number', 
        'is_active'
    ]
    
    # Filters for the sidebar
    list_filter = [
        'role', 
        'is_active', 
        'is_staff',
        'department'
    ]
    
    # Fields to search
    search_fields = [
        'username', 
        'email', 
        'student_number', 
        'staff_number'
    ]
    
    # Section organization in the user edit form
    fieldsets = UserAdmin.fieldsets + (
        ('ILES Additional Information', {
            'fields': (
                'role', 
                'department', 
                'staff_number', 
                'student_number',
                'phone_number'
            )
        }),
    )
    
    # Fields shown when creating a new user
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('ILES Additional Information', {
            'fields': (
                'role', 
                'department', 
                'staff_number', 
                'student_number',
                'phone_number'
            )
        }),
    )
@admin.register(InternshipPlacement)
class InternshipPlacementAdmin(admin.ModelAdmin):
    list_display = ['student', 'company_name', 'start_date', 'end_date', 'is_active']
    list_filter = ['is_active', 'start_date']
    search_fields = ['student__username', 'company_name']


@admin.register(WeeklyLog)
class WeeklyLogAdmin(admin.ModelAdmin):
    list_display = ['placement', 'week_number', 'status', 'submitted_at']
    list_filter = ['status', 'created_at']
    search_fields = ['placement__student__username', 'activities']
    readonly_fields = ['created_at', 'updated_at']
# Register the CustomUser model with the custom admin class
admin.site.register(CustomUser, CustomUserAdmin)from django.contrib import admin

# Register your models here.
