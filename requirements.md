# ILES (Internship Logging & Evaluation System) - Requirements Document

## Project Overview
ILES is a workflow-driven system that manages internship placements, weekly logs, supervisor reviews, academic evaluations, and score computations.

## 1. User Stories

### Student Intern (5 stories minimum)

1. As a **student**, I want to login to the system, so that I can access my personal internship dashboard.
2. As a **student**, I want to submit weekly internship logs, so that my work can be reviewed by supervisors.
3. As a **student**, I want to edit my weekly logs before they are reviewed, so that I can correct mistakes.
4. As a **student**, I want to view the status of my submitted logs (Draft, Submitted, Approved, Rejected), so that I know what action to take.
5. As a **student**, I want to view my final evaluation scores, so that I know my overall performance.

### Workplace Supervisor (3 stories minimum)

1. As a **workplace supervisor**, I want to see a list of students assigned to me, so that I can manage my supervisees.
2. As a **workplace supervisor**, I want to approve or reject weekly logs, so that only valid work is recorded.
3. As a **workplace supervisor**, I want to provide feedback when rejecting a log, so that students know what needs correction.

### Academic Supervisor (3 stories minimum)

1. As an **academic supervisor**, I want to evaluate students using weighted criteria, so that grading is standardized.
2. As an **academic supervisor**, I want to view weekly logs and workplace feedback, so that I have full context for evaluation.
3. As an **academic supervisor**, I want to see all students under my supervision, so that I can manage my workload.

### Internship Administrator (3 stories minimum)

1. As an **administrator**, I want to assign supervisors to students, so that each student is properly monitored.
2. As an **administrator**, I want to create and manage internship placements, so that placements are properly tracked.
3. As an **administrator**, I want to view all system data for reporting purposes, so that I can monitor overall progress.

## 2. Functional Requirements

### Student Features
- FR1: The system shall allow a logged-in student to create a weekly log.
- FR2: The system shall automatically set new logs to status = Draft.
- FR3: The system shall allow editing only when status = Draft or Rejected.
- FR4: The system shall allow submission only when status = Draft.
- FR5: The system shall change status from Draft to Submitted upon submission.
- FR6: The system shall timestamp all submissions.

### Workplace Supervisor Features
- FR7: The system shall display all Submitted logs for students assigned to a workplace supervisor.
- FR8: The system shall allow a workplace supervisor to change log status to Approved or Rejected.
- FR9: The system shall require a reason when a log is Rejected.
- FR10: The system shall prevent editing of logs when status = Approved.

### Academic Supervisor Features
- FR11: The system shall allow academic supervisors to define weighted evaluation criteria.
- FR12: The system shall automatically calculate final scores based on weighted criteria.
- FR13: The system shall prevent duplicate evaluations for the same student/placement.

### Administrator Features
- FR14: The system shall allow administrators to assign workplace and academic supervisors to placements.
- FR15: The system shall prevent assignment of supervisors with incorrect roles.
- FR16: The system shall allow administrators to view all placements, logs, and evaluations.

## 3. Non-Functional Requirements

### Security
- NFR1: The system shall use role-based access control (RBAC) to restrict features by user role.
- NFR2: Passwords shall be hashed using strong algorithms (bcrypt/Argon2).
- NFR3: All API endpoints shall require authentication except login/registration.

### Performance
- NFR4: Dashboard pages shall load within 2 seconds.
- NFR5: The system shall support at least 100 concurrent users.

### Usability
- NFR6: The system shall provide clear validation error messages.
- NFR7: The interface shall be responsive and work on mobile devices.

### Reliability
- NFR8: The system shall prevent data loss during submission failures.
- NFR9: All state transitions shall be validated on the backend (not just frontend).

## 4. Workflow States

### WeeklyLog States
- **Draft**: Student is creating/editing the log (not yet submitted)
- **Submitted**: Student has submitted for review
- **Approved**: Workplace supervisor has approved the log
- **Rejected**: Workplace supervisor rejected the log (needs revision)

### State Transitions (Allowed Moves)
- Draft → Submitted (Student submits)
- Draft → (No other transitions allowed)
- Submitted → Approved (Workplace supervisor approves)
- Submitted → Rejected (Workplace supervisor rejects)
- Rejected → Draft (Student edits and resubmits)

### Business Rules for States
- Rule 1: No editing after status = Approved
- Rule 2: No submission after deadline (to be defined per placement)
- Rule 3: Only Submitted logs can be approved/rejected
- Rule 4: Rejected logs must include feedback

## 5. Core Entities (Data Models)

### CustomUser (extends AbstractUser)
| Field | Type | Description |
|-------|------|-------------|
| role | Choice | Student, WorkplaceSupervisor, AcademicSupervisor, Admin |
| department | String | Department (for supervisors and admin) |
| staff_number | String | Unique ID for staff members |
| student_number | String | Unique ID for students |

### InternshipPlacement
| Field | Type | Description |
|-------|------|-------------|
| student | ForeignKey | Link to CustomUser (role=student) |
| company_name | String | Name of the internship company |
| start_date | Date | Placement start date |
| end_date | Date | Placement end date |
| workplace_supervisor | ForeignKey | Link to CustomUser (role=workplace) |
| academic_supervisor | ForeignKey | Link to CustomUser (role=academic) |
| is_active | Boolean | Whether placement is currently active |

### WeeklyLog
| Field | Type | Description |
|-------|------|-------------|
| placement | ForeignKey | Link to InternshipPlacement |
| week_number | Integer | Week number of the internship |
| activities | Text | Description of activities done |
| status | Choice | Draft, Submitted, Approved, Rejected |
| submitted_at | DateTime | When log was submitted |
| created_at | DateTime | Auto-set on creation |
| updated_at | DateTime | Auto-updated on changes |

### EvaluationCriteria
| Field | Type | Description |
|-------|------|-------------|
| name | String | e.g., "Technical Skills" |
| weight | Decimal | Percentage weight (e.g., 0.40 for 40%) |
| created_by | ForeignKey | Academic supervisor who created it |

### Evaluation
| Field | Type | Description |
|-------|------|-------------|
| placement | ForeignKey | Link to InternshipPlacement |
| criteria | ForeignKey | Link to EvaluationCriteria |
| score | Decimal | Score out of 100 |
| evaluated_by | ForeignKey | Academic supervisor |
| evaluated_at | DateTime | When evaluation was done |

## 6. System Boundaries

### What the System Will Do
- Manage user roles and permissions
- Track internship placements
- Handle weekly log submissions and reviews
- Compute weighted evaluation scores
- Generate dashboards for each role

### What the System Will NOT Do (Out of Scope)
- Handle payments or financial transactions
- Integrate with external HR systems
- Support real-time chat between supervisors and students
- Automatically verify log authenticity

## 7. Constraints & Assumptions

### Technical Constraints
- Backend: Django + Django REST Framework
- Frontend: React
- Database: PostgreSQL
- Deployment: Cloud platform (to be decided)

### Assumptions
- All users have email addresses for notifications
- Students have unique student numbers
- Staff members have unique staff numbers
- Internet connection is available for all users 