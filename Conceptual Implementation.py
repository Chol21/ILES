# models.py
"""
Internship Learning Experience System (ILES) Models
Manages user roles, internship placements, and weekly activity logs
"""

from django.contrib.auth.models import AbstractUser
from django.db import models
from django.conf import settings
from django.core.exceptions import ValidationError
from django.utils import timezone
from datetime import timedelta


class CustomUser(AbstractUser):
    """
    Extended user model with role-based access control for ILES system.
    Supports four user roles: Student, Workplace Supervisor, Academic Supervisor, and Admin.
    """
    
    ROLE_CHOICES = (
        ('student', 'Student'),
        ('workplace', 'Workplace Supervisor'),
        ('academic', 'Academic Supervisor'),
        ('admin', 'Administrator'),
    )
    
    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        help_text="User role in the system"
    )
    department = models.CharField(
        max_length=150,
        blank=True,
        null=True,
        help_text="Department or faculty (optional)"
    )
    staff_number = models.CharField(
        max_length=50,
        unique=True,
        blank=True,
        null=True,
        help_text="Unique staff identifier"
    )
    student_number = models.CharField(
        max_length=50,
        unique=True,
        blank=True,
        null=True,
        help_text="Unique student identifier"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Custom User"
        verbose_name_plural = "Custom Users"
        indexes = [
            models.Index(fields=['role']),
            models.Index(fields=['staff_number']),
            models.Index(fields=['student_number']),
        ]

    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"

    # Role-checking convenience methods
    def is_student(self):
        """Check if user is a student."""
        return self.role == 'student'

    def is_workplace_supervisor(self):
        """Check if user is a workplace supervisor."""
        return self.role == 'workplace'

    def is_academic_supervisor(self):
        """Check if user is an academic supervisor."""
        return self.role == 'academic'

    def is_admin(self):
        """Check if user is an administrator."""
        return self.role == 'admin'


class InternshipPlacement(models.Model):
    """
    Represents an internship placement linking a student to a company
    with assigned workplace and academic supervisors.
    """
    
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='placements',
        limit_choices_to={'role': 'student'},
        help_text="Student undertaking the internship"
    )
    company_name = models.CharField(
        max_length=255,
        help_text="Name of the company"
    )
    start_date = models.DateField(
        help_text="Start date of the internship"
    )
    end_date = models.DateField(
        help_text="End date of the internship"
    )
    workplace_supervisor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='workplace_supervisions',
        limit_choices_to={'role': 'workplace'},
        help_text="Supervisor at the workplace"
    )
    academic_supervisor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='academic_supervisions',
        limit_choices_to={'role': 'academic'},
        help_text="Supervisor from the academic institution"
    )
    is_active = models.BooleanField(
        default=True,
        help_text="Whether this placement is currently active"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Internship Placement"
        verbose_name_plural = "Internship Placements"
        ordering = ['-start_date']
        indexes = [
            models.Index(fields=['student', 'is_active']),
            models.Index(fields=['start_date', 'end_date']),
        ]
        constraints = [
            models.CheckConstraint(
                check=models.Q(start_date__lt=models.F('end_date')),
                name='internship_start_before_end'
            ),
            models.UniqueConstraint(
                fields=['student', 'start_date', 'end_date'],
                name='unique_student_placement_period'
            ),
        ]

    def __str__(self):
        return f"{self.student.username} at {self.company_name} ({self.start_date.year})"

    def clean(self):
        """Validate placement dates and business logic."""
        if self.start_date >= self.end_date:
            raise ValidationError(
                {'end_date': 'End date must be after start date.'}
            )
        
        # Check for overlapping placements for the same student
        overlapping = InternshipPlacement.objects.filter(
            student=self.student,
            start_date__lt=self.end_date,
            end_date__gt=self.start_date
        ).exclude(pk=self.pk)
        
        if overlapping.exists():
            raise ValidationError(
                "Student already has an overlapping placement during this period."
            )

    def save(self, *args, **kwargs):
        """Run clean before saving."""
        self.full_clean()
        super().save(*args, **kwargs)

    def is_ongoing(self):
        """Check if placement is currently ongoing."""
        today = timezone.now().date()
        return self.start_date <= today <= self.end_date and self.is_active

    def days_remaining(self):
        """Calculate days remaining in the placement."""
        today = timezone.now().date()
        if today >= self.end_date:
            return 0
        return (self.end_date - today).days

    def duration_in_weeks(self):
        """Calculate total duration of placement in weeks."""
        delta = self.end_date - self.start_date
        return delta.days // 7

    def expected_log_count(self):
        """Calculate expected number of weekly logs."""
        return self.duration_in_weeks()


class WeeklyLog(models.Model):
    """
    Weekly activity log submitted by students during internship.
    Tracks activities and progresses through a defined workflow.
    """
    
    STATUS_CHOICES = (
        ('draft', 'Draft'),
        ('submitted', 'Submitted'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    )
    
    placement = models.ForeignKey(
        InternshipPlacement,
        on_delete=models.CASCADE,
        related_name='logs',
        help_text="Associated internship placement"
    )
    week_number = models.PositiveIntegerField(
        help_text="Week number of the internship"
    )
    activities = models.TextField(
        help_text="Describe activities completed this week",
        blank=False
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='draft',
        help_text="Current status of the log"
    )
    submitted_at = models.DateTimeField(
        blank=True,
        null=True,
        help_text="Timestamp when log was submitted"
    )
    rejection_reason = models.TextField(
        blank=True,
        null=True,
        help_text="Reason for rejection (if applicable)"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Weekly Log"
        verbose_name_plural = "Weekly Logs"
        ordering = ['-week_number']
        indexes = [
            models.Index(fields=['placement', 'week_number']),
            models.Index(fields=['status', 'submitted_at']),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=['placement', 'week_number'],
                name='unique_placement_week'
            ),
        ]

    def __str__(self):
        return f"Week {self.week_number} - {self.placement.student.username} ({self.status})"

    def clean(self):
        """Validate weekly log data."""
        if self.week_number < 1:
            raise ValidationError({'week_number': 'Week number must be at least 1.'})
        
        if self.week_number > self.placement.expected_log_count():
            raise ValidationError(
                {
                    'week_number': f'Week number exceeds expected duration of {self.placement.expected_log_count()} weeks.'
                }
            )
        
        if self.status != 'draft' and not self.activities.strip():
            raise ValidationError({'activities': 'Activities cannot be empty for submitted logs.'})

    def save(self, *args, **kwargs):
        """Run clean before saving."""
        self.full_clean()
        super().save(*args, **kwargs)

    # State transition query methods
    def can_edit(self):
        """Check if log can be edited."""
        return self.status in ('draft', 'rejected')

    def can_submit(self):
        """Check if log can be submitted."""
        return self.status == 'draft' and self.activities.strip()

    def can_approve(self):
        """Check if log can be approved."""
        return self.status == 'submitted'

    def can_reject(self):
        """Check if log can be rejected."""
        return self.status == 'submitted'

    # State transition action methods
    def submit(self, force=False):
        """
        Submit the weekly log for review.
        
        Args:
            force: If True, bypass validation checks
            
        Raises:
            ValidationError: If log cannot be submitted
        """
        if not force and not self.can_submit():
            raise ValidationError("This log cannot be submitted. It must be in draft status with activities.")
        
        self.status = 'submitted'
        self.submitted_at = timezone.now()
        self.rejection_reason = None
        self.save()

    def approve(self):
        """
        Approve the weekly log.
        
        Raises:
            ValidationError: If log is not in submitted status
        """
        if not self.can_approve():
            raise ValidationError("Only submitted logs can be approved.")
        
        self.status = 'approved'
        self.save()

    def reject(self, reason=""):
        """
        Reject the weekly log with optional reason.
        
        Args:
            reason: Explanation for rejection
            
        Raises:
            ValidationError: If log is not in submitted status
        """
        if not self.can_reject():
            raise ValidationError("Only submitted logs can be rejected.")
        
        self.status = 'rejected'
        self.rejection_reason = reason
        self.save()

    def revert_to_draft(self):
        """
        Revert log back to draft status.
        Useful for allowing students to re-edit rejected logs.
        """
        if self.status not in ('rejected', 'approved'):
            raise ValidationError("Only rejected or approved logs can be reverted to draft.")
        
        self.status = 'draft'
        self.rejection_reason = None
        self.save()

    def days_since_submission(self):
        """Calculate days since log was submitted."""
        if not self.submitted_at:
            return None
        return (timezone.now() - self.submitted_at).days

    def is_overdue_for_approval(self, days=7):
        """Check if log has been pending approval for more than specified days."""
        if self.status != 'submitted' or not self.submitted_at:
            return False
        return self.days_since_submission() > days