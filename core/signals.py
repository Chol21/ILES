from django.db.models.signals import pre_save, post_save
from django.dispatch import receiver
from django.core.mail import send_mail
from django.conf import settings
from .models import WeeklyLog


@receiver(pre_save, sender=WeeklyLog)
def track_status_change(sender, instance, **kwargs):
    """Store the previous status before saving."""
    if instance.pk:
        try:
            instance._previous_status = WeeklyLog.objects.get(pk=instance.pk).status
        except WeeklyLog.DoesNotExist:
            instance._previous_status = None
    else:
        instance._previous_status = None


@receiver(post_save, sender=WeeklyLog)
def notify_on_status_change(sender, instance, created, **kwargs):
    """Send email when status actually changes."""
    if created:
        return

    previous = getattr(instance, '_previous_status', None)
    current = instance.status

    # Only act if status actually changed
    if previous == current:
        return

    student = instance.placement.student
    student_name = student.first_name or student.username
    student_email = student.email
    week = instance.week_number

    print(f"[SIGNAL] Status changed: {previous} → {current} for Week {week}")

    if current == 'submitted':
        supervisor = instance.placement.workplace_supervisor
        if supervisor and supervisor.email:
            send_mail(
                subject=f'[ILES] New Log Submitted — Week {week}',
                message=(
                    f'Hello {supervisor.first_name},\n\n'
                    f'{student_name} has submitted their Week {week} log for your review.\n\n'
                    f'Please log in to ILES to review it.\n\n'
                    f'— ILES System'
                ),
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[supervisor.email],
                fail_silently=True,
            )
            print(f"[SIGNAL] Email sent to supervisor: {supervisor.email}")

    elif current == 'approved' and student_email:
        send_mail(
            subject=f'[ILES] Your Week {week} Log Has Been Approved ✓',
            message=(
                f'Hello {student_name},\n\n'
                f'Great news! Your Week {week} internship log has been approved.\n\n'
                f'Feedback: {instance.supervisor_feedback or "No feedback provided."}\n\n'
                f'Keep up the good work!\n\n'
                f'— ILES System'
            ),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[student_email],
            fail_silently=True,
        )
        print(f"[SIGNAL] Approval email sent to: {student_email}")

    elif current == 'rejected' and student_email:
        send_mail(
            subject=f'[ILES] Your Week {week} Log Needs Revision',
            message=(
                f'Hello {student_name},\n\n'
                f'Your Week {week} log requires revision.\n\n'
                f'Feedback: {instance.supervisor_feedback}\n\n'
                f'Please log in, update and resubmit.\n\n'
                f'— ILES System'
            ),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[student_email],
            fail_silently=True,
        )
        print(f"[SIGNAL] Rejection email sent to: {student_email}")