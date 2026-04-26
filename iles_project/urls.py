from django.contrib import admin
from django.urls import path, include

try:
    from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerUIView
    docs_urls = [
        path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
        path('api/docs/', SpectacularSwaggerUIView.as_view(url_name='schema'), name='swagger-ui'),
    ]
except ImportError:
    docs_urls = []

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('api.urls')),
] + docs_urls