# models.py
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.conf import settings

class CustomUser(AbstractUser):
    ROLE_CHOICES = (
        ('student', 'Student'),
        ('workplace', 'Workplace Supervisor'),
        ('academic', 'Academic Supervisor'),
        ('admin', 'Administrator'),
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    department = models.CharField(max_length=150, blank=True, null=True)
    staff_number = models.CharField(max_length=50, unique=True, blank=True, null=True)
    student_number = models.CharField(max_length=50, unique=True, blank=True, null=True)

    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"


class InternshipPlacement(models.Model):
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='placements',
        limit_choices_to={'role': 'student'}
    )
    company_name = models.CharField(max_length=255)
    start_date = models.DateField()
    end_date = models.DateField()
    workplace_supervisor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='workplace_supervisions',
        limit_choices_to={'role': 'workplace'}
    )
    academic_supervisor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='academic_supervisions',
        limit_choices_to={'role': 'academic'}
    )
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.student.username} at {self.company_name}"


class WeeklyLog(models.Model):
    STATUS_CHOICES = (
        ('draft', 'Draft'),
        ('submitted', 'Submitted'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    )
    placement = models.ForeignKey(InternshipPlacement, on_delete=models.CASCADE, related_name='logs')
    week_number = models.PositiveIntegerField()
    activities = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    submitted_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Log {self.week_number} - {self.placement.student.username}"

    # TODO: Add validation methods for state transitions (Phase 3)
    # def can_edit(self):
    #     return self.status == 'draft' or self.status == 'rejected'
