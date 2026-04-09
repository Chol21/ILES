from rest_framework import serializers
from core.models import CustomUser, InternshipPlacement, WeeklyLog, EvaluationCriteria, Evaluation

class CustomUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role', 'student_number', 'staff_number', 'phone_number']


class InternshipPlacementSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.username', read_only=True)
    workplace_supervisor_name = serializers.CharField(source='workplace_supervisor.username', read_only=True, allow_null=True)
    academic_supervisor_name = serializers.CharField(source='academic_supervisor.username', read_only=True, allow_null=True)
    
    class Meta:
        model = InternshipPlacement
        fields = '__all__'


class WeeklyLogSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='placement.student.username', read_only=True)
    can_edit = serializers.BooleanField(read_only=True)
    can_submit = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = WeeklyLog
        fields = '__all__'
        read_only_fields = ['submitted_at', 'reviewed_at', 'created_at', 'updated_at']
    
    def validate(self, data):
        """Validate business rules for WeeklyLog"""
        request = self.context.get('request')
        instance = self.instance
        
        # Check if editing is allowed
        if instance and not instance.can_edit():
            raise serializers.ValidationError("Cannot edit log that has been submitted or approved")
        
        # Validate week number is positive
        if data.get('week_number', 0) <= 0:
            raise serializers.ValidationError({"week_number": "Week number must be greater than 0"})
        
        # Validate week ending date is not in the future
        from datetime import date
        if data.get('week_ending_date') and data['week_ending_date'] > date.today():
            raise serializers.ValidationError({"week_ending_date": "Week ending date cannot be in the future"})
        
        return data
    
    def update(self, instance, validated_data):
        """Handle status transitions"""
        new_status = validated_data.get('status', instance.status)
        
        # Handle submission
        if new_status == 'submitted' and instance.status == 'draft':
            validated_data['submitted_at'] = self.context['request'].now()
        
        # Handle approval/rejection
        if new_status in ['approved', 'rejected'] and instance.status == 'submitted':
            validated_data['reviewed_at'] = self.context['request'].now()
        
        return super().update(instance, validated_data)


class EvaluationCriteriaSerializer(serializers.ModelSerializer):
    class Meta:
        model = EvaluationCriteria
        fields = '__all__'


class EvaluationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Evaluation
        fields = '__all__'
    
    def validate_score(self, value):
        if value < 0 or value > 100:
            raise serializers.ValidationError("Score must be between 0 and 100")
        return value
