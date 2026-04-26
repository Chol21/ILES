from django.contrib.auth.models import AbstractUser
from django.core.exceptions import ValidationError
from django.db import models
from django.utils import timezone


# ─── User ─────────────────────────────────────────────────────────────────────

class CustomUser(AbstractUser):
    ROLE_CHOICES = (
        ('student', 'Student'),
        ('workplace', 'Workplace Supervisor'),
        ('academic', 'Academic Supervisor'),
        ('admin', 'Administrator'),
    )

    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='student')
    department = models.CharField(max_length=150, blank=True, null=True)
    staff_number = models.CharField(max_length=50, unique=True, blank=True, null=True)
    student_number = models.CharField(max_length=50, unique=True, blank=True, null=True)
    phone_number = models.CharField(max_length=15, blank=True, null=True)

    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"

    class Meta:
        verbose_name = "User"
        verbose_name_plural = "Users"


# ─── Internship ───────────────────────────────────────────────────────────────

class InternshipPlacement(models.Model):
    student = models.ForeignKey(
        CustomUser,
        on_delete=models.CASCADE,
        related_name='placements',
        limit_choices_to={'role': 'student'},
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
        limit_choices_to={'role': 'workplace'},
    )
    academic_supervisor = models.ForeignKey(
        CustomUser,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='academic_supervisions',
        limit_choices_to={'role': 'academic'},
    )

    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def clean(self):
        if self.start_date and self.end_date and self.end_date < self.start_date:
            raise ValidationError("End date cannot be before start date.")

    def __str__(self):
        return f"{self.student.username} - {self.company_name} ({self.start_date.year})"

    class Meta:
        ordering = ['-created_at']


# ─── Weekly Log ───────────────────────────────────────────────────────────────

class WeeklyLog(models.Model):
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
    )
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
        return self.status in ['draft', 'rejected']

    def can_submit(self):
        return self.status in ['draft', 'rejected']

    def submit(self):
        if not self.can_submit():
            raise ValidationError("This log cannot be submitted in its current state.")
        self.status = 'submitted'
        self.submitted_at = timezone.now()
        self.save()

    def approve(self):
        if self.status != 'submitted':
            raise ValidationError("Only submitted logs can be approved.")
        self.status = 'approved'
        self.reviewed_at = timezone.now()
        self.save()

    def reject(self):
        if self.status != 'submitted':
            raise ValidationError("Only submitted logs can be rejected.")
        self.status = 'rejected'
        self.reviewed_at = timezone.now()
        self.save()

    class Meta:
        ordering = ['week_number']
        constraints = [
            models.UniqueConstraint(
                fields=['placement', 'week_number'],
                name='unique_week_per_placement',
            )
        ]


# ─── Evaluation ───────────────────────────────────────────────────────────────

class EvaluationCriteria(models.Model):
    name = models.CharField(max_length=255)
    weight = models.DecimalField(max_digits=5, decimal_places=2)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

    class Meta:
        verbose_name_plural = "Evaluation Criteria"
        ordering = ['name']


class Evaluation(models.Model):
    placement = models.ForeignKey(
        InternshipPlacement,
        on_delete=models.CASCADE,
        related_name='evaluations',
    )
    criteria = models.ForeignKey(
        EvaluationCriteria,
        on_delete=models.PROTECT,
        related_name='evaluations',
    )
    score = models.DecimalField(max_digits=5, decimal_places=2)
    evaluated_by = models.ForeignKey(
        CustomUser,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='evaluations_given',
    )
    evaluated_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.placement.student.username} - {self.criteria.name}: {self.score}"

    class Meta:
        ordering = ['-evaluated_at']
        # Prevent duplicate scores for the same placement + criteria combination
        constraints = [
            models.UniqueConstraint(
                fields=['placement', 'criteria'],
                name='unique_evaluation_per_criteria',
            )
        ]


class OverallEvaluation(models.Model):
    GRADE_CHOICES = (
        ('A', 'A - Distinction'),
        ('B', 'B - Merit'),
        ('C', 'C - Pass'),
        ('D', 'D - Borderline'),
        ('F', 'F - Fail'),
    )

    placement = models.OneToOneField(
        InternshipPlacement,
        on_delete=models.CASCADE,
        related_name='overall_evaluation',
    )
    total_score = models.DecimalField(max_digits=5, decimal_places=2)
    grade = models.CharField(max_length=5, choices=GRADE_CHOICES)
    evaluated_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.placement.student.username} - {self.grade} ({self.total_score})"

    class Meta:
        ordering = ['-evaluated_at']
