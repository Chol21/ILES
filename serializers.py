from datetime import date

from django.contrib.auth.password_validation import validate_password
from django.utils import timezone
from rest_framework import serializers

from core.models import (
    CustomUser,
    Evaluation,
    EvaluationCriteria,
    InternshipPlacement,
    OverallEvaluation,
    WeeklyLog,
)


# ─── User ─────────────────────────────────────────────────────────────────────

class CustomUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'role', 'student_number', 'staff_number', 'phone_number', 'department',
        ]
        read_only_fields = ['id']


class RegisterSerializer(serializers.ModelSerializer):
    """Used for new user registration."""
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, label='Confirm password')

    class Meta:
        model = CustomUser
        fields = [
            'username', 'email', 'password', 'password2',
            'first_name', 'last_name', 'role',
            'student_number', 'staff_number', 'phone_number', 'department',
        ]

    def validate(self, data):
        if data['password'] != data['password2']:
            raise serializers.ValidationError({'password': 'Passwords do not match.'})
        return data

    def create(self, validated_data):
        validated_data.pop('password2')
        password = validated_data.pop('password')
        user = CustomUser(**validated_data)
        user.set_password(password)
        user.save()
        return user


# ─── Internship ───────────────────────────────────────────────────────────────

class InternshipPlacementSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.username', read_only=True)
    workplace_supervisor_name = serializers.CharField(
        source='workplace_supervisor.username', read_only=True, allow_null=True
    )
    academic_supervisor_name = serializers.CharField(
        source='academic_supervisor.username', read_only=True, allow_null=True
    )

    class Meta:
        model = InternshipPlacement
        fields = '__all__'

    def validate(self, data):
        start = data.get('start_date')
        end = data.get('end_date')
        if start and end and end < start:
            raise serializers.ValidationError({'end_date': 'End date cannot be before start date.'})
        return data


# ─── Weekly Log ───────────────────────────────────────────────────────────────

class WeeklyLogSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='placement.student.username', read_only=True)
    can_edit = serializers.BooleanField(read_only=True)
    can_submit = serializers.BooleanField(read_only=True)

    class Meta:
        model = WeeklyLog
        fields = '__all__'
        read_only_fields = ['submitted_at', 'reviewed_at', 'created_at', 'updated_at']

    def validate(self, data):
        instance = self.instance

        if instance and not instance.can_edit():
            raise serializers.ValidationError('Cannot edit a log that has been submitted or approved.')

        if data.get('week_number', 1) <= 0:
            raise serializers.ValidationError({'week_number': 'Week number must be greater than 0.'})

        if data.get('week_ending_date') and data['week_ending_date'] > date.today():
            raise serializers.ValidationError({'week_ending_date': 'Week ending date cannot be in the future.'})

        return data

    def update(self, instance, validated_data):
        new_status = validated_data.get('status', instance.status)

        # FIX: was request.now() which doesn't exist — correct is timezone.now()
        if new_status == 'submitted' and instance.status in ['draft', 'rejected']:
            validated_data['submitted_at'] = timezone.now()

        if new_status in ['approved', 'rejected'] and instance.status == 'submitted':
            validated_data['reviewed_at'] = timezone.now()

        return super().update(instance, validated_data)


# ─── Evaluation ───────────────────────────────────────────────────────────────

class EvaluationCriteriaSerializer(serializers.ModelSerializer):
    class Meta:
        model = EvaluationCriteria
        fields = '__all__'


class EvaluationSerializer(serializers.ModelSerializer):
    criteria_name = serializers.CharField(source='criteria.name', read_only=True)
    evaluated_by_name = serializers.CharField(source='evaluated_by.username', read_only=True, allow_null=True)

    class Meta:
        model = Evaluation
        fields = '__all__'

    def validate_score(self, value):
        if value < 0 or value > 100:
            raise serializers.ValidationError('Score must be between 0 and 100.')
        return value


class OverallEvaluationSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='placement.student.username', read_only=True)

    class Meta:
        model = OverallEvaluation
        fields = '__all__'
        read_only_fields = ['total_score', 'grade', 'evaluated_at']
