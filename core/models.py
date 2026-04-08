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
