# ILES — Internship Log & Evaluation System

A full-stack web application for managing student internship placements, weekly log submissions, supervisor reviews, and weighted evaluations.

**Built with:** Django REST Framework + React (Vite) + Tailwind CSS

---

## 👥 User Roles

| Role | Permissions |
|------|-------------|
| Student | Submit weekly logs, view placement, view evaluation results |
| Workplace Supervisor | Review, approve and reject logs, evaluate students |
| Academic Supervisor | Monitor logs, evaluate students |
| Administrator | Manage placements, assign supervisors, manage users |

---

## ✨ Features

- JWT authentication with auto token refresh
- Role-based dashboards and access control
- Weekly log workflow: Draft → Submitted → Approved/Rejected
- Deadline enforcement — no submission after placement end date
- Email notifications on log submission, approval and rejection
- Weighted evaluation scoring: Technical 40% + Communication 30% + Professionalism 30%
- Automatic grade assignment: A (80+), B (70+), C (60+), D (50+), F (<50)
- Student evaluation results with score breakdown

---

## 🛠️ Tech Stack

**Backend**
- Python 3.14 / Django 5.0.6
- Django REST Framework
- SimpleJWT for authentication
- Django Signals for email notifications
- SQLite (development)

**Frontend**
- React 18 + Vite
- Tailwind CSS
- Axios with JWT interceptors
- React Router v6
- React Toastify

---

## 🚀 Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+
- Git

### Backend Setup

```bash
# Clone the repository
git clone https://github.com/Chol21/ILES.git
cd ILES

# Create and activate virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
source venv/bin/activate     # Mac/Linux

# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Start server
python manage.py runserver
```

### Frontend Setup

```bash
cd iles-frontend
npm install
npm run dev
```

### Access the App

| Service | URL |
|---------|-----|
| React Frontend | http://localhost:5173 |
| Django API | http://127.0.0.1:8000/api |
| API Docs | http://127.0.0.1:8000/api/docs |
| Django Admin | http://127.0.0.1:8000/admin |

---

## 🔑 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register/` | Register new user |
| POST | `/api/auth/login/` | Login and get JWT tokens |
| POST | `/api/auth/token/refresh/` | Refresh access token |
| POST | `/api/auth/logout/` | Logout |
| GET | `/api/users/me/` | Get current user profile |
| GET/POST | `/api/placements/` | List or create placements |
| GET/POST | `/api/weekly-logs/` | List or create weekly logs |
| POST | `/api/weekly-logs/{id}/submit/` | Submit log for review |
| POST | `/api/weekly-logs/{id}/approve/` | Approve a log |
| POST | `/api/weekly-logs/{id}/reject/` | Reject a log with feedback |
| GET/POST | `/api/evaluations/` | List or create evaluations |
| GET/POST | `/api/overall-evaluations/` | List or create overall evaluations |

---

## 📁 Project Structure