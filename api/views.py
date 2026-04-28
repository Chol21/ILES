from django.utils import timezone
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from core.models import (
    CustomUser,
    Evaluation,
    EvaluationCriteria,
    InternshipPlacement,
    OverallEvaluation,
    WeeklyLog,
)
from .serializers import (
    CustomUserSerializer,
    EvaluationCriteriaSerializer,
    EvaluationSerializer,
    InternshipPlacementSerializer,
    OverallEvaluationSerializer,
    RegisterSerializer,
    WeeklyLogSerializer,
)
from .permissions import IsAdminRole, IsSupervisorOrOwner


# ─── Auth ─────────────────────────────────────────────────────────────────────

class RegisterView(APIView):
    """Public endpoint — anyone can register."""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            refresh = RefreshToken.for_user(user)
            return Response({
                'user': CustomUserSerializer(user).data,
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LogoutView(APIView):
    """Blacklist the refresh token on logout."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response({'message': 'Logged out successfully.'}, status=status.HTTP_200_OK)
        except Exception:
            return Response({'error': 'Invalid token.'}, status=status.HTTP_400_BAD_REQUEST)


# ─── User ─────────────────────────────────────────────────────────────────────

class CustomUserViewSet(viewsets.ModelViewSet):
    queryset = CustomUser.objects.all()
    serializer_class = CustomUserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        # Admins see everyone; others only see themselves
        if user.role == 'admin' or user.is_staff:
            return CustomUser.objects.all()
        return CustomUser.objects.filter(pk=user.pk)

    @action(detail=False, methods=['get'], url_path='me')
    def me(self, request):
        """Return the currently logged-in user's profile."""
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)


class StudentViewSet(viewsets.ReadOnlyModelViewSet):
    """Read-only list of students — accessible to supervisors and admins."""
    serializer_class = CustomUserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role in ['admin', 'workplace', 'academic'] or user.is_staff:
            return CustomUser.objects.filter(role='student')
        # Students can only see themselves
        return CustomUser.objects.filter(pk=user.pk, role='student')


# ─── Internship ───────────────────────────────────────────────────────────────

class InternshipPlacementViewSet(viewsets.ModelViewSet):
    queryset = InternshipPlacement.objects.all()
    serializer_class = InternshipPlacementSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin' or user.is_staff:
            return InternshipPlacement.objects.all()
        elif user.role == 'student':
            return InternshipPlacement.objects.filter(student=user)
        elif user.role == 'workplace':
            return InternshipPlacement.objects.filter(workplace_supervisor=user)
        elif user.role == 'academic':
            return InternshipPlacement.objects.filter(academic_supervisor=user)
        return InternshipPlacement.objects.none()


# ─── Weekly Log ───────────────────────────────────────────────────────────────

class WeeklyLogViewSet(viewsets.ModelViewSet):
    queryset = WeeklyLog.objects.all()
    serializer_class = WeeklyLogSerializer
    permission_classes = [permissions.IsAuthenticated, IsSupervisorOrOwner]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin' or user.is_staff:
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
        if log.status not in ['draft', 'rejected']:
            return Response(
                {'error': 'Only draft or rejected logs can be submitted.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        log.status = 'submitted'
        log.submitted_at = timezone.now()
        log.save()
        return Response(self.get_serializer(log).data)

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        log = self.get_object()
        if log.status != 'submitted':
            return Response(
                {'error': 'Only submitted logs can be approved.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        log.status = 'approved'
        log.reviewed_at = timezone.now()
        log.supervisor_feedback = request.data.get('feedback', '')
        log.save()
        return Response(self.get_serializer(log).data)

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        log = self.get_object()
        if log.status != 'submitted':
            return Response(
                {'error': 'Only submitted logs can be rejected.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        feedback = request.data.get('feedback')
        if not feedback:
            return Response(
                {'error': 'Feedback is required when rejecting a log.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        log.status = 'rejected'
        log.reviewed_at = timezone.now()
        log.supervisor_feedback = feedback
        log.save()
        return Response(self.get_serializer(log).data)


# ─── Evaluation ───────────────────────────────────────────────────────────────

class EvaluationCriteriaViewSet(viewsets.ModelViewSet):
    queryset = EvaluationCriteria.objects.all()
    serializer_class = EvaluationCriteriaSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin' or user.is_staff:
            return EvaluationCriteria.objects.all()
        return EvaluationCriteria.objects.filter(is_active=True)


class EvaluationViewSet(viewsets.ModelViewSet):
    queryset = Evaluation.objects.all()
    serializer_class = EvaluationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin' or user.is_staff:
            return Evaluation.objects.all()
        elif user.role == 'student':
            return Evaluation.objects.filter(placement__student=user)
        elif user.role == 'workplace':
            return Evaluation.objects.filter(placement__workplace_supervisor=user)
        elif user.role == 'academic':
            return Evaluation.objects.filter(placement__academic_supervisor=user)
        return Evaluation.objects.none()


class OverallEvaluationViewSet(viewsets.ModelViewSet):
    queryset = OverallEvaluation.objects.all()
    serializer_class = OverallEvaluationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin' or user.is_staff:
            return OverallEvaluation.objects.all()
        elif user.role == 'student':
            return OverallEvaluation.objects.filter(placement__student=user)
        return OverallEvaluation.objects.all()

    def create(self, request, *args, **kwargs):
        placement_id = request.data.get('placement')
        total_score = request.data.get('total_score')
        grade = request.data.get('grade')

        # Check if one already exists
        existing = OverallEvaluation.objects.filter(placement_id=placement_id).first()
        if existing:
            existing.total_score = total_score
            existing.grade = grade
            existing.save()
            serializer = self.get_serializer(existing)
            return Response(serializer.data)

        serializer = self.get_serializer(data={
            'placement': placement_id,
            'total_score': total_score,
            'grade': grade,
        })
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
