# Django Settings Configuration Guide

This guide explains the improvements made to `settings.py` and how to configure your environment.

## Key Improvements

### 1. Security Enhancements
- **SECRET_KEY**: Now loaded from environment variable (required for production)
- **DEBUG**: Controlled by environment variable, preventing accidental production exposure
- **ALLOWED_HOSTS**: Explicitly configured per environment
- **Security Headers**: Automatically enabled in production (SSL redirect, secure cookies, etc.)

### 2. Environment Management
- **ENVIRONMENT variable**: Distinguishes between `development`, `staging`, and `production`
- **Conditional Database**: SQLite for development, PostgreSQL for production
- **Conditional Email**: Console output in development, SMTP in production

### 3. Database Configuration
- **Development**: SQLite (default, no setup needed)
- **Production**: PostgreSQL (more robust for production use)

### 4. Logging System
- Comprehensive logging to both console and file
- Logs stored in `logs/django.log`
- Configurable log levels via `DJANGO_LOG_LEVEL` env variable

### 5. Media Files Support
- Added `MEDIA_URL` and `MEDIA_ROOT` for file uploads
- Create `media/` directory as needed

### 6. REST Framework Enhancements
- Added pagination (10 items per page by default)
- Added filtering, search, and ordering support
- Requires: `pip install django-filter`

## Setup Instructions

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

Required packages:
- django
- djangorestframework
- djangorestframework-simplejwt
- django-cors-headers
- drf-spectacular
- python-dotenv
- whitenoise
- django-filter  # For REST Framework filters
- psycopg2-binary  # For PostgreSQL (production only)
```

### 2. Create `.env` File
Copy `.env.example` to `.env` and update with your values:

```bash
cp .env.example .env
```

**Development `.env` (minimal):**
```
DEBUG=True
ENVIRONMENT=development
SECRET_KEY=your-dev-secret-key
ALLOWED_HOSTS=localhost,127.0.0.1
```

**Production `.env` (example):**
```
DEBUG=False
ENVIRONMENT=production
SECRET_KEY=your-super-secret-production-key
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com
DB_NAME=iles_prod_db
DB_USER=iles_user
DB_PASSWORD=secure-password
DB_HOST=your-db-host.com
DB_PORT=5432
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
```

### 3. Create Required Directories
```bash
mkdir -p logs media static templates
```

### 4. Run Migrations
```bash
python manage.py migrate
```

### 5. Create Superuser
```bash
python manage.py createsuperuser
```

### 6. Collect Static Files (Production)
```bash
python manage.py collectstatic --noinput
```

## Security Checklist for Production

- [ ] Change `SECRET_KEY` to a random, secure value
- [ ] Set `DEBUG=False`
- [ ] Set `ENVIRONMENT=production`
- [ ] Update `ALLOWED_HOSTS` with your domain(s)
- [ ] Configure PostgreSQL database with secure credentials
- [ ] Set up email SMTP configuration
- [ ] Use HTTPS (SSL/TLS certificate)
- [ ] Update `SECURE_CONTENT_SECURITY_POLICY` as needed
- [ ] Review CORS origins - remove localhost
- [ ] Set strong password requirements
- [ ] Enable database backups
- [ ] Monitor logs for errors and security issues

## Environment Variables Reference

| Variable | Default | Description |
|----------|---------|-------------|
| `DEBUG` | False | Enable debug mode (NEVER True in production) |
| `ENVIRONMENT` | development | Deployment environment |
| `SECRET_KEY` | - | Django secret key (REQUIRED, must be secure) |
| `ALLOWED_HOSTS` | localhost,127.0.0.1 | Comma-separated allowed domains |
| `DB_NAME` | iles_db | Database name |
| `DB_USER` | postgres | Database user |
| `DB_PASSWORD` | - | Database password (REQUIRED for production) |
| `DB_HOST` | localhost | Database host |
| `DB_PORT` | 5432 | Database port |
| `EMAIL_HOST` | smtp.gmail.com | SMTP server |
| `EMAIL_PORT` | 587 | SMTP port |
| `EMAIL_USE_TLS` | True | Use TLS for email |
| `EMAIL_HOST_USER` | - | Email sender address |
| `EMAIL_HOST_PASSWORD` | - | Email password/app password |
| `DJANGO_LOG_LEVEL` | INFO | Logging level |

## Common Issues

### Issue: "No module named 'django_filters'"
**Solution**: `pip install django-filter`

### Issue: "DATABASES is not configured"
**Solution**: Ensure `.env` file exists and is in the project root. Check that environment variables are being loaded.

### Issue: "psycopg2 not found"
**Solution**: `pip install psycopg2-binary` (PostgreSQL driver)

### Issue: Static files not working
**Solution**: Run `python manage.py collectstatic` and ensure `STATIC_ROOT` directory exists.

### Issue: Media files uploading but not accessible
**Solution**: Ensure `media/` directory exists and is writable. Add media URL routing in `urls.py`:
```python
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    # ... your patterns
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
```

## Testing Your Configuration

```bash
# Check Django setup
python manage.py check

# Test database connection
python manage.py dbshell

# Run tests
python manage.py test

# Start development server
python manage.py runserver
```

## Additional Resources

- [Django Security Documentation](https://docs.djangoproject.com/en/stable/topics/security/)
- [Django Settings Reference](https://docs.djangoproject.com/en/stable/ref/settings/)
- [Django REST Framework Configuration](https://www.django-rest-framework.org/api-guide/settings/)
- [Environment Variables Best Practices](https://12factor.net/config)
