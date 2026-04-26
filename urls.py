from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from . import views

router = DefaultRouter()
router.register(r'users', views.CustomUserViewSet)
router.register(r'students', views.StudentViewSet, basename='student')
router.register(r'placements', views.InternshipPlacementViewSet)
router.register(r'weekly-logs', views.WeeklyLogViewSet)
router.register(r'evaluation-criteria', views.EvaluationCriteriaViewSet)
router.register(r'evaluations', views.EvaluationViewSet)
router.register(r'overall-evaluations', views.OverallEvaluationViewSet)

urlpatterns = [
    # Auth endpoints
    path('auth/register/', views.RegisterView.as_view(), name='register'),
    path('auth/login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/logout/', views.LogoutView.as_view(), name='logout'),

    # All model endpoints
    path('', include(router.urls)),
]
