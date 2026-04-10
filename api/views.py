from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django.utils import timezone
from core.models import CustomUser, InternshipPlacement, WeeklyLog, EvaluationCriteria, Evaluation
from .serializers import (
    CustomUserSerializer, InternshipPlacementSerializer, 
    WeeklyLogSerializer, EvaluationCriteriaSerializer, EvaluationSerializer
)

class CustomUserViewSet(viewsets.ModelViewSet):
    queryset = CustomUser.objects.all()
    serializer_class = CustomUserSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return CustomUser.objects.all()
        return CustomUser.objects.filter(id=user.id)


class InternshipPlacementViewSet(viewsets.ModelViewSet):
    queryset = InternshipPlacement.objects.all()
    serializer_class = InternshipPlacementSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return InternshipPlacement.objects.all()
        elif user.role == 'student':
            return InternshipPlacement.objects.filter(student=user)
        elif user.role == 'workplace':
            return InternshipPlacement.objects.filter(workplace_supervisor=user)
        elif user.role == 'academic':
            return InternshipPlacement.objects.filter(academic_supervisor=user)
        return InternshipPlacement.objects.none()


class WeeklyLogViewSet(viewsets.ModelViewSet):
    queryset = WeeklyLog.objects.all()
    serializer_class = WeeklyLogSerializer
    permission_classes = [permissions.IsAuthenticated,IsSupervisorOrOwner]
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return WeeklyLog.objects.all()
        elif user.role == 'student':
            return WeeklyLog.objects.filter(placement__student=user)
        elif user.role == 'workplace':
            return WeeklyLog.objects.filter(placement__workplace_supervisor=user)
        elif user.role == 'academic':
            return WeeklyLog.objects.filter(placement__academic_supervisor=user)
        return WeeklyLog.objects.none()

    
    
    @action(detail=True, methods=['post'])
    def submit(self, request, pk=None):
        log = self.get_object()
        if log.status != 'draft':
            return Response({'error': 'Only draft logs can be submitted'}, status=status.HTTP_400_BAD_REQUEST)
        
        log.status = 'submitted'
        log.submitted_at = timezone.now()
        log.save()
        
        serializer = self.get_serializer(log)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        log = self.get_object()
        if log.status != 'submitted':
            return Response({'error': 'Only submitted logs can be approved'}, status=status.HTTP_400_BAD_REQUEST)
        
        log.status = 'approved'
        log.reviewed_at = timezone.now()
        log.supervisor_feedback = request.data.get('feedback', '')
        log.save()
        
        serializer = self.get_serializer(log)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        log = self.get_object()
        if log.status != 'submitted':
            return Response({'error': 'Only submitted logs can be rejected'}, status=status.HTTP_400_BAD_REQUEST)
        
        feedback = request.data.get('feedback')
        if not feedback:
            return Response({'error': 'Feedback is required when rejecting'}, status=status.HTTP_400_BAD_REQUEST)
        
        log.status = 'rejected'
        log.reviewed_at = timezone.now()
        log.supervisor_feedback = feedback
        log.save()
        
        serializer = self.get_serializer(log)
        return Response(serializer.data)
