# core/admin.py
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import (
    CustomUser,
    EvaluationCriteria,
    Evaluation,
    InternshipPlacement,
    OverallEvaluation,
    WeeklyLog,
)


# ─── Custom User ─────────────────────────────────────────────────────────────

class CustomUserAdmin(UserAdmin):
    """Extends Django's UserAdmin to include ILES-specific fields."""

    model = CustomUser

    list_display = [
        'username', 'email', 'first_name', 'last_name',
        'role', 'student_number', 'staff_number', 'is_active',
    ]
    list_filter  = ['role', 'is_active', 'is_staff', 'department']
    search_fields = ['username', 'email', 'student_number', 'staff_number']

    _extra_fields = (
        'ILES Additional Information', {
            'fields': ('role', 'department', 'staff_number', 'student_number', 'phone_number'),
        }
    )
    fieldsets     = UserAdmin.fieldsets     + (_extra_fields,)
    add_fieldsets = UserAdmin.add_fieldsets + (_extra_fields,)


admin.site.register(CustomUser, CustomUserAdmin)


# ─── Internship ───────────────────────────────────────────────────────────────

@admin.register(InternshipPlacement)
class InternshipPlacementAdmin(admin.ModelAdmin):
    list_display  = ['student', 'company_name', 'start_date', 'end_date', 'is_active']
    list_filter   = ['is_active', 'start_date']
    search_fields = ['student__username', 'company_name']


@admin.register(WeeklyLog)
class WeeklyLogAdmin(admin.ModelAdmin):
    list_display    = ['placement', 'week_number', 'status', 'submitted_at']
    list_filter     = ['status', 'created_at']
    search_fields   = ['placement__student__username', 'activities']
    readonly_fields = ['submitted_at', 'reviewed_at', 'created_at', 'updated_at']


# ─── Evaluation ───────────────────────────────────────────────────────────────

@admin.register(EvaluationCriteria)
class EvaluationCriteriaAdmin(admin.ModelAdmin):
    list_display  = ['name', 'weight', 'is_active']
    list_filter   = ['is_active', 'created_at']
    search_fields = ['name']


@admin.register(Evaluation)
class EvaluationAdmin(admin.ModelAdmin):
    list_display  = ['placement', 'criteria', 'score', 'evaluated_by']
    list_filter   = ['evaluated_at']
    search_fields = ['placement__student__username']


@admin.register(OverallEvaluation)
class OverallEvaluationAdmin(admin.ModelAdmin):
    list_display    = ['placement', 'total_score', 'grade', 'evaluated_at']
    readonly_fields = ['total_score', 'grade']