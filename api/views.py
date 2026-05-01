from django.utils import timezone
from django.db.models import QuerySet

from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView

from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError

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


# ─────────────────────────────────────────────────────────────────────────────
# 🔹 Utility Mixins
# ─────────────────────────────────────────────────────────────────────────────

class RoleQuerySetMixin:
    """Centralized role-based filtering logic"""

    def is_admin(self, user):
        return user.role == "admin" or user.is_staff

    def none(self):
        return self.queryset.none()


# ─────────────────────────────────────────────────────────────────────────────
# 🔹 Auth
# ─────────────────────────────────────────────────────────────────────────────

class RegisterView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = serializer.save()
        refresh = RefreshToken.for_user(user)

        return Response({
            "user": CustomUserSerializer(user).data,
            "refresh": str(refresh),
            "access": str(refresh.access_token),
        }, status=status.HTTP_201_CREATED)


class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get("refresh")
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response({"message": "Logged out successfully."})

        except TokenError:
            return Response({"error": "Invalid token."}, status=status.HTTP_400_BAD_REQUEST)


# ─────────────────────────────────────────────────────────────────────────────
# 🔹 Users
# ─────────────────────────────────────────────────────────────────────────────

class CustomUserViewSet(RoleQuerySetMixin, viewsets.ModelViewSet):
    queryset = CustomUser.objects.all()
    serializer_class = CustomUserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self) -> QuerySet:
        user = self.request.user
        if self.is_admin(user):
            return self.queryset
        return self.queryset.filter(pk=user.pk)

    @action(detail=False, methods=["get"])
    def me(self, request):
        return Response(self.get_serializer(request.user).data)


class StudentViewSet(RoleQuerySetMixin, viewsets.ReadOnlyModelViewSet):
    serializer_class = CustomUserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if self.is_admin(user) or user.role in ["workplace", "academic"]:
            return CustomUser.objects.filter(role="student")
        return CustomUser.objects.filter(pk=user.pk, role="student")


# ─────────────────────────────────────────────────────────────────────────────
# 🔹 Internship
# ─────────────────────────────────────────────────────────────────────────────

class InternshipPlacementViewSet(RoleQuerySetMixin, viewsets.ModelViewSet):
    queryset = InternshipPlacement.objects.select_related(
        "student", "workplace_supervisor", "academic_supervisor"
    )
    serializer_class = InternshipPlacementSerializer
    permission_classes = [permissions.IsAuthenticated, IsSupervisorOrOwner]

    def get_queryset(self):
        user = self.request.user

        if self.is_admin(user):
            return self.queryset
        if user.role == "student":
            return self.queryset.filter(student=user)
        if user.role == "workplace":
            return self.queryset.filter(workplace_supervisor=user)
        if user.role == "academic":
            return self.queryset.filter(academic_supervisor=user)

        return self.none()


# ─────────────────────────────────────────────────────────────────────────────
# 🔹 Weekly Logs
# ─────────────────────────────────────────────────────────────────────────────

class WeeklyLogViewSet(RoleQuerySetMixin, viewsets.ModelViewSet):
    queryset = WeeklyLog.objects.select_related(
        "placement", "placement__student"
    )
    serializer_class = WeeklyLogSerializer
    permission_classes = [permissions.IsAuthenticated, IsSupervisorOrOwner]

    def get_queryset(self):
        user = self.request.user

        if self.is_admin(user):
            return self.queryset
        if user.role == "student":
            return self.queryset.filter(placement__student=user)
        if user.role == "workplace":
            return self.queryset.filter(placement__workplace_supervisor=user)
        if user.role == "academic":
            return self.queryset.filter(placement__academic_supervisor=user)

        return self.none()

    # ─── Actions ───

    @action(detail=True, methods=["post"])
    def submit(self, request, pk=None):
        log = self.get_object()

        if log.placement.end_date < timezone.now().date():
            return Response(
                {"error": "Internship has ended."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if log.status not in ["draft", "rejected"]:
            return Response(
                {"error": "Only draft or rejected logs can be submitted."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        log.status = "submitted"
        log.submitted_at = timezone.now()
        log.save()

        return Response(self.get_serializer(log).data)

    @action(detail=True, methods=["post"])
    def approve(self, request, pk=None):
        if request.user.role not in ["workplace", "academic"]:
            return Response({"error": "Not authorized."}, status=403)

        log = self.get_object()

        if log.status != "submitted":
            return Response(
                {"error": "Only submitted logs can be approved."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        log.status = "approved"
        log.reviewed_at = timezone.now()
        log.supervisor_feedback = request.data.get("feedback", "")
        log.save()

        return Response(self.get_serializer(log).data)

    @action(detail=True, methods=["post"])
    def reject(self, request, pk=None):
        if request.user.role not in ["workplace", "academic"]:
            return Response({"error": "Not authorized."}, status=403)

        log = self.get_object()
        feedback = request.data.get("feedback")

        if log.status != "submitted":
            return Response(
                {"error": "Only submitted logs can be rejected."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not feedback:
            return Response(
                {"error": "Feedback is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        log.status = "rejected"
        log.reviewed_at = timezone.now()
        log.supervisor_feedback = feedback
        log.save()

        return Response(self.get_serializer(log).data)


# ─────────────────────────────────────────────────────────────────────────────
# 🔹 Evaluation
# ─────────────────────────────────────────────────────────────────────────────

class EvaluationCriteriaViewSet(RoleQuerySetMixin, viewsets.ModelViewSet):
    queryset = EvaluationCriteria.objects.all()
    serializer_class = EvaluationCriteriaSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if self.is_admin(user):
            return self.queryset
        return self.queryset.filter(is_active=True)


class EvaluationViewSet(RoleQuerySetMixin, viewsets.ModelViewSet):
    queryset = Evaluation.objects.select_related("placement")
    serializer_class = EvaluationSerializer
    permission_classes = [permissions.IsAuthenticated, IsSupervisorOrOwner]

    def get_queryset(self):
        user = self.request.user
        qs = self.queryset

        placement_id = self.request.query_params.get("placement")
        if placement_id:
            qs = qs.filter(placement_id=placement_id)

        if self.is_admin(user):
            return qs
        if user.role == "student":
            return qs.filter(placement__student=user)
        if user.role == "workplace":
            return qs.filter(placement__workplace_supervisor=user)
        if user.role == "academic":
            return qs.filter(placement__academic_supervisor=user)

        return self.none()


class OverallEvaluationViewSet(RoleQuerySetMixin, viewsets.ModelViewSet):
    queryset = OverallEvaluation.objects.select_related("placement")
    serializer_class = OverallEvaluationSerializer
    permission_classes = [permissions.IsAuthenticated, IsSupervisorOrOwner]

    def get_queryset(self):
        user = self.request.user

        if self.is_admin(user):
            return self.queryset
        if user.role == "student":
            return self.queryset.filter(placement__student=user)
        if user.role == "workplace":
            return self.queryset.filter(placement__workplace_supervisor=user)
        if user.role == "academic":
            return self.queryset.filter(placement__academic_supervisor=user)

        return self.none()

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        placement = serializer.validated_data["placement"]

        existing = OverallEvaluation.objects.filter(placement=placement).first()
        if existing:
            existing.total_score = serializer.validated_data["total_score"]
            existing.grade = serializer.validated_data["grade"]
            existing.save()

            return Response(self.get_serializer(existing).data)

        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"])
    def calculate(self, request, pk=None):
        overall = self.get_object()
        overall.calculate_total_score()
        return Response(self.get_serializer(overall).data)