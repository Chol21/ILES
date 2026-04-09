from rest_framework import viewsets, permissions 
from core.models import CustomUser, InternshipPlacement 
from .serializers import CustomUserSerializer, InternshipPlacementSerializer 
class CustomUserViewSet(viewsets.ModelViewSet): 
    queryset = CustomUser.objects.all() 
    serializer_class = CustomUserSerializer 
