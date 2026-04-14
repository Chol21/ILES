from django.urls import path, include 
from rest_framework.routers import DefaultRouter 
from . import views 
router = DefaultRouter() 
router.register(r'users', views.CustomUserViewSet) 
router.register(r'students', views.StudentViewSet, basename='student') 
router.register(r'placements', views.InternshipPlacementViewSet)
router.register(r'weekly-logs', views.WeeklyLogViewSet)
router.register(r'evaluation-criteria', views.EvaluationCriteriaViewSet)
router.register(r'evaluations', views.EvaluationViewSet)
urlpatterns = [path('', include(router.urls))] 
