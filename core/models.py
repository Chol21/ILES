from django.contrib.auth.models import AbstractUser
from django.db import models

class CustomUser(AbstractUser):
    """
    Custom User model that extends Django's AbstractUser.
    Adds role-based fields for the ILES system.
    """
    
    ROLE_CHOICES = (
        ('student', 'Student'),
        ('workplace', 'Workplace Supervisor'),
        ('academic', 'Academic Supervisor'),
        ('admin', 'Administrator'),
    )
    
    # Role field - determines what the user can do in the system
    role = models.CharField(
        max_length=20, 
        choices=ROLE_CHOICES, 
        default='student'
    )
    
    # Department field (for supervisors and admin)
    department = models.CharField(
        max_length=150, 
        blank=True, 
        null=True
    )
    
    # Staff number (for supervisors and admin)
    staff_number = models.CharField(
        max_length=50, 
        unique=True, 
        blank=True, 
        null=True
    )
    
    # Student number (for students)
    student_number = models.CharField(
        max_length=50, 
        unique=True, 
        blank=True, 
        null=True
    )
    
    # Phone number (for SMS notifications)
    phone_number = models.CharField(
        max_length=15, 
        blank=True, 
        null=True
    )
    
    def __str__(self):
        """String representation of the user"""
        return f"{self.username} ({self.get_role_display()})"
    
    class Meta:
        verbose_name = "User"
        verbose_name_plural = "Users"

# Add this AFTER your CustomUser class in core/models.py

class InternshipPlacement(models.Model):
    student = models.ForeignKey(
        CustomUser, 
        on_delete=models.CASCADE, 
        related_name='placements',
        limit_choices_to={'role': 'student'}
    )
    company_name = models.CharField(max_length=255)
    start_date = models.DateField()
    end_date = models.DateField()
    workplace_supervisor = models.ForeignKey(
        CustomUser, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='workplace_supervisions',
        limit_choices_to={'role': 'workplace'}
    )
    academic_supervisor = models.ForeignKey(
        CustomUser, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='academic_supervisions',
        limit_choices_to={'role': 'academic'}
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.student.username} - {self.company_name}"
    
    class Meta:
        ordering = ['-created_at']


class WeeklyLog(models.Model):
    STATUS_CHOICES = (
        ('draft', 'Draft'),
        ('submitted', 'Submitted'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    )
    
    placement = models.ForeignKey(InternshipPlacement, on_delete=models.CASCADE, related_name='logs')
    week_number = models.PositiveIntegerField()
    week_ending_date = models.DateField()
    activities = models.TextField()
    key_learnings = models.TextField(blank=True, null=True)
    challenges = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    supervisor_feedback = models.TextField(blank=True, null=True)
    submitted_at = models.DateTimeField(blank=True, null=True)
    reviewed_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Week {self.week_number} - {self.placement.student.username}"
    
    def can_edit(self):
        """Check if log can be edited"""
        return self.status in ['draft', 'rejected']
    
    def can_submit(self):
        """Check if log can be submitted"""
        return self.status == 'draft'
    
    def can_approve(self):
        """Check if log can be approved"""
        return self.status == 'submitted'
    
    def can_reject(self):
        """Check if log can be rejected"""
        return self.status == 'submitted'
    
    class Meta:
        ordering = ['placement', 'week_number']
        unique_together = ['placement', 'week_number']
