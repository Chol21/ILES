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


# ─────────────────────────────────────────────────────────────────────────────
# 🔹 User
# ─────────────────────────────────────────────────────────────────────────────

class CustomUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = [
            'id', 'username', 'email',
            'first_name', 'last_name',
            'role', 'student_number',
            'staff_number', 'phone_number',
            'department',
        ]
        read_only_fields = ['id']


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True)

    class Meta:
        model = CustomUser
        fields = [
            'username', 'email', 'password', 'password2',
            'first_name', 'last_name', 'role',
            'student_number', 'staff_number',
            'phone_number', 'department',
        ]

    def validate(self, data):
        if data['password'] != data['password2']:
            raise serializers.ValidationError({'password': 'Passwords do not match.'})

        role = data.get('role')

        if role == 'student' and not data.get('student_number'):
            raise serializers.ValidationError({'student_number': 'Required for students.'})

        if role in ['academic', 'workplace'] and not data.get('staff_number'):
            raise serializers.ValidationError({'staff_number': 'Required for staff.'})

        return data

    def create(self, validated_data):
        validated_data.pop('password2')
        password = validated_data.pop('password')

        user = CustomUser(**validated_data)
        user.set_password(password)
        user.save()
        return user


# ─────────────────────────────────────────────────────────────────────────────
# 🔹 Internship Placement
# ─────────────────────────────────────────────────────────────────────────────

class InternshipPlacementSerializer(serializers.ModelSerializer):
    workplace_supervisor_name =serializers.CharField(source='workplace_supervisor.get_full_name', read_only=True,
    allow_null=True)
    academic_supervisor_name = serializers.CharField(source='academic_supervisor.get_full_name',
    read_only=True, allow_null=True)


    class Meta:
        model = InternshipPlacement
       
        fields = ['id', 'student', 'student_name', 'company_name', 'start_date', 'end_date',
            'workplace_supervisor', 'workplace_supervisor_name', 'academic_supervisor',
            'academic_supervisor_name', 'is_active']
        read_only_fields = ['id', 'student']

    def validate(self, data):
        start = data.get('start_date')
        end = data.get('end_date')

        if start and end and end < start:
            raise serializers.ValidationError({'end_date': 'End date cannot be before start date.'})

        return data

    def create(self, validated_data):
        request = self.context["request"]
        # Admin can assign any student; non-admin creates for themselves
        if request.user.role != "admin":
            validated_data["student"] = request.user
        return super().create(validated_data)

# ─────────────────────────────────────────────────────────────────────────────
# 🔹 Weekly Log
# ─────────────────────────────────────────────────────────────────────────────

class WeeklyLogSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='placement.student.username', read_only=True)

    class Meta:
        model = WeeklyLog
        fields = ['id', 'placement', 'student_name', 'week_number', 'week_ending_date', 'activities',
        'key_learnings', 'challenges', 'status', 'supervisor_feedback', 'submitted_at',
        'reviewed_at']
        
        read_only_fields = [
            'id',
            'status',
            'submitted_at',
            'reviewed_at',
        ]

    def validate(self, data):
        request = self.context['request']
        instance = self.instance

        # Ownership enforcement
        if instance and request.user != instance.placement.student:
            raise serializers.ValidationError('You do not own this log.')

        if data.get('week_number', 1) <= 0:
            raise serializers.ValidationError({'week_number': 'Must be > 0.'})

        if data.get('week_ending_date') and data['week_ending_date'] > timezone.now().date():
            raise serializers.ValidationError({'week_ending_date': 'Cannot be in the future.'})

        return data


# ─────────────────────────────────────────────────────────────────────────────
# 🔹 Evaluation Criteria
# ─────────────────────────────────────────────────────────────────────────────

class EvaluationCriteriaSerializer(serializers.ModelSerializer):
    class Meta:
        model = EvaluationCriteria
        fields = ['id', 'name', 'description', 'weight', 'is_active']


# ─────────────────────────────────────────────────────────────────────────────
# 🔹 Evaluation
# ─────────────────────────────────────────────────────────────────────────────

class EvaluationSerializer(serializers.ModelSerializer):
    criteria_name = serializers.CharField(source='criteria.name', read_only=True)

    class Meta:
        model = Evaluation
        fields = ['id', 'placement', 'criteria', 'criteria_name', 'score', 'evaluated_by',
            'evaluated_at']
        read_only_fields = ['id', 'evaluated_by', 'evaluated_at']

    def validate_score(self, value):
        if value < 0 or value > 100:
            raise serializers.ValidationError('Score must be between 0 and 100.')
        return value

    def create(self, validated_data):
        validated_data['evaluated_by'] = self.context['request'].user
        return super().create(validated_data)


# ─────────────────────────────────────────────────────────────────────────────
# 🔹 Overall Evaluation
# ─────────────────────────────────────────────────────────────────────────────

class OverallEvaluationSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='placement.student.username', read_only=True)

    class Meta:
        model = OverallEvaluation
        fields = [
            'id',
            'placement',
            'student_name',
            'total_score',
            'grade',
            'evaluated_at',
        ]
        read_only_fields = [
            'id',
            'total_score',
            'grade',
            'evaluated_at',
        ]